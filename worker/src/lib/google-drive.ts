/**
 * Google Drive API client — verbatim from src/lib/google-drive.ts
 */

import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { getGoogleCredentials, isGoogleConfigured } from './google-auth.js';

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

export function isGoogleDriveConfigured(): boolean {
  return isGoogleConfigured() && !!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
}

function getDrive(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const credentials = getGoogleCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

async function findOrCreateFolder(
  parentId: string,
  folderName: string,
): Promise<string> {
  const drive = getDrive();

  const search = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id!;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  const folderId = folder.data.id!;

  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return folderId;
}

export async function uploadFromUrl(
  url: string,
  fileName: string,
  folderId: string,
  mimeType = 'image/png',
): Promise<{ id: string; name: string; webViewLink: string }> {
  const drive = getDrive();
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

export async function listFiles(folderId: string, maxResults = 50) {
  const drive = getDrive();
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

export async function searchFiles(query: string, folderId?: string, maxResults = 20) {
  const drive = getDrive();
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

export async function getBrandAssets() {
  const [logos, assets] = await Promise.all([
    listFiles(DRIVE_FOLDERS.logo, 10),
    listFiles(DRIVE_FOLDERS.brand_assets, 10),
  ]);
  return { logos, assets };
}

export function getThumbnailUrl(fileId: string, size = 400): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

export function getDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
