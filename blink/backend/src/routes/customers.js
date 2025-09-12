import express from 'express';
import multer from 'multer';
import { getMe, updateMe, uploadAvatar, deleteMe } from '../controllers/customerController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);
router.post('/me/avatar', requireAuth, upload.array('avatar', 1), uploadAvatar);
router.delete('/me', requireAuth, deleteMe);

export default router;
