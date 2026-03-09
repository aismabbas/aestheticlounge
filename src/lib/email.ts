/**
 * Email sender using Zoho Mail API.
 * Uses OAuth refresh token flow for automatic token management.
 */

const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';
const ZOHO_MAIL_API = 'https://mail.zoho.com/api/accounts';

// Cache access token in memory (serverless = per invocation, but helps within same request)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho OAuth credentials not configured (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN)');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${ZOHO_TOKEN_URL}?${params}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Zoho token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Zoho token refresh error: ${JSON.stringify(data)}`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  };

  return cachedToken.token;
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<void> {
  const accountId = process.env.ZOHO_ACCOUNT_ID;
  if (!accountId) {
    throw new Error('ZOHO_ACCOUNT_ID not configured');
  }

  const accessToken = await getAccessToken();
  const fromAddress = from || process.env.ZOHO_FROM_ADDRESS;

  const res = await fetch(`${ZOHO_MAIL_API}/${accountId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fromAddress,
      toAddress: to,
      subject,
      content: html,
      mailFormat: 'html',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoho Mail send failed: ${res.status} ${text}`);
  }
}

/**
 * Send a magic login link email with Aesthetic Lounge branding.
 */
export async function sendMagicLinkEmail(to: string, name: string, loginUrl: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;border:1px solid #E8E5E0;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#1A1A1A;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:600;letter-spacing:0.5px;">Aesthetic Lounge</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:11px;">Staff Dashboard</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 24px;">
          <p style="margin:0 0 8px;color:#333;font-size:15px;">Hi ${name},</p>
          <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.5;">
            Click the button below to sign in to your dashboard. This link expires in 15 minutes.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${loginUrl}" style="display:inline-block;background:#B8924A;color:#FFFFFF;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.3px;">
                Sign In to Dashboard
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;color:#999;font-size:12px;line-height:1.5;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 24px;border-top:1px solid #E8E5E0;text-align:center;">
          <p style="margin:0;color:#999;font-size:11px;">Aesthetic Lounge — DHA Phase 8, Lahore</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  await sendEmail({
    to,
    subject: 'Sign in to Aesthetic Lounge Dashboard',
    html,
  });
}
