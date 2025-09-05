import express from 'express';
import { 
  getDeliveryLocations, 
  checkDeliveryAvailability 
} from '../controllers/deliveryController.js';

const router = express.Router();

// Public routes
router.get('/locations', getDeliveryLocations);
router.get('/check', checkDeliveryAvailability);

export default router;
