import jwt from 'jsonwebtoken';
import { supabaseAnon, supabaseAdmin } from '../config/supabaseClient.js';
import { ensureCustomer } from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'brandverse-api',
    audience: 'brandverse-app'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'brandverse-api',
      audience: 'brandverse-app'
    });
  } catch (error) {
    return null;
  }
};

export async function signup(req, res) {
  try {
    const { email, full_name, name } = req.body;
    const userName = full_name || name;
    // Check if customer exists
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
    // Send OTP
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: { 
        data: { full_name: userName },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback`
      }
    });
    if (error) {
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
    console.error('[SIGNUP ERROR]', e);
    res.status(500).json({ error: e.message });
  }
}

export async function login(req, res) {
  try {
    const { email } = req.body;
    console.log('[authController] login called for email:', email);
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
    const adminEmails = process.env.ADMIN_EMAIL.split(',') || process.env.AUTH_U;
    const isAdmin = adminEmails.includes(email);
    res.json({ 
      message: 'OTP sent to your email. Please verify to login.',
      isAdmin
    });
  } catch (e) {
    console.error('[LOGIN ERROR]', e);
    res.status(500).json({ error: e.message });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, token, type } = req.body;
    const otpType = type || 'email';
    console.log('[verifyOtp] Verifying OTP for:', email);
    const { data, error } = await supabaseAnon.auth.verifyOtp({
      email,
      token,
      type: otpType
    });
    if (error) {
      console.error('[VERIFY_OTP SUPABASE ERROR]', error);
      return res.status(400).json({ error: error.message });
    }
    console.log('[verifyOtp] OTP verification successful');
    const adminEmails = process.env.ADMIN_EMAIL.split(',');
    const isAdmin = adminEmails.includes(email);
    // Create JWT payload
    const payload = {
      userId: data.user.id,
      email: data.user.email,
      isAdmin
    };
    // Generate JWT token
    const jwtToken = generateToken(payload);
    // Ensure customer record exists
    try {
      await ensureCustomer({ id: data.user.id, email: data.user.email });
      console.log('[VERIFY_OTP] Customer record ensured');
    } catch (err) {
      console.warn('[VERIFY_OTP CUSTOMER WARN]', err.message || err);
    }
    // Set JWT as HTTP-only cookie AND return in response
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // Only HTTPS in production
  sameSite: isProduction ? 'none' : 'lax', // Allow cross-origin in prod
  // domain property removed to allow default host
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
    };
    
    console.log('[verifyOtp] Cookie options:', cookieOptions);
    console.log('[verifyOtp] NODE_ENV:', process.env.NODE_ENV);
    res.cookie('auth_token', jwtToken, cookieOptions);
    const responseData = { 
      message: isAdmin ? 'Admin OTP verified successfully' : 'OTP verified successfully', 
      user: {
        id: data.user.id,
        email: data.user.email,
        isAdmin: isAdmin
      },
      admin: isAdmin,
      token: jwtToken // Also return token for localStorage storage if needed
    };
    console.log('[verifyOtp] Sending response with JWT');
    res.json(responseData);
  } catch (e) {
    console.error('[VERIFY_OTP EXCEPTION]', e);
    res.status(500).json({ error: e.message });
  }
}

export async function me(req, res) {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies?.auth_token;
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    if (!token) {
      console.warn('[ME WARN] No token found');
      return res.json({ user: null, admin: false });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      console.warn('[ME WARN] Invalid or expired token');
      return res.json({ user: null, admin: false });
    }
    console.log('[me] JWT decoded successfully:', {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: decoded.isAdmin
    });
    res.json({ 
      user: {
        id: decoded.userId,
        email: decoded.email,
        isAdmin: decoded.isAdmin
      }, 
      admin: decoded.isAdmin 
    });
  } catch (e) {
    console.error('[ME ERROR]', e);
    res.json({ user: null, admin: false });
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ message: 'Logged out successfully' });
  } catch (e) {
    console.error('[LOGOUT ERROR]', e);
    res.status(500).json({ error: 'Failed to logout' });
  }
}

// JWT Authentication Middleware
export const authenticateJWT = (req, res, next) => {
  console.log('[AUTH_MIDDLEWARE] Request URL:', req.url);
  console.log('[AUTH_MIDDLEWARE] Cookies:', req.cookies);
  console.log('[AUTH_MIDDLEWARE] Authorization header:', req.headers.authorization);

  // Try to get token from cookie first
  let token = req.cookies?.auth_token;

  // Fallback: try Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Fallback: try parsing from document.cookie header (for some proxies)
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/auth_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    console.warn('[AUTH_MIDDLEWARE WARN] No token provided in cookie or Authorization header');
    return res.status(401).json({ error: 'Authentication required' });
  }

  console.log('[AUTH_MIDDLEWARE] Token found, verifying...');
  const decoded = verifyToken(token);
  if (!decoded) {
    console.warn('[AUTH_MIDDLEWARE WARN] Invalid or expired token');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  console.log('[AUTH_MIDDLEWARE] Token verified successfully for:', decoded.email);
  req.user = {
    id: decoded.userId,
    email: decoded.email,
    isAdmin: decoded.isAdmin
  };
  next();
};

// Admin-only middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    console.warn('[ADMIN_MIDDLEWARE WARN] Admin access required');
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Combined middleware for admin routes
export const adminAuth = [authenticateJWT, requireAdmin];