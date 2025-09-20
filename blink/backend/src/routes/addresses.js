import express from 'express';
// ...existing code...
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
import { authenticateJWT } from '../controllers/authController.js';
// ...existing code...
router.get('/', authenticateJWT, getCurrentUserAddresses);

// Create address for current authenticated user
router.post('/', authenticateJWT, createCurrentUserAddress);

// Get all addresses for a customer
router.get('/customer/:customer_id', getCustomerAddresses);

// Get a specific address by ID
router.get('/:id', getAddress);

// Create a new address for a customer
router.post('/customer/:customer_id', createAddress);

// Update an address
router.put('/:id', authenticateJWT, updateAddress);

// Delete an address
router.delete('/:id', authenticateJWT, deleteAddress);

// Set an address as default
router.patch('/:id/default', authenticateJWT, setDefaultAddress);

export default router;
