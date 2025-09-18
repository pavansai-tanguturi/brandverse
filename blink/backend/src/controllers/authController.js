import { supabaseAnon, supabaseAdmin } from '../config/supabaseClient.js';
import { ensureCustomer } from '../models/userModel.js';

export async function signup(req, res) {
  try {
    const { email, full_name, name } = req.body;
    const userName = full_name || name; // Accept either parameter name
    
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
        data: { full_name: userName },
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
    console.log('[authController] login called for email:', email);

    // Send OTP for all users (including admin)
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback`
      }
    });
    if (error) {
      console.error('[authController] Error sending OTP:', error);
      return res.status(400).json({ error: error.message });
    }

    // Check if this is admin email for frontend UI purposes
    const adminEmail = process.env.ADMIN_EMAIL || process.env.AUTH_U;
    const isAdminEmail = email === adminEmail;

    res.json({ 
      message: 'OTP sent to your email. Please verify to login.',
      isAdmin: isAdminEmail
    });
  } catch (e) {
    console.error('[authController] login exception:', e);
    res.status(500).json({ error: e.message });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, token, type } = req.body;
    const otpType = type || 'email';

    const { data, error } = await supabaseAnon.auth.verifyOtp({
      email,
      token,
      type: otpType
    });

    if (error) return res.status(400).json({ error: error.message });

    // Check if this is admin user
    const adminEmail = process.env.ADMIN_EMAIL || process.env.AUTH_U;
    const adminId = process.env.ADMIN_ID || 'admin';
    const isAdmin = email === adminEmail;

    // Set session with admin privileges if applicable
    if (isAdmin) {
      req.session.user = { 
        id: adminId, 
        email: adminEmail, 
        isAdmin: true 
      };
      
      console.log('[verifyOtp] Admin session created:', req.session.user);
      console.log('[verifyOtp] Session ID:', req.sessionID);
      
      // Ensure there is a customers row for the admin as well
      try {
        await ensureCustomer({ id: adminId, email: adminEmail });
      } catch (err) {
        console.warn('[auth] failed to ensure admin customer row', err.message || err);
      }
      
      res.json({ 
        message: 'Admin OTP verified successfully', 
        user: req.session.user, 
        admin: true 
      });
    } else {
      // Regular user
      req.session.user = { id: data.user.id, email: data.user.email };
      
      console.log('[verifyOtp] User session created:', req.session.user);
      console.log('[verifyOtp] Session ID:', req.sessionID);
      
      await ensureCustomer(data.user);

      res.json({ 
        message: 'OTP verified successfully', 
        user: req.session.user,
        admin: false
      });
    }
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
  console.log('[me] === Session Debug Info ===');
  console.log('[me] Session ID:', req.sessionID);
  console.log('[me] Session exists:', !!req.session);
  console.log('[me] Session user:', req.session?.user);
  console.log('[me] Cookie header:', req.headers.cookie);
  console.log('[me] Origin:', req.headers.origin);
  console.log('[me] User-Agent:', req.headers['user-agent']?.substring(0, 50));
  
  const user = req.session?.user || null;
  const adminId = process.env.ADMIN_ID || 'admin';
  const isAdmin = !!user && (user.isAdmin === true || user.id === adminId);
  
  console.log('[me] Final result - User:', user ? `${user.email} (${user.id})` : 'null');
  console.log('[me] Final result - Admin:', isAdmin);
  console.log('[me] ========================');
  
  res.json({ user, admin: isAdmin });
}

export async function logout(req, res) {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
}

// Debug endpoint to test session functionality
export async function sessionTest(req, res) {
  console.log('[sessionTest] Testing session functionality...');
  
  const sessionData = {
    sessionID: req.sessionID,
    hasSession: !!req.session,
    sessionUser: req.session?.user || null,
    cookies: req.headers.cookie || 'No cookies',
    origin: req.headers.origin || 'No origin',
    userAgent: req.headers['user-agent']?.substring(0, 100) || 'No user agent'
  };
  
  // If no session user, create a test session
  if (!req.session?.user) {
    req.session.testUser = {
      id: 'test-123',
      email: 'test@example.com',
      created: new Date().toISOString()
    };
    sessionData.testSessionCreated = true;
  }
  
  console.log('[sessionTest] Session data:', sessionData);
  res.json({
    message: 'Session test completed',
    data: sessionData,
    timestamp: new Date().toISOString()
  });
}