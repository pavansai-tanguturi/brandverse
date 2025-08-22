import express from 'express';
import { signup, login, me, logout } from '../controllers/authController.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/user', me);
router.post('/logout', logout);

export default router;