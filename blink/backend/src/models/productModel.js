import { supabaseAdmin } from '../config/supabaseClient.js';

export async function listActive() {
  return await supabaseAdmin
    .from('products')
    .select('*, product_images(path,is_primary)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
}

export async function getById(id) {
  return await supabaseAdmin
    .from('products')
    .select('*, product_images(path,is_primary)')
    .eq('id', id)
    .single();
}