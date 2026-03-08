-- Lead assignment & settings migration
-- Run against the Neon database before deploying

-- 1. Add assigned_to column to al_leads (references al_staff.id)
ALTER TABLE al_leads ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- Index for fast lookups by assigned staff
CREATE INDEX IF NOT EXISTS idx_al_leads_assigned_to ON al_leads(assigned_to);

-- Index for round-robin counting (assigned today)
CREATE INDEX IF NOT EXISTS idx_al_leads_assigned_today
  ON al_leads(assigned_to, created_at DESC);

-- 2. Settings key/value table (used for assignment config + future settings)
CREATE TABLE IF NOT EXISTS al_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed default lead assignment settings
INSERT INTO al_settings (key, value, updated_at)
VALUES (
  'lead_assignment',
  '{"auto_assign_enabled":true,"assignable_roles":["receptionist","manager","admin"],"max_leads_per_day":0}',
  NOW()
)
ON CONFLICT (key) DO NOTHING;
