import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('al_session');
  if (!session?.value) return null;
  try {
    const data = JSON.parse(session.value);
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

// POST — public, no auth required
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`feedback:${ip}`, 10 * 60_000, 5)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      client_name,
      treatment,
      rating,
      feedback,
      would_recommend,
      improvements,
    } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating (1-5) is required' },
        { status: 400 },
      );
    }

    if (!feedback || feedback.trim().length === 0) {
      return NextResponse.json(
        { error: 'Feedback text is required' },
        { status: 400 },
      );
    }

    const id = ulid();
    const result = await query(
      `INSERT INTO al_feedback (id, client_name, treatment, rating, feedback, would_recommend, improvements)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        id,
        client_name || null,
        treatment || null,
        rating,
        feedback.trim(),
        would_recommend ?? null,
        improvements?.trim() || null,
      ],
    );

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Feedback POST error:', err);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 },
    );
  }
}

// GET — dashboard auth required
export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rating = req.nextUrl.searchParams.get('rating');
    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');

    let sql = 'SELECT * FROM al_feedback';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (rating) {
      params.push(parseInt(rating, 10));
      conditions.push(`rating = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`created_at >= $${params.length}::date`);
    }
    if (to) {
      params.push(to);
      conditions.push(`created_at <= $${params.length}::date + interval '1 day'`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Feedback GET error:', err);
    return NextResponse.json(
      { error: 'Failed to load feedback' },
      { status: 500 },
    );
  }
}
