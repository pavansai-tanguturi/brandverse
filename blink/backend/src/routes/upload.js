import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadImage } from '../controllers/uploadController.js';
import { adminAuth } from '../controllers/authController.js';

const router = express.Router();

// Set up multer for file uploads (temporary local storage)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });


// POST /api/upload - handle image upload to Supabase (admin only)
router.post('/', adminAuth, upload.single('image'), uploadImage);

// --- Additional CRUD operations for Supabase Storage ---
import { supabaseAdmin } from '../config/supabaseClient.js';

// GET /api/upload - List all images in the bucket (admin only)
router.get('/', adminAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.storage.from('category-images').list('', { limit: 100 });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/upload/:filename - Get public URL for a specific image (admin only)
router.get('/:filename', adminAuth, async (req, res) => {
  const { filename } = req.params;
  const { data } = supabaseAdmin.storage.from('category-images').getPublicUrl(filename);
  if (!data || !data.publicUrl) return res.status(404).json({ error: 'Image not found' });
  res.json({ publicUrl: data.publicUrl });
});

// DELETE /api/upload/:filename - Delete an image from the bucket (admin only)
router.delete('/:filename', adminAuth, async (req, res) => {
  const { filename } = req.params;
  const { error } = await supabaseAdmin.storage.from('category-images').remove([filename]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
