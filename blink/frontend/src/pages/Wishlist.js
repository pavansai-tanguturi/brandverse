import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ModernNavbar from "../components/ModernNavbar";
import MobileBottomNav from "../components/MobileBottomNav";

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: wishlistItems, removeFromWishlist, isLoading, fetchWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [loadingItemId, setLoadingItemId] = useState(null);

  // Debug logging
  console.log("Wishlist Debug:", { wishlistItems, isLoading });

  // Ensure wishlist is loaded
  useEffect(() => {
    if (fetchWishlist) {
      fetchWishlist();
    }
  }, [fetchWishlist]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      setLoadingItemId(productId);
      await removeFromWishlist(productId);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleAddToCart = async (item) => {
    try {
      setLoadingItemId(item.id);
      await addToCart(item, 1);
      // Optionally navigate to cart after adding
      // navigate("/cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
        <ModernNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your wishlist...</p>
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      <ModernNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">
              {wishlistItems?.length || 0} {(wishlistItems?.length || 0) === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          
          {!user && (
            <div className="text-center bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-emerald-800 text-sm">
                <button
                  onClick={() => navigate("/login")}
                  className="text-emerald-600 hover:text-emerald-800 font-medium underline"
                >
                  Sign in
                </button>{" "}
                to sync your wishlist across devices
              </p>
            </div>
          )}
        </div>

        {/* Wishlist Items */}
        {(!wishlistItems || wishlistItems.length === 0) ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start adding items to your wishlist by clicking the heart icon on products you love!
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(wishlistItems || []).map((item) => {
              const hasDiscount = (item.discount_percent || 0) > 0;
              const price = (item.price_cents || 0) / 100;
              const finalPrice = hasDiscount
                ? price * (1 - item.discount_percent / 100)
                : price;
              const isLoading = loadingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-gray-200"
                >
                  <div className="relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                      onClick={() => handleProductClick(item.id)}
                    />
                    
                    {hasDiscount && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {item.discount_percent}% OFF
                      </div>
                    )}

                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      disabled={isLoading}
                      className="absolute top-3 right-3 p-2 bg-red-50 border border-red-200 text-red-600 rounded-full hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
                      title="Remove from wishlist"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>

                    {item.stock_quantity <= 5 && item.stock_quantity > 0 && (
                      <div className="absolute bottom-3 right-3 bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {item.stock_quantity} left
                      </div>
                    )}
                    
                    {item.stock_quantity <= 0 && (
                      <div className="absolute bottom-3 right-3 bg-rose-500 text-white px-2 py-1 rounded text-xs font-bold">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3
                      className="font-medium text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2 cursor-pointer"
                      onClick={() => handleProductClick(item.id)}
                    >
                      {item.title}
                    </h3>

                    {/* Price Section */}
                    <div className="mb-4">
                      {hasDiscount ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-emerald-600">
                              ₹{finalPrice.toFixed(2)}
                            </span>
                            <span className="text-gray-500 line-through text-sm">
                              ₹{price.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-emerald-600 font-semibold text-sm">
                            Save ₹{(price - finalPrice).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          ₹{finalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={item.stock_quantity <= 0 || isLoading}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          item.stock_quantity <= 0
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          </div>
                        ) : item.stock_quantity <= 0 ? (
                          "Out of Stock"
                        ) : (
                          "Add to Cart"
                        )}
                      </button>

                      <button
                        onClick={() => handleProductClick(item.id)}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continue Shopping Section */}
        {wishlistItems && wishlistItems.length > 0 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate("/products")}
              className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Wishlist;