import { supabaseAdmin } from '../config/supabaseClient.js';

export async function createOrder(req, res) {
  try {
    if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
    const userId = req.session.user.id;
    const { shipping_cents = 0, tax_cents = 0, discount_cents = 0 } = req.body || {};

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!customer || !customer.id) return res.status(404).json({ error: 'Customer record not found' });

    let { data: carts } = await supabaseAdmin
      .from('carts')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .limit(1);
    const cart = carts?.[0];
    if (!cart) return res.status(400).json({ error: 'No active cart' });

    const { data: items } = await supabaseAdmin
      .from('cart_items')
      .select('*, products(title, price_cents, stock_quantity)')
      .eq('cart_id', cart.id);
    if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    let subtotal = 0;
    for (const it of items) {
      if (it.products.stock_quantity < it.quantity)
        return res.status(400).json({ error: `Insufficient stock for ${it.products.title}` });
      subtotal += it.unit_price_cents * it.quantity;
    }
    const total = subtotal + tax_cents + shipping_cents - discount_cents;

    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customer.id,
        status: 'pending',
        subtotal_cents: subtotal,
        tax_cents,
        shipping_cents,
        discount_cents,
        total_cents: total,
      })
      .select('*')
      .single();
    if (oErr) return res.status(400).json({ error: oErr.message });

    for (const it of items) {
      await supabaseAdmin.from('order_items').insert({
        order_id: order.id,
        product_id: it.product_id,
        title: it.products.title,
        quantity: it.quantity,
        unit_price_cents: it.unit_price_cents,
        total_cents: it.unit_price_cents * it.quantity,
      });
      await supabaseAdmin
        .from('products')
        .update({ stock_quantity: it.products.stock_quantity - it.quantity })
        .eq('id', it.product_id);
    }

    await supabaseAdmin.from('carts').update({ status: 'converted' }).eq('id', cart.id);

    res.status(201).json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function listMyOrders(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('auth_user_id', userId)
    .single();
  
  if (!customer || !customer.id) return res.status(404).json({ error: 'Customer record not found' });
  
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function listAllOrders(_req, res) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items(*),
      customers(
        id,
        full_name,
        email,
        phone,
        shipping_address,
        billing_address
      )
    `)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body; // pending|paid|shipped|delivered|cancelled|refunded
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}