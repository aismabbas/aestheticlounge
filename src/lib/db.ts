import { Pool } from '@neondatabase/serverless';

/**
 * Lightweight database helper using @neondatabase/serverless.
 * Reads DATABASE_URL from environment.
 */

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function query(
  sql: string,
  params?: unknown[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const p = getPool();
  const result = await p.query(sql, params);
  return result;
}
