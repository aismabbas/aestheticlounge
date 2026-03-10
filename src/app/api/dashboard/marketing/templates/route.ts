import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { TEMPLATE_SCHEMAS as templateSchemas } from '@/lib/marketing-config';

/**
 * GET /api/dashboard/marketing/templates
 * Returns all available templates with their schema info.
 */
export async function GET() {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json(templateSchemas);
}
