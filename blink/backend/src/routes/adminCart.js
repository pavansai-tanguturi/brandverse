import express from 'express';
import { adminAuth } from '../controllers/authController.js';
import { adminAddItem, adminRemoveItem } from '../controllers/adminCartController.js';

const router = express.Router();

// Apply admin JWT authentication to all admin cart routes
router.use(adminAuth);

router.post('/cart/items', adminAddItem);
router.delete('/cart/items/:id', adminRemoveItem);

export default router;