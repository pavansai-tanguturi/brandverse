import { supabaseAdmin } from '../config/supabaseClient.js';
import Razorpay from 'razorpay';

// Initialize Razorpay only if keys are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized with environment keys');
} else {
  console.log('⚠️ Razorpay keys not found in environment - Razorpay payments disabled');
}

// Helper function to calculate discounted price
const calculateDiscountedPrice = (originalPriceCents, discountPercent) => {
  if (!discountPercent || discountPercent <= 0) return originalPriceCents;
  return Math.round(originalPriceCents * (1 - discountPercent / 100));
};

// Helper function to get products with images using proper foreign key relationship
async function getProductsWithImages(productIds) {
  try {
    // First try JOIN approach using proper foreign key relationship
    const { data: joinedProducts, error: joinError } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        title,
        price_cents,
        discount_percent,
        stock_quantity,
        product_images!product_images_product_id_fkey(
          path,
          is_primary
        )
      `)
      .in('id', productIds);

    if (!joinError && joinedProducts) {
      // Process joined data to get primary image
      const productsWithImages = joinedProducts.map(product => {
        const primaryImage = product.product_images?.find(img => img.is_primary === true);
        return {
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          discount_percent: product.discount_percent,
          stock_quantity: product.stock_quantity,
          image_url: primaryImage?.path || null
        };
      });

      console.log('Products fetched with JOIN approach');
      return { products: productsWithImages, error: null };
    }

    console.log('JOIN failed, using separate queries fallback');
    
    // Fallback: Get products and images separately
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, title, price_cents, discount_percent, stock_quantity')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return { products: [], error: productsError };
    }

    // Get primary images for these products
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('product_images')
      .select('product_id, path')
      .in('product_id', productIds)
      .eq('is_primary', true);

    if (imagesError) {
      console.error('Error fetching product images:', imagesError);
      // Don't fail if images can't be fetched, just continue without images
    }

    // Combine products with their primary images
    const productsWithImages = products.map(product => {
      const primaryImage = images?.find(img => img.product_id === product.id);
      return {
        ...product,
        image_url: primaryImage?.path || null
      };
    });

    return { products: productsWithImages, error: null };
  } catch (error) {
    console.error('Error in getProductsWithImages:', error);
    return { products: [], error };
  }
}

// Fix for cart validation endpoint
export async function validateCart(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }
    
    const userId = req.user.id;
    
    // Find customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('auth_user_id', userId)
      .single();
    
    if (customerError || !customer) {
      return res.status(404).json({ 
        error: 'Customer not found',
        isValid: false 
      });
    }
    
    // Find active cart
    const { data: carts, error: cartsError } = await supabaseAdmin
      .from('carts')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .limit(1);
      
    if (cartsError) {
      return res.status(500).json({ 
        error: 'Failed to fetch cart',
        isValid: false 
      });
    }
    
    const cart = carts?.[0];
    
    if (!cart) {
      return res.json({
        isValid: false,
        hasActiveCart: false,
        message: 'No active cart found'
      });
    }
    
    // Get cart items
    const { data: cartItems, error: itemsError } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);
      
    if (itemsError) {
      return res.status(500).json({ 
        error: 'Failed to fetch cart items',
        isValid: false 
      });
    }

    const isEmpty = !cartItems || cartItems.length === 0;
    
    res.json({
      isValid: !isEmpty,
      hasActiveCart: true,
      isEmpty: isEmpty,
      itemCount: cartItems?.length || 0,
      cart: cart
    });
    
  } catch (error) {
    console.error('Cart validation failed:', error);
    res.status(500).json({ 
      error: 'Cart validation failed',
      isValid: false 
    });
  }
}

// Keep your existing functions for listMyOrders, listAllOrders, etc...
export async function listMyOrders(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.user.id;
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

// Confirm Razorpay payment and update order
export async function confirmPayment(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Fetch order from DB
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();
    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify payment signature
    const crypto = await import('crypto');
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select('*')
      .single();
    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Optionally reduce stock here if not already done

    res.json({ success: true, order: updatedOrder, message: 'Payment confirmed and order updated' });
  } catch (error) {
    console.error('💥 Payment confirmation failed:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
}

export async function confirmCODOrder(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    const orderId = req.params.orderId;
    
    console.log('🚀 COD confirmation started for order:', orderId);
    
    // Get order details
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
      
    if (fetchError || !order) {
      console.error('❌ Order not found:', fetchError);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify order belongs to current user
    const userId = req.user.id;
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('auth_user_id', userId)
      .single();
      
    if (!customer || order.customer_id !== customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Only allow COD confirmation for COD orders
    if (order.payment_method !== 'cod') {
      return res.status(400).json({ error: 'Invalid payment method for COD confirmation' });
    }
    
    // Check if already confirmed
    if (order.status === 'confirmed' && order.payment_status === 'cod_pending') {
      return res.json({ 
        success: true,
        order: order,
        message: 'Order already confirmed' 
      });
    }
    
    // Update order status for COD
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        payment_status: 'cod_pending',
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('*')
      .single();
      
    if (updateError) {
      console.error('❌ Order update failed:', updateError);
      return res.status(400).json({ error: updateError.message });
    }
    
    console.log('✅ Order status updated to confirmed');
    
    res.json({ 
      success: true,
      order: updatedOrder,
      message: 'COD order confirmed successfully' 
    });
    
  } catch (error) {
    console.error('💥 COD confirmation failed:', error);
    res.status(500).json({ error: 'COD confirmation failed' });
  }
}

// Restore stock for all products in an order (admin only)
export async function restoreStockForOrder(req, res) {
  try {
    const orderId = req.params.orderId;
    // Fetch order and items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();
    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const items = order.order_items || [];
    let restored = [];
    for (const item of items) {
      // Increment product stock
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({
          stock_quantity: item.products?.stock_quantity + item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);
      if (!updateError) restored.push(item.product_id);
    }
    res.json({ success: true, restored });
  } catch (error) {
    console.error('💥 restoreStockForOrder failed:', error);
    res.status(500).json({ error: 'Failed to restore stock for order' });
  }
}
// List all orders (admin only)
export async function listAllOrders(req, res) {
  try {
    const search = req.query.search?.toLowerCase();
    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*), customers(full_name, email, phone)')
      .order('created_at', { ascending: false });

    let { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    // If search param is present, filter in JS (Supabase doesn't support ilike on joined fields)
    if (search) {
      data = (data || []).filter(order => {
        // Order ID
        if (order.id && order.id.toLowerCase().includes(search)) return true;
        // Customer name/email/phone (handle missing customers object)
        const customer = order.customers || {};
        if (
          (customer.full_name && customer.full_name.toLowerCase().includes(search)) ||
          (customer.email && customer.email.toLowerCase().includes(search)) ||
          (customer.phone && customer.phone.toLowerCase().includes(search))
        ) return true;
        return false;
      });
    }
    res.json(data);
  } catch (error) {
    console.error('💥 listAllOrders failed:', error);
    res.status(500).json({ error: 'Failed to fetch all orders' });
  }
}
// Razorpay Webhook Handler
export async function handleWebhook(req, res) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    if (!webhookSecret || !signature) {
      return res.status(400).json({ error: 'Missing webhook secret or signature' });
    }

    // Verify signature
    const crypto = await import('crypto');
    const expectedSignature = crypto.createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Example: handle payment.captured event
    if (event === 'payment.captured' && payload && payload.payment && payload.payment.entity) {
      const payment = payload.payment.entity;
      const razorpay_order_id = payment.order_id;
      const razorpay_payment_id = payment.id;

      // Find order by razorpay_order_id
      const { data: order, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id)
        .single();
      if (!order || fetchError) {
        return res.status(404).json({ error: 'Order not found for webhook' });
      }

      // Update order status to paid/confirmed
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          razorpay_payment_id,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', order.id);
    }

    // You can handle other events as needed

    res.json({ success: true });
  } catch (error) {
    console.error('💥 Webhook handling failed:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
}

// Update order status (admin only)
export async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { status, payment_status } = req.body;
    if (!status && !payment_status) {
      return res.status(400).json({ error: 'No status or payment_status provided' });
    }
    const updateData = {};
    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;
    updateData.updated_at = new Date().toISOString();
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single();
    if (error || !updatedOrder) {
      return res.status(400).json({ error: error?.message || 'Order not found or update failed' });
    }
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('💥 updateOrderStatus failed:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

// 1. DEBUGGING FUNCTIONS - Add these to your checkout page for troubleshooting

// Add this function to your CheckoutPage.js to debug cart status
const debugCartStatus = async () => {
  try {
    console.log('🔍 Starting cart debug...');
    
    // Check if user is authenticated
    const token = localStorage.getItem('supabase.auth.token') || sessionStorage.getItem('supabase.auth.token');
    console.log('🔐 Auth token exists:', !!token);
    
    // Call the cart validation endpoint
    const response = await fetch('/api/orders/validate-cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const result = await response.json();
    console.log('🛒 Cart validation result:', result);
    
    // Also check cart items directly
    const cartResponse = await fetch('/api/cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const cartData = await cartResponse.json();
    console.log('📦 Direct cart data:', cartData);
    
  } catch (error) {
    console.error('❌ Cart debug failed:', error);
  }
};

// 2. IMPROVED ORDER CREATION FUNCTION
const createCODOrderImproved = async () => {
  try {
    console.log('🚀 Starting improved COD order creation...');
    setIsCreatingOrder(true);
    
    // First, validate cart before attempting order creation
    await debugCartStatus();
    
    // Validate required fields
    if (!selectedAddress) {
      setError('Please select a shipping address');
      return;
    }

    // Prepare order data
    const orderData = {
      payment_method: 'cod',
      create_razorpay_order: false,
      shipping_address: selectedAddress,
      shipping_cents: calculateShipping(),
      tax_cents: calculateTax(),
      discount_cents: 0, // Adjust based on your discount logic
    };

    console.log('📋 Order data being sent:', orderData);

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
      },
      body: JSON.stringify(orderData),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Order creation failed:', errorData);
      
      // Handle specific error cases
      if (errorData.code === 'NO_ACTIVE_CART') {
        setError('Your cart is empty or expired. Please add items to your cart.');
        // Optionally redirect to products page
        // navigate('/products');
        return;
      } else if (errorData.code === 'EMPTY_CART') {
        setError('Your cart is empty. Please add items before placing an order.');
        return;
      } else if (errorData.code === 'DELIVERY_UNAVAILABLE') {
        setError(errorData.message || 'Delivery not available to your location.');
        return;
      }
      
      throw new Error(errorData.error || 'Order creation failed');
    }

    const order = await response.json();
    console.log('✅ Order created successfully:', order);

    // Handle successful order creation
    setOrderCreated(true);
    setCreatedOrder(order);
    
    // Optional: Clear cart from local state or trigger refresh
    // clearCart();
    
  } catch (error) {
    console.error('💥 COD Order creation error:', error);
    setError(error.message || 'Failed to create order');
  } finally {
    setIsCreatingOrder(false);
  }
};

// 3. CART INITIALIZATION FUNCTION - Add this to ensure cart exists
const ensureCartExists = async () => {
  try {
    const token = localStorage.getItem('supabase.auth.token');
    if (!token) {
      console.log('❌ No auth token found');
      return false;
    }

    // Try to get or create cart
    const response = await fetch('/api/cart/ensure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cart ensured:', result);
      return true;
    } else {
      console.error('❌ Failed to ensure cart exists');
      return false;
    }
  } catch (error) {
    console.error('❌ Cart initialization error:', error);
    return false;
  }
};

export async function createOrder(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    const userId = req.user.id;
    
    console.log('🚀 Order creation started for user:', userId);
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      shipping_cents = 0, 
      tax_cents = 0, 
      discount_cents = 0,
      payment_method = null,
      create_razorpay_order = false,
      shipping_address = null
    } = req.body || {};

    // Find or create customer with better error handling
    let { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('auth_user_id', userId)
      .single();
    
    if (customerError) {
      console.error('❌ Customer fetch error:', customerError);
      
      if (customerError.code === 'PGRST116') {
        // Customer not found - create one
        console.log('📝 Creating new customer for user:', userId);
        const { data: newCustomer, error: createError } = await supabaseAdmin
          .from('customers')
          .insert({ auth_user_id: userId })
          .select('id')
          .single();
          
        if (createError) {
          console.error('❌ Customer creation failed:', createError);
          return res.status(500).json({ error: 'Failed to create customer record' });
        }
        
        customer = newCustomer;
        console.log('✅ New customer created:', customer.id);
      } else {
        return res.status(500).json({ error: 'Database error while fetching customer' });
      }
    }
    
    if (!customer || !customer.id) {
      console.error('❌ Customer still not available after creation attempt');
      return res.status(500).json({ error: 'Customer record unavailable' });
    }
    
    console.log('✅ Customer confirmed:', customer.id);

    // Find active cart with better debugging
    let { data: carts, error: cartsError } = await supabaseAdmin
      .from('carts')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('status', 'active');
      
    if (cartsError) {
      console.error('❌ Carts fetch error:', cartsError);
      return res.status(500).json({ error: 'Database error while fetching cart' });
    }
    
    console.log('🛒 Found active carts:', carts);
    
    // Also check for ANY carts (not just active) for debugging
    const { data: allCarts } = await supabaseAdmin
      .from('carts')
      .select('*')
      .eq('customer_id', customer.id);
    console.log('🛒 All carts for customer:', allCarts);
    
    let cart = carts?.[0];
    if (!cart) {
      console.error('❌ No active cart found for customer_id:', customer.id);
      console.log('🔍 Available carts:', allCarts);
      
      // Try to reactivate the most recent cart if it exists
      if (allCarts && allCarts.length > 0) {
        const mostRecentCart = allCarts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        console.log('🔄 Attempting to reactivate most recent cart:', mostRecentCart.id);
        
        // Check if this cart has items
        const { data: cartItems } = await supabaseAdmin
          .from('cart_items')
          .select('*')
          .eq('cart_id', mostRecentCart.id);
        
        if (cartItems && cartItems.length > 0) {
          // Reactivate the cart
          const { data: reactivatedCart, error: reactivateError } = await supabaseAdmin
            .from('carts')
            .update({ status: 'active' })
            .eq('id', mostRecentCart.id)
            .select('*')
            .single();
            
          if (!reactivateError) {
            cart = reactivatedCart;
            console.log('✅ Cart reactivated successfully:', cart.id);
          } else {
            console.error('❌ Failed to reactivate cart:', reactivateError);
          }
        }
      }
      
      // If still no cart, create a new one
      if (!cart) {
        console.log('📝 Creating new cart for customer:', customer.id);
        const { data: newCart, error: cartCreateError } = await supabaseAdmin
          .from('carts')
          .insert({ 
            customer_id: customer.id,
            status: 'active'
          })
          .select('*')
          .single();
          
        if (cartCreateError) {
          console.error('❌ Failed to create new cart:', cartCreateError);
          return res.status(400).json({ 
            error: 'Unable to create cart. Please try adding items to your cart first.',
            code: 'CART_CREATION_FAILED'
          });
        }
        
        cart = newCart;
        console.log('✅ New cart created:', cart.id);
        
        // Since this is a new empty cart, return an error asking user to add items
        return res.status(400).json({ 
          error: 'Your cart is empty. Please add items to your cart before placing an order.',
          code: 'EMPTY_CART',
          redirect: '/products'
        });
      }
    }
    
    console.log('✅ Active cart confirmed:', cart.id);

    // Fetch cart items
    const { data: cartItems, error: itemsError } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);
      
    if (itemsError) {
      console.error('❌ Cart items fetch error:', itemsError);
      return res.status(500).json({ error: 'Database error while fetching cart items' });
    }
    
    console.log('📦 Cart items found:', cartItems?.length || 0);
    
    if (!cartItems || cartItems.length === 0) {
      console.error('❌ Cart is empty for cart_id:', cart.id);
      return res.status(400).json({ 
        error: 'Cart is empty. Please add items to your cart before placing an order.',
        code: 'EMPTY_CART',
        redirect: '/products'
      });
    }

    // Continue with the rest of your existing order creation logic...
    // Fetch products with discount information
    const productIds = [...new Set(cartItems.map(item => item.product_id))];
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, title, price_cents, discount_percent, stock_quantity')
      .in('id', productIds);

    if (productsError) {
      console.error('❌ Products fetch error:', productsError);
      return res.status(500).json({ error: 'Database error while fetching products' });
    }

    // Create lookup map for products
    const productsById = {};
    (products || []).forEach(product => {
      productsById[product.id] = product;
    });

    // Combine cart items with product data and calculate discounted prices
    const items = cartItems.map(cartItem => {
      const product = productsById[cartItem.product_id];
      if (!product) {
        console.error(`[ORDER ERROR] Product not found for cart item:`, cartItem);
        return { ...cartItem, products: null };
      }

      // Defensive: Ensure quantity is a valid number
      const quantity = Number(cartItem.quantity) || 1;
      const originalPrice = product.price_cents;
      const discountPercent = product.discount_percent || 0;
      const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercent);

      console.log(`[ORDER DEBUG] Product: ${product.title} | ProductID: ${product.id} | Original: ${originalPrice} | Discount %: ${discountPercent} | Discounted: ${discountedPrice} | Qty: ${quantity}`);

      return {
        ...cartItem,
        quantity, // ensure numeric
        products: product,
        // Store both original and discounted prices for order history
        original_unit_price_cents: originalPrice,
        final_unit_price_cents: discountedPrice, // This is what we'll charge
        discount_percent: discountPercent,
        discount_amount_cents: originalPrice - discountedPrice
      };
    });

    // Validate stock and calculate totals using DISCOUNTED prices
    let subtotal = 0;
    let totalDiscount = 0;
    for (const it of items) {
      if (!it.products) {
        console.error('❌ Product not found for cart item:', it);
        return res.status(400).json({ error: `Product not found for item in cart`, item: it });
      }
      
      if (it.products.stock_quantity < it.quantity) {
        console.error('❌ Insufficient stock:', it.products.title, 'Available:', it.products.stock_quantity, 'Required:', it.quantity, 'CartItem:', it);
        return res.status(400).json({ 
          error: `Insufficient stock for ${it.products.title}`,
          available: it.products.stock_quantity,
          required: it.quantity,
          item: it
        });
      }

      // Use discounted price for subtotal calculation
  const itemTotal = it.final_unit_price_cents * it.quantity;
  subtotal += itemTotal;
  totalDiscount += it.discount_amount_cents * it.quantity;
  // Extra debug
  console.log(`[ORDER ITEM] Title: ${it.products.title}, Qty: ${it.quantity}, Price: ${it.final_unit_price_cents}, Total: ${itemTotal}`);
    }
    
    const total = subtotal + tax_cents + shipping_cents - discount_cents;
    console.log('💰 Order totals - Subtotal (after discounts):', subtotal, 'Total Discount:', totalDiscount, 'Final Total:', total);

    // Create Razorpay order if requested
    let razorpayOrder = null;
    if (create_razorpay_order && payment_method === 'razorpay') {
      if (!razorpay) {
        console.error('❌ Razorpay not configured - missing API keys');
        return res.status(400).json({ 
          error: 'Payment gateway not configured',
          code: 'PAYMENT_GATEWAY_UNAVAILABLE'
        });
      }
      
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: total,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          payment_capture: 1
        });
        console.log('✅ Razorpay order created:', razorpayOrder.id);
      } catch (razorpayError) {
        console.error('❌ Razorpay order creation failed:', razorpayError);
        return res.status(400).json({ 
          error: 'Payment gateway error',
          code: 'RAZORPAY_ERROR'
        });
      }
    }

    // Prepare order data
    const orderData = {
      customer_id: customer.id,
      status: payment_method === 'cod' ? 'confirmed' : 'pending',
      subtotal_cents: subtotal, // This is now the discounted subtotal
      tax_cents,
      shipping_cents,
      discount_cents: discount_cents + totalDiscount, // Include both cart discount and product discounts
      total_cents: total,
    };

    // Add Razorpay order ID if created
    if (razorpayOrder) {
      orderData.razorpay_order_id = razorpayOrder.id;
    }

    // Add address information and delivery check (keeping your existing logic)
    if (shipping_address) {
      console.log('📍 Received shipping address:', JSON.stringify(shipping_address, null, 2));
      
      try {
        const city = shipping_address.city;
        const region = shipping_address.state;
        const country = shipping_address.country || 'India';
        
        console.log(`🔍 Checking if delivery is available to: ${city}, ${region}, ${country}`);
        
        let isDeliveryAvailable = false;

        // Your existing delivery check logic here...
        const normalizeForMatching = (str) => {
          if (!str) return null;
          return str.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
        };

        // Check exact location match
        if (city && region) {
          const { data: allCityMatches } = await supabaseAdmin
            .from('delivery_locations')
            .select('*')
            .eq('is_active', true)
            .not('city', 'is', null)
            .not('region', 'is', null);

          if (allCityMatches && allCityMatches.length > 0) {
            const normalizedInputCity = normalizeForMatching(city);
            const normalizedInputRegion = normalizeForMatching(region);
            const normalizedInputCountry = normalizeForMatching(country);

            const exactMatch = allCityMatches.find(location => {
              const normalizedDbCity = normalizeForMatching(location.city);
              const normalizedDbRegion = normalizeForMatching(location.region);
              const normalizedDbCountry = normalizeForMatching(location.country);

              return normalizedDbCity === normalizedInputCity &&
                     normalizedDbRegion === normalizedInputRegion &&
                     normalizedDbCountry === normalizedInputCountry;
            });

            if (exactMatch) {
              isDeliveryAvailable = true;
              console.log(`✅ Exact location match found`);
            }
          }
        }

        // Region-wide and country-wide checks...
        if (!isDeliveryAvailable && region) {
          const { data: allRegionMatches } = await supabaseAdmin
            .from('delivery_locations')
            .select('*')
            .eq('is_active', true)
            .is('city', null)
            .not('region', 'is', null);

          if (allRegionMatches && allRegionMatches.length > 0) {
            const normalizedInputRegion = normalizeForMatching(region);
            const normalizedInputCountry = normalizeForMatching(country);

            const regionMatch = allRegionMatches.find(location => {
              const normalizedDbRegion = normalizeForMatching(location.region);
              const normalizedDbCountry = normalizeForMatching(location.country);
              return normalizedDbRegion === normalizedInputRegion &&
                     normalizedDbCountry === normalizedInputCountry;
            });

            if (regionMatch) {
              isDeliveryAvailable = true;
              console.log(`✅ Region-wide delivery found`);
            }
          }
        }

        if (!isDeliveryAvailable) {
          const { data: countryMatches } = await supabaseAdmin
            .from('delivery_locations')
            .select('*')
            .eq('is_active', true)
            .is('region', null)
            .is('city', null);

          if (countryMatches && countryMatches.length > 0) {
            const normalizedInputCountry = normalizeForMatching(country);
            const countryMatch = countryMatches.find(location => {
              const normalizedDbCountry = normalizeForMatching(location.country);
              return normalizedDbCountry === normalizedInputCountry;
            });

            if (countryMatch) {
              isDeliveryAvailable = true;
              console.log(`✅ Country-wide delivery found`);
            }
          }
        }

        if (!isDeliveryAvailable) {
          const locationName = [city, region, country].filter(Boolean).join(', ');
          console.log(`❌ BLOCKING ORDER: Delivery not available to ${locationName}`);
          
          return res.status(400).json({ 
            error: 'Delivery not available',
            message: `Sorry, we don't currently deliver to ${locationName}.`,
            code: 'DELIVERY_UNAVAILABLE'
          });
        }

        console.log(`✅ Delivery confirmed available`);
        
      } catch (deliveryCheckError) {
        console.error('❌ Error checking delivery availability:', deliveryCheckError);
        return res.status(500).json({ 
          error: 'Delivery verification failed',
          code: 'DELIVERY_CHECK_ERROR'
        });
      }

      orderData.shipping_address = shipping_address;
      if (!shipping_address.type || shipping_address.type === 'both' || shipping_address.type === 'billing') {
        orderData.billing_address = shipping_address;
      }
    }

    // Add payment information
    if (payment_method) {
      orderData.payment_method = payment_method;
      orderData.payment_status = payment_method === 'cod' ? 'cod_pending' : 'pending';
    }

    console.log('💾 Creating order with data:', JSON.stringify(orderData, null, 2));

    // Create the order
    let { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select('*')
      .single();
    
    if (oErr) {
      console.error('❌ Order creation error:', oErr);
      if (oErr.message.includes('column') && oErr.message.includes('does not exist')) {
        console.log('🔄 Retrying order creation without address/payment columns...');
        const basicOrderData = {
          customer_id: customer.id,
          status: payment_method === 'cod' ? 'confirmed' : 'pending',
          subtotal_cents: subtotal,
          tax_cents,
          shipping_cents,
          discount_cents: discount_cents + totalDiscount,
          total_cents: total,
        };
        
        if (razorpayOrder) {
          basicOrderData.razorpay_order_id = razorpayOrder.id;
        }
        
        const { data: basicOrder, error: basicErr } = await supabaseAdmin
          .from('orders')
          .insert(basicOrderData)
          .select('*')
          .single();
          
        if (basicErr) {
          console.error('❌ Basic order creation also failed:', basicErr);
          return res.status(400).json({ error: basicErr.message });
        }
        
        order = basicOrder;
      } else {
        return res.status(400).json({ error: oErr.message });
      }
    }

    console.log('✅ Order created successfully:', order.id);

    // Create order items with PRESERVED DISCOUNT INFORMATION
    for (const it of items) {
      // Extra logging for price/discount debug
      console.log('[ORDER ITEM DEBUG]', {
        product_id: it.product_id,
        title: it.products && it.products.title,
        original_price: it.original_unit_price_cents,
        discount_percent: it.discount_percent,
        discounted_price: it.final_unit_price_cents,
        quantity: it.quantity
      });

      const orderItemData = {
        order_id: order.id,
        product_id: it.product_id,
        title: it.products && it.products.title ? it.products.title : '[UNKNOWN PRODUCT]',
        quantity: it.quantity,
        unit_price_cents: it.final_unit_price_cents, // Store the discounted price
        total_cents: it.final_unit_price_cents * it.quantity, // Total with discount applied
      };

      if (!orderItemData.title || orderItemData.title === '[UNKNOWN PRODUCT]') {
        console.error('[ORDER ITEM ERROR] Title missing for order item:', orderItemData, 'Cart/Product:', it);
      }

      const { error: itemError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemData);
      
      if (itemError) {
        console.error('❌ Failed to create order item:', itemError, 'OrderItemData:', orderItemData);
      }
    }

    console.log('✅ Order items created successfully');

    // Stock management for COD orders (keeping your existing logic)
    let stockReduced = false;
    const reducedItems = [];
    
    if (payment_method === 'cod') {
      try {
        console.log('📦 Reducing stock for COD order...');
        
        for (const it of items) {
          const { error: stockError } = await supabaseAdmin
            .from('products')
            .update({ 
              stock_quantity: it.products.stock_quantity - it.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', it.product_id);
          
          if (stockError) {
            console.error('❌ Failed to reduce stock for product:', it.product_id, stockError);
            
            for (const reducedItem of reducedItems) {
              await supabaseAdmin
                .from('products')
                .update({ 
                  stock_quantity: reducedItem.original_quantity,
                  updated_at: new Date().toISOString()
                })
                .eq('id', reducedItem.product_id);
            }
            
            await supabaseAdmin
              .from('orders')
              .update({ status: 'cancelled' })
              .eq('id', order.id);
            
            return res.status(500).json({ 
              error: 'Stock update failed',
              code: 'STOCK_UPDATE_FAILED'
            });
          }
          
          reducedItems.push({
            product_id: it.product_id,
            original_quantity: it.products.stock_quantity,
            reduced_quantity: it.quantity
          });
        }
        
        stockReduced = true;
        console.log('✅ Stock reduced successfully for all items');
        
      } catch (stockError) {
        console.error('❌ Stock reduction failed:', stockError);
        
        for (const reducedItem of reducedItems) {
          await supabaseAdmin
            .from('products')
            .update({ 
              stock_quantity: reducedItem.original_quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', reducedItem.product_id);
        }
        
        await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', order.id);
        
        return res.status(500).json({ 
          error: 'Order processing failed',
          code: 'ORDER_PROCESSING_FAILED'
        });
      }
    }

    // Convert cart to inactive for successful orders
    if (payment_method === 'cod' && stockReduced) {
      const { error: cartUpdateError } = await supabaseAdmin
        .from('carts')
        .update({ status: 'converted' })
        .eq('id', cart.id);
      
      if (cartUpdateError) {
        console.error('⚠️ Failed to convert cart status:', cartUpdateError);
      } else {
        console.log('✅ Cart converted to inactive status');
      }
    }

    console.log('🎉 Order creation completed successfully');

    res.status(201).json({
      ...order,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID || null,
      razorpay_order_id: razorpayOrder?.id || null
    });

  } catch (e) { 
    console.error('💥 Order creation failed with exception:', e);
    res.status(500).json({ error: e.message }); 
  }
}