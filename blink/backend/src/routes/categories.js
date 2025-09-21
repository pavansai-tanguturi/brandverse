import express from 'express';
// ...existing code...
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', listCategories);
import { adminAuth } from '../controllers/authController.js';
// ...existing code...
router.post('/', adminAuth, createCategory);
router.patch('/:id', adminAuth, updateCategory);
router.delete('/:id', adminAuth, deleteCategory);

export default router;
