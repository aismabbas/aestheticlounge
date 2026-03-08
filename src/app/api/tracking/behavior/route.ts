import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/tracking/behavior
 *
 * Accepts batched behavioral events from the frontend tracker.
 * Stores in al_behavior_events and updates aggregate fields on al_leads.
 *
 * Table DDL (run once):
 *
 * CREATE TABLE IF NOT EXISTS al_behavior_events (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   visitor_id TEXT NOT NULL,
 *   lead_id UUID,
 *   event_type TEXT NOT NULL,       -- page_view, scroll, cta_click, time_on_page, form_start, form_submit
 *   page_url TEXT NOT NULL,
 *   page_title TEXT DEFAULT '',
 *   metadata JSONB DEFAULT '{}',
 *   session_id TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_behavior_visitor ON al_behavior_events(visitor_id);
 * CREATE INDEX idx_behavior_lead ON al_behavior_events(lead_id);
 * CREATE INDEX idx_behavior_session ON al_behavior_events(session_id);
 * CREATE INDEX idx_behavior_type ON al_behavior_events(event_type);
 * CREATE INDEX idx_behavior_created ON al_behavior_events(created_at);
 *
 * -- Add visitor_id column to al_leads if not present:
 * ALTER TABLE al_leads ADD COLUMN IF NOT EXISTS visitor_id TEXT;
 * CREATE INDEX IF NOT EXISTS idx_leads_visitor ON al_leads(visitor_id);
 */

interface IncomingEvent {
  visitor_id: string;
  event_type: string;
  page_url: string;
  page_title?: string;
  metadata?: Record<string, unknown>;
  session_id: string;
  timestamp?: string;
}

// Treatment page patterns
const TREATMENT_PATTERNS = [
  '/services/',
  '/treatments/',
  '/laser',
  '/hydrafacial',
  '/botox',
  '/filler',
  '/prp',
  '/skin',
  '/chemical-peel',
  '/microneedling',
];

function extractTreatmentName(url: string): string | null {
  const lower = url.toLowerCase();
  for (const pattern of TREATMENT_PATTERNS) {
    if (lower.includes(pattern)) {
      // Extract the slug from the URL
      const parts = url.split('/').filter(Boolean);
      const slug = parts[parts.length - 1] || '';
      // Convert slug to display name
      return slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const events: IncomingEvent[] = Array.isArray(body.events)
      ? body.events
      : body.visitor_id
        ? [body]
        : [];

    if (events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Validate events
    const validEvents = events.filter(
      (e) => e.visitor_id && e.event_type && e.page_url && e.session_id,
    );

    if (validEvents.length === 0) {
      return NextResponse.json({ error: 'No valid events' }, { status: 400 });
    }

    // Look up lead_id for this visitor
    const visitorId = validEvents[0].visitor_id;
    let leadId: string | null = null;

    try {
      const leadResult = await query(
        'SELECT id FROM al_leads WHERE visitor_id = $1 LIMIT 1',
        [visitorId],
      );
      if (leadResult.rows.length > 0) {
        leadId = leadResult.rows[0].id;
      }
    } catch {
      // visitor_id column may not exist yet — graceful fallback
    }

    // Batch insert events
    const valueParts: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    for (const event of validEvents) {
      valueParts.push(
        `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6})`,
      );
      params.push(
        event.visitor_id,
        leadId,
        event.event_type,
        event.page_url,
        event.page_title || '',
        JSON.stringify(event.metadata || {}),
        event.session_id,
      );
      paramIdx += 7;
    }

    await query(
      `INSERT INTO al_behavior_events (visitor_id, lead_id, event_type, page_url, page_title, metadata, session_id)
       VALUES ${valueParts.join(', ')}`,
      params,
    );

    // Update aggregate fields on al_leads if we have a linked lead
    if (leadId) {
      await updateLeadAggregates(leadId, validEvents);
    }

    return NextResponse.json({ ok: true, stored: validEvents.length });
  } catch (err) {
    console.error('[tracking/behavior] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateLeadAggregates(
  leadId: string,
  events: IncomingEvent[],
): Promise<void> {
  try {
    // Count page views in this batch
    const pageViews = events.filter((e) => e.event_type === 'page_view').length;

    // Sum time on page
    const timeOnPage = events
      .filter((e) => e.event_type === 'time_on_page')
      .reduce((sum, e) => sum + (((e.metadata as Record<string, number>)?.seconds) || 0), 0);

    // Extract treatments viewed
    const treatments = new Set<string>();
    for (const event of events) {
      if (event.event_type === 'page_view') {
        const treatment = extractTreatmentName(event.page_url);
        if (treatment) treatments.add(treatment);
      }
    }

    // Count form submissions
    const formSubmits = events.filter((e) => e.event_type === 'form_submit').length;

    // Build update query
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (pageViews > 0) {
      updates.push(`pages_viewed = COALESCE(pages_viewed, 0) + $${idx}`);
      params.push(pageViews);
      idx++;
    }

    if (timeOnPage > 0) {
      updates.push(`time_on_site = COALESCE(time_on_site, 0) + $${idx}`);
      params.push(timeOnPage);
      idx++;
    }

    if (formSubmits > 0) {
      updates.push(`form_submissions = COALESCE(form_submissions, 0) + $${idx}`);
      params.push(formSubmits);
      idx++;
    }

    // Always update last_activity_at
    updates.push(`last_activity_at = NOW()`);

    if (treatments.size > 0) {
      // Append new treatments to existing array (deduplicated via SQL)
      const treatArr = Array.from(treatments);
      updates.push(
        `treatments_viewed = (
          SELECT ARRAY(
            SELECT DISTINCT unnest(
              COALESCE(treatments_viewed, '{}') || $${idx}::text[]
            )
          )
        )`,
      );
      params.push(treatArr);
      idx++;
    }

    if (updates.length > 0) {
      params.push(leadId);
      await query(
        `UPDATE al_leads SET ${updates.join(', ')} WHERE id = $${idx}`,
        params,
      );
    }
  } catch (err) {
    console.error('[tracking/behavior] Lead aggregate update error:', err);
  }
}
