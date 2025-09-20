import { supabaseAdmin } from '../config/supabaseClient.js';

export async function adminAddItem(req, res) {
  // req.body: { cart_id, product_id, quantity }
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  if (!req.session.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  const { cart_id, product_id, quantity = 1 } = req.body;
  if (!cart_id || !product_id) return res.status(400).json({ error: 'cart_id and product_id required' });

  const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', product_id).single();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock_quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  const { data: item, error } = await supabaseAdmin.from('cart_items').insert({ cart_id, product_id, quantity, unit_price_cents: product.price_cents }).select('*').single();
  if (error) return res.status(400).json({ error: error.message });

  // log event
  await supabaseAdmin.from('events').insert({ type: 'admin_add_cart_item', customer_id: null, product_id, metadata: { cart_id, admin: req.session.user.id, quantity } });

  res.status(201).json(item);
}

export async function adminRemoveItem(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  if (!req.session.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  const { id } = req.params; // cart item id
  const { data: item } = await supabaseAdmin.from('cart_items').select('id,cart_id,product_id,quantity').eq('id', id).single();
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  const { error } = await supabaseAdmin.from('cart_items').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from('events').insert({ type: 'admin_remove_cart_item', customer_id: null, product_id: item.product_id, metadata: { cart_id: item.cart_id, admin: req.session.user.id, quantity: item.quantity } });

  res.json({ deleted: true });
}
