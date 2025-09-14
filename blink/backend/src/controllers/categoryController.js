import { supabaseAdmin } from '../config/supabaseClient.js';

export async function listCategories(_req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Categories fetch error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      data.map(async (category) => {
        const { count } = await supabaseAdmin
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('is_active', true);
        
        return {
          ...category,
          count: count || 0
        };
      })
    );

    // Add "All Products" category
    const { count: totalCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const allCategories = [
      { id: 'all', name: 'All Products', slug: 'all', count: totalCount || 0 },
      ...categoriesWithCounts
    ];

    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
