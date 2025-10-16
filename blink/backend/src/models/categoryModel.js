import { supabaseAdmin } from '../config/supabaseClient.js';

// Category Model
const Category = {
  async getAll(includeInactive = false) {
    let query = supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getBySlug(slug) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  },

  async create(category) {
    const categoryData = {
      name: category.name.trim(),
      slug: category.slug.trim().toLowerCase(),
      ...(category.image_url && { image_url: category.image_url.trim() })
    };

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([categoryData])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.slug !== undefined) updateData.slug = updates.slug.trim().toLowerCase();
    if (updates.image_url !== undefined) updateData.image_url = updates.image_url ? updates.image_url.trim() : null;

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    // Check if category has products first
    const { count } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);
    
    if (count > 0) {
      throw new Error(`Cannot delete category with ${count} existing products. Please move or delete all products first.`);
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  async getProductCount(categoryId) {
    const { count, error } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('is_active', true);
    
    if (error) throw error;
    return count || 0;
  }
};

export default Category;
