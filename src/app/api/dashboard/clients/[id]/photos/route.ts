import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';
import {
  isGoogleDriveConfigured,
  getOrCreateClientFolder,
  getOrCreateTreatmentFolder,
  uploadPhoto,
  getDirectUrl,
} from '@/lib/google-drive';
import { checkAuth } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await query(
      'SELECT * FROM al_client_photos WHERE client_id = $1 ORDER BY taken_at DESC',
      [id],
    );

    // Enrich photos with Drive URLs if they have a drive_file_id
    const photos = result.rows.map((p: Record<string, unknown>) => ({
      ...p,
      thumbnail_url: p.thumbnail_url || p.photo_url,
      full_url: p.drive_file_id
        ? getDirectUrl(p.drive_file_id as string)
        : p.photo_url,
    }));

    return NextResponse.json({
      photos,
      drive_configured: isGoogleDriveConfigured(),
    });
  } catch (err) {
    console.error('[dashboard/clients/[id]/photos] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const contentType = req.headers.get('content-type') || '';

    // Handle multipart file upload (Google Drive)
    if (contentType.includes('multipart/form-data')) {
      if (!isGoogleDriveConfigured()) {
        return NextResponse.json(
          { error: 'Google Drive is not configured. Set Google service account credentials and GOOGLE_DRIVE_ROOT_FOLDER_ID.' },
          { status: 503 },
        );
      }

      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const treatment = formData.get('treatment') as string;
      const photoType = formData.get('photo_type') as string;
      const takenAt = (formData.get('taken_at') as string) || new Date().toISOString().split('T')[0];
      const notes = (formData.get('notes') as string) || null;

      if (!file || !treatment || !photoType) {
        return NextResponse.json(
          { error: 'file, treatment, and photo_type are required' },
          { status: 400 },
        );
      }

      if (!['before', 'after'].includes(photoType)) {
        return NextResponse.json(
          { error: 'photo_type must be "before" or "after"' },
          { status: 400 },
        );
      }

      // Get client name for folder creation
      const clientResult = await query('SELECT name FROM al_clients WHERE id = $1', [id]);
      if (clientResult.rows.length === 0) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      const clientName = clientResult.rows[0].name;

      // Create folder structure and upload
      const clientFolderId = await getOrCreateClientFolder(id, clientName);
      const treatmentFolderId = await getOrCreateTreatmentFolder(clientFolderId, treatment);

      // Build filename: before_2026-03-08.jpg
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${photoType}_${takenAt}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { fileId, webViewLink, thumbnailLink } = await uploadPhoto(
        treatmentFolderId,
        fileName,
        buffer,
        file.type || 'image/jpeg',
      );

      // Save record to database
      const photoId = `photo_${randomBytes(12).toString('hex')}`;
      const fullUrl = getDirectUrl(fileId);

      const result = await query(
        `INSERT INTO al_client_photos (id, client_id, treatment, photo_type, photo_url, thumbnail_url, drive_file_id, drive_folder_id, taken_at, notes, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          photoId,
          id,
          treatment,
          photoType,
          webViewLink,
          thumbnailLink,
          fileId,
          treatmentFolderId,
          takenAt,
          notes,
          user.name || user.email || 'staff',
        ],
      );

      const photo = result.rows[0];
      return NextResponse.json(
        {
          ...photo,
          thumbnail_url: thumbnailLink,
          full_url: fullUrl,
        },
        { status: 201 },
      );
    }

    // Legacy JSON-based photo URL submission (fallback)
    const body = await req.json();
    const { treatment, photo_type, photo_url, taken_at, notes } = body;

    if (!treatment || !photo_type || !photo_url) {
      return NextResponse.json(
        { error: 'treatment, photo_type, and photo_url are required' },
        { status: 400 },
      );
    }

    if (!['before', 'after'].includes(photo_type)) {
      return NextResponse.json(
        { error: 'photo_type must be "before" or "after"' },
        { status: 400 },
      );
    }

    const photoId = `photo_${randomBytes(12).toString('hex')}`;

    const result = await query(
      `INSERT INTO al_client_photos (id, client_id, treatment, photo_type, photo_url, taken_at, notes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        photoId,
        id,
        treatment,
        photo_type,
        photo_url,
        taken_at || new Date().toISOString().split('T')[0],
        notes || null,
        user.name || user.email || 'staff',
      ],
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('[dashboard/clients/[id]/photos] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
