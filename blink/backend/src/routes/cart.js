import express from 'express';
// ...existing code...
import { getCart, addItem, updateItemQty, removeItem } from '../controllers/cartController.js';

const router = express.Router();
import { authenticateJWT } from '../controllers/authController.js';
// ...existing code...
router.get('/', authenticateJWT, getCart);
router.post('/items', authenticateJWT, addItem);
router.patch('/items/:id', authenticateJWT, updateItemQty);
router.delete('/items/:id', authenticateJWT, removeItem);

export default router;