import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await query('SELECT * FROM al_payments WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ payment: result.rows[0] });
  } catch (err) {
    console.error('[dashboard/payments/[id]] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const allowedFields = ['status', 'notes', 'payment_method', 'amount', 'receipt_number'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        values.push(body[field]);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE al_payments SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ payment: result.rows[0] });
  } catch (err) {
    console.error('[dashboard/payments/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await query('DELETE FROM al_payments WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, id });
  } catch (err) {
    console.error('[dashboard/payments/[id]] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
