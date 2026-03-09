'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

interface FolderTab {
  key: string;
  label: string;
  icon: string;
}

const FOLDERS: FolderTab[] = [
  { key: 'brand_assets', label: 'Brand Assets', icon: '\u2726' },
  { key: 'logo', label: 'Logos', icon: '\u25C8' },
  { key: 'ad_creatives', label: 'Ad Creatives', icon: '\uD83D\uDDBC' },
  { key: 'models', label: 'Models', icon: '\uD83D\uDC64' },
  { key: 'reels', label: 'Reels', icon: '\uD83C\uDFAC' },
  { key: 'campaigns_ad_images', label: 'Campaign Images', icon: '\uD83D\uDCF7' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BrandAssetsPage() {
  const [activeFolder, setActiveFolder] = useState('brand_assets');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/dashboard/drive?action=search&q=${encodeURIComponent(searchQuery)}&folder=${activeFolder}`
        : `/api/dashboard/drive?action=list&folder=${activeFolder}`;
      const res = await fetch(url);
      const data = await res.json();
      setFiles(data.files || data.images || []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, searchQuery]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // Upload handler
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setUploadMsg(null);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const res = await fetch('/api/dashboard/drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload',
            fileName: file.name,
            folder: activeFolder,
            fileData: base64,
            mimeType: file.type || 'application/octet-stream',
          }),
        });
        const data = await res.json();
        if (data.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (failCount === 0) {
      setUploadMsg({ text: `${successCount} file${successCount !== 1 ? 's' : ''} uploaded successfully`, type: 'success' });
    } else {
      setUploadMsg({ text: `${successCount} uploaded, ${failCount} failed`, type: failCount > successCount ? 'error' : 'success' });
    }
    setTimeout(() => setUploadMsg(null), 5000);
    fetchFiles();
  }

  // Thumbnail URL helper
  function getThumbnail(file: DriveFile): string | null {
    if (file.thumbnailLink) return file.thumbnailLink;
    if (file.mimeType?.startsWith('image/') && file.id) {
      return `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`;
    }
    return null;
  }

  function getFileIcon(mimeType: string): string {
    if (mimeType?.startsWith('image/')) return '\uD83D\uDDBC';
    if (mimeType?.startsWith('video/')) return '\uD83C\uDFAC';
    if (mimeType?.includes('pdf')) return '\uD83D\uDCC4';
    if (mimeType?.includes('folder')) return '\uD83D\uDCC1';
    if (mimeType?.includes('font') || mimeType?.includes('opentype')) return '\uD83D\uDD24';
    return '\uD83D\uDCC2';
  }

  function formatSize(bytes?: string): string {
    if (!bytes) return '';
    const b = parseInt(bytes, 10);
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            <Link href="/dashboard/marketing" className="hover:text-gold">Marketing Studio</Link>
            <span>/</span>
            <span>Brand Assets</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Brand Assets</h1>
          <p className="text-sm text-text-muted mt-1">Manage logos, templates, and creative assets from Google Drive</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.ai,.psd,.svg,.otf,.ttf,.woff,.woff2"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Files
              </>
            )}
          </button>
          <a
            href={`https://drive.google.com/drive/folders/1tkui8WF41TjVsjbpOyIdSIGBHcMmWWN2`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-border text-sm font-medium rounded-lg text-text-dark hover:bg-warm-white transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Drive
          </a>
        </div>
      </div>

      {/* Upload feedback */}
      {uploadMsg && (
        <div className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium border ${
          uploadMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {uploadMsg.text}
        </div>
      )}

      {/* Folder tabs + search */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1 overflow-x-auto">
            {FOLDERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setActiveFolder(f.key); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFolder === f.key
                    ? 'bg-gold text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg w-52"
            />
            <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* File grid */}
      <div className="bg-white rounded-xl border border-border p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-text-muted">Loading files from Google Drive...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">{FOLDERS.find((f) => f.key === activeFolder)?.icon || '\uD83D\uDCC2'}</p>
            <p className="text-sm text-text-muted">
              {searchQuery ? `No files matching "${searchQuery}"` : 'No files in this folder yet'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
            >
              Upload Files
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-text-muted">{files.length} file{files.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file) => {
                const thumb = getThumbnail(file);
                const isImage = file.mimeType?.startsWith('image/');
                const isVideo = file.mimeType?.startsWith('video/');

                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className="group relative rounded-xl border border-border-light overflow-hidden cursor-pointer hover:border-gold hover:shadow-md transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-warm-white flex items-center justify-center overflow-hidden">
                      {thumb && (isImage || isVideo) ? (
                        <img
                          src={thumb}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-4xl">{getFileIcon(file.mimeType)}</span>
                      )}
                    </div>
                    {/* File info */}
                    <div className="p-2">
                      <p className="text-xs font-medium text-text-dark truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {formatSize(file.size)}
                      </p>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 rounded-full px-3 py-1 text-xs font-medium text-text-dark shadow">
                        View
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* File detail modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedFile(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Preview */}
            <div className="bg-warm-white flex items-center justify-center min-h-[300px] rounded-t-2xl overflow-hidden">
              {selectedFile.mimeType?.startsWith('image/') && selectedFile.id ? (
                <img
                  src={`https://drive.google.com/thumbnail?id=${selectedFile.id}&sz=w800`}
                  alt={selectedFile.name}
                  className="max-w-full max-h-[60vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : selectedFile.mimeType?.startsWith('video/') ? (
                <div className="text-center py-12">
                  <span className="text-5xl">{'\uD83C\uDFAC'}</span>
                  <p className="text-sm text-text-muted mt-2">Video preview not available</p>
                </div>
              ) : (
                <span className="text-6xl">{getFileIcon(selectedFile.mimeType)}</span>
              )}
            </div>
            {/* Info */}
            <div className="p-6">
              <h3 className="font-serif text-lg text-text-dark mb-1">{selectedFile.name}</h3>
              <div className="flex flex-wrap gap-3 text-xs text-text-muted mb-4">
                <span>{selectedFile.mimeType}</span>
                {selectedFile.size && <span>{formatSize(selectedFile.size)}</span>}
                {selectedFile.modifiedTime && (
                  <span>Modified: {new Date(selectedFile.modifiedTime).toLocaleDateString()}</span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedFile.webViewLink && (
                  <a
                    href={selectedFile.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
                  >
                    Open in Drive
                  </a>
                )}
                {selectedFile.webContentLink && (
                  <a
                    href={selectedFile.webContentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-text-dark hover:bg-warm-white transition-colors"
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-dark transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
