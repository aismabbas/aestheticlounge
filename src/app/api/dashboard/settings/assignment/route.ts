import { NextRequest, NextResponse } from 'next/server';
import {
  getAssignmentSettings,
  saveAssignmentSettings,
  getAssignmentStats,
} from '@/lib/lead-assignment';
import { checkAuth } from '@/lib/api-auth';

export async function GET() {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [settings, stats] = await Promise.all([
      getAssignmentSettings(),
      getAssignmentStats(),
    ]);

    return NextResponse.json({ settings, stats });
  } catch (err) {
    console.error('[settings/assignment] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admin/manager can change settings
  if (!['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await req.json();
    await saveAssignmentSettings(body);
    const updated = await getAssignmentSettings();
    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    console.error('[settings/assignment] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
