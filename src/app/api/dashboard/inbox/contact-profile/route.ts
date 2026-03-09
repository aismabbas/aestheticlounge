import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

/**
 * GET /api/dashboard/inbox/contact-profile?thread_id=...
 *
 * Returns enriched contact profile for the inbox right panel:
 * - Lead/client details
 * - Behavior events (user journey)
 * - Appointments
 * - Payments summary
 */
export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const threadId = req.nextUrl.searchParams.get('thread_id');
  if (!threadId) {
    return NextResponse.json({ error: 'thread_id required' }, { status: 400 });
  }

  try {
    // Get thread
    const threadRes = await query(
      `SELECT * FROM al_unified_inbox WHERE id = $1`,
      [threadId],
    );
    if (threadRes.rows.length === 0) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    const thread = threadRes.rows[0];

    let lead = null;
    let client = null;
    let appointments: unknown[] = [];
    let payments: unknown[] = [];
    let behaviorEvents: unknown[] = [];
    let journey = null;

    // Fetch lead data if linked
    if (thread.lead_id) {
      const leadRes = await query(
        `SELECT id, name, phone, email, source, stage, quality, interest, notes,
                booked_treatment, booking_value, score, score_factors,
                treatments_viewed, utm_source, utm_medium, utm_campaign,
                landing_page, visit_count, time_on_site, created_at, last_activity_at,
                instagram_handle, facebook_id, whatsapp_number
         FROM al_leads WHERE id = $1`,
        [thread.lead_id],
      );
      if (leadRes.rows.length > 0) {
        lead = leadRes.rows[0];

        // Get behavior events for this lead's visitor_id
        const visitorRes = await query(
          `SELECT visitor_id FROM al_leads WHERE id = $1`,
          [thread.lead_id],
        );
        const visitorId = visitorRes.rows[0]?.visitor_id;

        if (visitorId) {
          const eventsRes = await query(
            `SELECT event_type, page_url, page_title, metadata, session_id, created_at
             FROM al_behavior_events
             WHERE visitor_id = $1
               AND created_at > NOW() - INTERVAL '90 days'
             ORDER BY created_at DESC
             LIMIT 50`,
            [visitorId],
          );
          behaviorEvents = eventsRes.rows;

          // Build simple journey
          const reversed = [...eventsRes.rows].reverse();
          const pageViews = reversed.filter((e: { event_type: string }) => e.event_type === 'page_view');
          const uniquePages = new Set(pageViews.map((e: { page_url: string }) => e.page_url));
          journey = {
            landing_page: pageViews[0]?.page_url || null,
            pages_visited: uniquePages.size,
            page_list: Array.from(uniquePages).slice(0, 10),
            cta_clicked: reversed.some((e: { event_type: string }) => e.event_type === 'cta_click'),
            form_submitted: reversed.some((e: { event_type: string }) => e.event_type === 'form_submit'),
            total_time: reversed
              .filter((e: { event_type: string }) => e.event_type === 'time_on_page')
              .reduce((sum: number, e: { metadata: unknown }) => {
                const meta = typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata;
                return sum + ((meta as { seconds?: number })?.seconds || 0);
              }, 0),
          };
        }
      }
    }

    // Fetch client data if linked
    if (thread.client_id) {
      const clientRes = await query(
        `SELECT id, name, phone, email, gender, date_of_birth, created_at
         FROM al_clients WHERE id = $1`,
        [thread.client_id],
      );
      if (clientRes.rows.length > 0) {
        client = clientRes.rows[0];

        // Get appointments for this client
        const apptRes = await query(
          `SELECT id, treatment, date, time, status, created_at
           FROM al_appointments WHERE client_id = $1
           ORDER BY date DESC LIMIT 10`,
          [thread.client_id],
        );
        appointments = apptRes.rows;

        // Get payment summary
        const payRes = await query(
          `SELECT id, amount, currency, treatment, status, created_at
           FROM al_payments WHERE client_id = $1
           ORDER BY created_at DESC LIMIT 10`,
          [thread.client_id],
        );
        payments = payRes.rows;
      }
    }

    // Search for matching leads/clients by phone or name (for merge suggestions)
    const matchSuggestions: unknown[] = [];
    if (!thread.lead_id && !thread.client_id) {
      // Try to find matching leads
      if (thread.contact_phone) {
        const phoneMatches = await query(
          `SELECT id, name, phone, email, stage, source, created_at FROM al_leads
           WHERE phone = $1 OR phone LIKE $2
           ORDER BY created_at DESC LIMIT 5`,
          [thread.contact_phone, `%${thread.contact_phone.slice(-10)}%`],
        );
        for (const row of phoneMatches.rows) {
          matchSuggestions.push({ type: 'lead', ...row });
        }
      }
      if (thread.contact_name && thread.contact_name !== 'Unknown') {
        const nameMatches = await query(
          `SELECT id, name, phone, email, stage, source, created_at FROM al_leads
           WHERE LOWER(name) LIKE $1
           ORDER BY created_at DESC LIMIT 3`,
          [`%${thread.contact_name.toLowerCase()}%`],
        );
        for (const row of nameMatches.rows) {
          if (!matchSuggestions.some((s: unknown) => (s as { id: string }).id === row.id)) {
            matchSuggestions.push({ type: 'lead', ...row });
          }
        }
      }
      // Also check clients
      if (thread.contact_phone) {
        const clientMatches = await query(
          `SELECT id, name, phone, email, created_at FROM al_clients
           WHERE phone = $1 OR phone LIKE $2
           ORDER BY created_at DESC LIMIT 3`,
          [thread.contact_phone, `%${thread.contact_phone.slice(-10)}%`],
        );
        for (const row of clientMatches.rows) {
          matchSuggestions.push({ type: 'client', ...row });
        }
      }
    }

    return NextResponse.json({
      thread_id: threadId,
      lead,
      client,
      appointments,
      payments,
      behavior_events: behaviorEvents,
      journey,
      match_suggestions: matchSuggestions,
    });
  } catch (err) {
    console.error('[inbox/contact-profile] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
