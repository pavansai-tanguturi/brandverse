import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Cart action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return {
          ...state,
          items: state.items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      } else {
        // Add new item
        const cartItem = {
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          discount_percent: product.discount_percent || 0,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          quantity: quantity
        };
        
        return {
          ...state,
          items: [...state.items, cartItem]
        };
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
        // Remove item if quantity is 0 or negative
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
      return {
        ...state,
        items: []
      };
    }
    
    case CART_ACTIONS.LOAD_CART: {
      return {
        ...state,
        items: action.payload.items || []
      };
    }
    
    default:
      return state;
  }
};

// Initial state - load from localStorage if available
const getInitialState = () => {
  try {
    const savedCart = localStorage.getItem('brandverse_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      return parsedCart.items ? parsedCart : { items: [] };
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return { items: [] };
};

const initialState = getInitialState();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Cart is now loaded from localStorage in initial state

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('brandverse_cart', JSON.stringify(state));
  }, [state]);

  // Cart actions
  const addToCart = (product, quantity = 1) => {
    if (quantity > product.stock_quantity) {
      throw new Error(`Only ${product.stock_quantity} items available in stock`);
    }
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { product, quantity } });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { productId } });
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
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
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    
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
