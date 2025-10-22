import express from "express";
import multer from "multer";
import {
  getMe,
  updateMe,
  uploadAvatar,
  deleteMe,
} from "../controllers/customerController.js";
// ...existing code...

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

import { authenticateJWT } from "../controllers/authController.js";
// ...existing code...
router.get("/me", authenticateJWT, getMe);
router.patch("/me", authenticateJWT, updateMe);
router.post(
  "/me/avatar",
  authenticateJWT,
  upload.array("avatar", 1),
  uploadAvatar,
);
router.delete("/me", authenticateJWT, deleteMe);

export default router;
