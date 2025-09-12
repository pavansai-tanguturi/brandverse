import { Router } from 'express';
import { listCustomers, getCustomerDetails, updateCustomerAdmin } from '../controllers/customerController.js';

const router = Router();

// GET /api/admin/customers - List all customers with stats
router.get('/', listCustomers);

// GET /api/admin/customers/:id - Get customer details
router.get('/:id', getCustomerDetails);

// PUT /api/admin/customers/:id - Update customer (admin only)
router.put('/:id', updateCustomerAdmin);

export default router;
