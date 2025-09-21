const db = require('../config/supabaseClient');

// Category Model
const Category = {
  async getAll() {
    const { data, error } = await db.from('categories').select('*');
    if (error) throw error;
    return data;
  },
  async getById(id) {
    const { data, error } = await db.from('categories').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(category) {
    const { data, error } = await db.from('categories').insert([category]).select('*').single();
    if (error) throw error;
    return data;
  },
  async update(id, updates) {
    const { data, error } = await db.from('categories').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
  async remove(id) {
    const { error } = await db.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

module.exports = Category;
