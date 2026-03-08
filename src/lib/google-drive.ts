import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

/* ------------------------------------------------------------------ */
/* Google Drive helper for AL client before/after photos               */
/*                                                                     */
/* Folder structure:                                                   */
/*   AL Clinic Photos / {client_name}_{client_id} / {treatment} /     */
/*     before_2026-03-08.jpg                                           */
/* ------------------------------------------------------------------ */

let driveClient: drive_v3.Drive | null = null;

/**
 * Returns true if the required env vars are set for Google Drive.
 */
export function isGoogleDriveConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  );
}

/**
 * Lazily initialize and return the Google Drive client.
 */
function getDrive(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set');
  }

  const credentials = JSON.parse(credsJson);
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
  const drive = getDrive();

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
  const drive = getDrive();

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
  const drive = getDrive();

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
  const drive = getDrive();

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
  const drive = getDrive();
  await drive.files.delete({ fileId });
}

/**
 * Get a direct download/view URL for a file (for full-size preview).
 */
export function getDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?id=${fileId}&export=view`;
}
