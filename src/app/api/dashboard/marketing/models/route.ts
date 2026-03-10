import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { MODELS } from '@/lib/marketing-config';
import {
  DRIVE_FOLDERS,
  listFiles,
  uploadFromUrl,
  createDriveFolder,
  isGoogleDriveConfigured,
} from '@/lib/google-drive';

// ---------------------------------------------------------------------------
// Model metadata (extended from marketing-config for the detail page)
// ---------------------------------------------------------------------------

const MODEL_DETAILS: Record<
  string,
  { ethnicity: string; look: string; use: string }
> = {
  Ayesha: {
    ethnicity: 'Pakistani (Lahori, fair wheat-to-light complexion)',
    look: 'Elegant DHA aesthetic — polished but natural',
    use: 'Ramadan/Eid campaigns, treatment face ads, conservative audience',
  },
  Meher: {
    ethnicity: 'Pakistani Kashmiri (fair porcelain skin)',
    look: 'Sultry, voluptuous, luxury beauty editorial',
    use: 'Body contouring ads, curves-focused hooks, spa treatment ads',
  },
  Noor: {
    ethnicity: 'Pakistani Punjabi (warm caramel brown skin)',
    look: 'Bold, athletic, high fashion',
    use: 'Athletic body hooks, laser legs/arms ads, high-fashion body ads',
  },
  Usman: {
    ethnicity: 'Pakistani (warm medium-brown skin)',
    look: 'Groomed, professional, calm confidence',
    use: "Men's Hair PRP ads, men's scalp treatment ads",
  },
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/marketing/models
// ---------------------------------------------------------------------------
// Without ?detail=true  -> returns the simple MODELS array (legacy, used by carousel/post pages)
// With    ?detail=true  -> returns enriched models with Drive images

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const detail = req.nextUrl.searchParams.get('detail') === 'true';

  if (!detail) {
    return NextResponse.json(MODELS);
  }

  try {
    // Fetch model sub-folders from Drive
    let modelFolders: Array<{ id: string; name: string }> = [];
    if (isGoogleDriveConfigured()) {
      const files = await listFiles(DRIVE_FOLDERS.models);
      modelFolders = files
        .filter((f) => f.mimeType === 'application/vnd.google-apps.folder')
        .map((f) => ({ id: f.id!, name: f.name! }));
    }

    const models = await Promise.all(
      MODELS.map(async (m) => {
        const extra = MODEL_DETAILS[m.name] || {
          ethnicity: '',
          look: '',
          use: m.desc,
        };

        // Find matching Drive folder (case-insensitive)
        const folder = modelFolders.find(
          (f) => f.name.toLowerCase() === m.name.toLowerCase(),
        );

        let driveImages: Array<{
          id: string;
          name: string;
          webViewLink?: string;
          thumbnailLink?: string;
          modifiedTime?: string;
        }> = [];

        if (folder) {
          const files = await listFiles(folder.id, 50);
          driveImages = files
            .filter((f) => f.mimeType?.startsWith('image/'))
            .map((f) => ({
              id: f.id!,
              name: f.name!,
              webViewLink: f.webViewLink || undefined,
              thumbnailLink:
                f.thumbnailLink ||
                `https://drive.google.com/thumbnail?id=${f.id}&sz=w400`,
              modifiedTime: f.modifiedTime || undefined,
            }));
        }

        // Pick a hero image: prefer "hero" in name, otherwise first image
        const heroFile =
          driveImages.find((f) =>
            f.name.toLowerCase().includes('hero'),
          ) || driveImages[0];
        const heroImage = heroFile
          ? `https://drive.google.com/thumbnail?id=${heroFile.id}&sz=w600`
          : undefined;

        return {
          name: m.name,
          fullName: m.fullName,
          age: m.age,
          desc: m.desc,
          ethnicity: extra.ethnicity,
          look: extra.look,
          use: extra.use,
          portraits: m.portraits,
          driveFolderId: folder?.id,
          driveImages,
          heroImage,
        };
      }),
    );

    return NextResponse.json({ models });
  } catch (err) {
    console.error('[models] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to load models' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/dashboard/marketing/models
// ---------------------------------------------------------------------------
// Body: { action: 'upload_url', model, url, fileName }

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action !== 'upload_url') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const { model, url, fileName, createIfMissing } = body;
  if (!model || !url || !fileName) {
    return NextResponse.json(
      { error: 'model, url, and fileName are required' },
      { status: 400 },
    );
  }

  if (!isGoogleDriveConfigured()) {
    return NextResponse.json(
      { error: 'Google Drive is not configured' },
      { status: 500 },
    );
  }

  try {
    // Find the model's Drive folder
    const files = await listFiles(DRIVE_FOLDERS.models);
    let folder = files.find(
      (f) =>
        f.mimeType === 'application/vnd.google-apps.folder' &&
        f.name?.toLowerCase() === model.toLowerCase(),
    );

    // Create folder if it doesn't exist and createIfMissing is true
    if (!folder?.id && createIfMissing) {
      const newFolder = await createDriveFolder(
        model.toLowerCase(),
        DRIVE_FOLDERS.models,
      );
      folder = { id: newFolder.id!, name: model.toLowerCase(), mimeType: 'application/vnd.google-apps.folder' };
    }

    if (!folder?.id) {
      return NextResponse.json(
        { error: `Drive folder not found for model "${model}". Use createIfMissing to create a new one.` },
        { status: 404 },
      );
    }

    const result = await uploadFromUrl(url, fileName, folder.id);
    return NextResponse.json({ success: true, file: result, folderCreated: !!createIfMissing });
  } catch (err) {
    console.error('[models] POST upload_url error:', err);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 },
    );
  }
}
