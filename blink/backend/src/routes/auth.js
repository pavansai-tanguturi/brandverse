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

// Development admin login shortcut (remove in production)
router.post('/dev-admin-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const adminEmail = process.env.ADMIN_EMAIL || process.env.AUTH_U;
  const adminId = process.env.ADMIN_ID || 'admin';
  
  req.session.user = {
    id: adminId,
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

export default router;