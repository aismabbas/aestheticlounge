import { NextRequest, NextResponse } from 'next/server';
import { assignLead, autoAssignLead } from '@/lib/lead-assignment';
import { checkAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { lead_id, staff_id, action } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
    }

    // Auto-assign mode
    if (action === 'auto') {
      const assignedTo = await autoAssignLead(lead_id);
      if (!assignedTo) {
        return NextResponse.json(
          { error: 'No available staff for assignment' },
          { status: 422 },
        );
      }
      return NextResponse.json({ success: true, assigned_to: assignedTo });
    }

    // Manual assign mode
    if (!staff_id) {
      return NextResponse.json(
        { error: 'staff_id is required for manual assignment' },
        { status: 400 },
      );
    }

    await assignLead(lead_id, staff_id);
    return NextResponse.json({ success: true, assigned_to: staff_id });
  } catch (err) {
    console.error('[dashboard/leads/assign] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
