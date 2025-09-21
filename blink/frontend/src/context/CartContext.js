// 1. FIRST - Update your CartContext.js to handle missing endpoints gracefully

import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Cart action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
  SET_LOADING: 'SET_LOADING'
};

// Cart reducer (same as before)
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case CART_ACTIONS.ADD_ITEM: {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      } else {
        const cartItem = {
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          discount_percent: product.discount_percent || 0,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          quantity: quantity
        };
        
        return { ...state, items: [...state.items, cartItem] };
      }
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.productId)
      };
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== productId)
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === productId
            ? { ...item, quantity: Math.min(quantity, item.stock_quantity) }
            : item
        )
      };
    }
    
    case CART_ACTIONS.CLEAR_CART: {
      return { ...state, items: [] };
    }
    
    case CART_ACTIONS.LOAD_CART: {
      return { ...state, items: action.payload.items || [] };
    }
    
    default:
      return state;
  }
};

// Initial state
const getInitialState = () => {
  try {
    const savedCart = localStorage.getItem('brandverse_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      return parsedCart.items ? parsedCart : { items: [], isLoading: false };
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return { items: [], isLoading: false };
};

// Fallback sync function - uses existing /api/cart endpoint
const forceCartSyncFallback = async (dispatch) => {
  try {
    console.log('🔄 Syncing cart with basic endpoint...');
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
    
    const response = await fetch(`${API_BASE}/api/cart`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (response.ok) {
      const cartData = await response.json();
      console.log('🛒 Server cart data:', cartData);
      
      if (cartData.items && cartData.items.length > 0) {
        // Map the response to match your cart format
        const syncedItems = cartData.items.map(item => ({
          id: item.products?.id || item.product_id,
          title: item.products?.title || item.title || 'Unknown Product',
          price_cents: item.products?.price_cents || item.unit_price_cents || 0,
          quantity: item.quantity,
          image_url: item.products?.image_url || null,
          stock_quantity: item.products?.stock_quantity || 0,
          discount_percent: item.products?.discount_percent || 0
        }));

        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: syncedItems } });
        console.log('✅ Cart synced successfully');
        return true;
      } else {
        // Empty cart
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
        console.log('Cart is empty');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Cart sync failed:', error);
    return false;
  }
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, getInitialState());

  useEffect(() => {
    localStorage.setItem('brandverse_cart', JSON.stringify(state));
  }, [state]);

  // Sync on mount
  useEffect(() => {
    const syncOnMount = async () => {
      try {
        await forceCartSyncFallback(dispatch);
      } catch (error) {
        console.error('Failed to sync cart on mount:', error);
      }
    };
    syncOnMount();
  }, []);

  // Optimistic addToCart: update local state immediately, backend in background, sync only on error
  const addToCart = (product, quantity = 1) => {
    // Check stock locally first
    const currentQuantityInCart = getItemQuantity(product.id);
    const totalQuantity = currentQuantityInCart + quantity;
    if (totalQuantity > product.stock_quantity) {
      const available = product.stock_quantity - currentQuantityInCart;
      throw new Error(`Only ${available} more items can be added (${product.stock_quantity} total stock, ${currentQuantityInCart} already in cart)`);
    }

    // Update local state immediately for better UX
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { product, quantity } });

    // Fire backend add in background
    (async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
        const response = await fetch(`${API_BASE}/api/cart/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ product_id: product.id, quantity })
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Backend add failed:', error);
          // If stock error, show alert and sync cart
          if (error.error && error.error.includes('stock')) {
            alert(error.error);
            await forceCartSyncFallback(dispatch);
          }
          // For other errors, just log and sync
          else {
            console.warn('Backend sync failed, syncing cart:', error.error);
            await forceCartSyncFallback(dispatch);
          }
        } else {
          // Optionally debounce sync for consistency, but not required for instant UX
          // setTimeout(() => forceCartSyncFallback(dispatch), 500);
        }
      } catch (backendError) {
        console.warn('Backend cart sync failed:', backendError);
        // Optionally sync cart after error
        // setTimeout(() => forceCartSyncFallback(dispatch), 500);
      }
    })();
  };

  const removeFromCart = async (productId) => {
    try {
      // Update local state immediately
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { productId } });
      
      // Try backend sync
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
        await fetch(`${API_BASE}/api/cart/remove`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ product_id: productId })
        });
      } catch (backendError) {
        console.warn('Backend remove failed:', backendError);
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        return await removeFromCart(productId);
      }

      // Update local state immediately
      dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
      
      // Try backend sync
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
        await fetch(`${API_BASE}/api/cart/update-quantity`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ product_id: productId, quantity })
        });
      } catch (backendError) {
        console.warn('Backend update failed:', backendError);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const forceSync = async () => {
    return await forceCartSyncFallback(dispatch);
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  // Simple validation using existing endpoints
  const validateForCheckout = async () => {
    try {
      // Force sync first
      await forceCartSyncFallback(dispatch);
      
      if (state.items.length === 0) {
        throw new Error('Cart is empty');
      }
      
      // Basic validation - check if items have valid data
      const invalidItems = state.items.filter(item => 
        !item.id || !item.title || item.quantity <= 0 || item.quantity > item.stock_quantity
      );
      
      if (invalidItems.length > 0) {
        throw new Error('Some items in cart are invalid or out of stock');
      }
      
      return {
        valid: true,
        items: state.items,
        total_cents: getCartTotal()
      };
      
    } catch (error) {
      console.error('Cart validation failed:', error);
      throw error;
    }
  };

  // Cart calculations
  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      const itemPrice = item.discount_percent > 0 
        ? (item.price_cents * (1 - item.discount_percent / 100))
        : item.price_cents;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const getCartSubtotal = () => {
    return state.items.reduce((total, item) => {
      return total + (item.price_cents * item.quantity);
    }, 0);
  };

  const getTotalDiscount = () => {
    return state.items.reduce((total, item) => {
      if (item.discount_percent > 0) {
        const discount = item.price_cents * (item.discount_percent / 100) * item.quantity;
        return total + discount;
      }
      return total;
    }, 0);
  };

  const getItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getFormattedPrice = (priceInCents) => {
    return `₹${(priceInCents / 100).toFixed(2)}`;
  };

  const isInCart = (productId) => {
    return state.items.some(item => item.id === productId);
  };

  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    // State
    items: state.items,
    isLoading: state.isLoading || false,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    forceSync,
    validateForCheckout,
    
    // Calculations
    getCartTotal,
    getCartSubtotal,
    getTotalDiscount,
    getItemCount,
    getFormattedPrice,
    isInCart,
    getItemQuantity,
    
    // Formatted values
    cartTotal: getFormattedPrice(getCartTotal()),
    cartSubtotal: getFormattedPrice(getCartSubtotal()),
    totalDiscount: getFormattedPrice(getTotalDiscount()),
    itemCount: getItemCount()
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// 2. ADD THIS TO YOUR CART CONTROLLER - Simple fallback route
export async function validateCartSimple(req, res) {
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
      cart: cart,
      message: isEmpty ? 'Cart is empty' : 'Cart is valid'
    });
    
  } catch (error) {
    console.error('Cart validation failed:', error);
    res.status(500).json({ 
      error: 'Cart validation failed',
      isValid: false 
    });
  }
}