import express from 'express';
import { summary, exportAnalytics } from '../controllers/adminController.js';
import { 
  adminGetDeliveryLocations, 
  adminAddDeliveryLocation, 
  adminUpdateDeliveryLocation, 
  adminDeleteDeliveryLocation, 
  adminToggleDeliveryLocation 
} from '../controllers/deliveryController.js';
import { adminAuth, authenticateJWT } from '../controllers/authController.js';

const router = express.Router();

// Apply JWT authentication to all admin routes
router.use(adminAuth);

router.get('/analytics/summary', summary);
router.get('/analytics/export', exportAnalytics);

// Delivery location management
router.get('/delivery-locations', adminGetDeliveryLocations);
router.post('/delivery-locations', adminAddDeliveryLocation);
router.put('/delivery-locations/:id', adminUpdateDeliveryLocation);
router.delete('/delivery-locations/:id', adminDeleteDeliveryLocation);
router.patch('/delivery-locations/:id/toggle', adminToggleDeliveryLocation);
export default router;