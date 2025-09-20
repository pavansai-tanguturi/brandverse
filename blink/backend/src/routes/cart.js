import express from 'express';
import { authenticateJWT } from '../controllers/authController.js';
import { getCart, addItem, updateItemQty, removeItem } from '../controllers/cartController.js';

const router = express.Router();

// Apply JWT authentication to all cart routes
router.use(authenticateJWT);

router.get('/', getCart);
router.post('/items', addItem);
router.patch('/items/:id', updateItemQty);
router.delete('/items/:id', removeItem);

export default router;