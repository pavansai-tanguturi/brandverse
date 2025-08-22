import { supabaseAdmin } from '../config/supabaseClient.js';
import { getOrCreateActiveCart } from '../models/cartModel.js';

export async function getCart(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('auth_user_id', userId)
    .single();
  if (!customer || !customer.id) {
    // No customer record found for this user (might be admin or not provisioned)
    return res.status(404).json({ error: 'Customer record not found' });
  }

  const cart = await getOrCreateActiveCart(customer.id);
  const { data: items } = await supabaseAdmin
    .from('cart_items')
    .select('*, products(title, price_cents, currency, stock_quantity)')
    .eq('cart_id', cart.id);
  res.json({ cart, items });
}

export async function addItem(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('auth_user_id', userId)
    .single();
  if (!customer || !customer.id) return res.status(404).json({ error: 'Customer record not found' });
  const cart = await getOrCreateActiveCart(customer.id);
  // Ignore any client-supplied cart_id/customer_id to prevent hijacking another cart
  const { product_id, productId, quantity = 1 } = req.body;
  const finalProductId = product_id || productId;
  const { data: product, error: pErr } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', finalProductId)
    .single();
  if (pErr || !product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock_quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  const { data: item, error } = await supabaseAdmin
    .from('cart_items')
    .insert({ cart_id: cart.id, product_id: finalProductId, quantity, unit_price_cents: product.price_cents })
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json(item);
}

export async function updateItemQty(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const id = req.params.id;
  const { quantity } = req.body;
  if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ error: 'Invalid quantity' });
  // Verify ownership: item must belong to a cart owned by the current session user
  const userId = req.session.user.id;
  const { data: item } = await supabaseAdmin.from('cart_items').select('id,cart_id,product_id').eq('id', id).single();
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  const { data: cart } = await supabaseAdmin.from('carts').select('id,customer_id').eq('id', item.cart_id).single();
  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  const { data: customer } = await supabaseAdmin.from('customers').select('id,auth_user_id').eq('id', cart.customer_id).single();
  if (!customer || customer.auth_user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

  const { data: updated, error } = await supabaseAdmin
    .from('cart_items')
    .update({ quantity })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(updated);
}

export async function removeItem(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const id = req.params.id;
  // Verify ownership before deleting
  const userId = req.session.user.id;
  const { data: item } = await supabaseAdmin.from('cart_items').select('id,cart_id').eq('id', id).single();
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  const { data: cart } = await supabaseAdmin.from('carts').select('id,customer_id').eq('id', item.cart_id).single();
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  const { data: customer } = await supabaseAdmin.from('customers').select('id,auth_user_id').eq('id', cart.customer_id).single();
  if (!customer || customer.auth_user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

  const { error } = await supabaseAdmin.from('cart_items').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ deleted: true });
}