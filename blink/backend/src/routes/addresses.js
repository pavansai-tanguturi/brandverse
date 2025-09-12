import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { 
  getCustomerAddresses, 
  getAddress, 
  createAddress, 
  updateAddress, 
  deleteAddress,
  setDefaultAddress,
  getCurrentUserAddresses,
  createCurrentUserAddress
} from '../controllers/addressController.js';

const router = express.Router();

// Get all addresses for current authenticated user
router.get('/', requireAuth, getCurrentUserAddresses);

// Create address for current authenticated user
router.post('/', requireAuth, createCurrentUserAddress);

// Get all addresses for a customer
router.get('/customer/:customer_id', getCustomerAddresses);

// Get a specific address by ID
router.get('/:id', getAddress);

// Create a new address for a customer
router.post('/customer/:customer_id', createAddress);

// Update an address
router.put('/:id', requireAuth, updateAddress);

// Delete an address
router.delete('/:id', requireAuth, deleteAddress);

// Set an address as default
router.patch('/:id/default', requireAuth, setDefaultAddress);

export default router;
