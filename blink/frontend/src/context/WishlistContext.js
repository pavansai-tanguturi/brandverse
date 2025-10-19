import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";

const WishlistContext = createContext();

// Wishlist action types
const WISHLIST_ACTIONS = {
  ADD_ITEM: "ADD_ITEM",
  REMOVE_ITEM: "REMOVE_ITEM",
  CLEAR_WISHLIST: "CLEAR_WISHLIST",
  LOAD_WISHLIST: "LOAD_WISHLIST",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_GUEST_MODE: "SET_GUEST_MODE",
};

// Wishlist reducer
const wishlistReducer = (state, action) => {
  switch (action.type) {
    case WISHLIST_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case WISHLIST_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case WISHLIST_ACTIONS.SET_GUEST_MODE:
      return { ...state, isGuestMode: action.payload };

    case WISHLIST_ACTIONS.ADD_ITEM: {
      const { product } = action.payload;
      const existingItem = state.items.find((item) => item.id === product.id);

      if (!existingItem) {
        const wishlistItem = {
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          discount_percent: product.discount_percent || 0,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          description: product.description,
          addedAt: new Date().toISOString(),
        };

        return {
          ...state,
          items: [...state.items, wishlistItem],
          error: null,
        };
      }
      return state; // Item already in wishlist
    }

    case WISHLIST_ACTIONS.REMOVE_ITEM: {
      const { productId } = action.payload;
      return {
        ...state,
        items: state.items.filter((item) => item.id !== productId),
        error: null,
      };
    }

    case WISHLIST_ACTIONS.CLEAR_WISHLIST: {
      return {
        ...state,
        items: [],
        error: null,
      };
    }

    case WISHLIST_ACTIONS.LOAD_WISHLIST: {
      return {
        ...state,
        items: action.payload.items || [],
        isLoading: false,
        error: null,
      };
    }

    default:
      return state;
  }
};

