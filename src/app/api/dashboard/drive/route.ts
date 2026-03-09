import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  DRIVE_FOLDERS,
  type DriveFolderKey,
  listFiles,
  searchFiles,
  getModelImages,
  getBrandAssets,
  uploadFromUrl,
  uploadPhoto,
  createDriveFolder,
} from '@/lib/google-drive';

/**
 * GET /api/dashboard/drive?action=list&folder=models
 * GET /api/dashboard/drive?action=search&q=ayesha
 * GET /api/dashboard/drive?action=model&name=ayesha
 * GET /api/dashboard/drive?action=brand
 * GET /api/dashboard/drive?action=folders (list all folder IDs)
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const action = req.nextUrl.searchParams.get('action') || 'folders';

  try {
    switch (action) {
      case 'list': {
        const folder = (req.nextUrl.searchParams.get('folder') || 'root') as DriveFolderKey;
        const folderId = DRIVE_FOLDERS[folder] || req.nextUrl.searchParams.get('folderId');
        if (!folderId) return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
        const files = await listFiles(folderId);
        return NextResponse.json({ files });
      }

      case 'search': {
        const q = req.nextUrl.searchParams.get('q');
        if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });
        const folder = req.nextUrl.searchParams.get('folder') as DriveFolderKey | null;
        const folderId = folder ? DRIVE_FOLDERS[folder] : undefined;
        const files = await searchFiles(q, folderId);
        return NextResponse.json({ files });
      }

      case 'model': {
        const name = req.nextUrl.searchParams.get('name');
        if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
        const images = await getModelImages(name);
        return NextResponse.json({ images });
      }

      case 'brand': {
        const assets = await getBrandAssets();
        return NextResponse.json(assets);
      }

      case 'folders': {
        return NextResponse.json({ folders: DRIVE_FOLDERS });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[dashboard/drive] error:', err);
    return NextResponse.json({ error: 'Drive API error' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/drive
 * Body: { action: 'upload_url', url, fileName, folder } — upload from URL
 * Body: { action: 'mkdir', name, parentFolder } — create folder
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case 'upload_url': {
        const { url, fileName, folder, mimeType } = body;
        if (!url || !fileName) {
          return NextResponse.json({ error: 'url and fileName required' }, { status: 400 });
        }
        const folderId = DRIVE_FOLDERS[folder as DriveFolderKey] || folder || DRIVE_FOLDERS.root;
        const result = await uploadFromUrl(url, fileName, folderId, mimeType);
        return NextResponse.json({ success: true, file: result });
      }

      case 'mkdir': {
        const { name, parentFolder } = body;
        if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
        const parentId = DRIVE_FOLDERS[parentFolder as DriveFolderKey] || parentFolder || DRIVE_FOLDERS.root;
        const result = await createDriveFolder(name, parentId);
        return NextResponse.json({ success: true, folder: result });
      }

      case 'upload': {
        const { fileName, folder, fileData, mimeType } = body;
        if (!fileName || !fileData) {
          return NextResponse.json({ error: 'fileName and fileData (base64) required' }, { status: 400 });
        }
        const folderId = DRIVE_FOLDERS[folder as DriveFolderKey] || folder || DRIVE_FOLDERS.brand_assets;
        const buffer = Buffer.from(fileData, 'base64');
        const result = await uploadPhoto(folderId, fileName, buffer, mimeType || 'image/png');
        return NextResponse.json({ success: true, file: result });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[dashboard/drive] POST error:', err);
    return NextResponse.json({ error: 'Drive API error' }, { status: 500 });
  }
}
