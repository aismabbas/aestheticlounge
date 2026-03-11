import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const COOKIE_NAME = 'al_session';

/**
 * Verify HMAC-signed session cookie using Web Crypto API (Edge-compatible).
 */
async function verifySessionEdge(cookieValue: string): Promise<Record<string, unknown> | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;

  const [b64, sig] = parts;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(b64));
    // Convert to base64url
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (sig !== expectedSig) return null;

    const json = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard routes (except /dashboard/login)
  if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/login')) {
    // Check NextAuth JWT token (Google OAuth)
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const hasNextAuth = !!token?.staffId;

    // Check legacy OTP cookie (HMAC-signed)
    let hasLegacy = false;
    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
    if (sessionCookie) {
      const session = await verifySessionEdge(sessionCookie);
      if (session) {
        hasLegacy = !!(session.staffId && session.exp && Date.now() <= (session.exp as number));
      }
    }

    if (!hasNextAuth && !hasLegacy) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url));
    }
  }

  // If logged in and visiting /dashboard/login, redirect to /dashboard
  if (pathname === '/dashboard/login') {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token?.staffId) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
    if (sessionCookie) {
      const session = await verifySessionEdge(sessionCookie);
      if (session && session.staffId && session.exp && Date.now() <= (session.exp as number)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
