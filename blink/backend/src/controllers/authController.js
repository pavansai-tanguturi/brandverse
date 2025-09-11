import { supabaseAnon, supabaseAdmin } from '../config/supabaseClient.js';
import { ensureCustomer } from '../models/userModel.js';

export async function signup(req, res) {
  try {
    const { email, full_name } = req.body;
    
    // First check if a customer with this email already exists in our database
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingCustomer) {
      return res.status(400).json({ 
        error: "User already exists. Please login instead.",
        code: "USER_ALREADY_EXISTS"
      });
    }
    
    // Send OTP for passwordless signup
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: { 
        data: { full_name },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/auth/callback`
      }
    });
    
    if (error) {
      // Handle specific Supabase error messages for existing users
      if (error.message.includes('already registered') || 
          error.message.includes('User already registered') ||
          error.status === 422) {
        return res.status(400).json({ 
          error: "User already exists. Please login instead.",
          code: "USER_ALREADY_EXISTS"
        });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'OTP sent to your email. Please verify to complete signup.' });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
}

export async function login(req, res) {
  try {
    const { email } = req.body;

    // Admin login using env-configured email (no password needed)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.AUTH_U;
    if (email === adminEmail) {
      const adminId = process.env.ADMIN_ID || 'admin';
        req.session.user = { id: adminId, email: adminEmail, isAdmin: true };
        // Ensure there is a customers row for the admin as well
        try {
          await ensureCustomer({ id: adminId, email: adminEmail });
        } catch (err) {
          // ignore provisioning errors but log to console
          console.warn('[auth] failed to ensure admin customer row', err.message || err);
        }
        return res.json({ message: 'Admin logged in', user: req.session.user, admin: true });
    }

    // Regular user login through OTP
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/auth/callback`
      }
    });
    
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'OTP sent to your email. Please verify to login.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function verifyOtp(req, res) {
  try {
    const { email, token, type = 'magiclink' } = req.body;

    const { data, error } = await supabaseAnon.auth.verifyOtp({
      email,
      token,
      type
    });

    if (error) return res.status(400).json({ error: error.message });

    // Set session for the authenticated user
    req.session.user = { id: data.user.id, email: data.user.email };
    await ensureCustomer(data.user);

    res.json({ message: 'OTP verified successfully', user: req.session.user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function sessionFromEmail(req, res) {
  try {
    const { email } = req.body;
    
    // Create session based on email (used for admin authentication)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.AUTH_U;
    if (email === adminEmail) {
      const adminId = process.env.ADMIN_ID || 'admin';
      req.session.user = { id: adminId, email: adminEmail, isAdmin: true };
      return res.json({ message: 'Admin session created', user: req.session.user });
    }
    
    res.status(400).json({ error: 'Invalid email for session creation' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function me(req, res) {
  const user = req.session?.user || null;
  const adminId = process.env.ADMIN_ID || 'admin';
  const isAdmin = !!user && (user.isAdmin === true || user.id === adminId);
  res.json({ user, admin: isAdmin });
}

export async function logout(req, res) {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
}