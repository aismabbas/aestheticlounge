import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 },
      );
    }

    const result = await query(
      'SELECT id, email, name, role FROM al_staff WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email.trim()],
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No staff account found with this email' },
        { status: 404 },
      );
    }

    const staff = result.rows[0];

    // In production, send OTP via email/WhatsApp here.
    // For dev, we just confirm the email exists.
    return NextResponse.json({
      success: true,
      staffId: staff.id,
      message: 'OTP sent (dev: use 000000)',
    });
  } catch (err) {
    console.error('[auth/login] error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
