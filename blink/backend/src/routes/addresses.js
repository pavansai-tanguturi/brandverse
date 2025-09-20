import express from 'express';
import { authenticateJWT, adminAuth } from '../controllers/authController.js';
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

// User routes - require JWT authentication
router.get('/', authenticateJWT, getCurrentUserAddresses);
router.post('/', authenticateJWT, createCurrentUserAddress);
router.put('/:id', authenticateJWT, updateAddress);
router.delete('/:id', authenticateJWT, deleteAddress);
router.patch('/:id/default', authenticateJWT, setDefaultAddress);

// Admin routes - require admin JWT authentication
router.get('/customer/:customer_id', adminAuth, getCustomerAddresses);
router.get('/:id', authenticateJWT, getAddress); // Users can view their own addresses
router.post('/customer/:customer_id', adminAuth, createAddress);

export default router;