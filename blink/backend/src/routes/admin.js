import express from 'express';
import { summary, exportAnalytics } from '../controllers/adminController.js';
import { 
  adminGetDeliveryLocations, 
  adminAddDeliveryLocation, 
  adminUpdateDeliveryLocation, 
  adminDeleteDeliveryLocation, 
  adminToggleDeliveryLocation, 
  adminBulkAddDeliveryLocations, 
  adminBulkDeleteDeliveryLocations, 
  adminBulkToggleDeliveryLocations, 
  adminExportDeliveryLocations
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

// Bulk operations
router.post('/delivery-locations/bulk', adminBulkAddDeliveryLocations);
router.delete('/delivery-locations/bulk', adminBulkDeleteDeliveryLocations);
router.patch('/delivery-locations/bulk-toggle', adminBulkToggleDeliveryLocations);
router.get('/delivery-locations/export', adminExportDeliveryLocations);
export default router;