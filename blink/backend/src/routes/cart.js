import express from 'express';
import { authenticateJWT } from '../controllers/authController.js';
import {
  getCart,
  addItem,
  updateItemQty,
  removeItem,
  checkCartStatus,
  ensureActiveCart,
  validateCartForCheckout,
  updateCartQuantity,     // New
  removeCartItemByProduct, // New
  clearCart              // New
} from '../controllers/cartController.js';

const router = express.Router();

// Existing routes
router.get('/', authenticateJWT, getCart);
router.post('/add', authenticateJWT, addItem);
router.put('/item/:id', authenticateJWT, updateItemQty);
router.delete('/item/:id', authenticateJWT, removeItem);
router.get('/status', authenticateJWT, checkCartStatus);
router.post('/ensure', authenticateJWT, ensureActiveCart);

// New routes for better sync support
router.put('/update-quantity', authenticateJWT, updateCartQuantity);
router.delete('/remove', authenticateJWT, removeCartItemByProduct);
router.get('/validate-checkout', authenticateJWT, validateCartForCheckout);
router.get('/validate', authenticateJWT, validateCartForCheckout);
router.delete('/clear', authenticateJWT, clearCart);

export default router;