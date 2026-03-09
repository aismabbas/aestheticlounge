import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  getPageViewsForUser,
  getTopPagesViewed,
  getUserSessionData,
  getTrafficSource,
} from '@/lib/ga4';
import { checkAuth } from '@/lib/api-auth';

/**
 * GET /api/dashboard/leads/[id]/behavior
 *
 * Returns the full behavioral profile for a lead:
 * - Page view history
 * - Session timeline
 * - Top pages
 * - CTAs clicked
 * - Time on site total
 * - Treatments browsed
 * - Scroll depth averages
 * - GA4 data (if configured)
 * - Section engagement (time per page group)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get lead + visitor_id
    const leadResult = await query('SELECT id, visitor_id, name FROM al_leads WHERE id = $1', [id]);
    if (leadResult.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leadResult.rows[0];
    const visitorId = lead.visitor_id;

    if (!visitorId) {
      return NextResponse.json({
        lead_id: id,
        has_data: false,
        message: 'No visitor tracking linked to this lead yet.',
        events: [],
        sessions: [],
        top_pages: [],
        cta_clicks: [],
        time_on_site_total: 0,
        treatments_browsed: [],
        avg_scroll_depth: 0,
        journey: null,
        ga4: null,
      });
    }

    // Fetch all events for this visitor (last 90 days, cap at 500)
    const eventsResult = await query(
      `SELECT event_type, page_url, page_title, metadata, session_id, created_at
       FROM al_behavior_events
       WHERE visitor_id = $1
         AND created_at > NOW() - INTERVAL '90 days'
       ORDER BY created_at DESC
       LIMIT 500`,
      [visitorId],
    );
    const events = eventsResult.rows;

    // Page view history (ordered by time)
    const pageViews = events
      .filter((e: { event_type: string }) => e.event_type === 'page_view')
      .reverse();

    // Session timeline (grouped by session_id)
    const sessionMap = new Map<string, {
      session_id: string;
      started_at: string;
      ended_at: string;
      page_count: number;
      pages: string[];
      duration_seconds: number;
      source: string;
    }>();

    for (const event of events) {
      const sid = event.session_id;
      if (!sessionMap.has(sid)) {
        sessionMap.set(sid, {
          session_id: sid,
          started_at: event.created_at,
          ended_at: event.created_at,
          page_count: 0,
          pages: [],
          duration_seconds: 0,
          source: '',
        });
      }
      const session = sessionMap.get(sid)!;

      // Expand time range
      const eventTime = new Date(event.created_at).getTime();
      if (eventTime < new Date(session.started_at).getTime()) {
        session.started_at = event.created_at;
      }
      if (eventTime > new Date(session.ended_at).getTime()) {
        session.ended_at = event.created_at;
      }

      if (event.event_type === 'page_view') {
        session.page_count++;
        if (!session.pages.includes(event.page_url)) {
          session.pages.push(event.page_url);
        }
        // Check for referrer in metadata
        const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata;
        if (meta?.referrer && !session.source) {
          session.source = meta.referrer;
        }
      }

      if (event.event_type === 'time_on_page') {
        const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata;
        session.duration_seconds += meta?.seconds || 0;
      }
    }

    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    // Top pages visited (aggregated)
    const pageCounts = new Map<string, { url: string; title: string; views: number; is_treatment: boolean }>();
    for (const event of events) {
      if (event.event_type !== 'page_view') continue;
      const existing = pageCounts.get(event.page_url);
      const isTreatment = /\/(services|treatments)\//i.test(event.page_url);
      if (existing) {
        existing.views++;
      } else {
        pageCounts.set(event.page_url, {
          url: event.page_url,
          title: event.page_title || event.page_url,
          views: 1,
          is_treatment: isTreatment,
        });
      }
    }
    const topPages = Array.from(pageCounts.values())
      .sort((a, b) => b.views - a.views);

    // CTA clicks
    const ctaClicks = events
      .filter((e: { event_type: string }) => e.event_type === 'cta_click')
      .map((e: { metadata: unknown; page_url: string; created_at: string }) => {
        const meta = typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata;
        return {
          type: meta?.cta_type || 'unknown',
          text: meta?.cta_text || '',
          page: e.page_url,
          timestamp: e.created_at,
        };
      });

    // Time on site total
    const timeOnSiteTotal = events
      .filter((e: { event_type: string }) => e.event_type === 'time_on_page')
      .reduce((sum: number, e: { metadata: unknown }) => {
        const meta = typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata;
        return sum + (meta?.seconds || 0);
      }, 0);

    // Treatments browsed
    const treatmentPages = topPages.filter((p) => p.is_treatment);

    // Scroll depth average
    const scrollEvents = events.filter((e: { event_type: string }) => e.event_type === 'scroll');
    const avgScrollDepth = scrollEvents.length > 0
      ? Math.round(
          scrollEvents.reduce((sum: number, e: { metadata: unknown }) => {
            const meta = typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata;
            return sum + (meta?.depth_percent || 0);
          }, 0) / scrollEvents.length,
        )
      : 0;

    // Section engagement (time per page group)
    const sectionTime = new Map<string, number>();
    for (const event of events) {
      if (event.event_type !== 'time_on_page') continue;
      const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata;
      const seconds = meta?.seconds || 0;
      // Group by first path segment
      const segment = event.page_url.split('/').filter(Boolean)[0] || 'home';
      sectionTime.set(segment, (sectionTime.get(segment) || 0) + seconds);
    }
    const sectionEngagement = Array.from(sectionTime.entries())
      .map(([section, seconds]) => ({ section, seconds }))
      .sort((a, b) => b.seconds - a.seconds);

    // Journey map: first landing → pages → CTA → form
    const journey = buildJourneyMap(events);

    // GA4 data (optional)
    let ga4Data = null;
    try {
      const [ga4Sessions, ga4Source] = await Promise.all([
        getUserSessionData(visitorId),
        getTrafficSource(visitorId),
      ]);
      if (ga4Sessions || ga4Source) {
        const ga4Pages = await getTopPagesViewed(visitorId);
        const ga4PageViews = await getPageViewsForUser(visitorId);
        ga4Data = {
          sessions: ga4Sessions,
          traffic_source: ga4Source,
          top_pages: ga4Pages,
          page_views: ga4PageViews,
        };
      }
    } catch {
      // GA4 not configured — that's fine
    }

    return NextResponse.json({
      lead_id: id,
      visitor_id: visitorId,
      has_data: events.length > 0,
      events: pageViews.slice(0, 100), // recent page views
      sessions,
      top_pages: topPages,
      cta_clicks: ctaClicks,
      time_on_site_total: timeOnSiteTotal,
      treatments_browsed: treatmentPages,
      avg_scroll_depth: avgScrollDepth,
      section_engagement: sectionEngagement,
      journey,
      ga4: ga4Data,
      total_events: events.length,
    });
  } catch (err) {
    console.error('[leads/[id]/behavior] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildJourneyMap(events: any[]): {
  landing_page: string | null;
  pages_visited: number;
  cta_clicked: boolean;
  form_started: boolean;
  form_submitted: boolean;
} {
  const reversed = [...events].reverse(); // chronological order
  const landing = reversed.find((e) => e.event_type === 'page_view');
  const pagesVisited = new Set(
    reversed.filter((e) => e.event_type === 'page_view').map((e) => e.page_url),
  ).size;
  const ctaClicked = reversed.some((e) => e.event_type === 'cta_click');
  const formStarted = reversed.some((e) => e.event_type === 'form_start');
  const formSubmitted = reversed.some((e) => e.event_type === 'form_submit');

  return {
    landing_page: landing?.page_url || null,
    pages_visited: pagesVisited,
    cta_clicked: ctaClicked,
    form_started: formStarted,
    form_submitted: formSubmitted,
  };
}
