import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

const OTP_EXPIRY_MINUTES = 5;

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
      'SELECT id, email, name, role, phone FROM al_staff WHERE LOWER(email) = LOWER($1) AND active = true LIMIT 1',
      [email.trim()],
    );

    if (!result.rows || result.rows.length === 0) {
      // Don't reveal whether email exists — generic message
      return NextResponse.json({
        success: true,
        channel: 'sent',
        message: 'If this email is registered, an OTP has been sent.',
      });
    }

    const staff = result.rows[0];

    // Generate 6-digit OTP
    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any previous unused OTPs for this email
    await query(
      'UPDATE al_otp SET used = true WHERE email = $1 AND used = false',
      [staff.email],
    );

    // Store OTP
    await query(
      'INSERT INTO al_otp (email, code, expires_at) VALUES ($1, $2, $3)',
      [staff.email, code, expiresAt.toISOString()],
    );

    // Send OTP via WhatsApp if configured, otherwise dev mode
    const waToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (waToken && waPhoneId && staff.phone) {
      // Production: Send via WhatsApp Cloud API authentication template
      try {
        await fetch(
          `https://graph.facebook.com/v21.0/${waPhoneId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${waToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: staff.phone.replace(/[^0-9]/g, ''),
              type: 'template',
              template: {
                name: 'al_staff_otp',
                language: { code: 'en' },
                components: [
                  {
                    type: 'body',
                    parameters: [
                      { type: 'text', text: code },
                    ],
                  },
                  {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [
                      { type: 'text', text: code },
                    ],
                  },
                ],
              },
            }),
          },
        );

        return NextResponse.json({
          success: true,
          staffId: staff.id,
          channel: 'whatsapp',
          message: `OTP sent to WhatsApp ending in ${staff.phone.slice(-4)}`,
        });
      } catch (waErr) {
        console.error('[auth/login] WhatsApp OTP send failed:', waErr);
        // Fall through to dev mode
      }
    }

    // Dev mode: OTP is stored in DB but not sent — log for dev access only
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[auth/login] DEV OTP for ${staff.email}: ${code}`);
    }

    return NextResponse.json({
      success: true,
      staffId: staff.id,
      channel: 'dev',
      message: 'OTP sent (dev mode — check server logs or use 000000)',
      // In dev, also accept the hardcoded 000000
    });
  } catch (err) {
    console.error('[auth/login] error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
