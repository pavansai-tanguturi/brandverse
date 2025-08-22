import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createOrder, listMyOrders, listAllOrders, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', requireAuth, createOrder);
router.get('/', requireAuth, listMyOrders);
router.get('/admin', requireAdmin, listAllOrders);
router.patch('/admin/:id/status', requireAdmin, updateOrderStatus);

export default router;