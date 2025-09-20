import {
  adminGetDeliveryLocations,
  adminGetDeliveryLocation, // ✅ You missed this!
  adminAddDeliveryLocation,
  adminBulkAddDeliveryLocations,
  adminUpdateDeliveryLocation,
  adminDeleteDeliveryLocation,
  adminBulkDeleteDeliveryLocations,
  adminToggleDeliveryLocation,
  adminBulkToggleDeliveryLocations,
  adminExportDeliveryLocations
} from '../controllers/deliveryController.js';

import { adminAuth } from '../controllers/authController.js';

import express from 'express';
const router = express.Router();

// Bulk routes first
router.post('/bulk', adminAuth, adminBulkAddDeliveryLocations);
router.delete('/bulk', adminAuth, adminBulkDeleteDeliveryLocations);
router.put('/bulk-toggle', adminAuth, adminBulkToggleDeliveryLocations);

// Export
router.get('/export', adminAuth, adminExportDeliveryLocations);

// General
router.get('/', adminAuth, adminGetDeliveryLocations);
router.post('/', adminAuth, adminAddDeliveryLocation);

// Dynamic routes last
router.get('/:id', adminAuth, adminGetDeliveryLocation); // ✅ No longer undefined
router.put('/:id', adminAuth, adminUpdateDeliveryLocation);
router.delete('/:id', adminAuth, adminDeleteDeliveryLocation);
router.put('/:id/toggle', adminAuth, adminToggleDeliveryLocation);

export default router;
