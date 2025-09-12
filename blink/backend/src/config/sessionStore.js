import session from 'express-session';
import dotenv from 'dotenv';
dotenv.config();

// Use in-memory session store instead of database storage
console.log('[sessionStore] Using in-memory session store for better performance.');
const sessionStore = new session.MemoryStore();

export { sessionStore };