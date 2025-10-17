import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ModernNavbar from '../components/ModernNavbar';
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
    getFormattedPrice,
    getCartTotal,
    getCartSubtotal,
    getTotalDiscount,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const [isClearing, setIsClearing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  const handleQuantityChange = async (productId, newQuantity) => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    if (newQuantity <= 0) await removeFromCart(productId);
    else await updateQuantity(productId, newQuantity);
    setUpdatingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    await clearCart();
    setIsClearing(false);
  };

  const handleCheckout = () => {
    if (!user) navigate('/login?redirect=/checkout');
    else navigate('/checkout');
  };

  const continueShopping = () => navigate('/');

  return (
    <>
      <ModernNavbar showSearch={true} />
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
              {itemCount > 0 && (
                <p className="text-gray-600">{itemCount} item{itemCount > 1 && 's'} in your cart</p>
              )}
            </div>
            {itemCount > 0 && (
              <button
                className="px-4 py-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 flex items-center gap-2"
                onClick={handleClearCart}
                disabled={isClearing}
              >
                {isClearing ? 'Clearing...' : 'Empty Cart'}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CartIcon className="w-10 h-10" strokeColor="#059669" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-600 mb-6">Looks like you haven't added any items yet.</p>
                <button
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition"
                  onClick={continueShopping}
                >
                  Start Shopping
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map(item => {
                  const itemPrice = item.discount_percent > 0
                    ? item.price_cents * (1 - item.discount_percent / 100)
                    : item.price_cents;
                  const itemTotal = itemPrice * item.quantity;
                  const isUpdating = updatingItems.has(item.id);

                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border p-4 gap-4 hover:shadow-md transition">
                      
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="text-gray-900 font-semibold">{item.title}</h3>
                          {item.description && <p className="text-gray-500 text-sm">{item.description}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg font-bold text-gray-900">{getFormattedPrice(itemPrice)}</span>
                            {item.discount_percent > 0 && (
                              <span className="text-sm text-gray-400 line-through">{getFormattedPrice(item.price_cents)}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating}
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{isUpdating ? '...' : item.quantity}</span>
                            <button
                              className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock_quantity || isUpdating}
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="text-rose-600 hover:text-rose-800 text-sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex-shrink-0 text-right">
                        <span className="font-bold text-gray-900">{getFormattedPrice(itemTotal)}</span>
                        <p className="text-gray-500 text-sm">{item.quantity} × {getFormattedPrice(itemPrice)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm sticky top-24 space-y-4"> 
                <h3 className="text-xl font-semibold text-gray-900">Order Summary</h3>
                {(() => {
                  const originalCents = getCartSubtotal();
                  const discountedCents = getCartTotal();
                  const savingsCents = getTotalDiscount();
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total price ({itemCount} items):</span>
                        <span className="font-medium text-gray-900">{getFormattedPrice(originalCents)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="text-emerald-600 font-medium">-{getFormattedPrice(savingsCents)}</span>
                      </div>
                    </>
                  );
                })()}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Amount to pay:</span>
                  <span className="text-emerald-600">{cartTotal}</span>
                </div>

                <button
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition"
                  onClick={handleCheckout}
                >
                  {user ? 'Proceed to Checkout' : 'Sign in & Checkout'}
                </button>

                <button
                  className="w-full py-3 bg-white border border-gray-300 rounded-xl hover:border-gray-400 transition"
                  onClick={continueShopping}
                >
                  Continue Shopping
                </button>
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
