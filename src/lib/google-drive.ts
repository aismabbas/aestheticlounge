import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { getGoogleCredentialsAsync, isGoogleConfigured } from './google-auth';

/* ------------------------------------------------------------------ */
/* Google Drive API client — API-only, no local filesystem dependency. */
/* Uses the AL service account for authentication.                     */
/* Works in Netlify serverless, Hostinger VPS, n8n — anywhere.        */
/*                                                                     */
/* Folder structure (marketing assets):                                */
/*   AestheticLounge / BrandAssets / Models / {character_name} /      */
/*   AestheticLounge / AdCreatives /                                   */
/*   AestheticLounge / Reels /                                         */
/*   AestheticLounge / Campaigns / AdImages /                          */
/*                                                                     */
/* Folder structure (client photos):                                   */
/*   AL Clinic Photos / {client_name}_{client_id} / {treatment} /     */
/* ------------------------------------------------------------------ */

// Marketing asset folder IDs (shared with SA + info@aestheticloungeofficial.com)
export const DRIVE_FOLDERS = {
  root: '1km1DM6bJwgU_0kEi2z9fN_FBE96TzIoA',
  ad_creatives: '1fj_gR6Y5zkquq4tm__EpwtqYlyMOGw0w',
  brand_assets: '1tkui8WF41TjVsjbpOyIdSIGBHcMmWWN2',
  models: '1126tL24ODp9GeTCfKvBapLHZQ_Z2-Irp',
  video_ads: '1m5pdSGjt5yRNUDf6z6sFmUarbZvfUqDO',
  campaigns: '12E_x6yXL1qhikpbmC-I-dfG3-f5QJ9lC',
  campaigns_ad_images: '19fpZJ71W2pgkte_KHIAUd9Ypz35_7yCl',
  research: '1P_UClKEvXhskkq893-j5tj-Chq6lwGAy',
  reels: '1ZRN4fIYu9Tks6mB2-y2I441dhb5Kaf8-',
  logo: '1pS_I9buHo-try9c3gtgk5ZKR5FVlD9sm',
} as const;

export type DriveFolderKey = keyof typeof DRIVE_FOLDERS;

let driveClient: drive_v3.Drive | null = null;

/**
 * Returns true if the required env vars are set for Google Drive.
 */
export function isGoogleDriveConfigured(): boolean {
  return isGoogleConfigured() && !!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
}

/**
 * Lazily initialize and return the Google Drive client.
 */
async function getDrive(): Promise<drive_v3.Drive> {
  if (driveClient) return driveClient;

  const credentials = await getGoogleCredentialsAsync();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

/**
 * Find a folder by name inside a parent folder, or create it.
 */
async function findOrCreateFolder(
  parentId: string,
  folderName: string,
): Promise<string> {
  const drive = await getDrive();

  // Search for existing folder
  const search = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id!;
  }

  // Create folder
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  const folderId = folder.data.id!;

  // Share folder with anyone with link (so thumbnails work in dashboard)
  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return folderId;
}

/**
 * Get or create the client folder: {clientName}_{clientId}
 */
export async function getOrCreateClientFolder(
  clientId: string,
  clientName: string,
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID env var is not set');
  }

  // Sanitize client name for folder name
  const safeName = clientName.replace(/[/\\?%*:|"<>]/g, '_').trim();
  const folderName = `${safeName}_${clientId}`;

  return findOrCreateFolder(rootFolderId, folderName);
}

/**
 * Get or create a treatment subfolder inside the client folder.
 */
export async function getOrCreateTreatmentFolder(
  clientFolderId: string,
  treatmentName: string,
): Promise<string> {
  const safeName = treatmentName.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return findOrCreateFolder(clientFolderId, safeName);
}

/**
 * Upload a photo to Google Drive.
 */
export async function uploadPhoto(
  folderId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<{ fileId: string; webViewLink: string; thumbnailLink: string }> {
  const drive = await getDrive();

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink, thumbnailLink',
  });

  const fileId = file.data.id!;

  // Make file publicly viewable
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Build direct thumbnail URL (Google Drive thumbnail API)
  const thumbnailLink =
    file.data.thumbnailLink ||
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  const webViewLink =
    file.data.webViewLink ||
    `https://drive.google.com/file/d/${fileId}/view`;

  return { fileId, webViewLink, thumbnailLink };
}

