import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = ['active', 'role', 'name', 'phone'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        values.push(body[field]);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE al_staff SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id, email, name, role, phone, active`;

    const result = await query(sql, values);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[dashboard/staff/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
