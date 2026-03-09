import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getAllActiveExecutions, checkConnection } from '@/lib/n8n';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const connected = await checkConnection();
    if (!connected) {
      return NextResponse.json({ connected: false, executions: [] });
    }
    const executions = await getAllActiveExecutions();
    return NextResponse.json({ connected: true, executions });
  } catch {
    return NextResponse.json({ connected: false, executions: [] });
  }
}
