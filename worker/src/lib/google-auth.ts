/**
 * Shared Google service account credential resolver — verbatim from src/lib/google-auth.ts
 */
export function getGoogleCredentials(): { client_email: string; private_key: string; project_id?: string } {
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SA_PRIVATE_KEY;
  if (email && key) {
    return {
      client_email: email,
      private_key: key.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_SA_PROJECT_ID,
    };
  }

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

export function isGoogleConfigured(): boolean {
  return !!(
    (process.env.GOOGLE_SA_CLIENT_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY) ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  );
}
