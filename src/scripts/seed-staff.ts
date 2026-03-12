/**
 * Seed a default admin staff member into al_staff.
 *
 * Usage:
 *   npx tsx src/scripts/seed-staff.ts
 *
 * Requires DATABASE_URL in environment (or .env.local).
 */

import { Pool } from '@neondatabase/serverless';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  // Ensure al_staff table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS al_staff (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      phone TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Insert default admin
  const result = await pool.query(`
    INSERT INTO al_staff (id, email, name, role, phone)
    VALUES ('admin-001', 'info@aestheticloungeofficial.com', 'Admin', 'admin', '+923276660004')
    ON CONFLICT (id) DO NOTHING
    RETURNING id, email, name, role
  `);

  if (result.rows.length > 0) {
    console.log('Seeded admin staff member:', result.rows[0]);
  } else {
    console.log('Admin staff member already exists (no change).');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
