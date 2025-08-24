import express from 'express';
import { getDashboardAnalytics, exportAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/dashboard', getDashboardAnalytics);
router.get('/export', exportAnalytics);

export default router;
