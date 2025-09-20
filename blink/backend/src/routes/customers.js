import express from 'express';
import multer from 'multer';
import { adminAuth } from '../controllers/authController.js';
import {
  getMe,
  updateMe,
  uploadAvatar,
  deleteMe
} from '../controllers/customerController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All customer routes require authentication (using the working adminAuth)
router.use(adminAuth);

// Customer profile routes
router.get('/me', getMe);
router.put('/me', updateMe);
router.post('/me/avatar', upload.array('files', 1), uploadAvatar);
router.delete('/me', deleteMe);

export default router;