import { supabaseAdmin } from '../config/supabaseClient.js';
import { nanoid } from 'nanoid';

export async function listProducts(_req, res) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, product_images(path,is_primary)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });

  const enriched = await Promise.all((data || []).map(async (p) => {
    const primary = (p.product_images || []).find(i => i.is_primary) || p.product_images?.[0];
    let image_url = null;
    if (primary) {
      const { data: signed } = await supabaseAdmin.storage
        .from(process.env.PRODUCT_IMAGES_BUCKET)
        .createSignedUrl(primary.path, 600);
      image_url = signed?.signedUrl || null;
    }
    return { ...p, image_url };
  }));
  res.json(enriched);
}

export async function getProduct(req, res) {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, product_images(path,is_primary)')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  const withUrls = await Promise.all((data.product_images || []).map(async (img) => {
    const { data: signed } = await supabaseAdmin.storage
      .from(process.env.PRODUCT_IMAGES_BUCKET)
      .createSignedUrl(img.path, 600);
    return { ...img, url: signed?.signedUrl || null };
  }));
  res.json({ ...data, product_images: withUrls });
}

export async function createProduct(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });
  try {
    const { title, slug, description, price_cents, currency = 'INR', category_id, stock_quantity = 0, is_active = true } = req.body;

    const { data: product, error: pErr } = await supabaseAdmin
      .from('products')
      .insert({ title, slug, description, price_cents: Number(price_cents), currency, category_id: category_id || null, stock_quantity: Number(stock_quantity), is_active })
      .select('*')
      .single();
    if (pErr) return res.status(400).json({ error: pErr.message });

    const rows = [];
    for (const [idx, file] of (req.files || []).entries()) {
      const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
      const path = `${product.id}/${nanoid(8)}.${ext}`;
      const { error: uErr } = await supabaseAdmin.storage
        .from(process.env.PRODUCT_IMAGES_BUCKET)
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
      if (uErr) return res.status(400).json({ error: uErr.message });
      rows.push({ product_id: product.id, path, is_primary: idx === 0 });
    }
    if (rows.length) await supabaseAdmin.from('product_images').insert(rows);

    res.status(201).json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function updateProduct(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });

  const { id } = req.params;
  const patch = req.body;
  if ('price_cents' in patch) patch.price_cents = Number(patch.price_cents);
  if ('stock_quantity' in patch) patch.stock_quantity = Number(patch.stock_quantity);
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteProduct(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });

  const { id } = req.params;
  const { data: imgs } = await supabaseAdmin
    .from('product_images')
    .select('path')
    .eq('product_id', id);
  if (imgs?.length) await supabaseAdmin.storage
    .from(process.env.PRODUCT_IMAGES_BUCKET)
    .remove(imgs.map(i => i.path));
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ deleted: true });
}

export async function addImages(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });

  const { id } = req.params;
  const { replace } = req.query; // check if we should replace existing images
  
  // If replace=true, delete existing images first
  if (replace === 'true') {
    const { data: existingImages } = await supabaseAdmin
      .from('product_images')
      .select('path')
      .eq('product_id', id);
    
    if (existingImages?.length) {
      // Delete from storage
      await supabaseAdmin.storage
        .from(process.env.PRODUCT_IMAGES_BUCKET)
        .remove(existingImages.map(img => img.path));
      
      // Delete from database
      await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', id);
    }
  }

  const rows = [];
  for (const [idx, file] of (req.files || []).entries()) {
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const path = `${id}/${nanoid(8)}.${ext}`;
    const { error: uErr } = await supabaseAdmin.storage
      .from(process.env.PRODUCT_IMAGES_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (uErr) return res.status(400).json({ error: uErr.message });
    rows.push({ product_id: id, path, is_primary: idx === 0 }); // first image is primary
  }
  if (rows.length) await supabaseAdmin.from('product_images').insert(rows);
  res.json({ uploaded: rows.length, replaced: replace === 'true' });
}