import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUncontactedLeads, getUncontactedCount } from '@/lib/lead-assignment';

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
    const scope = req.nextUrl.searchParams.get('scope') || 'mine';
    const staffId = scope === 'mine' ? user.staffId : undefined;

    const [leads, summary] = await Promise.all([
      staffId ? getUncontactedLeads(staffId) : Promise.resolve([]),
      getUncontactedCount(staffId),
    ]);

    return NextResponse.json({
      leads,
      count: summary.count,
      oldest_seconds: summary.oldest_seconds,
    });
  } catch (err) {
    console.error('[dashboard/leads/uncontacted] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
