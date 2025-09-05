import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { summary, exportAnalytics } from '../controllers/adminController.js';
import { 
  adminGetDeliveryLocations, 
  adminAddDeliveryLocation, 
  adminUpdateDeliveryLocation, 
  adminDeleteDeliveryLocation, 
  adminToggleDeliveryLocation 
} from '../controllers/deliveryController.js';

const router = express.Router();
router.get('/analytics/summary', requireAdmin, summary);
router.get('/analytics/export', requireAdmin, exportAnalytics);

// Delivery location management
router.get('/delivery-locations', requireAdmin, adminGetDeliveryLocations);
router.post('/delivery-locations', requireAdmin, adminAddDeliveryLocation);
router.put('/delivery-locations/:id', requireAdmin, adminUpdateDeliveryLocation);
router.delete('/delivery-locations/:id', requireAdmin, adminDeleteDeliveryLocation);
router.patch('/delivery-locations/:id/toggle', requireAdmin, adminToggleDeliveryLocation);

export default router;