import express from 'express';
import {
  listCustomers,
  getCustomerDetails,
  updateCustomerAdmin
} from '../controllers/customerController.js';
import { adminAuth } from '../controllers/authController.js';

const router = express.Router();

// Apply JWT admin authentication to all admin/customer routes
router.get('/', adminAuth, listCustomers);
router.get('/:id', adminAuth, getCustomerDetails);
router.put('/:id', adminAuth, updateCustomerAdmin);

export default router;
