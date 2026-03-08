import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface StaffSession {
  staffId: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

const COOKIE_NAME = 'al_session';

/**
 * Read and validate the al_session cookie.
 * Returns null if missing or expired.
 */
export async function getSession(): Promise<StaffSession | null> {
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
