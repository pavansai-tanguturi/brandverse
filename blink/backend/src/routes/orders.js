import express from 'express';
// ...existing code...
import { adminAuth, authenticateJWT } from '../controllers/authController.js';
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

router.post('/', authenticateJWT, createOrder);
router.get('/', authenticateJWT, listMyOrders);
router.get('/admin', adminAuth, listAllOrders);
router.patch('/admin/:id/status', adminAuth, updateOrderStatus);

// Payment routes
router.post('/confirm-payment', authenticateJWT, confirmPayment);
router.post('/:orderId/confirm-cod', authenticateJWT, confirmCODOrder);
router.post('/webhook', handleWebhook); // No auth required for webhooks

// Stock restoration route (Admin only)
router.post('/admin/:orderId/restore-stock', adminAuth, restoreStockForOrder);

export default router;