import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { query } from '@/lib/db';
import { sendMagicLinkEmail } from '@/lib/email';

/**
 * POST /api/auth/magic-link
 * Body: { email }
 * Generates a magic link token, stores in DB, sends email.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Look up active staff
    const staffResult = await query(
      'SELECT id, email, name FROM al_staff WHERE LOWER(email) = LOWER($1) AND active = true LIMIT 1',
      [email.trim()],
    );

    if (!staffResult.rows || staffResult.rows.length === 0) {
      // Don't reveal whether email exists — always show success
      return NextResponse.json({ success: true, message: 'If this email is registered, a login link has been sent.' });
    }

    const staff = staffResult.rows[0];

    // Invalidate previous unused links for this email
    await query(
      'UPDATE al_magic_links SET used = true WHERE email = $1 AND used = false',
      [staff.email],
    );

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await query(
      'INSERT INTO al_magic_links (email, token, expires_at) VALUES ($1, $2, $3)',
      [staff.email, token, expiresAt.toISOString()],
    );

    // Build login URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://aesthetic-lounge-dev.netlify.app';
    const loginUrl = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;

    // Send email
    await sendMagicLinkEmail(staff.email, staff.name, loginUrl);

    return NextResponse.json({ success: true, message: 'Login link sent to your email.' });
  } catch (err) {
    console.error('[auth/magic-link] error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to send login link. Please try again.' },
      { status: 500 },
    );
  }
}