/**
 * List photos (image files) in a Google Drive folder.
 */
export async function listPhotos(
  folderId: string,
): Promise<
  Array<{
    id: string;
    name: string;
    webViewLink: string;
    thumbnailLink: string;
    createdTime: string;
  }>
> {
  const drive = await getDrive();

  const result = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false and mimeType contains 'image/'`,
    fields: 'files(id, name, webViewLink, thumbnailLink, createdTime)',
    orderBy: 'createdTime desc',
    spaces: 'drive',
  });

  return (result.data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
    webViewLink:
      f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    thumbnailLink:
      f.thumbnailLink ||
      `https://drive.google.com/thumbnail?id=${f.id}&sz=w400`,
    createdTime: f.createdTime || '',
  }));
}

/**
 * Get a thumbnail URL for a specific file.
 */
export async function getPhotoThumbnail(fileId: string): Promise<string> {
  const drive = await getDrive();

  const file = await drive.files.get({
    fileId,
    fields: 'thumbnailLink',
  });

  return (
    file.data.thumbnailLink ||
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
  );
}

/**
 * Delete a photo from Google Drive.
 */
export async function deletePhoto(fileId: string): Promise<void> {
  const drive = await getDrive();
  await drive.files.delete({ fileId });
}

/**
 * Get a direct download/view URL for a file (for full-size preview).
 */
export function getDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?id=${fileId}&export=view`;
}

/* ------------------------------------------------------------------ */
/* Marketing Asset Functions (for n8n pipeline + dashboard)            */
/* ------------------------------------------------------------------ */

/** Upload a file from a remote URL to Drive (API-only, no local FS) */
export async function uploadFromUrl(
  url: string,
  fileName: string,
  folderId: string,
  mimeType = 'image/png',
): Promise<{ id: string; name: string; webViewLink: string }> {
  const drive = await getDrive();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: stream },
    fields: 'id,name,webViewLink',
    supportsAllDrives: true,
  });

  // Make publicly viewable
  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    id: res.data.id!,
    name: res.data.name!,
    webViewLink: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}

/** Download a file as a buffer (API-only) */
export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = await getDrive();
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' },
  );
  return Buffer.from(res.data as ArrayBuffer);
}

/** List all files in a folder */
export async function listFiles(folderId: string, maxResults = 50) {
  const drive = await getDrive();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)',
    orderBy: 'modifiedTime desc',
    pageSize: maxResults,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files || [];
}

/** Search files by name */
export async function searchFiles(query: string, folderId?: string, maxResults = 20) {
  const drive = await getDrive();
  let q = `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`;
  if (folderId) q += ` and '${folderId}' in parents`;

  const res = await drive.files.list({
    q,
    fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,parents)',
    orderBy: 'modifiedTime desc',
    pageSize: maxResults,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files || [];
}

/** Create a subfolder */
export async function createDriveFolder(name: string, parentId: string) {
  const drive = await getDrive();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id,name,webViewLink',
    supportsAllDrives: true,
  });
  return res.data;
}

/** Get model reference images for reel/ad creation */
export async function getModelImages(modelName: string) {
  const modelFolders = await listFiles(DRIVE_FOLDERS.models);
  const modelFolder = modelFolders.find(
    (f) => f.name?.toLowerCase() === modelName.toLowerCase(),
  );

  if (modelFolder?.id) {
    return listFiles(modelFolder.id, 20);
  }
  return searchFiles(modelName, DRIVE_FOLDERS.models);
}

/** Get brand assets (logos + top-level assets) */
export async function getBrandAssets() {
  const [logos, assets] = await Promise.all([
    listFiles(DRIVE_FOLDERS.logo, 10),
    listFiles(DRIVE_FOLDERS.brand_assets, 10),
  ]);
  return { logos, assets };
}

/** Get thumbnail URL helper */
export function getThumbnailUrl(fileId: string, size = 400): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

/** Get download URL helper */
export function getDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
