import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';

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
  try {
    const body = await req.json();
    const { complaint, category, client_name, client_phone } = body;

    if (!complaint || complaint.trim().length < 20) {
      return NextResponse.json(
        { error: 'Complaint must be at least 20 characters' },
        { status: 400 },
      );
    }

    const validCategories = [
      'Service Quality',
      'Wait Times',
      'Staff Behavior',
      'Cleanliness',
      'Billing',
      'Other',
    ];

    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Valid category is required' },
        { status: 400 },
      );
    }

    const isAnonymous = !client_name && !client_phone;

    const id = ulid();
    const result = await query(
      `INSERT INTO al_complaints (id, complaint, category, client_name, client_phone, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        id,
        complaint.trim(),
        category,
        client_name?.trim() || null,
        client_phone?.trim() || null,
        isAnonymous,
      ],
    );

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Complaint POST error:', err);
    return NextResponse.json(
      { error: 'Failed to submit complaint' },
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
    const status = req.nextUrl.searchParams.get('status');
    const category = req.nextUrl.searchParams.get('category');

    let sql = 'SELECT * FROM al_complaints';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Complaint GET error:', err);
    return NextResponse.json(
      { error: 'Failed to load complaints' },
      { status: 500 },
    );
  }
}

// PATCH — update complaint status/notes (auth required)
export async function PATCH(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, admin_notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Complaint ID required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (status) {
      const validStatuses = ['new', 'reviewing', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (admin_notes !== undefined) {
      params.push(admin_notes);
      updates.push(`admin_notes = $${params.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    params.push(id);
    const sql = `UPDATE al_complaints SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;

    const result = await query(sql, params);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Complaint PATCH error:', err);
    return NextResponse.json(
      { error: 'Failed to update complaint' },
      { status: 500 },
    );
  }
}
