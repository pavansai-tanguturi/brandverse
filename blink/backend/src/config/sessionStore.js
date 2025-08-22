import session from 'express-session';
import pg from 'pg';
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
dotenv.config();

const PgSession = connectPgSimple(session);

const dbUrl = process.env.SUPABASE_DB_URL || '';
const isPlaceholder = !dbUrl || dbUrl.includes('YOUR_PROJECT') || dbUrl.includes('POSTGRES_PASSWORD');

let pgPool = null;
let sessionStore = null;

if (isPlaceholder) {
  console.warn('[sessionStore] SUPABASE_DB_URL is not configured or looks like a placeholder. Falling back to in-memory session store.');
  sessionStore = new session.MemoryStore();
} else {
  pgPool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  sessionStore = new PgSession({
    pool: pgPool,
    tableName: 'session'
  });
}

export { pgPool, sessionStore };