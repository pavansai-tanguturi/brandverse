import { supabaseAdmin } from '../config/supabaseClient.js';
import { ensureCustomer } from '../models/userModel.js';
import { generateToken, setTokenCookie } from '../middleware/auth.js';

// 🔐 POST /api/auth/login
export async function loginWithToken(req, res) {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: 'access_token required' });
    }

    // Verify the Supabase access token
    const { data, error } = await supabaseAdmin.auth.getUser(access_token);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data?.user;
    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const adminId = process.env.ADMIN_ID;
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = adminEmail && user.email && 
                   user.email.toLowerCase() === adminEmail.toLowerCase();

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Ensure customer record exists
    const userId = adminId || user.id;
    try {
      await ensureCustomer({ id: userId, email: user.email });
    } catch (e) {
      console.warn('Failed to ensure customer record:', e.message);
    }

    // Generate JWT token
    const tokenPayload = {
      id: userId,
      email: user.email,
      isAdmin: true,
      iat: Math.floor(Date.now() / 1000)
    };

    const jwtToken = generateToken(tokenPayload);

    // Set HTTP-only cookie
    setTokenCookie(res, jwtToken);

    res.json({
      message: 'Login successful',
      user: {
        id: userId,
        email: user.email,
        isAdmin: true
      },
      token: jwtToken // Also return token for header-based auth
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 🔐 POST /api/auth/login-email (Alternative login method)
export async function loginWithEmail(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const adminId = process.env.ADMIN_ID;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail || email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Ensure customer record exists
    const userId = adminId || 'admin';
    try {
      await ensureCustomer({ id: userId, email: adminEmail });
    } catch (e) {
      console.warn('Failed to ensure customer record:', e.message);
    }

    // Generate JWT token
    const tokenPayload = {
      id: userId,
      email: adminEmail,
      isAdmin: true,
      iat: Math.floor(Date.now() / 1000)
    };

    const jwtToken = generateToken(tokenPayload);

    // Set HTTP-only cookie
    setTokenCookie(res, jwtToken);

    res.json({
      message: 'Login successful',
      user: {
        id: userId,
        email: adminEmail,
        isAdmin: true
      },
      token: jwtToken
    });
  } catch (e) {
    console.error('Email login error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 🔐 POST /api/auth/customer-login (For regular customers)
export async function customerLogin(req, res) {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: 'access_token required' });
    }

    // Verify the Supabase access token
    const { data, error } = await supabaseAdmin.auth.getUser(access_token);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data?.user;
    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Ensure customer record exists
    try {
      await ensureCustomer({ id: user.id, email: user.email });
    } catch (e) {
      console.warn('Failed to ensure customer record:', e.message);
    }

    // Check if user is admin (optional for customers)
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = adminEmail && user.email && 
                   user.email.toLowerCase() === adminEmail.toLowerCase();

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      isAdmin: isAdmin || false,
      iat: Math.floor(Date.now() / 1000)
    };

    const jwtToken = generateToken(tokenPayload);

    // Set HTTP-only cookie
    setTokenCookie(res, jwtToken);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        isAdmin: isAdmin || false
      },
      token: jwtToken
    });
  } catch (e) {
    console.error('Customer login error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 🚪 POST /api/auth/logout
export async function logout(req, res) {
  try {
    // Clear the HTTP-only cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });

    res.json({ 
      message: 'Logout successful',
      note: 'Please discard any stored tokens on the client side'
    });
  } catch (e) {
    console.error('Logout error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 🔍 GET /api/auth/me (Verify current token)
export async function getCurrentUser(req, res) {
  try {
    // This endpoint expects the authenticateToken middleware to run first
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get fresh user data from database
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('id, email, full_name, is_admin, created_at')
      .eq('auth_user_id', req.user.id)
      .single();

    if (error) {
      console.warn('Failed to get customer data:', error.message);
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        isAdmin: req.user.isAdmin || customer?.is_admin || false,
        full_name: customer?.full_name,
        created_at: customer?.created_at
      },
      authenticated: true
    });
  } catch (e) {
    console.error('Get current user error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 🔄 POST /api/auth/refresh (Optional: Refresh token)
export async function refreshToken(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Generate new token with same payload
    const tokenPayload = {
      id: req.user.id,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      iat: Math.floor(Date.now() / 1000)
    };

    const jwtToken = generateToken(tokenPayload);

    // Set new HTTP-only cookie
    setTokenCookie(res, jwtToken);

    res.json({
      message: 'Token refreshed successfully',
      token: jwtToken
    });
  } catch (e) {
    console.error('Refresh token error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}