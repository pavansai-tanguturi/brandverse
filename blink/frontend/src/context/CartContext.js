import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Cart action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
  SET_LOADING: 'SET_LOADING',
  SET_GUEST_MODE: 'SET_GUEST_MODE'
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case CART_ACTIONS.SET_GUEST_MODE:
      return { ...state, isGuestMode: action.payload };

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
      return {
        items: parsedCart.items || [],
        isLoading: false,
        isGuestMode: true // Always start in guest mode
      };
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return { 
    items: [], 
    isLoading: false, 
    isGuestMode: true // Always start in guest mode
  };
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Fallback sync function - only works for authenticated users
const forceCartSyncFallback = async (dispatch) => {
  try {
    console.log('🔄 Syncing cart with server...');
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
    
    const response = await fetch(`${API_BASE}/api/cart`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (response.status === 401) {
      // User not authenticated - switch to guest mode
      dispatch({ type: CART_ACTIONS.SET_GUEST_MODE, payload: true });
      console.log('👤 Running in guest mode (not authenticated)');
      return false;
    }

    if (response.ok) {
      const cartData = await response.json();
      console.log('🛒 Server cart data:', cartData);
      
      // User is authenticated
      dispatch({ type: CART_ACTIONS.SET_GUEST_MODE, payload: false });
      
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
        // Empty cart but user is authenticated
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
        console.log('🛒 Server cart is empty');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Cart sync failed:', error);
    // On network error, assume guest mode
    dispatch({ type: CART_ACTIONS.SET_GUEST_MODE, payload: true });
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

  // REMOVED the automatic initialization that was causing premature API calls
  // No more useEffect making API calls on mount!

  // Optimistic addToCart with guest/authenticated mode handling
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

    // Only sync with server if user is authenticated
    if (!state.isGuestMode) {
      (async () => {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
          const response = await fetch(`${API_BASE}/api/cart/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ product_id: product.id, quantity })
          });

          if (response.status === 401) {
            // User was logged out, switch to guest mode
            dispatch({ type: CART_ACTIONS.SET_GUEST_MODE, payload: true });
            console.log('👤 Switched to guest mode - user logged out');
            return;
          }

          if (!response.ok) {
            const error = await response.json();
            console.error('Backend add failed:', error);
            if (error.error && error.error.includes('stock')) {
              alert(error.error);
              await forceCartSyncFallback(dispatch);
            }
          }
        } catch (backendError) {
          console.warn('Backend cart sync failed:', backendError);
        }
      })();
    }
  };

  const removeFromCart = async (productId) => {
    try {
      // Update local state immediately
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { productId } });
      
      // Try backend sync only if authenticated
      if (!state.isGuestMode) {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
          const response = await fetch(`${API_BASE}/api/cart/remove`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ product_id: productId })
          });
          
          if (response.status === 401) {
            dispatch({ type: CART_ACTIONS.SET_GUEST_MODE, payload: true });
          }
        } catch (backendError) {
          console.warn('Backend remove failed:', backendError);
        }
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
      
      // Try backend sync only if authenticated
      if (!state.isGuestMode) {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
          const response = await fetch(`${API_BASE}/api/cart/update-quantity`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ product_id: productId, quantity })
          });
          
          if (response.status === 401) {
            dispatch({ type: CART_ACTIONS.SET_GUEST_MODE, payload: true });
          }
        } catch (backendError) {
          console.warn('Backend update failed:', backendError);
        }
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const forceSync = async () => {
    if (state.isGuestMode) {
      console.log('👤 In guest mode, skipping server sync');
      return false;
    }
    return await forceCartSyncFallback(dispatch);
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  // NEW: Call this function when user successfully logs in
  const initializeAuthenticatedCart = async () => {
    console.log('🔐 User logged in, initializing authenticated cart...');
    
    try {
      // Switch to authenticated mode first
      dispatch({ type: CART_ACTIONS.SET_GUEST_MODE, payload: false });
      
      // Sync guest cart to server if there are items
      if (state.items.length > 0) {
        console.log('🔄 Syncing guest cart to server...');
        
        for (const item of state.items) {
          try {
            const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
            await fetch(`${API_BASE}/api/cart/add`, {
              method: 'POST',
              headers: getAuthHeaders(),
              credentials: 'include',
              body: JSON.stringify({ 
                product_id: item.id, 
                quantity: item.quantity 
              })
            });
          } catch (error) {
            console.error('Failed to sync item to server:', error);
          }
        }
      }
      
      // Now sync back from server to get the authoritative state
      await forceCartSyncFallback(dispatch);
      
    } catch (error) {
      console.error('Failed to initialize authenticated cart:', error);
      // If authentication fails, revert to guest mode
      dispatch({ type: CART_ACTIONS.SET_GUEST_MODE, payload: true });
    }
  };

  // NEW: Call this when user logs out
  const handleLogout = () => {
    console.log('🚪 User logged out, switching to guest mode...');
    dispatch({ type: CART_ACTIONS.SET_GUEST_MODE, payload: true });
    // Keep the cart items in localStorage for guest mode
  };

  // Convert guest cart to server cart when user logs in
  const syncGuestCartToServer = async () => {
    if (state.isGuestMode && state.items.length > 0) {
      console.log('🔄 Syncing guest cart to server...');
      
      for (const item of state.items) {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
          await fetch(`${API_BASE}/api/cart/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ 
              product_id: item.id, 
              quantity: item.quantity 
            })
          });
        } catch (error) {
          console.error('Failed to sync item to server:', error);
        }
      }
      
      // Now sync back from server to get the authoritative state
      await forceCartSyncFallback(dispatch);
    } else {
      // Just sync from server
      await forceCartSyncFallback(dispatch);
    }
  };

  // Simple validation
  const validateForCheckout = async () => {
    try {
      if (state.isGuestMode) {
        throw new Error('Please log in to proceed with checkout');
      }
      
      // Force sync first for authenticated users
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
    isGuestMode: state.isGuestMode || false,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    forceSync,
    syncGuestCartToServer,
    validateForCheckout,
    
    // NEW: Auth-related functions
    initializeAuthenticatedCart,
    handleLogout,
    
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