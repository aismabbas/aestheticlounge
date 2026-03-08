import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

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

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get('status');
    const method = sp.get('method');
    const dateFrom = sp.get('date_from');
    const dateTo = sp.get('date_to');
    const limit = parseInt(sp.get('limit') || '100', 10);
    const sort = sp.get('sort') || 'created_at';
    const order = sp.get('order') || 'DESC';

    const allowedSort = ['created_at', 'amount', 'client_name', 'treatment', 'status', 'payment_method'];
    const safeSort = allowedSort.includes(sort) ? sort : 'created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let sql = 'SELECT * FROM al_payments';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (method) {
      params.push(method);
      conditions.push(`payment_method = $${params.length}`);
    }

    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`created_at >= $${params.length}::timestamptz`);
    }

    if (dateTo) {
      params.push(dateTo + 'T23:59:59.999Z');
      conditions.push(`created_at <= $${params.length}::timestamptz`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY ${safeSort} ${safeOrder} NULLS LAST`;

    params.push(limit);
    sql += ` LIMIT $${params.length}`;

    // Summary stats — scoped to same filters (except limit)
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    const statsParams = params.slice(0, -1); // exclude limit

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const statsSql = `
      SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= '${monthStart}' THEN amount ELSE 0 END), 0) AS month_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_total,
        COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= '${todayStart}' THEN amount ELSE 0 END), 0) AS today_collections,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) AS avg_transaction,
        COUNT(*) AS total_count
      FROM al_payments${whereClause}
    `;

    const [result, statsResult] = await Promise.all([
      query(sql, params),
      query(statsSql, statsParams),
    ]);

    const stats = statsResult.rows[0];

    return NextResponse.json({
      payments: result.rows,
      total: parseInt(stats.total_count, 10),
      stats: {
        month_revenue: parseFloat(stats.month_revenue),
        pending_total: parseFloat(stats.pending_total),
        today_collections: parseFloat(stats.today_collections),
        avg_transaction: parseFloat(stats.avg_transaction),
      },
    });
  } catch (err) {
    console.error('[dashboard/payments] GET error:', err);
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
    const {
      client_id,
      client_name,
      amount,
      currency = 'PKR',
      treatment,
      payment_method,
      status = 'completed',
      receipt_number,
      notes,
      staff_id,
    } = body;

    if (!client_name || !amount || !treatment || !payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields: client_name, amount, treatment, payment_method' },
        { status: 400 },
      );
    }

    const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const sql = `
      INSERT INTO al_payments (id, client_id, client_name, amount, currency, treatment, payment_method, status, receipt_number, notes, staff_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await query(sql, [
      id,
      client_id || null,
      client_name,
      amount,
      currency,
      treatment,
      payment_method,
      status,
      receipt_number || null,
      notes || null,
      staff_id || user.id || null,
    ]);

    return NextResponse.json({ payment: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[dashboard/payments] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
