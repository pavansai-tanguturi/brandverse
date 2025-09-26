
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

// Utility function for authenticated API calls
const makeAuthenticatedRequest = async (url, options = {}) => {
  // Get token from localStorage or cookie for authentication
  let token = localStorage.getItem('auth_token');
  if (!token && typeof document !== 'undefined') {
    const match = document.cookie.match(/auth_token=([^;]+)/);
    if (match) token = match[1];
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });
};

// --- CART VALIDATION & FORCE REFRESH HELPERS ---
const validateCartBeforeOrder = async () => {
  try {
    console.log('🔍 Validating cart before order...');
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
    
    const response = await makeAuthenticatedRequest(`${API_BASE}/api/cart/validate`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const serverCart = await response.json();
      console.log('🛒 Server cart items:', serverCart.items);
      serverCart.items?.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          product_id: item.product_id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price_cents / 100,
          total: item.total_cents ? item.total_cents / 100 : (item.unit_price_cents * item.quantity) / 100
        });
      });
      return serverCart;
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Failed to fetch server cart:', response.status, errorData);
      
      // If cart is empty on server but we have items on client, try to sync
      if (response.status === 400 && errorData.error === 'Cart is empty') {
        console.warn('⚠️ Server cart is empty but client has items. Cart sync required.');
        return { isEmpty: true, needsSync: true, error: errorData };
      }
      
      return { error: errorData, status: response.status };
    }
  } catch (error) {
    console.error('❌ Cart validation error:', error);
    return { error: error.message };
  }
};

// SIMPLIFIED: Skip cart sync during checkout to prevent clearing items
const forceCartRefresh = async (items) => {
  try {
    console.log('🔄 [CHECKOUT] Skipping cart refresh to preserve items during checkout');
    console.log('� [CHECKOUT] Current cart items:', items.length);
    console.log('� [CHECKOUT] Items:', items.map(item => ({ id: item.id, title: item.title, quantity: item.quantity })));
    
    // Don't sync or refresh - just preserve current items for checkout
    return;
  } catch (error) {
    console.error('❌ [CHECKOUT] Cart refresh failed:', error);
  }
};

