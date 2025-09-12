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
router.post('/logout', logout);

export default router;