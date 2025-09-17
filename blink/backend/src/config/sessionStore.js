import session from 'express-session';
import SupabaseSessionStore from './SupabaseSessionStore.js';
import dotenv from 'dotenv';
dotenv.config();

let sessionStore;

// Use database session store in production, memory store in development
if (process.env.NODE_ENV === 'production') {
  console.log('[sessionStore] Using Supabase session store for production.');
  
  try {
    sessionStore = new SupabaseSessionStore({
      ttl: 24 * 60 * 60, // 24 hours
      tableName: 'user_sessions'
    });

    // Clean up expired sessions every hour
    setInterval(() => {
      sessionStore.cleanup();
    }, 60 * 60 * 1000);
    
  } catch (error) {
    console.warn('[sessionStore] Failed to initialize Supabase session store, using memory store:', error.message);
    sessionStore = new session.MemoryStore();
  }
  
} else {
  console.log('[sessionStore] Using in-memory session store for development.');
  sessionStore = new session.MemoryStore();
}

export { sessionStore };