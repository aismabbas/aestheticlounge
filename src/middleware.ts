import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'al_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard routes (except /dashboard/login)
  if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/login')) {
    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url));
    }

    try {
      const session = JSON.parse(sessionCookie);
      if (!session.staffId || !session.exp || Date.now() > session.exp) {
        const response = NextResponse.redirect(new URL('/dashboard/login', request.url));
        response.cookies.delete(COOKIE_NAME);
        return response;
      }
    } catch {
      return NextResponse.redirect(new URL('/dashboard/login', request.url));
    }
  }

  // If logged in and visiting /dashboard/login, redirect to /dashboard
  if (pathname === '/dashboard/login') {
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
