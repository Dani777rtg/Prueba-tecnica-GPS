import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  (process.env.DATABASE_URL || '').includes('render.com');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
export async function query(text, params) {
  return pool.query(text, params);
}
