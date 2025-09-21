
import { supabaseAdmin } from '../config/supabaseClient.js';
import fs from 'fs';
import path from 'path';

// Handles file upload for category images to Supabase Storage
export async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileExt = path.extname(req.file.originalname);
    const fileName = `category_${Date.now()}${fileExt}`;
    const bucket = 'category-images';

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
    // Remove local file after upload
    fs.unlinkSync(req.file.path);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    const imageUrl = publicUrlData.publicUrl;
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
