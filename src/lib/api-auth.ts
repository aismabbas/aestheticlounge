import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from './next-auth';

/**
 * Shared auth check for API routes.
 * Supports both NextAuth (Google OAuth) and legacy al_session cookie.
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

  // Fallback to legacy OTP/magic-link cookie
  const cookieStore = await cookies();
  const session = cookieStore.get('al_session');
  if (!session?.value) return null;
  try {
    const data = JSON.parse(session.value);
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
