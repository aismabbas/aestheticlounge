import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';
import { checkAuth } from '@/lib/api-auth';

export async function GET() {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await query('SELECT * FROM al_services ORDER BY category, name');

    // Group by category
    const grouped: Record<string, unknown[]> = {};
    for (const svc of result.rows) {
      const cat = svc.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(svc);
    }

    return NextResponse.json({ services: grouped });
  } catch (err) {
    console.error('[dashboard/services] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, category, description, price_pkr, duration_min, slug } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'name and category are required' },
        { status: 400 },
      );
    }

    const id = ulid();
    const safeSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const result = await query(
      `INSERT INTO al_services (id, name, category, description, price_pkr, duration_min, active, slug)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       RETURNING *`,
      [id, name, category, description || null, price_pkr || 0, duration_min || 30, safeSlug],
    );

    return NextResponse.json({ service: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[dashboard/services] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
