import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { 
  createOrder, 
  listMyOrders, 
  listAllOrders, 
  updateOrderStatus, 
  confirmPayment, 
  confirmCODOrder,
  handleWebhook,
  restoreStockForOrder
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/', requireAuth, createOrder);
router.get('/', requireAuth, listMyOrders);
router.get('/admin', requireAdmin, listAllOrders);
router.patch('/admin/:id/status', requireAdmin, updateOrderStatus);

// Payment routes
router.post('/confirm-payment', requireAuth, confirmPayment);
router.post('/:orderId/confirm-cod', requireAuth, confirmCODOrder);
router.post('/webhook', handleWebhook); // No auth required for webhooks

// Stock restoration route (Admin only)
router.post('/admin/:orderId/restore-stock', requireAdmin, restoreStockForOrder);

export default router;