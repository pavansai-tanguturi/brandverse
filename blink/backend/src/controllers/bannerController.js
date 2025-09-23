import { supabaseAdmin } from '../config/supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = 'banner-images';

export const getAllBanners = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch banners', details: err.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    let imageUrl = null;
    console.log('--- DEBUG: Received file:', req.file);
    if (!req.file) {
      console.error('--- DEBUG: No file received in req.file');
    }
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;
      console.log('--- DEBUG: Uploading to bucket:', BUCKET, 'as', fileName);
      const uploadResult = await supabaseAdmin.storage.from(BUCKET).upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });
      console.log('--- DEBUG: Supabase upload result:', uploadResult);
      if (uploadResult.error) {
        console.error('--- DEBUG: Supabase upload error:', uploadResult.error);
        throw uploadResult.error;
      }
      const publicUrlResult = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
      console.log('--- DEBUG: Supabase getPublicUrl result:', publicUrlResult);
      imageUrl = publicUrlResult.data.publicUrl;
      console.log('--- DEBUG: Image uploaded, public URL:', imageUrl);
      if (!imageUrl) {
        console.error('--- DEBUG: Image URL is null after upload!');
      }
    }
    const { title, subtitle, button_text, category_slug } = req.body;
    const id = uuidv4();
    const { data, error } = await supabaseAdmin
      .from('banners')
      .insert([
        { id, title, subtitle, button_text, category_slug, image_url: imageUrl }
      ])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Banner creation error:', err);
    res.status(500).json({ error: 'Failed to create banner', details: err.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    let imageUrl = req.body.image_url;
    console.log('--- DEBUG: [PATCH] Received file:', req.file);
    if (!req.file) {
      console.log('--- DEBUG: [PATCH] No file received in req.file. Checking if image_url is present in form data:', imageUrl);
      if (!imageUrl) {
        // Fetch current image_url from DB
        const { data: currentBanner, error: fetchError } = await supabaseAdmin
          .from('banners')
          .select('image_url')
          .eq('id', id)
          .single();
        if (fetchError) {
          console.error('--- DEBUG: [PATCH] Error fetching current banner for image_url:', fetchError);
          throw fetchError;
        }
        imageUrl = currentBanner?.image_url || null;
        console.log('--- DEBUG: [PATCH] Using existing image_url from DB:', imageUrl);
      }
    }
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;
      console.log('--- DEBUG: [PATCH] Uploading to bucket:', BUCKET, 'as', fileName);
      const uploadResult = await supabaseAdmin.storage.from(BUCKET).upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });
      console.log('--- DEBUG: [PATCH] Supabase upload result:', uploadResult);
      if (uploadResult.error) {
        console.error('--- DEBUG: [PATCH] Supabase upload error:', uploadResult.error);
        throw uploadResult.error;
      }
      const publicUrlResult = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
      console.log('--- DEBUG: [PATCH] Supabase getPublicUrl result:', publicUrlResult);
      imageUrl = publicUrlResult.data.publicUrl;
      console.log('--- DEBUG: [PATCH] Image uploaded, public URL:', imageUrl);
      if (!imageUrl) {
        console.error('--- DEBUG: [PATCH] Image URL is null after upload!');
      }
    }
    const { title, subtitle, button_text, category_slug } = req.body;
    const { data, error } = await supabaseAdmin
      .from('banners')
      .update({
        title,
        subtitle,
        button_text,
        category_slug,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('--- DEBUG: [PATCH] Banner update error:', err);
    res.status(500).json({ error: 'Failed to update banner', details: err.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('banners')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete banner', details: err.message });
  }
};
