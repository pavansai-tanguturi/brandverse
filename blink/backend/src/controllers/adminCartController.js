import { supabaseAdmin } from '../config/supabaseClient.js';

export async function adminAddItem(req, res) {
  // Check JWT authentication
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { cart_id, product_id, quantity = 1 } = req.body;
  if (!cart_id || !product_id) {
    return res.status(400).json({ error: 'cart_id and product_id required' });
  }

  try {
    // Check if product exists and has sufficient stock
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Add item to cart
    const { data: item, error } = await supabaseAdmin
      .from('cart_items')
      .insert({ 
        cart_id, 
        product_id, 
        quantity, 
        unit_price_cents: product.price_cents 
      })
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Log admin event
    await supabaseAdmin
      .from('events')
      .insert({ 
        type: 'admin_add_cart_item', 
        customer_id: null, 
        product_id, 
        metadata: { 
          cart_id, 
          admin: req.user.userId, 
          admin_email: req.user.email,
          quantity 
        } 
      });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error in adminAddItem:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminRemoveItem(req, res) {
  // Check JWT authentication
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params; // cart item id

  try {
    // Get cart item details before deletion
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('cart_items')
      .select('id, cart_id, product_id, quantity')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Delete the cart item
    const { error: deleteError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    // Log admin event
    await supabaseAdmin
      .from('events')
      .insert({ 
        type: 'admin_remove_cart_item', 
        customer_id: null, 
        product_id: item.product_id, 
        metadata: { 
          cart_id: item.cart_id, 
          admin: req.user.userId,
          admin_email: req.user.email,
          quantity: item.quantity 
        } 
      });

    res.json({ deleted: true });
  } catch (error) {
    console.error('Error in adminRemoveItem:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}