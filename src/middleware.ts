import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const COOKIE_NAME = 'al_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard routes (except /dashboard/login)
  if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/login')) {
    // Check NextAuth JWT token (Google OAuth)
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const hasNextAuth = !!token?.staffId;

    // Check legacy OTP cookie
    let hasLegacy = false;
    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        hasLegacy = !!(session.staffId && session.exp && Date.now() <= session.exp);
      } catch {
        // Invalid cookie
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
      try {
        const session = JSON.parse(sessionCookie);
        if (session.staffId && session.exp && Date.now() <= session.exp) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch {
        // Invalid cookie, let them see login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
