
import { supabaseAdmin } from '../config/supabaseClient.js';
import path from 'path';

// Handles file upload for category images to Supabase Storage
export async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    // Use the buffer directly from memory storage
    const fileBuffer = req.file.buffer;
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

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    const imageUrl = publicUrlData.publicUrl;
    
    res.json({ imageUrl });
  } catch (err) {
    console.error('Upload controller error:', err);
    res.status(500).json({ error: err.message });
  }
}
