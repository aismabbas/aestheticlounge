import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from './next-auth';
import crypto from 'crypto';

const COOKIE_NAME = 'al_session';

/**
 * Get the signing secret. Uses NEXTAUTH_SECRET (always present) as HMAC key.
 */
function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for session signing');
  return secret;
}

/**
 * Sign a session payload and return the cookie value (payload.signature).
 */
export function signSession(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

/**
 * Verify and decode a signed session cookie. Returns null if tampered or expired.
 */
function verifySession(cookieValue: string): Record<string, unknown> | null {
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;

  const [b64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url');

  // Timing-safe comparison to prevent timing attacks
  if (sig.length !== expectedSig.length) return null;
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const json = Buffer.from(b64, 'base64url').toString();
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Shared auth check for API routes.
 * Supports both NextAuth (Google OAuth) and legacy al_session cookie (HMAC-signed).
 * Returns staff session data or null.
 */
export async function checkAuth(): Promise<{
  staffId: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
} | null> {
  // Try NextAuth session first (Google OAuth)
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user?.staffId) {
    return {
      staffId: nextAuthSession.user.staffId,
      email: nextAuthSession.user.email || '',
      name: nextAuthSession.user.staffName || nextAuthSession.user.name || '',
      role: nextAuthSession.user.role || 'agent',
      phone: nextAuthSession.user.phone,
    };
  }

  // Fallback to legacy OTP/magic-link cookie (HMAC-signed)
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session?.value) return null;

  const data = verifySession(session.value);
  if (!data) return null;

  // Check expiry
  if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;

  return {
    staffId: data.staffId as string,
    email: data.email as string,
    name: data.name as string,
    role: data.role as string,
    phone: data.phone as string | undefined,
  };
}
