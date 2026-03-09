import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  isGoogleDriveConfigured,
  deletePhoto as deleteDrivePhoto,
  getDirectUrl,
} from '@/lib/google-drive';
import { checkAuth } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, photoId } = await params;

    const result = await query(
      'SELECT * FROM al_client_photos WHERE id = $1 AND client_id = $2',
      [photoId, id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = result.rows[0];
    return NextResponse.json({
      ...photo,
      thumbnail_url: photo.thumbnail_url || photo.photo_url,
      full_url: photo.drive_file_id
        ? getDirectUrl(photo.drive_file_id)
        : photo.photo_url,
    });
  } catch (err) {
    console.error('[dashboard/clients/[id]/photos/[photoId]] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, photoId } = await params;

    // Get the photo record first
    const result = await query(
      'SELECT * FROM al_client_photos WHERE id = $1 AND client_id = $2',
      [photoId, id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = result.rows[0];

    // Delete from Google Drive if it has a drive_file_id
    if (photo.drive_file_id && isGoogleDriveConfigured()) {
      try {
        await deleteDrivePhoto(photo.drive_file_id);
      } catch (driveErr) {
        console.error('[photos/[photoId]] Drive delete error (continuing):', driveErr);
        // Continue to delete DB record even if Drive delete fails
      }
    }

    // Delete the DB record
    await query(
      'DELETE FROM al_client_photos WHERE id = $1 AND client_id = $2',
      [photoId, id],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[dashboard/clients/[id]/photos/[photoId]] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
