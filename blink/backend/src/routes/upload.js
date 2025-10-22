import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/uploadController.js";
import { adminAuth } from "../controllers/authController.js";

const router = express.Router();

// Set up multer for file uploads (memory storage for direct bucket upload)
const upload = multer({
  storage: multer.memoryStorage(),
});

// POST /api/upload - handle image upload to Supabase (admin only)
router.post("/", adminAuth, upload.single("image"), uploadImage);

// --- Additional CRUD operations for Supabase Storage ---
import { supabaseAdmin } from "../config/supabaseClient.js";

// GET /api/upload - List all images in the bucket (admin only)
router.get("/", adminAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.storage
    .from("category-images")
    .list("", { limit: 100 });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/upload/:filename - Get public URL for a specific image (admin only)
router.get("/:filename", adminAuth, async (req, res) => {
  const { filename } = req.params;
  const { data } = supabaseAdmin.storage
    .from("category-images")
    .getPublicUrl(filename);
  if (!data || !data.publicUrl)
    return res.status(404).json({ error: "Image not found" });
  res.json({ publicUrl: data.publicUrl });
});

// DELETE /api/upload/:filename - Delete an image from the bucket (admin only)
router.delete("/:filename", adminAuth, async (req, res) => {
  const { filename } = req.params;
  const { error } = await supabaseAdmin.storage
    .from("category-images")
    .remove([filename]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
