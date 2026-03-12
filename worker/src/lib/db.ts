import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Node.js needs a WebSocket implementation for Neon's serverless driver
neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL not set');
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function query(
  sql: string,
  params?: unknown[],
): Promise<any> {
  const p = getPool();
  const result = await p.query(sql, params);
  return result;
}
