import { supabaseAdmin } from '../config/supabaseClient.js';

export async function getOrCreateActiveCart(customer_id) {
  let { data: carts } = await supabaseAdmin
    .from('carts')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('status', 'active')
    .limit(1);
  let cart = carts?.[0];
  if (!cart) {
    const { data: created } = await supabaseAdmin
      .from('carts')
      .insert({ customer_id })
      .select('*')
      .single();
    cart = created;
  }
  return cart;
}