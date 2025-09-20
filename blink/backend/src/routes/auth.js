// authRoutes.js - JWT-based clean version
import express from 'express';
import { signup, login, me, logout, verifyOtp } from '../controllers/authController.js';
// Remove session import since you're using JWT
// import { sessionFromToken } from '../controllers/sessionController.js';

const router = express.Router();

// Public auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
// Remove session-based route
// router.post('/session-from-token', sessionFromToken);
router.get('/user', me);
router.get('/me', me);
router.post('/logout', logout);

// Remove all session-based debug routes since you're using JWT
// Keep only if needed for development debugging

export default router;