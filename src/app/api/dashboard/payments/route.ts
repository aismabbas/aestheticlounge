import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendCAPIEvent } from '@/lib/capi';
import { checkAuth } from '@/lib/api-auth';

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

    const mp = statsParams.length + 1; // monthStart param index
    const tp = statsParams.length + 2; // todayStart param index

    const statsSql = `
      SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= $${mp}::timestamptz THEN amount ELSE 0 END), 0) AS month_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_total,
        COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= $${tp}::timestamptz THEN amount ELSE 0 END), 0) AS today_collections,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) AS avg_transaction,
        COUNT(*) AS total_count
      FROM al_payments${whereClause}
    `;

    const [result, statsResult] = await Promise.all([
      query(sql, params),
      query(statsSql, [...statsParams, monthStart, todayStart]),
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
      staff_id || user.staffId || null,
    ]);

    // Fire Meta CAPI Purchase event for closed-loop attribution
    if (status === 'completed' && amount > 0) {
      // Lookup client email/phone for CAPI matching
      let clientEmail: string | undefined;
      let clientPhone: string | undefined;
      if (client_id) {
        try {
          const clientRow = await query(
            `SELECT email, phone FROM al_clients WHERE id = $1 LIMIT 1`,
            [client_id],
          );
          if (clientRow.rows[0]) {
            clientEmail = clientRow.rows[0].email || undefined;
            clientPhone = clientRow.rows[0].phone || undefined;
          }
        } catch { /* non-critical */ }
      }

      sendCAPIEvent({
        eventName: 'Purchase',
        eventSourceUrl: 'https://aestheticloungeofficial.com/dashboard/payments',
        userData: {
          email: clientEmail,
          phone: clientPhone,
        },
        customData: {
          currency: currency || 'PKR',
          value: parseFloat(amount),
          content_name: treatment,
          content_category: 'treatment_payment',
        },
      }).catch((err) => console.error('[payments] CAPI Purchase error:', err));
    }

    return NextResponse.json({ payment: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[dashboard/payments] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
