/**
 * Shared Google service account credential resolver.
 * Supports two modes:
 *   1. GOOGLE_SERVICE_ACCOUNT_JSON — full JSON file path or inline JSON (local dev)
 *   2. GOOGLE_SA_CLIENT_EMAIL + GOOGLE_SA_PRIVATE_KEY — split env vars (Netlify/Lambda, avoids 4KB limit)
 */
export function getGoogleCredentials(): { client_email: string; private_key: string; project_id?: string } {
  // Mode 1: Split env vars (preferred for serverless)
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SA_PRIVATE_KEY;
  if (email && key) {
    return {
      client_email: email,
      private_key: key.replace(/\\n/g, '\n'), // env vars escape newlines
      project_id: process.env.GOOGLE_SA_PROJECT_ID,
    };
  }

  // Mode 2: Full JSON (file path or inline)
  const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credsJson) {
    throw new Error('Google service account not configured. Set GOOGLE_SA_CLIENT_EMAIL + GOOGLE_SA_PRIVATE_KEY, or GOOGLE_SERVICE_ACCOUNT_JSON.');
  }

  if (credsJson.startsWith('{')) {
    return JSON.parse(credsJson);
  }

  const fs = require('fs');
  const path = require('path');
  const resolved = path.resolve(process.cwd(), credsJson);
  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}

/**
 * Check if Google service account is configured.
 */
export function isGoogleConfigured(): boolean {
  return !!(
    (process.env.GOOGLE_SA_CLIENT_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY) ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  );
}
