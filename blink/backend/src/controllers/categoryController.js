import { supabaseAdmin } from '../config/supabaseClient.js';

export async function listCategories(_req, res) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function createCategory(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });
  
  const { name, slug } = req.body;
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ name, slug })
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateCategory(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });
  
  const { id } = req.params;
  const patch = req.body;
  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteCategory(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });
  
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ deleted: true });
}
