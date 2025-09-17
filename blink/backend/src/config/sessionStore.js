import session from 'express-session';
import SupabaseSessionStore from './SupabaseSessionStore.js';
import dotenv from 'dotenv';
dotenv.config();

let sessionStore;

// Temporarily use memory store for all environments until database session store is properly configured
console.log('[sessionStore] Using in-memory session store (temporary fix for session persistence issues).');
console.log('[sessionStore] Note: Sessions will be lost on server restart. Database session store will be re-enabled once properly configured.');

sessionStore = new session.MemoryStore();

// TODO: Re-enable database session store once the user_sessions table is created in Supabase
// if (process.env.NODE_ENV === 'production') {
//   sessionStore = new SupabaseSessionStore({
//     ttl: 24 * 60 * 60, // 24 hours
//     tableName: 'user_sessions'
//   });
// }

export { sessionStore };