// Initial state - load from localStorage if available
const getInitialWishlistState = () => {
  try {
    const savedWishlist = localStorage.getItem("brandverse_wishlist");
    if (savedWishlist) {
      const parsedWishlist = JSON.parse(savedWishlist);
      return {
        items: parsedWishlist.items || [],
        isLoading: false,
        error: null,
        isGuestMode: true, // Always start in guest mode
      };
    }
  } catch (error) {
    console.error("Error loading wishlist from localStorage:", error);
  }
  return {
    items: [],
    isLoading: false,
    error: null,
    isGuestMode: true,
  };
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const initialWishlistState = getInitialWishlistState();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialWishlistState);

  // API Base URL - FIXED: Use import.meta.env instead of process.env
  const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3001";
  const API_BASE = `${API_BASE_URL}/api`;

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("brandverse_wishlist", JSON.stringify(state));
  }, [state]);

  // Fetch wishlist from server for authenticated users
  const fetchWishlist = useCallback(async () => {
    if (state.isGuestMode) {
      console.log("👤 In guest mode, skipping server wishlist fetch");
      return;
    }

    dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });

    try {
      const response = await fetch(`${API_BASE}/wishlist`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.status === 401) {
        // User not authenticated - switch to guest mode
        dispatch({ type: WISHLIST_ACTIONS.SET_GUEST_MODE, payload: true });
        dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: false });
        console.log("👤 Switched to guest mode (not authenticated)");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist: ${response.status}`);
      }

      const wishlistData = await response.json();

      // Map server response to local format
      const mappedItems = wishlistData.items
        ? wishlistData.items.map((item) => ({
            id: item.products?.id || item.product_id,
            title: item.products?.title || item.title || "Unknown Product",
            price_cents: item.products?.price_cents || item.price_cents || 0,
            discount_percent: item.products?.discount_percent || 0,
            image_url: item.products?.image_url || null,
            stock_quantity: item.products?.stock_quantity || 0,
            description: item.products?.description || "",
            addedAt: item.created_at || new Date().toISOString(),
          }))
        : [];

      dispatch({
        type: WISHLIST_ACTIONS.LOAD_WISHLIST,
        payload: { items: mappedItems },
      });
      console.log("✅ Wishlist synced from server");
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [API_BASE, state.isGuestMode]);

  // Add to wishlist with backend sync
  const addToWishlist = async (product) => {
    try {
      // Update local state immediately for better UX
      dispatch({ type: WISHLIST_ACTIONS.ADD_ITEM, payload: { product } });

      // Only sync with server if user is authenticated
      if (!state.isGuestMode) {
        const response = await fetch(`${API_BASE}/wishlist/add`, {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ product_id: product.id }),
        });

        if (response.status === 401) {
          // User was logged out, switch to guest mode
          dispatch({ type: WISHLIST_ACTIONS.SET_GUEST_MODE, payload: true });
          console.log("👤 Switched to guest mode - user logged out");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Backend wishlist add failed:", errorData);
          // Optionally revert local change if server fails
          // dispatch({ type: WISHLIST_ACTIONS.REMOVE_ITEM, payload: { productId: product.id } });
        }
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      // Optionally revert local change
      // dispatch({ type: WISHLIST_ACTIONS.REMOVE_ITEM, payload: { productId: product.id } });
    }
  };

  // Remove from wishlist with backend sync
  const removeFromWishlist = async (productId) => {
    try {
      // Update local state immediately
      dispatch({ type: WISHLIST_ACTIONS.REMOVE_ITEM, payload: { productId } });

      // Only sync with server if user is authenticated
      if (!state.isGuestMode) {
        const response = await fetch(`${API_BASE}/wishlist/remove`, {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ product_id: productId }),
        });

        if (response.status === 401) {
          dispatch({ type: WISHLIST_ACTIONS.SET_GUEST_MODE, payload: true });
          console.log("👤 Switched to guest mode - user logged out");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Backend wishlist remove failed:", errorData);
        }
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  // Clear wishlist
  const clearWishlist = async () => {
    try {
      dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });

      // Only sync with server if user is authenticated
      if (!state.isGuestMode) {
        const response = await fetch(`${API_BASE}/wishlist/clear`, {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        });

        if (response.status === 401) {
          dispatch({ type: WISHLIST_ACTIONS.SET_GUEST_MODE, payload: true });
          console.log("👤 Switched to guest mode - user logged out");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Backend wishlist clear failed:", errorData);
        }
      }
    } catch (error) {
      console.error("Error clearing wishlist:", error);
    }
  };

  // Initialize authenticated wishlist when user logs in
  const initializeAuthenticatedWishlist = async () => {
    console.log("🔐 User logged in, initializing authenticated wishlist...");

    try {
      // Switch to authenticated mode
      dispatch({ type: WISHLIST_ACTIONS.SET_GUEST_MODE, payload: false });

      // Sync guest wishlist to server if there are items
      if (state.items.length > 0) {
        console.log("🔄 Syncing guest wishlist to server...");

        for (const item of state.items) {
          try {
            await fetch(`${API_BASE}/wishlist/add`, {
              method: "POST",
              headers: getAuthHeaders(),
              credentials: "include",
              body: JSON.stringify({ product_id: item.id }),
            });
          } catch (error) {
            console.error("Failed to sync wishlist item to server:", error);
          }
        }
      }

      // Fetch the authoritative wishlist from server
      await fetchWishlist();
    } catch (error) {
      console.error("Failed to initialize authenticated wishlist:", error);
      dispatch({ type: WISHLIST_ACTIONS.SET_GUEST_MODE, payload: true });
    }
  };

  // Handle user logout
  const handleLogout = () => {
    console.log("🚪 User logged out, switching wishlist to guest mode...");
    dispatch({ type: WISHLIST_ACTIONS.SET_GUEST_MODE, payload: true });
    // Keep wishlist items in localStorage for guest mode
  };

  // Utility functions
  const isInWishlist = (productId) => {
    return state.items.some((item) => item.id === productId);
  };

  const wishlistCount = state.items.length;

  const value = {
    // State (with backwards compatibility)
    state: {
      items: state.items,
      isLoading: state.isLoading || false,
      error: state.error,
      isGuestMode: state.isGuestMode || false,
    },
    items: state.items,
    wishlistCount,
    isLoading: state.isLoading || false,
    error: state.error,
    isGuestMode: state.isGuestMode || false,

    // Actions
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    fetchWishlist,
    isInWishlist,

    // Auth-related functions
    initializeAuthenticatedWishlist,
    handleLogout,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
