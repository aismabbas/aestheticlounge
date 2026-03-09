import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  const limit = Number(req.nextUrl.searchParams.get('limit') || '50');

  try {
    const rows = await sql`
      SELECT id, created_at, agent, action, decision, context, result
      FROM al_decision_log
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return NextResponse.json({ log: rows });
  } catch {
    return NextResponse.json({ log: [] });
  }
}
