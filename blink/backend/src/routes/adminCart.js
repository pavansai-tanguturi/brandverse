import express from 'express';
import { adminAddItem, adminRemoveItem } from '../controllers/adminCartController.js';
const router = express.Router();
router.post('/cart/items', adminAddItem);
router.delete('/cart/items/:id', adminRemoveItem);
export default router;
