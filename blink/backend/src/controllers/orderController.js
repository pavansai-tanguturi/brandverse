import { supabaseAdmin } from '../config/supabaseClient.js';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret',
});

export async function createOrder(req, res) {
  try {
    if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
    const userId = req.session.user.id;
    const { 
      shipping_cents = 0, 
      tax_cents = 0, 
      discount_cents = 0,
      payment_method = null,
      create_razorpay_order = false
    } = req.body || {};

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

    // Create Razorpay order if requested
    let razorpayOrder = null;
    if (create_razorpay_order && payment_method === 'razorpay') {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: total, // amount in paisa
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          payment_capture: 1
        });
      } catch (razorpayError) {
        console.error('Razorpay order creation failed:', razorpayError);
        return res.status(400).json({ error: 'Payment gateway error' });
      }
    }

    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customer.id,
        status: 'pending',
        payment_status: 'pending',
        payment_method: payment_method,
        razorpay_order_id: razorpayOrder?.id || null,
        subtotal_cents: subtotal,
        tax_cents,
        shipping_cents,
        discount_cents,
        total_cents: total,
      })
      .select('*')
      .single();
    if (oErr) return res.status(400).json({ error: oErr.message });

    // Create order items but don't reduce stock yet (only after payment success)
    for (const it of items) {
      await supabaseAdmin.from('order_items').insert({
        order_id: order.id,
        product_id: it.product_id,
        title: it.products.title,
        quantity: it.quantity,
        unit_price_cents: it.unit_price_cents,
        total_cents: it.unit_price_cents * it.quantity,
      });
    }

    // Don't convert cart or reduce stock yet - wait for payment confirmation

    res.status(201).json({
      ...order,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      razorpay_order_id: razorpayOrder?.id
    });
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

export async function confirmPayment(req, res) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_id 
    } = req.body;

    if (!req.session?.user) return res.status(401).json({ error: 'Login required' });

    // Verify payment signature
    const crypto = await import('crypto');
    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get order details with items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', order_id)
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Payment already confirmed' });
    }

    // Update order status to paid
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        payment_status: 'paid',
        status: 'paid',
        razorpay_payment_id: razorpay_payment_id
      })
      .eq('id', order_id)
      .select('*')
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Reduce stock for all order items
    for (const item of order.order_items) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (product && product.stock_quantity >= item.quantity) {
        await supabaseAdmin
          .from('products')
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq('id', item.product_id);
      } else {
        // Rollback: mark order as failed if insufficient stock
        await supabaseAdmin
          .from('orders')
          .update({ 
            payment_status: 'failed',
            status: 'failed',
            failure_reason: `Insufficient stock for ${item.title}`
          })
          .eq('id', order_id);
        
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.title}. Payment will be refunded.` 
        });
      }
    }

    // Mark cart as converted
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', order.customer_id)
      .single();

    if (customer) {
      const { data: cart } = await supabaseAdmin
        .from('carts')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('status', 'active')
        .single();

      if (cart) {
        await supabaseAdmin
          .from('carts')
          .update({ status: 'converted' })
          .eq('id', cart.id);
      }
    }

    res.json({ 
      success: true, 
      order: updatedOrder,
      message: 'Payment confirmed successfully' 
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
}

export async function handleWebhook(req, res) {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);
    
    // Verify webhook signature
    const crypto = await import('crypto');
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    
    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      // Find order by razorpay_order_id
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, payment_status')
        .eq('razorpay_order_id', orderId)
        .single();

      if (order && order.payment_status === 'pending') {
        await supabaseAdmin
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'paid',
            razorpay_payment_id: paymentEntity.id
          })
          .eq('id', order.id);
      }
    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, payment_status')
        .eq('razorpay_order_id', orderId)
        .single();

      if (order && order.payment_status === 'pending') {
        await supabaseAdmin
          .from('orders')
          .update({ 
            payment_status: 'failed',
            status: 'failed',
            failure_reason: paymentEntity.error_description
          })
          .eq('id', order.id);
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}