const CheckoutPage = () => {
  // Helper function to check stock before checkout
  const checkCartStock = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await makeAuthenticatedRequest(`${API_BASE}/api/cart/validate`, {
        method: 'POST',
        body: JSON.stringify({ cart_items: items })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Insufficient stock')) {
          return {
            valid: false,
            error: errorData.error,
            item: errorData.item,
            available: errorData.available,
            required: errorData.required
          };
        }
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Stock check failed:', error);
      return { valid: true }; // Allow checkout if stock check fails
    }
  };

  // Helper function to verify product stock directly
  const verifyProductStock = async (productId) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await makeAuthenticatedRequest(`${API_BASE}/api/products/${productId}`);
      
      if (response.ok) {
        const product = await response.json();
        console.log(`🔍 [STOCK CHECK] Product ${productId}:`, {
          title: product.title,
          stock_quantity: product.stock_quantity,
          is_available: product.is_available,
          price_cents: product.price_cents
        });
        return product;
      }
    } catch (error) {
      console.error(`Failed to fetch product ${productId}:`, error);
      return null;
    }
  };

  // Function to remove out-of-stock item and retry checkout
  const handleRemoveOutOfStockItem = async () => {
    if (!outOfStockItem?.item?.id) return;
    
    try {
      setLoading(true);
      console.log(`🗑️ [CHECKOUT] Removing out-of-stock item: ${outOfStockItem.item.id}`);
      await removeFromCart(outOfStockItem.item.id);
      
      // Clear error states
      setError('');
      setOutOfStockItem(null);
      
      // Show success message
      setError(`"${outOfStockItem.name}" has been removed from your cart. You can now proceed with checkout.`);
      
      setTimeout(() => setError(''), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Failed to remove out-of-stock item:', error);
      setError('Failed to remove item from cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to ensure all cart items are synced to server
  const ensureServerCartSync = async () => {
    try {
      console.log('🔄 [CHECKOUT] Ensuring server cart is synced with local cart...');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      // Clear existing server cart first
      try {
        await makeAuthenticatedRequest(`${API_BASE}/api/cart/clear`, {
          method: 'POST'
        });
        console.log('🗑️ [CHECKOUT] Server cart cleared');
      } catch (clearError) {
        console.warn('⚠️ [CHECKOUT] Failed to clear server cart:', clearError);
      }
      
      // Add all current items to server cart
      for (const item of items) {
        console.log(`➕ [CHECKOUT] Adding item to server cart: ${item.title} (qty: ${item.quantity})`);
        
        const addResponse = await makeAuthenticatedRequest(`${API_BASE}/api/cart/add`, {
          method: 'POST',
          body: JSON.stringify({
            product_id: item.id,
            quantity: item.quantity
          })
        });
        
        if (!addResponse.ok) {
          const errorData = await addResponse.json();
          console.error(`❌ [CHECKOUT] Failed to add ${item.title} to server cart:`, errorData);
          throw new Error(`Failed to sync ${item.title} to server cart`);
        }
      }
      
      console.log('✅ [CHECKOUT] All items synced to server cart');
      return true;
      
    } catch (syncError) {
      console.error('❌ [CHECKOUT] Server cart sync failed:', syncError);
      return false;
    }
  };

  // COD order with validation (moved inside component for access to state)
  const createCODOrderWithValidation = async () => {
    try {
      console.log('🚀 [CHECKOUT] Starting COD order with validation...');
      console.log('🚀 [CHECKOUT] Initial state - User:', user?.email, 'Guest Mode:', isGuestMode, 'Items in cart:', items.length);
      setLoading(true);
      setError('');
      await forceCartRefresh(items);
      console.log('🔍 [CHECKOUT] Skipping server cart validation, using client cart directly');
      
      // Verify stock for all cart items
      console.log('🔍 [CHECKOUT] Verifying stock for all cart items...');
      for (const item of items) {
        await verifyProductStock(item.id);
      }
      
      // CRITICAL: Ensure server cart is properly synced
      console.log('🔄 [CHECKOUT] Ensuring server cart sync before order creation...');
      const syncSuccess = await ensureServerCartSync();
      if (!syncSuccess) {
        setError('Failed to sync cart with server. Please try again.');
        setLoading(false);
        return;
      }
      
      // Use client-side cart validation instead of server validation
      const validation = validateCart();
      if (!validation.valid) {
        setError('Cart contains invalid items. Please review your cart.');
        setLoading(false);
        return;
      }
      
      console.log('✅ [CHECKOUT] Client cart validation passed, proceeding with order creation');
      if (!selectedAddress) {
        setError('Please select a shipping address');
        setLoading(false);
        return;
      }
      
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      // Prepare cart items for order creation
      const cartItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price_cents: item.discount_percent > 0 
          ? Math.round(item.price_cents * (1 - item.discount_percent / 100))
          : item.price_cents
      }));
      
      console.log('📋 [CHECKOUT] Preparing order with cart items:', cartItems);
      
      const orderData = {
        payment_method: 'cod',
        create_razorpay_order: false,
        shipping_address: selectedAddress,
        shipping_cents: 0, // Add your shipping calculation if needed
        tax_cents: 0, // Add your tax calculation if needed
        discount_cents: 0,
        // Note: Not sending cart_items as backend will use synced server cart
      };
      console.log('📋 Creating order with validated cart...');
      console.log('🔍 [CHECKOUT] Full order data being sent:', JSON.stringify(orderData, null, 2));
      console.log('🔍 [CHECKOUT] Request headers being sent:', {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('auth_token') ? 'Bearer [TOKEN_PRESENT]' : 'No token'
      });
      
      const response = await makeAuthenticatedRequest(`${API_BASE}/api/orders`, {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      console.log('📡 Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Order creation failed:', errorData);
        if (errorData.code === 'NO_ACTIVE_CART' || errorData.code === 'EMPTY_CART') {
          setError('Your cart is empty or expired. Please add items to your cart and try again.');
          setLoading(false);
          return;
        }
        
        // Handle insufficient stock errors
        if (errorData.error && errorData.error.includes('Insufficient stock')) {
          const productName = errorData.item?.title || errorData.error.split('for ')[1] || 'a product';
          const available = errorData.available || 0;
          const required = errorData.required || 0;
          
          // Store out-of-stock item info for potential removal
          setOutOfStockItem({
            name: productName,
            available,
            required,
            item: errorData.item
          });
          
          setError(`Sorry, "${productName}" is out of stock or has insufficient quantity. Available: ${available}, Required: ${required}. Please update your cart and try again.`);
          setLoading(false);
          return;
        }
        
        throw new Error(errorData.error || 'Order creation failed');
      }
      const order = await response.json();
      console.log('✅ COD Order created successfully:', order);
      if (order.order_items) {
        console.log('📦 Order items created:');
        order.order_items.forEach((item, index) => {
          console.log(`Order Item ${index + 1}:`, {
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price_cents / 100,
            total: item.total_cents / 100
          });
        });
      }
      navigate('/order-success', {
        state: {
          order: order,
          message: 'Order placed successfully! You can pay cash on delivery.'
        }
      });
      setTimeout(() => clearCart(), 100);
    } catch (error) {
      console.error('💥 COD Order creation error:', error);
      setError(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };
  const { user } = useAuth();
  const { items, getCartTotal, getCartSubtotal, getTotalDiscount, clearCart, forceSync, isGuestMode, initializeAuthenticatedCart, removeFromCart, addToCart } = useCart();
  const navigate = useNavigate();

  // SIMPLIFIED: Use the cart context's discount calculation
  const getItemDiscountedPrice = (item) => {
    if (item.discount_percent && item.discount_percent > 0) {
      return Math.round(item.price_cents * (1 - item.discount_percent / 100));
    }
    return item.price_cents;
  };

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [outOfStockItem, setOutOfStockItem] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [newAddress, setNewAddress] = useState({
    full_name: user?.full_name || user?.name || '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    landmark: '',
    type: 'both',
    is_default: true
  });

  const fetchAddresses = useCallback(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await makeAuthenticatedRequest(`${API_BASE}/api/addresses`);
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        const defaultAddr = data.find(addr => addr.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        console.error('Failed to fetch addresses:', response.status);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  }, [navigate]);

  // SIMPLIFIED: Skip complex cart validation, just check if cart has items
  const validateCart = () => {
    if (items.length === 0) {
      return { valid: false, issues: [{ issue: 'Cart is empty' }] };
    }
    
    // Check for out of stock items
    const issues = [];
    items.forEach(item => {
      if (item.stock_quantity !== undefined && item.stock_quantity <= 0) {
        issues.push({ issue: `${item.title} is out of stock` });
      }
    });
    
    return { valid: issues.length === 0, issues };
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchAddresses();
  }, [user, items, navigate, fetchAddresses]);

  // DISABLED: Don't auto-initialize cart during checkout to prevent clearing items
  // Initialize authenticated cart if user is logged in but cart is in guest mode
  // useEffect(() => {
  //   if (user && isGuestMode && items.length > 0 && initializeAuthenticatedCart) {
  //     console.log('🔐 [CHECKOUT] User is authenticated but cart is in guest mode, initializing...');
  //     initializeAuthenticatedCart().catch(error => {
  //       console.error('❌ [CHECKOUT] Failed to initialize authenticated cart:', error);
  //     });
  //   }
  // }, [user, isGuestMode, items.length, initializeAuthenticatedCart]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      const response = await makeAuthenticatedRequest(`${API_BASE}/api/addresses`, {
        method: 'POST',
        body: JSON.stringify(newAddress)
      });

      if (response.ok) {
        const address = await response.json();
        setAddresses(prev => [address, ...prev]);
        setSelectedAddress(address);
        setShowAddressForm(false);
        setNewAddress({
          full_name: user?.full_name || user?.name || '',
          phone: '',
          address_line_1: '',
          address_line_2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'India',
          landmark: '',
          type: 'both',
          is_default: true
        });
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create address');
      }
    } catch (error) {
      console.error('Error creating address:', error);
      setError('Failed to create address');
    } finally {
      setLoading(false);
    }
  };

  // SIMPLIFIED: Direct order creation without cart sync
  const createCODOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[CHECKOUT] Creating COD order with cart items:', items);
      console.log('[CHECKOUT] Cart items format:', items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price_cents: item.price_cents
      })));
      
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      // Simple validation
      const validation = validateCart();
      if (!validation.valid) {
        throw new Error('Cart contains invalid items. Please review your cart.');
      }
      
      // Ensure server cart is synced
      const syncSuccess = await ensureServerCartSync();
      if (!syncSuccess) {
        setError('Failed to sync cart with server. Please try again.');
        setLoading(false);
        return;
      }

      const response = await makeAuthenticatedRequest(`${API_BASE}/api/orders`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: 'cod',
          shipping_address: selectedAddress ? {
            full_name: selectedAddress.full_name,
            phone: selectedAddress.phone,
            address_line_1: selectedAddress.address_line_1,
            address_line_2: selectedAddress.address_line_2,
            city: selectedAddress.city,
            state: selectedAddress.state,
            postal_code: selectedAddress.postal_code,
            country: selectedAddress.country,
            landmark: selectedAddress.landmark,
            type: selectedAddress.type || 'both'
          } : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.code === 'DELIVERY_UNAVAILABLE') {
          setError(`${errorData.message || 'Delivery not available to your location'}\n\nPlease contact us or try a different address.`);
          return;
        }
        
        // Handle insufficient stock errors
        if (errorData.error && errorData.error.includes('Insufficient stock')) {
          const productName = errorData.item?.title || errorData.error.split('for ')[1] || 'a product';
          const available = errorData.available || 0;
          const required = errorData.required || 0;
          
          setError(`Sorry, "${productName}" is out of stock or has insufficient quantity. Available: ${available}, Required: ${required}. Please update your cart and try again.`);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await response.json();
      console.log('COD Order created successfully:', order);

      // Try to confirm COD order
      try {
        const confirmResponse = await makeAuthenticatedRequest(`${API_BASE}/api/orders/${order.id}/confirm-cod`, {
          method: 'POST'
        });

        if (confirmResponse.ok) {
          const result = await confirmResponse.json();
          clearCart();
          navigate('/order-success', { 
            state: { 
              order: result.order || order,
              message: 'Order placed successfully! You can pay cash on delivery.' 
            } 
          });
        } else {
          console.warn('COD confirmation failed, but order was created');
          clearCart();
          navigate('/order-success', { 
            state: { 
              order: order,
              message: 'Order placed successfully! You can pay cash on delivery.' 
            } 
          });
        }
      } catch (confirmError) {
        console.warn('COD confirmation endpoint not available:', confirmError);
        clearCart();
        navigate('/order-success', { 
          state: { 
            order: order,
            message: 'Order placed successfully! You can pay cash on delivery.' 
          } 
        });
      }

    } catch (error) {
      console.error('COD Order creation error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createOrderAndPayment = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[CHECKOUT] Creating Razorpay order with cart items:', items);
      
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      const validation = validateCart();
      if (!validation.valid) {
        throw new Error('Cart contains invalid items');
      }
      
      // Ensure server cart is synced
      const syncSuccess = await ensureServerCartSync();
      if (!syncSuccess) {
        setError('Failed to sync cart with server. Please try again.');
        setLoading(false);
        return;
      }

      const response = await makeAuthenticatedRequest(`${API_BASE}/api/orders`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: 'razorpay',
          create_razorpay_order: true,
          shipping_address: selectedAddress ? {
            full_name: selectedAddress.full_name,
            phone: selectedAddress.phone,
            address_line_1: selectedAddress.address_line_1,
            address_line_2: selectedAddress.address_line_2,
            city: selectedAddress.city,
            state: selectedAddress.state,
            postal_code: selectedAddress.postal_code,
            country: selectedAddress.country,
            landmark: selectedAddress.landmark,
            type: selectedAddress.type || 'both'
          } : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'DELIVERY_UNAVAILABLE') {
          setError(`${errorData.message}`);
          return;
        }
        
        // Handle insufficient stock errors
        if (errorData.error && errorData.error.includes('Insufficient stock')) {
          const productName = errorData.item?.title || errorData.error.split('for ')[1] || 'a product';
          const available = errorData.available || 0;
          const required = errorData.required || 0;
          
          setError(`Sorry, "${productName}" is out of stock or has insufficient quantity. Available: ${available}, Required: ${required}. Please update your cart and try again.`);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await response.json();

      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const options = {
        key: order.razorpay_key_id,
        amount: order.total_cents,
        currency: 'INR',
        name: 'Brandverse',
        description: `Order #${order.id}`,
        order_id: order.razorpay_order_id,
        handler: async function (response) {
          await handlePaymentSuccess(response, order.id);
        },
        prefill: {
          name: user.name || user.email?.split('@')[0] || '',
          email: user.email || '',
          contact: selectedAddress?.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setError('Payment was cancelled. You can retry the payment.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Order creation error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse, orderId) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      const response = await makeAuthenticatedRequest(`${API_BASE}/api/orders/confirm-payment`, {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          order_id: orderId
        })
      });

      if (response.ok) {
        const result = await response.json();
        clearCart();
        navigate('/order-success', { 
          state: { 
            order: result.order,
            message: result.message 
          } 
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment confirmation failed');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setError(`Payment successful but confirmation failed: ${error.message}. Please contact support.`);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  if (!user || items.length === 0) {
    return null;
  }

  const validation = validateCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingTop: '80px' }}>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your order and complete payment</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-0.5 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-16 text-sm text-gray-600">
              <span>Review</span>
              <span>Address</span>
              <span>Payment</span>
            </div>
          </div>
        </div>

        {/* Cart Validation Warning */}
        {validation && !validation.valid && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Cart Issues:</p>
            {validation.issues && validation.issues.map((issue, index) => (
              <p key={index} className="text-sm mt-1">• {issue.issue || issue}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 whitespace-pre-line">
                {error}
                {outOfStockItem && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleRemoveOutOfStockItem}
                      disabled={loading}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'Removing...' : `Remove "${outOfStockItem.name}" from cart`}
                    </button>
                  </div>
                )}
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Debug: Check actual stock levels</summary>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <p>Cart items being sent to backend:</p>
                      {items.map(item => (
                        <div key={item.id} className="mt-1 pl-2 border-l-2 border-gray-300">
                          <div><strong>ID:</strong> {item.id}</div>
                          <div><strong>Title:</strong> {item.title}</div>
                          <div><strong>Quantity:</strong> {item.quantity}</div>
                          <div><strong>Stock in Frontend:</strong> {item.stock_quantity}</div>
                          <div><strong>Price:</strong> ₹{(item.price_cents / 100).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Step 1: Review Items */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Review Your Order</h2>
                <div className="space-y-4">
                  {items.map((item) => {
                    // Use backend-calculated price if available (unit_price_cents, total_cents)
                    const hasDiscount = item.discount_percent > 0;
                    const unitPrice = item.unit_price_cents !== undefined ? item.unit_price_cents : (item.discount_percent > 0 ? Math.round(item.price_cents * (1 - item.discount_percent / 100)) : item.price_cents);
                    const totalPrice = item.total_cents !== undefined ? item.total_cents : unitPrice * item.quantity;
                    return (
                      <div key={item.id} className="flex items-center space-x-4 py-4 border-b">
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=100&q=80'} 
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-gray-500">Quantity: {item.quantity}</p>
                          {hasDiscount ? (
                            <div className="space-y-1">
                              <p className="text-gray-500">
                                Price: ₹{(unitPrice / 100).toFixed(2)} each
                                <span className="ml-2 text-xs text-gray-400 line-through">₹{(item.price_cents / 100).toFixed(2)}</span>
                              </p>
                              <p className="text-green-600 text-sm">
                                Save ₹{((item.price_cents - unitPrice) / 100).toFixed(2)} ({item.discount_percent}% off)
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-500">Price: ₹{(item.price_cents / 100).toFixed(2)} each</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{(totalPrice / 100).toFixed(2)}</p>
                          {hasDiscount && (
                            <p className="text-xs text-gray-400 line-through">₹{((item.price_cents / 100) * item.quantity).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!validation.valid}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!validation.valid ? 'Fix Cart Issues First' : 'Continue to Address'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Address (keeping existing code) */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                
                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddress?.id === address.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{address.full_name}</p>
                            <p className="text-gray-600">{address.address_line_1}</p>
                            {address.address_line_2 && <p className="text-gray-600">{address.address_line_2}</p>}
                            <p className="text-gray-600">
                              {address.city}, {address.state} {address.postal_code}
                            </p>
                            <p className="text-gray-600">{address.phone}</p>
                          </div>
                          <input
                            type="radio"
                            name="selectedAddress"
                            checked={selectedAddress?.id === address.id}
                            onChange={() => setSelectedAddress(address)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        + Add New Address
                      </button>
                    </div>

                    {showAddressForm && (
                      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                          <h3 className="text-lg font-medium mb-4">Add New Address</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.full_name}
                                onChange={(e) => setNewAddress(prev => ({...prev, full_name: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                required
                                value={newAddress.phone}
                                onChange={(e) => setNewAddress(prev => ({...prev, phone: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.address_line_1}
                              onChange={(e) => setNewAddress(prev => ({...prev, address_line_1: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Line 2 (Optional)
                            </label>
                            <input
                              type="text"
                              value={newAddress.address_line_2}
                              onChange={(e) => setNewAddress(prev => ({...prev, address_line_2: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.city}
                                onChange={(e) => setNewAddress(prev => ({...prev, city: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                State *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.state}
                                onChange={(e) => setNewAddress(prev => ({...prev, state: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postal Code *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.postal_code}
                                onChange={(e) => setNewAddress(prev => ({...prev, postal_code: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Landmark (Optional)
                            </label>
                            <input
                              type="text"
                              value={newAddress.landmark}
                              onChange={(e) => setNewAddress(prev => ({...prev, landmark: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="flex justify-between pt-4">
                            <button
                              type="button"
                              onClick={() => setShowAddressForm(false)}
                              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              {loading ? 'Adding...' : 'Add Address'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => setStep(1)}
                        className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        ← Back to Review
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        disabled={!selectedAddress}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No addresses found. Please add a delivery address.</p>
                    {/* Always show the address form if there are no addresses */}
                    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50 max-w-xl mx-auto">
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <h3 className="text-lg font-medium mb-4">Add New Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.full_name}
                              onChange={(e) => setNewAddress(prev => ({...prev, full_name: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress(prev => ({...prev, phone: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 1 *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddress.address_line_1}
                            onChange={(e) => setNewAddress(prev => ({...prev, address_line_1: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 2 (Optional)
                          </label>
                          <input
                            type="text"
                            value={newAddress.address_line_2}
                            onChange={(e) => setNewAddress(prev => ({...prev, address_line_2: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.city}
                              onChange={(e) => setNewAddress(prev => ({...prev, city: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.state}
                              onChange={(e) => setNewAddress(prev => ({...prev, state: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Postal Code *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.postal_code}
                              onChange={(e) => setNewAddress(prev => ({...prev, postal_code: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Landmark (Optional)
                          </label>
                          <input
                            type="text"
                            value={newAddress.landmark}
                            onChange={(e) => setNewAddress(prev => ({...prev, landmark: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex justify-end pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {loading ? 'Adding...' : 'Add Address'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                
                <div className="space-y-4 mb-6">
                  {/*
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'razorpay' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('razorpay')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="razorpay"
                          checked={paymentMethod === 'razorpay'}
                          onChange={() => setPaymentMethod('razorpay')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <div>
                          <p className="font-medium">Pay Online</p>
                          <p className="text-sm text-gray-600">Pay securely using UPI, Cards, Net Banking, or Wallets</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  */}

                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'cod' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <div>
                                                    <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-gray-600">Pay with cash upon delivery at your doorstep</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 border rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{(getCartSubtotal() / 100).toFixed(2)}</span>
                    </div>
                    {getTotalDiscount() > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{(getTotalDiscount() / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total</span>
                      <span>₹{(getCartTotal() / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ← Back to Address
                  </button>
                  <button
                    onClick={paymentMethod === 'cod' ? createCODOrderWithValidation : createOrderAndPayment}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Placing Order...' : paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay Securely'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Summary (always visible on large screens) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{(getCartSubtotal() / 100).toFixed(2)}</span>
                </div>
                {getTotalDiscount() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{(getTotalDiscount() / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>₹{(getCartTotal() / 100).toFixed(2)}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Taxes included. Shipping calculated at checkout if applicable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;