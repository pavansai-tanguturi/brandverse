import express from 'express';
import multer from 'multer';
import { adminAuth } from '../controllers/authController.js';
import * as bannerController from '../controllers/bannerController.js';

const router = express.Router();

// Multer setup for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Public: Get all banners
router.get('/', bannerController.getAllBanners);

// Admin: Create banner
router.post('/', adminAuth, upload.single('image'), bannerController.createBanner);

// Admin: Update banner
router.patch('/:id', adminAuth, upload.single('image'), bannerController.updateBanner);

// Admin: Delete banner
router.delete('/:id', adminAuth, bannerController.deleteBanner);

export default router;
