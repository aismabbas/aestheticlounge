import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

/**
 * Meta Data Deletion Callback Endpoint
 *
 * When a user removes the app from their Facebook settings, Meta sends a
 * POST request to this endpoint with a signed_request containing the user's
 * Facebook ID. We must:
 *   1. Parse and verify the signed_request
 *   2. Delete user data associated with that Facebook user ID
 *   3. Return a JSON response with a confirmation_code and a status URL
 *
 * Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */

const APP_SECRET = process.env.META_APP_SECRET || '';

function parseSignedRequest(signedRequest: string): { user_id: string } | null {
  if (!APP_SECRET) {
    console.error('[data-deletion] META_APP_SECRET not configured');
    return null;
  }

  const [encodedSig, payload] = signedRequest.split('.');
  if (!encodedSig || !payload) return null;

  try {
    // Decode signature
    const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', APP_SECRET)
      .update(payload)
      .digest();

    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(sig, expectedSig)) {
      console.error('[data-deletion] Invalid signature');
      return null;
    }

    // Decode payload
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'),
    );

    return decoded;
  } catch {
    console.error('[data-deletion] Failed to parse signed_request');
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });
    }

    const data = parseSignedRequest(signedRequest);
    if (!data || !data.user_id) {
      return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 });
    }

    const userId = data.user_id;
    const confirmationCode = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    // Log the deletion request
    await query(
      `INSERT INTO al_data_deletion_requests (meta_user_id, confirmation_code, status, requested_at, expires_at)
       VALUES ($1, $2, 'pending', NOW(), $3)
       ON CONFLICT (meta_user_id) DO UPDATE SET
         confirmation_code = $2,
         status = 'pending',
         requested_at = NOW(),
         expires_at = $3`,
      [userId, confirmationCode, expiresAt.toISOString()],
    );

    // Delete user data from our tables
    // Meta user ID maps to sent_by in inbox messages (IG/Messenger sender ID)
    // For leads and behavior events, Meta doesn't provide a direct mapping,
    // so we delete inbox messages by sender ID and log the request for manual review
    await query(`DELETE FROM al_inbox_messages WHERE sent_by = $1`, [userId]);

    // Mark deletion as complete
    await query(
      `UPDATE al_data_deletion_requests SET status = 'completed', completed_at = NOW() WHERE meta_user_id = $1`,
      [userId],
    );

    console.info(`[data-deletion] Processed deletion for Meta user ${userId}`);

    // Return the response format Meta expects
    const statusUrl = `https://aestheticloungeofficial.com/data-deletion?code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (err) {
    console.error('[data-deletion] Error processing request:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET handler — allows users to check deletion status with a confirmation code.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing confirmation code' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT status, requested_at, completed_at, expires_at FROM al_data_deletion_requests WHERE confirmation_code = $1`,
      [code],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid confirmation code' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      status: row.status,
      requested_at: row.requested_at,
      completed_at: row.completed_at,
      expires_at: row.expires_at,
    });
  } catch (err) {
    console.error('[data-deletion] Status check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
