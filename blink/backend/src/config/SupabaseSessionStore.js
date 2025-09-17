import { Store } from 'express-session';
import { supabaseAdmin } from './supabaseClient.js';

class SupabaseSessionStore extends Store {
  constructor(options = {}) {
    super(options);
    this.tableName = options.tableName || 'user_sessions';
    this.ttl = options.ttl || 86400; // 24 hours in seconds
  }

  // Get session data
  get(sid, callback) {
    supabaseAdmin
      .from(this.tableName)
      .select('sess')
      .eq('sid', sid)
      .gt('expire', new Date().toISOString())
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.log(`[SessionStore] GET error for ${sid}:`, error.message);
          return callback(null, null);
        }
        if (!data) {
          console.log(`[SessionStore] No session found for ${sid}`);
          return callback(null, null);
        }
        console.log(`[SessionStore] GET success for ${sid}`);
        callback(null, data.sess);
      })
      .catch(err => {
        console.error(`[SessionStore] GET exception for ${sid}:`, err);
        callback(err);
      });
  }

  // Set session data
  set(sid, session, callback) {
    const expire = new Date(Date.now() + this.ttl * 1000);
    
    supabaseAdmin
      .from(this.tableName)
      .upsert({
        sid,
        sess: session,
        expire: expire.toISOString(),
        updated_at: new Date().toISOString()
      })
      .then(({ error }) => {
        if (error) {
          console.error(`[SessionStore] SET error for ${sid}:`, error.message);
        } else {
          console.log(`[SessionStore] SET success for ${sid}`);
        }
        callback(error);
      })
      .catch(err => {
        console.error(`[SessionStore] SET exception for ${sid}:`, err);
        callback(err);
      });
  }

  // Delete session
  destroy(sid, callback) {
    supabaseAdmin
      .from(this.tableName)
      .delete()
      .eq('sid', sid)
      .then(({ error }) => {
        callback(error);
      })
      .catch(err => callback(err));
  }

  // Touch session (extend expiry)
  touch(sid, session, callback) {
    const expire = new Date(Date.now() + this.ttl * 1000);
    
    supabaseAdmin
      .from(this.tableName)
      .update({
        expire: expire.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('sid', sid)
      .then(({ error }) => {
        callback(error);
      })
      .catch(err => callback(err));
  }

  // Clean up expired sessions
  async cleanup() {
    try {
      await supabaseAdmin
        .from(this.tableName)
        .delete()
        .lt('expire', new Date().toISOString());
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }
}

export default SupabaseSessionStore;