import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getChannelStatus } from '@/lib/meta-conversations';
import { isGoogleConfigured } from '@/lib/google-auth';
import { checkAuth } from '@/lib/api-auth';

export async function GET() {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Channel status
    const channels = getChannelStatus();

    // Tracking integrations status
    const integrations = {
      meta_pixel: {
        name: 'Meta Pixel',
        status: !!process.env.META_PIXEL_ID,
        id: process.env.META_PIXEL_ID || null,
        events: ['PageView', 'ViewContent', 'Lead', 'Schedule', 'Contact'],
        type: 'client-side',
        destination: 'Meta Ads Manager',
      },
      meta_capi: {
        name: 'Meta CAPI',
        status: !!(process.env.META_PIXEL_ID && process.env.META_ACCESS_TOKEN),
        events: ['Lead', 'Schedule', 'Purchase'],
        type: 'server-side',
        destination: 'Meta Events Manager',
        dedup: true,
      },
      ga4_client: {
        name: 'Google Analytics 4',
        status: !!process.env.NEXT_PUBLIC_GA4_ID,
        id: process.env.NEXT_PUBLIC_GA4_ID || null,
        events: ['page_view', 'scroll', 'consent_update'],
        type: 'client-side',
        destination: 'GA4 Property',
      },
      ga4_server: {
        name: 'GA4 Measurement Protocol',
        status: !!(process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET),
        events: ['Lead', 'Schedule', 'Purchase'],
        type: 'server-side',
        destination: 'GA4 Property',
      },
      ga4_data_api: {
        name: 'GA4 Data API',
        status: !!(process.env.GA4_PROPERTY_ID && isGoogleConfigured()),
        propertyId: process.env.GA4_PROPERTY_ID || null,
        type: 'read-only',
        destination: 'Dashboard Analytics',
      },
      behavior_tracking: {
        name: 'Behavior Tracking',
        status: true,
        events: ['page_view', 'scroll', 'time_on_page', 'cta_click'],
        type: 'client → server',
        destination: 'al_behavior_events (Neon DB)',
      },
      utm_tracking: {
        name: 'UTM Attribution',
        status: true,
        params: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'],
        type: 'client-side',
        destination: 'al_utm cookie → al_leads',
      },
      n8n_pipeline: {
        name: 'N8N Marketing Pipeline',
        status: !!(process.env.N8N_BASE_URL && process.env.N8N_API_KEY),
        type: 'webhook',
        destination: 'N8N Workflow',
      },
      cookie_consent: {
        name: 'Cookie Consent (GDPR)',
        status: true,
        categories: ['necessary', 'analytics', 'marketing', 'functional'],
        type: 'client-side',
        destination: 'Gates all tracking',
      },
    };

    // Inbox channel status
    const inboxChannels = {
      ig_comment: { name: 'Instagram Comments', status: channels.ig_comment, appReview: true },
      instagram_dm: { name: 'Instagram DMs', status: channels.instagram_dm, appReview: false, needed: 'instagram_business_manage_messages' },
      messenger: { name: 'Facebook Messenger', status: channels.messenger, appReview: false, needed: 'pages_messaging' },
      fb_comment: { name: 'Facebook Comments', status: channels.fb_comment, appReview: false, needed: 'pages_read_engagement' },
      whatsapp: { name: 'WhatsApp', status: channels.whatsapp, appReview: true, needed: channels.whatsapp ? undefined : 'WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN' },
    };

    // Event flow data
    const closedLoop = [
      { step: 1, name: 'Ad Click', source: 'Meta/Google Ads', captures: 'UTM params + fbclid', stored: 'al_utm cookie (30 days)' },
      { step: 2, name: 'Page Visit', source: 'Website', captures: 'page_view, scroll, time_on_page, CTA clicks', stored: 'al_behavior_events' },
      { step: 3, name: 'Lead Form', source: '/api/lead', fires: ['Meta Pixel Lead', 'CAPI Lead (server)', 'N8N webhook'], stored: 'al_leads' },
      { step: 4, name: 'Booking', source: '/api/booking', fires: ['Meta Pixel Schedule', 'CAPI Schedule (server)', 'N8N webhook'], stored: 'al_appointments' },
      { step: 5, name: 'Payment', source: '/api/dashboard/payments', fires: ['CAPI Purchase (server)'], stored: 'al_payments' },
      { step: 6, name: 'Optimization', source: 'Meta receives Purchase', result: 'Optimizes ad delivery for converters → lower CPA' },
    ];

    // DB stats
    const [leadsCount, eventsCount, inboxCount, paymentsCount] = await Promise.all([
      query(`SELECT COUNT(*) AS c FROM al_leads`),
      query(`SELECT COUNT(*) AS c FROM al_behavior_events`),
      query(`SELECT COUNT(*) AS c FROM al_inbox_messages`),
      query(`SELECT COUNT(*) AS c FROM al_payments`),
    ]);

    const dbStats = {
      leads: parseInt(leadsCount.rows[0].c, 10),
      behavior_events: parseInt(eventsCount.rows[0].c, 10),
      inbox_messages: parseInt(inboxCount.rows[0].c, 10),
      payments: parseInt(paymentsCount.rows[0].c, 10),
    };

    // ── Funnel counters ──────────────────────────────────────────────
    const [
      adClicksResult,
      pageVisitsResult,
      leadFormsResult,
      bookingsResult,
      paymentsCompletedResult,
      capiEventsResult,
      sourceBreakdownResult,
      instantFormsResult,
    ] = await Promise.all([
      // Step 1: Ad clicks — leads that arrived with UTM params (proxy for ad clicks)
      query(`SELECT
        COUNT(*) FILTER (WHERE utm_source IS NOT NULL) AS total,
        COUNT(*) FILTER (WHERE utm_source IN ('facebook', 'fb', 'instagram', 'ig', 'meta')) AS meta,
        COUNT(*) FILTER (WHERE utm_source IN ('google', 'google_ads', 'adwords')) AS google,
        COUNT(*) FILTER (WHERE source LIKE '%instant_form%' OR form_id IS NOT NULL) AS instant_form
      FROM al_leads`),
      // Step 2: Page visits — unique page_view events
      query(`SELECT COUNT(*) AS total FROM al_behavior_events WHERE event_type = 'page_view'`),
      // Step 3: Lead form submissions
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE source LIKE '%instant_form%' OR form_id IS NOT NULL) AS instant_form,
        COUNT(*) FILTER (WHERE source IN ('website', 'intake', 'landing_page') OR source LIKE 'inbox_%') AS website,
        COUNT(*) FILTER (WHERE utm_source IN ('facebook', 'fb', 'instagram', 'ig', 'meta')) AS meta,
        COUNT(*) FILTER (WHERE utm_source IN ('google', 'google_ads', 'adwords')) AS google
      FROM al_leads`),
      // Step 4: Bookings
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COALESCE(SUM(CASE WHEN price IS NOT NULL THEN price::numeric ELSE 0 END), 0) AS total_value
      FROM al_appointments`),
      // Step 5: Payments
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COALESCE(SUM(CASE WHEN status = 'completed' AND amount IS NOT NULL THEN amount::numeric ELSE 0 END), 0) AS total_revenue
      FROM al_payments`),
      // CAPI events sent
      query(`SELECT
        COUNT(*) FILTER (WHERE capi_lead_sent = true) AS capi_leads,
        COUNT(*) FILTER (WHERE capi_schedule_sent = true) AS capi_schedules,
        COUNT(*) FILTER (WHERE capi_purchase_sent = true) AS capi_purchases
      FROM al_leads`),
      // Source breakdown for leads
      query(`SELECT
        COALESCE(NULLIF(utm_source, ''), source, 'direct') AS src,
        COUNT(*) AS count
      FROM al_leads
      GROUP BY src
      ORDER BY count DESC
      LIMIT 10`),
      // Facebook Instant Forms specifically
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE stage = 'contacted' OR stage = 'qualified' OR stage = 'booked' OR stage = 'visited') AS contacted,
        COUNT(*) FILTER (WHERE stage = 'booked' OR stage = 'visited') AS booked
      FROM al_leads
      WHERE source LIKE '%instant_form%' OR form_id IS NOT NULL`),
    ]);

    const funnelCounters = {
      ad_clicks: {
        total: parseInt(adClicksResult.rows[0].total, 10),
        meta: parseInt(adClicksResult.rows[0].meta, 10),
        google: parseInt(adClicksResult.rows[0].google, 10),
        instant_form: parseInt(adClicksResult.rows[0].instant_form, 10),
      },
      page_visits: {
        total: parseInt(pageVisitsResult.rows[0].total, 10),
      },
      lead_forms: {
        total: parseInt(leadFormsResult.rows[0].total, 10),
        instant_form: parseInt(leadFormsResult.rows[0].instant_form, 10),
        website: parseInt(leadFormsResult.rows[0].website, 10),
        meta: parseInt(leadFormsResult.rows[0].meta, 10),
        google: parseInt(leadFormsResult.rows[0].google, 10),
      },
      bookings: {
        total: parseInt(bookingsResult.rows[0].total, 10),
        confirmed: parseInt(bookingsResult.rows[0].confirmed, 10),
        completed: parseInt(bookingsResult.rows[0].completed, 10),
        total_value: parseFloat(bookingsResult.rows[0].total_value),
      },
      payments: {
        total: parseInt(paymentsCompletedResult.rows[0].total, 10),
        completed: parseInt(paymentsCompletedResult.rows[0].completed, 10),
        total_revenue: parseFloat(paymentsCompletedResult.rows[0].total_revenue),
      },
      capi_events: {
        leads: parseInt(capiEventsResult.rows[0].capi_leads, 10),
        schedules: parseInt(capiEventsResult.rows[0].capi_schedules, 10),
        purchases: parseInt(capiEventsResult.rows[0].capi_purchases, 10),
      },
      source_breakdown: sourceBreakdownResult.rows.map((r: { src: string; count: string }) => ({
        source: r.src,
        count: parseInt(r.count, 10),
      })),
      instant_forms: {
        total: parseInt(instantFormsResult.rows[0].total, 10),
        contacted: parseInt(instantFormsResult.rows[0].contacted, 10),
        booked: parseInt(instantFormsResult.rows[0].booked, 10),
      },
    };

    return NextResponse.json({
      integrations,
      inboxChannels,
      closedLoop,
      dbStats,
      funnelCounters,
    });
  } catch (err) {
    console.error('[dashboard/events] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
