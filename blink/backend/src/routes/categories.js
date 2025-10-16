import express from 'express';
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { adminAuth } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.get('/', listCategories);
router.get('/:identifier', getCategory); // Can be ID or slug

// Admin-only routes
router.post('/', adminAuth, createCategory);
router.patch('/:id', adminAuth, updateCategory);
router.delete('/:id', adminAuth, deleteCategory);

export default router;
