-- Add Google Drive storage columns to al_client_photos
-- Run this migration before using Drive-based photo uploads

ALTER TABLE al_client_photos
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS drive_file_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

-- Index for looking up photos by drive_file_id (for deletion)
CREATE INDEX IF NOT EXISTS idx_al_client_photos_drive_file_id
  ON al_client_photos (drive_file_id)
  WHERE drive_file_id IS NOT NULL;
