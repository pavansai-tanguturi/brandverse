import express from 'express';
import { adminAuth } from '../controllers/authController.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';

const router = express.Router();

// Public route
router.get('/', listCategories);

// Admin routes - apply JWT auth
router.post('/', adminAuth, createCategory);
router.patch('/:id', adminAuth, updateCategory);
router.delete('/:id', adminAuth, deleteCategory);

export default router;