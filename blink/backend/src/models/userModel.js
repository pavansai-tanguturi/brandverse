import { supabaseAdmin } from '../config/supabaseClient.js';

export async function findCustomerByAuthId(auth_user_id) {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('auth_user_id', auth_user_id)
    .single();
  if (error) return null;
  return data;
}

export async function ensureCustomer(user) {
  const existing = await findCustomerByAuthId(user.id);
  if (existing) return existing;
  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert({ auth_user_id: user.id, email: user.email, full_name: user.user_metadata?.full_name || null })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}