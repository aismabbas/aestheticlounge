import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isValidRole } from '@/lib/rbac';

const COOKIE_NAME = 'al_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * GET /api/auth/magic-link/verify?token=xxx
 * Validates the magic link token, creates session, redirects to dashboard.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const baseUrl = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/dashboard/login?error=invalid_link`);
  }

  try {
    // Look up valid token
    const linkResult = await query(
      `SELECT id, email FROM al_magic_links
       WHERE token = $1 AND used = false AND expires_at > NOW()
       LIMIT 1`,
      [token],
    );

    if (!linkResult.rows || linkResult.rows.length === 0) {
      return NextResponse.redirect(`${baseUrl}/dashboard/login?error=link_expired`);
    }

    const link = linkResult.rows[0];

    // Mark token as used
    await query('UPDATE al_magic_links SET used = true WHERE id = $1', [link.id]);

    // Look up staff
    const staffResult = await query(
      'SELECT id, email, name, role, phone FROM al_staff WHERE LOWER(email) = LOWER($1) AND active = true LIMIT 1',
      [link.email],
    );

    if (!staffResult.rows || staffResult.rows.length === 0) {
      return NextResponse.redirect(`${baseUrl}/dashboard/login?error=not_staff`);
    }

    const staff = staffResult.rows[0];
    const role = isValidRole(staff.role) ? staff.role : 'agent';

    // Create session cookie
    const sessionPayload = {
      staffId: staff.id,
      email: staff.email,
      name: staff.name,
      role,
      phone: staff.phone || undefined,
      exp: Date.now() + SESSION_DURATION_MS,
    };

    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    response.cookies.set(COOKIE_NAME, JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000,
    });

    // Update last_login
    await query('UPDATE al_staff SET last_login = NOW() WHERE id = $1', [staff.id]);

    return response;
  } catch (err) {
    console.error('[auth/magic-link/verify] error:', err);
    return NextResponse.redirect(`${baseUrl}/dashboard/login?error=server_error`);
  }
}
