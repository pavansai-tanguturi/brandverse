import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { summary, exportAnalytics } from '../controllers/adminController.js';

const router = express.Router();
router.get('/analytics/summary', requireAdmin, summary);
router.get('/analytics/export', requireAdmin, exportAnalytics);
export default router;