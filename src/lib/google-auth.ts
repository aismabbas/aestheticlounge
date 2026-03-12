/**
 * Shared Google service account credential resolver.
 * Supports three modes:
 *   1. GOOGLE_SA_CLIENT_EMAIL + GOOGLE_SA_PRIVATE_KEY — env vars (local dev, build time)
 *   2. GOOGLE_SA_CLIENT_EMAIL + al_secrets DB table — for Lambda functions (key too large for 4KB limit)
 *   3. GOOGLE_SERVICE_ACCOUNT_JSON — full JSON file path or inline JSON (local dev)
 */

import { query } from './db';

let cachedKey: string | null = null;

export async function getGoogleCredentialsAsync(): Promise<{ client_email: string; private_key: string; project_id?: string }> {
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL;

  // Mode 1: Both in env vars (local dev or build-time)
  const envKey = process.env.GOOGLE_SA_PRIVATE_KEY;
  if (email && envKey) {
    return {
      client_email: email,
      private_key: envKey.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_SA_PROJECT_ID,
    };
  }

  // Mode 2: Email in env, key from DB (Lambda — key excluded from functions scope to stay under 4KB)
  if (email) {
    if (!cachedKey) {
      const { rows } = await query('SELECT value FROM al_secrets WHERE key = $1', ['GOOGLE_SA_PRIVATE_KEY']);
      if (rows.length > 0) cachedKey = rows[0].value as string;
    }
    if (cachedKey) {
      return {
        client_email: email,
        private_key: cachedKey.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_SA_PROJECT_ID,
      };
    }
  }

  // Mode 3: Full JSON (file path or inline)
  const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (credsJson?.startsWith('{')) return JSON.parse(credsJson);
  if (credsJson) {
    const fs = require('fs');
    const path = require('path');
    return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), credsJson), 'utf-8'));
  }

  throw new Error('Google credentials not configured. Set GOOGLE_SA_CLIENT_EMAIL + GOOGLE_SA_PRIVATE_KEY.');
}

/** Synchronous — works when key is in env or already cached from prior async call */
export function getGoogleCredentials(): { client_email: string; private_key: string; project_id?: string } {
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SA_PRIVATE_KEY || cachedKey;
  if (email && key) {
    return {
      client_email: email,
      private_key: key.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_SA_PROJECT_ID,
    };
  }

  const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (credsJson?.startsWith('{')) return JSON.parse(credsJson);

  throw new Error('Google credentials not available synchronously. Use getGoogleCredentialsAsync().');
}

export function isGoogleConfigured(): boolean {
  return !!(
    (process.env.GOOGLE_SA_CLIENT_EMAIL && (process.env.GOOGLE_SA_PRIVATE_KEY || cachedKey)) ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  );
}
