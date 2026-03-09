import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isValidRole } from '@/lib/rbac';

const COOKIE_NAME = 'al_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEV_OTP = '000000';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 },
      );
    }

    // Look up staff member
    const staffResult = await query(
      'SELECT id, email, name, role, phone FROM al_staff WHERE LOWER(email) = LOWER($1) AND active = true LIMIT 1',
      [email.trim()],
    );

    if (!staffResult.rows || staffResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Staff account not found' },
        { status: 404 },
      );
    }

    const staff = staffResult.rows[0];

    // Validate OTP: check DB first, then dev fallback
    let otpValid = false;

    // Check real OTP from database
    const otpResult = await query(
      `SELECT id FROM al_otp
       WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [staff.email, otp.trim()],
    );

    if (otpResult.rows && otpResult.rows.length > 0) {
      otpValid = true;
      // Mark OTP as used
      await query('UPDATE al_otp SET used = true WHERE id = $1', [otpResult.rows[0].id]);
    }

    // Dev fallback: accept 000000 when WhatsApp isn't configured
    if (!otpValid && otp === DEV_OTP && !process.env.WHATSAPP_ACCESS_TOKEN) {
      otpValid = true;
    }

    if (!otpValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 401 },
      );
    }

    // Validate role
    const role = isValidRole(staff.role) ? staff.role : 'agent';

    const sessionPayload = {
      staffId: staff.id,
      email: staff.email,
      name: staff.name,
      role,
      phone: staff.phone || undefined,
      exp: Date.now() + SESSION_DURATION_MS,
    };

    const response = NextResponse.json({
      success: true,
      name: staff.name,
      role,
    });

    response.cookies.set(COOKIE_NAME, JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000,
    });

    // Update last_login
    await query('UPDATE al_staff SET last_login = NOW() WHERE id = $1', [staff.id]);

    return response;
  } catch (err) {
    console.error('[auth/verify] error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
