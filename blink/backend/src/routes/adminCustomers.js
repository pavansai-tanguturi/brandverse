import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  listCustomers,
  getCustomerDetails,
  updateCustomerAdmin
} from '../controllers/customerController.js';

const router = express.Router();

// All admin customer routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Admin customer management routes
router.get('/', listCustomers);
router.get('/:id', getCustomerDetails);
router.put('/:id', updateCustomerAdmin);

export default router;