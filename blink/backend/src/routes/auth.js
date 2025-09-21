import express from 'express';
import { signup, login, me, logout, verifyOtp } from '../controllers/authController.js';
// ...existing code...
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
// ...existing code...
router.get('/user', me);
router.get('/me', me);
router.post('/logout', logout);



export default router;