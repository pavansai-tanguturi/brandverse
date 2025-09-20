// routes/deliveryRoutes.js
import express from 'express';
import {
  getDeliveryLocations,
  checkDeliveryAvailability,
  getDeliveryStats
} from '../controllers/deliveryController.js';

const router = express.Router();

router.get('/locations', getDeliveryLocations);
router.get('/check', checkDeliveryAvailability);
router.get('/stats', getDeliveryStats);

export default router;
