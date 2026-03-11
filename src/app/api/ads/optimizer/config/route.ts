import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/ads/optimizer/config — read all config keys
 * PATCH /api/ads/optimizer/config — update config keys
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { rows } = await query(`SELECT key, value, updated_at FROM al_optimizer_config ORDER BY key`);
    const config: Record<string, string> = {};
    for (const r of rows) config[r.key as string] = r.value as string;
    return NextResponse.json({ config });
  } catch (err) {
    console.error('[optimizer/config] Error:', err);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const updates = await req.json() as Record<string, string>;

    const allowedKeys = ['target_cpl', 'daily_cap_cents', 'monthly_cap_cad', 'optimizer_enabled', 'auto_execute_tier1', 'auto_execute_tier2'];
    const numericKeys = ['target_cpl', 'daily_cap_cents', 'monthly_cap_cad'];
    const booleanKeys = ['optimizer_enabled', 'auto_execute_tier1', 'auto_execute_tier2'];

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedKeys.includes(key)) continue;
      if (numericKeys.includes(key) && (isNaN(Number(value)) || Number(value) < 0)) {
        return NextResponse.json({ error: `Invalid numeric value for ${key}` }, { status: 400 });
      }
      if (booleanKeys.includes(key) && value !== 'true' && value !== 'false') {
        return NextResponse.json({ error: `${key} must be 'true' or 'false'` }, { status: 400 });
      }
      await query(
        `INSERT INTO al_optimizer_config (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, String(value)],
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[optimizer/config] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
