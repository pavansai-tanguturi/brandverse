// Import your existing Supabase client
import { supabaseAdmin as supabase } from '../config/supabaseClient.js';

// Simplified function - use the correct field name from your customers table
async function getCustomerByAuthId(userId) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', userId) // Updated to match your actual column name
      .single();
    
    if (error) {
      console.error('Error fetching customer:', error);
      // If customer doesn't exist, create one
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          auth_user_id: userId, // Updated to match your actual column name
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating customer:', createError);
        return null;
      }
      
      return newCustomer;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getCustomerByAuthId:', error);
    return null;
  }
}

// Utility function to create or get active cart
async function getOrCreateActiveCart(customerId) {
  try {
    // Try to find existing active cart
    // Use 'user_id' if that's your field name instead of 'customer_id'
    const { data: existingCart } = await supabase
      .from('carts')
      .select('*')
      .eq('customer_id', customerId) // Change to 'user_id' if that's your field name
      .eq('status', 'active')
      .single();

    if (existingCart) {
      return existingCart;
    }

    // Create new cart if none exists
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({
        customer_id: customerId, // Change to 'user_id' if that's your field name
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return newCart;
  } catch (error) {
    console.error('Error in getOrCreateActiveCart:', error);
    throw error;
  }
}

// Utility function to validate product availability
async function validateProduct(productId, requestedQuantity = 1) {
  const { data: product, error } = await supabase
    .from('products')
    .select('id, title, price_cents, stock_quantity, is_active')
    .eq('id', productId)
    .single();

  if (error || !product) {
    return { valid: false, error: 'Product not found', product: null };
  }

  if (!product.is_active) {
    return { valid: false, error: 'Product is no longer available', product };
  }

  if (product.stock_quantity < requestedQuantity) {
    return { 
      valid: false, 
      error: 'Insufficient stock', 
      product,
      available: product.stock_quantity,
      requested: requestedQuantity
    };
  }

  return { valid: true, product };
}

// Get cart with items
export async function getCart(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    
    const userId = req.user.id;
    const customer = await getCustomerByAuthId(userId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const cart = await getOrCreateActiveCart(customer.id);

    // First try with JOIN (requires foreign key relationship)
    let items = null;
    let itemsError = null;

    try {
      const { data: joinedItems, error: joinError } = await supabase
        .from('cart_items')
        .select(`
          *,
          products(
            id,
            title,
            price_cents,
            stock_quantity,
            is_active,
            discount_percent
          )
        `)
        .eq('cart_id', cart.id)
        .order('created_at', { ascending: false });

      items = joinedItems;
      itemsError = joinError;
    } catch (joinError) {
      console.warn('JOIN query failed, falling back to separate queries');
      itemsError = joinError;
    }

    // Fallback: Get cart items and products separately
    if (itemsError || !items) {
      console.log('Using fallback method to get cart items and products');
      
      const { data: cartItems, error: cartItemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id)
        .order('created_at', { ascending: false });

      if (cartItemsError) {
        console.error('Error fetching cart items:', cartItemsError);
        return res.status(500).json({ error: 'Failed to fetch cart items' });
      }

      if (!cartItems || cartItems.length === 0) {
        return res.json({
          cart: { ...cart, total_cents: 0 },
          items: []
        });
      }

      // Get product details for each cart item
      const productIds = cartItems.map(item => item.product_id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, price_cents, stock_quantity, is_active, discount_percent')
        .in('id', productIds);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return res.status(500).json({ error: 'Failed to fetch product details' });
      }

      // Fetch primary images for these products
      const { data: images, error: imagesError } = await supabase
        .from('product_images')
        .select('product_id, path')
        .in('product_id', productIds)
        .eq('is_primary', true);

      if (imagesError) {
        console.error('Error fetching product images:', imagesError);
      }

      // Manually join cart items with products and add image_url
      items = cartItems.map(cartItem => {
        const product = products.find(p => p.id === cartItem.product_id);
        let productWithImage = product ? { ...product } : null;
        if (productWithImage) {
          const primaryImage = images?.find(img => img.product_id === productWithImage.id);
          productWithImage.image_url = primaryImage?.path || null;
        }
        return {
          ...cartItem,
          products: productWithImage
        };
      });
    }

    // Filter out items with inactive or deleted products
    const validItems = items?.filter(item => 
      item.products && item.products.is_active
    ) || [];

    const totalCents = validItems.reduce((sum, item) => {
      const price = item.products.discount_percent > 0 
        ? Math.round(item.products.price_cents * (1 - item.products.discount_percent / 100))
        : item.products.price_cents;
      return sum + (item.quantity * price);
    }, 0);

    res.json({
      cart: { ...cart, total_cents: totalCents },
      items: validItems
    });

  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Updated addItem function with better validation
export async function addItem(req, res) {
  try {
    const { product_id, quantity = 1 } = req.body;
    
    if (!product_id || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid product ID and quantity required' });
    }

    if (!req.user) return res.status(401).json({ error: 'Login required' });
    
    const userId = req.user.id;
    const customer = await getCustomerByAuthId(userId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validate product first
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, price_cents, stock_quantity, is_active')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      console.error('Product validation error:', productError);
      return res.status(400).json({ error: 'Product not found' });
    }

    if (!product.is_active) {
      return res.status(400).json({ error: 'Product is no longer available' });
    }

    const cart = await getOrCreateActiveCart(customer.id);
    
    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)
      .single();

    if (existingItem) {
      // Debug logging for update errors
      console.log('DEBUG existingItem:', existingItem);
      console.log('DEBUG existingItem.id:', existingItem.id, 'type:', typeof existingItem.id);
      // Update existing item
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock_quantity < newQuantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          available: product.stock_quantity,
          current_in_cart: existingItem.quantity,
          trying_to_add: quantity,
          requested_total: newQuantity
        });
      }

      const { data: updatedItem, error } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          unit_price_cents: product.price_cents,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating cart item:', error);
        // Extra debug
        console.error('Update attempted for cart_item id:', existingItem.id);
        return res.status(500).json({ error: 'Failed to update cart item', debug: { existingItem, id: existingItem.id, error } });
      }

      res.json({ 
        success: true, 
        item: updatedItem,
        action: 'updated',
        message: 'Cart item quantity updated'
      });
    } else {
      // Add new item
      if (product.stock_quantity < quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          available: product.stock_quantity,
          requested: quantity
        });
      }

      const { data: newItem, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: product_id,
          quantity: quantity,
          unit_price_cents: product.price_cents,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding cart item:', error);
        return res.status(500).json({ error: 'Failed to add item to cart' });
      }

      res.json({ 
        success: true, 
        item: newItem,
        action: 'added',
        message: 'Item added to cart'
      });
    }

  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
