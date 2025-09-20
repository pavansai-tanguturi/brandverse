import express from 'express';
import { signup, login, me, logout, verifyOtp, sessionFromEmail } from '../controllers/authController.js';
import { sessionFromToken } from '../controllers/sessionController.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/session-from-token', sessionFromToken);
router.post('/session-from-email', sessionFromEmail);
router.get('/user', me);
router.get('/me', me);
router.post('/logout', logout);

// Debug route for session testing
router.get('/session-debug', (req, res) => {
  res.json({
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    user: req.session?.user || null,
    cookies: req.headers.cookie || 'No cookies',
    session: req.session || 'No session'
  });
});

// Admin session test
router.get('/admin-test', (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.AUTH_U;
  const isAdmin = req.session?.user?.email === adminEmail || req.session?.user?.isAdmin === true;
  
  res.json({
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    user: req.session?.user || null,
    isAdmin: isAdmin,
    adminEmail: adminEmail,
    adminEnvVars: {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      AUTH_U: process.env.AUTH_U
    }
  });
});

// Development admin login shortcut (remove in production)
router.post('/dev-admin-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const adminEmail = process.env.ADMIN_EMAIL || process.env.AUTH_U;
  
  req.session.user = {
    email: adminEmail,
    isAdmin: true
  };
  
  console.log('[DEV] Admin session created:', req.session.user);
  console.log('[DEV] Session ID:', req.sessionID);
  
  res.json({
    message: 'Development admin login successful',
    user: req.session.user,
    admin: true
  });
});

// Session debug endpoint
router.get('/session-debug', (req, res) => {
  res.json({
    sessionExists: !!req.session,
    sessionId: req.sessionID || 'none',
    user: req.session?.user || null,
    cookies: req.headers.cookie || 'none',
    origin: req.headers.origin || 'none',
    userAgent: req.headers['user-agent']?.substring(0, 50) || 'none',
    nodeEnv: process.env.NODE_ENV
  });
});

// Protected admin route example
router.get('/admin-only', (req, res) => {
  if (!req.session?.user || !req.session.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  res.json({
    message: 'Welcome, admin!',
    user: req.session.user
  });
});

export default router;