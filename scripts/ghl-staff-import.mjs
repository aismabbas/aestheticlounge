#!/usr/bin/env node
/**
 * GHL Staff/Users Import → al_staff
 * Pulls all team members from GoHighLevel and upserts into Neon.
 * Does NOT overwrite role if staff already exists (preserves manual role assignments).
 *
 * Usage: DATABASE_URL=... node scripts/ghl-staff-import.mjs
 */

const GHL_TOKEN = 'pit-3910b290-33d9-4e05-acc9-8ca930827782';
const GHL_LOCATION = 'MFf6tUm0YvWF6gZ5c9mN';
const GHL_BASE = 'https://services.leadconnectorhq.com';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL env var required.');
  process.exit(1);
}

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

const headers = {
  Authorization: `Bearer ${GHL_TOKEN}`,
  Version: '2021-07-28',
  Accept: 'application/json',
};

/**
 * Map GHL user type/role to AL role.
 * GHL roles: "admin", "user"
 * AL roles: admin, manager, agent, marketing, receptionist
 */
function mapRole(ghlUser) {
  const type = ghlUser.type || '';
  const name = `${ghlUser.firstName || ''} ${ghlUser.lastName || ''}`.trim().toLowerCase();

  // Owner / admin
  if (type === 'admin' || ghlUser.role === 'admin') return 'admin';

  // Check name hints for role assignment
  if (name.includes('doctor') || name.includes('dr.') || name.includes('dr ')) return 'manager';
  if (name.includes('reception') || name.includes('front desk')) return 'receptionist';
  if (name.includes('marketing') || name.includes('content')) return 'marketing';

  // Default to agent
  return 'agent';
}

async function run() {
  console.log('Fetching GHL team members...');

  // GHL Users/Search endpoint
  const res = await fetch(`${GHL_BASE}/users/search`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyId: GHL_LOCATION,
      role: '',
      type: '',
      enabled: true,
      limit: 100,
      skip: 0,
      locationId: GHL_LOCATION,
    }),
  });

  if (!res.ok) {
    // Try alternative endpoint
    console.log(`Search endpoint returned ${res.status}, trying /users/ ...`);
    const res2 = await fetch(`${GHL_BASE}/users/?locationId=${GHL_LOCATION}`, { headers });

    if (!res2.ok) {
      const text = await res2.text();
      console.error(`GHL Users API error ${res2.status}: ${text}`);
      process.exit(1);
    }

    const data = await res2.json();
    await processUsers(data.users || []);
    return;
  }

  const data = await res.json();
  await processUsers(data.users || []);
}

async function processUsers(users) {
  console.log(`Found ${users.length} GHL users\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const email = user.email?.trim()?.toLowerCase();
    if (!email) {
      console.log(`  SKIP: No email for user ${user.id}`);
      skipped++;
      continue;
    }

    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email.split('@')[0];
    const phone = user.phone || null;
    const role = mapRole(user);

    // Upsert: insert if new, update name/phone if exists (preserve role)
    const result = await pool.query(
      `INSERT INTO al_staff (id, email, name, role, phone, active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         phone = COALESCE(EXCLUDED.phone, al_staff.phone),
         updated_at = NOW()
       RETURNING (xmax = 0) AS is_insert`,
      [`ghl_${user.id}`, email, name, role, phone],
    );

    const isInsert = result.rows[0]?.is_insert;
    if (isInsert) {
      console.log(`  + INSERT: ${name} | ${email} | ${role}`);
      inserted++;
    } else {
      console.log(`  ~ UPDATE: ${name} | ${email} | (role preserved)`);
      updated++;
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${updated} updated, ${skipped} skipped`);

  // Show final staff list
  const all = await pool.query('SELECT name, email, role, active FROM al_staff ORDER BY name');
  console.log(`\nTotal staff in database: ${all.rows.length}`);
  all.rows.forEach(r => console.log(`  ${r.active ? '✓' : '✗'} ${r.name} | ${r.email} | ${r.role}`));

  await pool.end();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
