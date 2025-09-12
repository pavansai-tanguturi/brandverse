import React, { createContext, useContext, useReducer, useEffect } from 'react';

const WishlistContext = createContext();

// Wishlist action types
const WISHLIST_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_WISHLIST: 'CLEAR_WISHLIST',
  LOAD_WISHLIST: 'LOAD_WISHLIST'
};

// Wishlist reducer
const wishlistReducer = (state, action) => {
  switch (action.type) {
    case WISHLIST_ACTIONS.ADD_ITEM: {
      const { product } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (!existingItem) {
        const wishlistItem = {
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          discount_percent: product.discount_percent || 0,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          description: product.description,
          addedAt: new Date().toISOString()
        };
        
        return {
          ...state,
          items: [...state.items, wishlistItem]
        };
      }
      return state; // Item already in wishlist
    }
    
    case WISHLIST_ACTIONS.REMOVE_ITEM: {
      const { productId } = action.payload;
      return {
        ...state,
        items: state.items.filter(item => item.id !== productId)
      };
    }
    
    case WISHLIST_ACTIONS.CLEAR_WISHLIST: {
      return {
        ...state,
        items: []
      };
    }
    
    case WISHLIST_ACTIONS.LOAD_WISHLIST: {
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
const getInitialWishlistState = () => {
  try {
    const savedWishlist = localStorage.getItem('brandverse_wishlist');
    if (savedWishlist) {
      const parsedWishlist = JSON.parse(savedWishlist);
      return parsedWishlist.items ? parsedWishlist : { items: [] };
    }
  } catch (error) {
    console.error('Error loading wishlist from localStorage:', error);
  }
  return { items: [] };
};

const initialWishlistState = getInitialWishlistState();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialWishlistState);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('brandverse_wishlist', JSON.stringify(state));
  }, [state]);

  // Wishlist actions
  const addToWishlist = (product) => {
    dispatch({ type: WISHLIST_ACTIONS.ADD_ITEM, payload: { product } });
  };

  const removeFromWishlist = (productId) => {
    dispatch({ type: WISHLIST_ACTIONS.REMOVE_ITEM, payload: { productId } });
  };

  const clearWishlist = () => {
    dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
  };

  const isInWishlist = (productId) => {
    return state.items.some(item => item.id === productId);
  };

  // Wishlist calculations
  const wishlistCount = state.items.length;

  const value = {
    items: state.items,
    wishlistCount,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
