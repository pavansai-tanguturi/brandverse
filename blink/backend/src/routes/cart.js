import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCart, addItem, updateItemQty, removeItem } from '../controllers/cartController.js';

const router = express.Router();
router.get('/', requireAuth, getCart);
router.post('/items', requireAuth, addItem);
router.patch('/items/:id', requireAuth, updateItemQty);
router.delete('/items/:id', requireAuth, removeItem);

export default router;