import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import MobileBottomNav from '../components/MobileBottomNav';
import CartIcon from '../components/CartIcon';

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    itemCount,
    cartTotal,
    cartSubtotal,
    totalSavings,
    getFormattedPrice,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const [isClearing, setIsClearing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  const handleQuantityChange = async (productId, newQuantity) => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    
    if (newQuantity <= 0) {
      await removeFromCart(productId);
    } else {
      await updateQuantity(productId, newQuantity);
    }
    
    setUpdatingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to remove all items from your cart?')) {
      setIsClearing(true);
      await clearCart();
      setIsClearing(false);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const continueShopping = () => {
    navigate('/');
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
                {itemCount > 0 && (
                  <p className="text-gray-600">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
                  </p>
                )}
              </div>
              {itemCount > 0 && (
                <button 
                  className="flex items-center space-x-2 text-rose-600 hover:text-rose-700 transition-colors px-4 py-2 rounded-lg border border-rose-200 hover:border-rose-300 bg-white"
                  onClick={handleClearCart}
                  disabled={isClearing}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{isClearing ? 'Clearing...' : 'Clear Cart'}</span>
                </button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            /* Empty Cart */
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md w-full text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CartIcon className="w-10 h-10" strokeColor="#059669" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-600 mb-6">
                  Looks like you haven't added any items to your cart yet.
                </p>
                <button 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium w-full"
                  onClick={continueShopping}
                >
                  Start Shopping
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Items in your cart</h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>{itemCount} items</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => {
                      const itemPrice = item.discount_percent > 0 
                        ? (item.price_cents * (1 - item.discount_percent / 100))
                        : item.price_cents;
                      const itemTotal = itemPrice * item.quantity;
                      const itemSavings = item.discount_percent > 0 
                        ? (item.price_cents - itemPrice) * item.quantity
                        : 0;
                      const isUpdating = updatingItems.has(item.id);

                      return (
                        <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-xl hover:border-emerald-300 transition-all duration-200 bg-white">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <img 
                              src={item.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80'} 
                              alt={item.title}
                              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80';
                              }}
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
                              {item.title}
                            </h3>
                            
                            {item.description && (
                              <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            
                            {/* Pricing */}
                            <div className="mb-2">
                              {item.discount_percent > 0 ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-emerald-600">
                                    {getFormattedPrice(itemPrice)}
                                  </span>
                                  <span className="text-gray-500 line-through text-sm">
                                    {getFormattedPrice(item.price_cents)}
                                  </span>
                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">
                                    {item.discount_percent}% OFF
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-gray-900">
                                  {getFormattedPrice(item.price_cents)}
                                </span>
                              )}
                            </div>

                            {/* Savings */}
                            {itemSavings > 0 && (
                              <div className="text-emerald-600 text-sm font-medium mb-2">
                                You save: {getFormattedPrice(itemSavings)}
                              </div>
                            )}

                            {/* Stock Info */}
                            <div className="mb-3">
                              {item.stock_quantity > 0 ? (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  item.stock_quantity > 10 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {item.stock_quantity > 10 ? 'In Stock' : `Only ${item.stock_quantity} left`}
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-xs px-2 py-1 rounded-full">
                                  Out of Stock
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-600 font-medium">Qty:</span>
                                <div className="flex items-center border border-gray-300 rounded-lg">
                                  <button 
                                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || isUpdating}
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {isUpdating ? '...' : item.quantity}
                                  </span>
                                  <button 
                                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.stock_quantity || isUpdating}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Remove Button */}
                              <button 
                                className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 transition-colors text-sm"
                                onClick={() => removeFromCart(item.id)}
                                disabled={isUpdating}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-lg font-bold text-gray-900 mb-1">
                              {getFormattedPrice(itemTotal)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.quantity} × {getFormattedPrice(itemPrice)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cart Summary Section */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal ({itemCount} items):</span>
                      <span className="font-medium text-gray-900">{cartSubtotal}</span>
                    </div>
                    
                    {totalSavings > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Savings:</span>
                        <span className="font-medium text-emerald-600">-{getFormattedPrice(totalSavings)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium text-emerald-600">FREE</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-sm text-gray-600">Calculated at checkout</span>
                    </div>
                    
                    <hr className="border-gray-200" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-emerald-600">{cartTotal}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {!user && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-amber-800 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Sign in to save your cart and checkout faster</span>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg"
                      onClick={handleCheckout}
                    >
                      {user ? 'Proceed to Checkout' : 'Sign in & Checkout'}
                    </button>
                    
                    <button 
                      className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                      onClick={continueShopping}
                    >
                      Continue Shopping
                    </button>
                  </div>

                  {/* Security Badge */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                      <span className="font-medium">Secure Checkout</span>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Your payment information is encrypted and secure
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
};

export default CartPage;