import express from 'express';
import multer from 'multer';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addImages,
  deleteImage,
  searchProducts
} from '../controllers/productController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/search', searchProducts);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', upload.array('images', 6), createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/images', upload.array('images', 6), addImages);
router.delete('/:productId/images/:imageId', deleteImage);

export default router;