import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabaseClient.js';

// Middleware to extract and verify JWT token from cookies or headers
export function authenticateToken(req, res, next) {
  // Try to get token from Authorization header first, then cookies
  let token = null;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Optional middleware - allows requests with or without tokens
export function optionalAuth(req, res, next) {
  let token = null;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      console.warn('Optional auth token verification failed:', error.message);
      req.user = null;
    }
  }

  next();
}

// Middleware to check admin status
export async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userId = req.user.id || req.user.sub;
    
    // Check if user is the designated admin from env
    if (userId === process.env.ADMIN_ID) {
      req.user.isAdmin = true;
      return next();
    }

    // Otherwise check database
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('is_admin')
      .eq('auth_user_id', userId)
      .single();

    if (error) {
      console.error('Admin check database error:', error);
      return res.status(500).json({ error: 'Authentication check failed' });
    }

    if (!data?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Authentication check failed' });
  }
}

// Utility function to generate JWT token
export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'your-app-name',
    audience: 'your-app-users'
  });
}

// Utility function to verify token without middleware context
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Utility to set JWT cookie
export function setTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/'
  });
}

// Utility to clear JWT cookie
export function clearTokenCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
}