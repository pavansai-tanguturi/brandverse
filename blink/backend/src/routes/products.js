import express from 'express';
import multer from 'multer';
// ...existing code...
import { adminAuth, authenticateJWT } from '../controllers/authController.js';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addImages,
  deleteImage,
  searchProducts,
  // listTopSellingProducts
} from '../controllers/productController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public routes (no authentication required)
router.get('/search', searchProducts);
router.get('/', listProducts);
router.get('/:id', getProduct);

// Admin-only routes (require admin authentication)
router.post('/', adminAuth, upload.array('images', 6), createProduct);
router.patch('/:id', adminAuth, updateProduct);
router.delete('/:id', adminAuth, deleteProduct);
router.post('/:id/images', adminAuth, upload.array('images', 6), addImages);
router.delete('/:productId/images/:imageId', adminAuth, deleteImage);

export default router;