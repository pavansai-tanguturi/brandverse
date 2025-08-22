import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { summary } from '../controllers/adminController.js';

const router = express.Router();
router.get('/analytics/summary', requireAdmin, summary);
export default router;