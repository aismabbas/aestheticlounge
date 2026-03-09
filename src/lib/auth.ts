import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { hasPermission, hasAnyPermission, type Permission, type Role } from './rbac';
import { authOptions } from './next-auth';

export interface StaffSession {
  staffId: string;
  email: string;
  name: string;
  role: Role | string;
  phone?: string;
  exp: number;
}

const COOKIE_NAME = 'al_session';

/**
 * Read and validate session from either NextAuth (Google) or legacy OTP cookie.
 * Returns null if no valid session found.
 */
export async function getSession(): Promise<StaffSession | null> {
  // Try NextAuth session first (Google OAuth)
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user?.staffId) {
    return {
      staffId: nextAuthSession.user.staffId,
      email: nextAuthSession.user.email || '',
      name: nextAuthSession.user.staffName || nextAuthSession.user.name || '',
      role: nextAuthSession.user.role || 'agent',
      phone: nextAuthSession.user.phone,
      exp: Date.now() + 24 * 60 * 60 * 1000, // NextAuth manages its own expiry
    };
  }

  // Fallback to legacy OTP cookie
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const session: StaffSession = JSON.parse(raw);
    if (!session.staffId || !session.exp) return null;
    if (Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Require a valid session — redirects to /dashboard/login if not authenticated.
 */
export async function requireAuth(): Promise<StaffSession> {
  const session = await getSession();
  if (!session) {
    redirect('/dashboard/login');
  }
  return session;
}

/**
 * Require a valid session AND a specific permission.
 * Returns 401 if not logged in, 403 if unauthorized.
 */
export async function requirePermission(permission: Permission): Promise<StaffSession> {
  const session = await getSession();
  if (!session) {
    redirect('/dashboard/login');
  }
  if (!hasPermission(session.role, permission)) {
    redirect('/dashboard?error=forbidden');
  }
  return session;
}

/**
 * Check permission for API routes (returns null instead of redirecting).
 */
export async function checkApiPermission(permission: Permission): Promise<{ session: StaffSession | null; allowed: boolean }> {
  const session = await getSession();
  if (!session) return { session: null, allowed: false };
  return { session, allowed: hasPermission(session.role, permission) };
}

/**
 * Check if session has ANY of the listed permissions (for API routes).
 */
export async function checkApiAnyPermission(permissions: Permission[]): Promise<{ session: StaffSession | null; allowed: boolean }> {
  const session = await getSession();
  if (!session) return { session: null, allowed: false };
  return { session, allowed: hasAnyPermission(session.role, permissions) };
}
