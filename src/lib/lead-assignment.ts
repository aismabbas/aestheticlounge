import { query } from '@/lib/db';

/**
 * Round-robin lead assignment engine.
 *
 * Assigns incoming leads to active staff (receptionist / manager / admin)
 * using a least-assigned-today strategy.  Ties are broken by "who was
 * assigned longest ago" so the distribution stays fair.
 *
 * NOTE: The `assigned_to` TEXT column must exist on `al_leads`.
 *       Run the migration in migrations/add-assigned-to.sql first.
 */

const ASSIGNABLE_ROLES = ['receptionist', 'manager', 'admin'];

/* ------------------------------------------------------------------ */
/*  Settings helpers (stored in al_settings key/value table)          */
/* ------------------------------------------------------------------ */

interface AssignmentSettings {
  auto_assign_enabled: boolean;
  assignable_roles: string[];
  max_leads_per_day: number; // 0 = unlimited
}

const DEFAULT_SETTINGS: AssignmentSettings = {
  auto_assign_enabled: true,
  assignable_roles: [...ASSIGNABLE_ROLES],
  max_leads_per_day: 0,
};

export async function getAssignmentSettings(): Promise<AssignmentSettings> {
  try {
    const res = await query(
      `SELECT value FROM al_settings WHERE key = 'lead_assignment'`,
    );
    if (res.rows.length > 0) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(res.rows[0].value) };
    }
  } catch {
    // table may not exist yet — use defaults
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveAssignmentSettings(
  settings: Partial<AssignmentSettings>,
): Promise<void> {
  const current = await getAssignmentSettings();
  const merged = { ...current, ...settings };
  await query(
    `INSERT INTO al_settings (key, value, updated_at)
     VALUES ('lead_assignment', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(merged)],
  );
}

/* ------------------------------------------------------------------ */
/*  Core round-robin logic                                            */
/* ------------------------------------------------------------------ */

/**
 * Return the staff_id of the next person who should receive a lead.
 *
 * Algorithm:
 *  1. Fetch all active staff whose role is in the assignable list.
 *  2. Count how many leads each was assigned TODAY.
 *  3. If a max-per-day cap is set, exclude anyone at or above the cap.
 *  4. Pick whoever has the fewest assignments today.
 *  5. Break ties by "least-recently assigned" (oldest last_assigned_at wins).
 */
export async function getNextAssignee(): Promise<string | null> {
  const settings = await getAssignmentSettings();

  if (!settings.auto_assign_enabled) return null;

  const roles = settings.assignable_roles.length > 0
    ? settings.assignable_roles
    : ASSIGNABLE_ROLES;

  // Build role placeholders  $1, $2, ...
  const placeholders = roles.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `
    SELECT
      s.id AS staff_id,
      s.name,
      COALESCE(counts.assigned_today, 0)::int AS assigned_today,
      counts.last_assigned_at
    FROM al_staff s
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS assigned_today,
        MAX(l.created_at) AS last_assigned_at
      FROM al_leads l
      WHERE l.assigned_to = s.id
        AND l.created_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Karachi')
    ) counts ON true
    WHERE s.active = true
      AND s.role IN (${placeholders})
    ORDER BY
      assigned_today ASC,
      last_assigned_at ASC NULLS FIRST
    LIMIT 1
  `;

  const result = await query(sql, roles);

  if (result.rows.length === 0) return null;

  const candidate = result.rows[0];

  // Enforce max-per-day cap
  if (
    settings.max_leads_per_day > 0 &&
    candidate.assigned_today >= settings.max_leads_per_day
  ) {
    return null; // everyone is at capacity
  }

  return candidate.staff_id;
}

/* ------------------------------------------------------------------ */
/*  Assign / reassign                                                 */
/* ------------------------------------------------------------------ */

export async function assignLead(
  leadId: string,
  staffId: string,
): Promise<void> {
  await query(
    `UPDATE al_leads
     SET assigned_to = $1, updated_at = NOW(), last_activity_at = NOW()
     WHERE id = $2`,
    [staffId, leadId],
  );
}

/**
 * Auto-assign a specific lead (used for manual "re-auto-assign" action).
 * Returns the assigned staff_id or null if nobody available.
 */
export async function autoAssignLead(leadId: string): Promise<string | null> {
  const staffId = await getNextAssignee();
  if (!staffId) return null;
  await assignLead(leadId, staffId);
  return staffId;
}

/* ------------------------------------------------------------------ */
/*  Stats for dashboard                                               */
/* ------------------------------------------------------------------ */

export interface AssignmentStat {
  staff_id: string;
  name: string;
  role: string;
  assigned_today: number;
  responded: number;
  avg_response_time: number;
}

export async function getAssignmentStats(): Promise<AssignmentStat[]> {
  const sql = `
    SELECT
      s.id AS staff_id,
      s.name,
      s.role,
      COALESCE(a.assigned_today, 0)::int AS assigned_today,
      COALESCE(r.responded, 0)::int AS responded,
      COALESCE(r.avg_response_time, 0)::int AS avg_response_time
    FROM al_staff s
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS assigned_today
      FROM al_leads l
      WHERE l.assigned_to = s.id
        AND l.created_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Karachi')
    ) a ON true
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS responded,
        ROUND(AVG(rt.response_seconds))::int AS avg_response_time
      FROM al_lead_response_times rt
      WHERE rt.staff_id = s.id
        AND rt.first_response_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Karachi')
    ) r ON true
    WHERE s.active = true
      AND s.role IN ('receptionist', 'manager', 'admin')
    ORDER BY a.assigned_today DESC
  `;

  const result = await query(sql);
  return result.rows;
}

/* ------------------------------------------------------------------ */
/*  Uncontacted leads helpers                                         */
/* ------------------------------------------------------------------ */

export interface UncontactedLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  treatment: string;
  created_at: string;
  seconds_waiting: number;
  assigned_to: string;
  score: number;
  score_label: string;
  utm_source: string;
  source: string;
}

/**
 * Get leads assigned to a specific staff member that have stage='new'
 * and no entry in al_lead_response_times.
 */
export async function getUncontactedLeads(
  staffId: string,
): Promise<UncontactedLead[]> {
  const sql = `
    SELECT
      l.id,
      l.name,
      l.phone,
      l.email,
      l.treatment,
      l.created_at,
      EXTRACT(EPOCH FROM (NOW() - l.created_at))::int AS seconds_waiting,
      l.assigned_to,
      COALESCE(l.score, 0)::int AS score,
      l.utm_source,
      l.source
    FROM al_leads l
    LEFT JOIN al_lead_response_times rt ON rt.lead_id = l.id
    WHERE l.assigned_to = $1
      AND l.stage = 'new'
      AND rt.id IS NULL
    ORDER BY l.created_at ASC
  `;
  const result = await query(sql, [staffId]);
  return result.rows.map((r: Record<string, unknown>) => ({
    ...r,
    score_label:
      (r.score as number) >= 70
        ? 'hot'
        : (r.score as number) >= 40
          ? 'warm'
          : 'cold',
  })) as UncontactedLead[];
}

/**
 * Count uncontacted leads for ALL staff (for overview dashboard).
 */
export async function getUncontactedCount(staffId?: string): Promise<{
  count: number;
  oldest_seconds: number;
}> {
  let sql = `
    SELECT
      COUNT(*)::int AS count,
      COALESCE(MAX(EXTRACT(EPOCH FROM (NOW() - l.created_at)))::int, 0) AS oldest_seconds
    FROM al_leads l
    LEFT JOIN al_lead_response_times rt ON rt.lead_id = l.id
    WHERE l.stage = 'new'
      AND rt.id IS NULL
  `;
  const params: unknown[] = [];
  if (staffId) {
    params.push(staffId);
    sql += ` AND l.assigned_to = $1`;
  }
  const result = await query(sql, params);
  return result.rows[0];
}
