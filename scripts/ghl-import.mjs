#!/usr/bin/env node
/**
 * GHL Full Contact Import → al_clients + al_leads
 * Pulls all contacts from GoHighLevel and inserts into Neon.
 * Skips duplicates (ON CONFLICT DO NOTHING on id).
 */

const GHL_TOKEN = 'pit-3910b290-33d9-4e05-acc9-8ca930827782';
const GHL_LOCATION = 'MFf6tUm0YvWF6gZ5c9mN';
const GHL_BASE = 'https://services.leadconnectorhq.com';
const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('DATABASE_URL env var required. Set it to your Neon connection string.');
  process.exit(1);
}

// Use pg for batch inserts (more efficient than serverless for bulk)
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

const headers = {
  Authorization: `Bearer ${GHL_TOKEN}`,
  Version: '2021-07-28',
  Accept: 'application/json',
};

let totalFetched = 0;
let totalInsertedClients = 0;
let totalInsertedLeads = 0;
let totalSkipped = 0;

async function fetchPage(startAfterId = '', startAfter = 0) {
  const params = new URLSearchParams({
    locationId: GHL_LOCATION,
    limit: '100',
  });
  if (startAfterId) {
    params.set('startAfterId', startAfterId);
    params.set('startAfter', String(startAfter));
  }

  const url = `${GHL_BASE}/contacts/?${params}`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL API error ${res.status}: ${text}`);
  }

  return res.json();
}

function mapContact(c) {
  return {
    id: `ghl_${c.id}`,
    name: [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown',
    email: c.email || null,
    phone: c.phone || null,
    source: c.source || 'ghl_import',
    tags: c.tags || [],
    created_at: c.dateAdded || new Date().toISOString(),
    dnd: c.dnd || false,
    // GHL custom fields
    gender: c.gender || null,
    city: c.city || null,
    country: c.country || null,
    address: c.address1 || null,
    company: c.companyName || null,
    // Preserve original GHL data
    ghl_data: JSON.stringify({
      id: c.id,
      customFields: c.customField || [],
      attributions: c.attributions || [],
      lastActivity: c.lastActivity,
      type: c.type,
      website: c.website,
    }),
  };
}

async function insertBatch(contacts) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const c of contacts) {
      // Insert lead FIRST (al_clients has FK to al_leads)
      const leadResult = await client.query(
        `INSERT INTO al_leads (id, name, email, phone, source, stage, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [c.id, c.name, c.email, c.phone, 'ghl_import', 'converted', c.created_at],
      );

      if (leadResult.rowCount > 0) {
        totalInsertedLeads++;
      } else {
        totalSkipped++;
      }

      // Then insert client with lead_id FK
      const clientResult = await client.query(
        `INSERT INTO al_clients (id, lead_id, name, email, phone, tags, do_not_disturb, created_at)
         VALUES ($1, $1, $2, $3, $4, $5::text[], $6, $7)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [c.id, c.name, c.email, c.phone, c.tags, c.dnd, c.created_at],
      );

      if (clientResult.rowCount > 0) {
        totalInsertedClients++;
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('Starting GHL full contact import...');
  console.log(`Location: ${GHL_LOCATION}`);

  let startAfterId = '';
  let startAfter = 0;
  let hasMore = true;
  let page = 0;

  while (hasMore) {
    page++;
    console.log(`\nFetching page ${page}... (after: ${startAfterId || 'start'})`);

    const data = await fetchPage(startAfterId, startAfter);
    const contacts = data.contacts || [];

    if (contacts.length === 0) {
      hasMore = false;
      break;
    }

    totalFetched += contacts.length;
    console.log(`  Got ${contacts.length} contacts (total: ${totalFetched})`);

    // Map and insert
    const mapped = contacts.map(mapContact);
    await insertBatch(mapped);
    console.log(`  Inserted: ${totalInsertedClients} clients, ${totalInsertedLeads} leads, ${totalSkipped} skipped`);

    // Pagination
    const meta = data.meta || {};
    startAfterId = meta.startAfterId || contacts[contacts.length - 1]?.id || '';
    startAfter = meta.startAfter || totalFetched;

    // GHL returns less than limit when no more pages
    if (contacts.length < 100) {
      hasMore = false;
    }

    // Rate limit: GHL allows 100 requests/min
    await new Promise((r) => setTimeout(r, 700));
  }

  console.log('\n========================================');
  console.log('GHL Import Complete');
  console.log(`  Total fetched:  ${totalFetched}`);
  console.log(`  Clients added:  ${totalInsertedClients}`);
  console.log(`  Leads added:    ${totalInsertedLeads}`);
  console.log(`  Skipped (dupe): ${totalSkipped}`);
  console.log('========================================');

  await pool.end();
}

main().catch((err) => {
  console.error('Import failed:', err);
  pool.end();
  process.exit(1);
});
