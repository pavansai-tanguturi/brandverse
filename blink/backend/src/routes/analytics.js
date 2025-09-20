import express from 'express';
import { adminAuth } from '../controllers/authController.js';
import { getDashboardAnalytics, exportAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// Apply admin JWT authentication to all analytics routes
router.use(adminAuth);

router.get('/dashboard', getDashboardAnalytics);
router.get('/export', exportAnalytics);

export default router;