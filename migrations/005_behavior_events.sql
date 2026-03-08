-- Migration: Behavioral tracking events table
-- Run this against your Neon database to enable the behavioral tracking feature.

-- 1. Behavior events table
CREATE TABLE IF NOT EXISTS al_behavior_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  lead_id UUID,
  event_type TEXT NOT NULL,       -- page_view, scroll, cta_click, time_on_page, form_start, form_submit
  page_url TEXT NOT NULL,
  page_title TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavior_visitor ON al_behavior_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_behavior_lead ON al_behavior_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_behavior_session ON al_behavior_events(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_type ON al_behavior_events(event_type);
CREATE INDEX IF NOT EXISTS idx_behavior_created ON al_behavior_events(created_at);

-- 2. Add visitor_id to al_leads for cookie-to-lead mapping
ALTER TABLE al_leads ADD COLUMN IF NOT EXISTS visitor_id TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_visitor ON al_leads(visitor_id);

-- 3. Auto-cleanup: drop events older than 180 days (run via cron or pg_cron)
-- DELETE FROM al_behavior_events WHERE created_at < NOW() - INTERVAL '180 days';
