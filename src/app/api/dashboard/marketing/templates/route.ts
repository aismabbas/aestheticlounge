import { NextResponse } from 'next/server';
import { TEMPLATE_SCHEMAS as templateSchemas } from '@/lib/marketing-config';

/**
 * GET /api/dashboard/marketing/templates
 * Returns all available templates with their schema info.
 */
export async function GET() {
  return NextResponse.json(templateSchemas);
}
