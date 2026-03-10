import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { query } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  GET — List connected Meta forms with lead counts                   */
/* ------------------------------------------------------------------ */

export async function GET() {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await query(
      `SELECT
        form_id,
        landing_page AS form_name,
        ad_id,
        COUNT(*)::int AS lead_count,
        MAX(created_at) AS last_lead_at,
        utm_campaign
       FROM al_leads
       WHERE source = 'meta_form'
         AND form_id IS NOT NULL
       GROUP BY form_id, landing_page, ad_id, utm_campaign
       ORDER BY MAX(created_at) DESC`,
    );

    return NextResponse.json({ forms: result.rows || [] });
  } catch (err) {
    console.error('[forms-api] error:', err);
    return NextResponse.json({ forms: [] });
  }
}