// Update item quantity
export async function updateItemQty(req, res) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity required' });
    }

    if (!req.user) return res.status(401).json({ error: 'Login required' });

    if (quantity === 0) {
      // Remove item if quantity is 0
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return res.json({ message: 'Item removed from cart' });
    }

    // Get the cart item first
    const { data: cartItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .single();

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Validate product with new quantity
    const validation = await validateProduct(cartItem.product_id, quantity);
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    // Update quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ 
        quantity,
        unit_price_cents: validation.product.price_cents
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updatedItem);

  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Remove item from cart
export async function removeItem(req, res) {
  try {
    const { id } = req.params;
    
    if (!req.user) return res.status(401).json({ error: 'Login required' });

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Item removed from cart' });

  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


// Check cart status (returns if user has an active cart and item count)
export async function checkCartStatus(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    const userId = req.user.id;
    const customer = await getCustomerByAuthId(userId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    // Find active cart
    const { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .single();
    if (!cart) {
      return res.json({ hasActiveCart: false, itemCount: 0 });
    }
    // Count items
    const { count, error: countError } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('cart_id', cart.id);
    if (countError) {
      return res.status(500).json({ error: 'Failed to count cart items' });
    }
    res.json({ hasActiveCart: true, itemCount: count });
  } catch (error) {
    console.error('Error in checkCartStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Ensure user has an active cart (creates if missing, returns cart info)
export async function ensureActiveCart(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    const userId = req.user.id;
    const customer = await getCustomerByAuthId(userId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const cart = await getOrCreateActiveCart(customer.id);
    res.json({ cart });
  } catch (error) {
    console.error('Error in ensureActiveCart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update cart item quantity (replaces existing quantity)
export async function updateCartQuantity(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    const { product_id, quantity } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity required (minimum 1)' });
    }

    const userId = req.user.id;
    console.log(`Updating cart quantity for user ${userId}, product ${product_id}, quantity ${quantity}`);

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (customerError || !customer) {
      console.error('Customer fetch error:', customerError);
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get active cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .single();

    if (cartError || !cart) {
      console.error('Cart fetch error:', cartError);
      return res.status(404).json({ error: 'Active cart not found' });
    }

    // Check if cart item exists
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)
      .single();

    if (itemError || !cartItem) {
      console.error('Cart item fetch error:', itemError);
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    // Validate product and stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity, price_cents, is_active')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      console.error('Product fetch error:', productError);
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.is_active) {
      return res.status(400).json({ error: 'Product is no longer available' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        available: product.stock_quantity,
        requested: quantity
      });
    }

    // Update cart item with current product price (to handle price changes)
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ 
        quantity: quantity,
        unit_price_cents: product.price_cents, // Always use current price
        updated_at: new Date().toISOString()
      })
      .eq('id', cartItem.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Cart item update error:', updateError);
      return res.status(500).json({ error: 'Failed to update cart item' });
    }

    console.log('Cart item updated successfully:', {
      product_id,
      old_quantity: cartItem.quantity,
      new_quantity: quantity,
      price_cents: product.price_cents
    });
    
    res.json({ 
      success: true, 
      item: updatedItem,
      message: 'Quantity updated successfully'
    });

  } catch (error) {
    console.error('Update cart quantity error:', error);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
}

// Remove item from cart by product_id
export async function removeCartItemByProduct(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    const userId = req.user.id;
    console.log(`Removing cart item for user ${userId}, product ${product_id}`);

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get active cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .single();

    if (cartError || !cart) {
      return res.status(404).json({ error: 'Active cart not found' });
    }

    // Remove cart item
    const { data: deletedItem, error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)
      .select()
      .single();

    if (deleteError) {
      console.error('Remove cart item error:', deleteError);
      if (deleteError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Item not found in cart' });
      }
      return res.status(500).json({ error: 'Failed to remove item' });
    }

    console.log('Cart item removed successfully:', product_id);
    
    res.json({ 
      success: true,
      removed_item: deletedItem,
      message: 'Item removed successfully'
    });

  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
}

// Get detailed cart validation (enhanced version)
export async function validateCartForCheckout(req, res) {
  try {
    console.log('=== ENHANCED CART VALIDATION ===');
    console.log('User from JWT:', req.user?.id);
    
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    
    const userId = req.user.id;
    const customer = await getCustomerByAuthId(userId);
    
    if (!customer || !customer.id) {
      console.log('Customer lookup failed');
      return res.status(404).json({ error: 'Customer record not found' });
    }
    
    const cart = await getOrCreateActiveCart(customer.id);
    
    // Get cart items with product details
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products(
          id,
          title,
          price_cents,
          discount_percent,
          stock_quantity,
          is_active
        )
      `)
      .eq('cart_id', cart.id);
    
    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return res.status(500).json({ error: 'Failed to validate cart' });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        error: 'Cart is empty',
        valid: false,
        issues: [{ issue: 'Cart is empty' }]
      });
    }
    
    const issues = [];
    const validItems = [];
    let totalCents = 0;
    
    for (const item of items) {
      // Check if product exists and is active
      if (!item.products) {
        issues.push({
          item_id: item.id,
          product_id: item.product_id,
          issue: 'Product not found'
        });
        continue;
      }

      if (!item.products.is_active) {
        issues.push({
          item_id: item.id,
          product_id: item.product_id,
          issue: 'Product is no longer available'
        });
        continue;
      }
      
      // Check stock availability
      if (item.products.stock_quantity < item.quantity) {
        issues.push({
          item_id: item.id,
          product_id: item.product_id,
          issue: 'Insufficient stock',
          available: item.products.stock_quantity,
          requested: item.quantity
        });
        continue;
      }

      // Calculate item total with discount
      const discountPercent = item.products.discount_percent || 0;
      const discountedPrice = discountPercent > 0 
        ? Math.round(item.products.price_cents * (1 - discountPercent / 100))
        : item.products.price_cents;
      
      const itemTotal = discountedPrice * item.quantity;
      totalCents += itemTotal;

      // Add to valid items
      validItems.push({
        ...item,
        product: item.products,
        final_unit_price_cents: discountedPrice,
        item_total_cents: itemTotal
      });
    }
    
    if (issues.length > 0) {
      return res.status(400).json({
        error: 'Cart validation failed',
        valid: false,
        issues
      });
    }
    
    res.json({
      valid: true,
      issues: [],
      cart: { ...cart, total_cents: totalCents },
      items: validItems,
      summary: {
        item_count: validItems.length,
        total_quantity: validItems.reduce((sum, item) => sum + item.quantity, 0),
        total_cents: totalCents
      },
      message: 'Cart is valid for checkout'
    });
    
  } catch (error) {
    console.error('Enhanced cart validation error:', error);
    res.status(500).json({ 
      error: 'Cart validation failed',
      valid: false 
    });
  }
}

// Clear entire cart
export async function clearCart(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    const userId = req.user.id;
    const customer = await getCustomerByAuthId(userId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get active cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .single();

    if (cartError || !cart) {
      return res.json({ 
        success: true,
        message: 'No active cart to clear'
      });
    }

    // Remove all items from cart
    const { error: clearError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (clearError) {
      console.error('Clear cart error:', clearError);
      return res.status(500).json({ error: 'Failed to clear cart' });
    }

    console.log('Cart cleared successfully for user:', userId);
    
    res.json({ 
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}