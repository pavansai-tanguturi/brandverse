import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import '../styles/CartPage.css';

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

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
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
      // Redirect to login with return path
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
      <div className="cart-page">
        <div className="cart-container">
        {/* Header */}
        <div className="cart-header">
          <h1 className="cart-title">Shopping Cart</h1>
          {itemCount > 0 && (
            <div className="cart-count">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart */
          <div className="empty-cart-page">
            <div className="empty-cart-content">
              <div className="empty-cart-icon">
                <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9" />
                </svg>
              </div>
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added any items to your cart yet.</p>
              <button className="continue-shopping-btn" onClick={continueShopping}>
                Start Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="cart-content">
            {/* Cart Items Section */}
            <div className="cart-items-section">
              <div className="cart-items-header">
                <h2>Items in your cart</h2>
                <button 
                  className="clear-cart-btn" 
                  onClick={handleClearCart}
                  disabled={isClearing}
                >
                  {isClearing ? 'Clearing...' : 'Clear Cart'}
                </button>
              </div>

              <div className="cart-items-list">
                {items.map((item) => {
                  const itemPrice = item.discount_percent > 0 
                    ? (item.price_cents * (1 - item.discount_percent / 100))
                    : item.price_cents;
                  const itemTotal = itemPrice * item.quantity;
                  const itemSavings = item.discount_percent > 0 
                    ? (item.price_cents - itemPrice) * item.quantity
                    : 0;

                  return (
                    <div key={item.id} className="cart-item-card">
                      <div className="item-image-section">
                        <img 
                          src={item.image_url || '/placeholder-product.png'} 
                          alt={item.title}
                          className="item-image"
                          onError={(e) => {
                            e.target.src = '/placeholder-product.png';
                          }}
                        />
                      </div>

                      <div className="item-details-section">
                        <h3 className="item-title">{item.title}</h3>
                        {item.description && (
                          <p className="item-description">{item.description}</p>
                        )}
                        
                        <div className="item-pricing">
                          {item.discount_percent > 0 ? (
                            <div className="pricing-with-discount">
                              <span className="current-price">
                                {getFormattedPrice(itemPrice)}
                              </span>
                              <span className="original-price">
                                {getFormattedPrice(item.price_cents)}
                              </span>
                              <span className="discount-badge">
                                {item.discount_percent}% OFF
                              </span>
                            </div>
                          ) : (
                            <span className="item-price">
                              {getFormattedPrice(item.price_cents)}
                            </span>
                          )}
                        </div>

                        {itemSavings > 0 && (
                          <div className="item-savings">
                            You save: {getFormattedPrice(itemSavings)}
                          </div>
                        )}

                        <div className="item-stock-info">
                          {item.stock_quantity > 0 ? (
                            <span className="in-stock">
                              {item.stock_quantity > 10 ? 'In Stock' : `Only ${item.stock_quantity} left`}
                            </span>
                          ) : (
                            <span className="out-of-stock">Out of Stock</span>
                          )}
                        </div>
                      </div>

                      <div className="item-actions-section">
                        <div className="quantity-section">
                          <label className="quantity-label">Quantity:</label>
                          <div className="quantity-controls">
                            <button 
                              className="quantity-btn decrease"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              className="quantity-input"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 1;
                                if (newQuantity >= 1 && newQuantity <= item.stock_quantity) {
                                  handleQuantityChange(item.id, newQuantity);
                                }
                              }}
                              min="1"
                              max={item.stock_quantity}
                            />
                            <button 
                              className="quantity-btn increase"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock_quantity}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="item-total-section">
                          <div className="item-total-price">
                            {getFormattedPrice(itemTotal)}
                          </div>
                        </div>

                        <button 
                          className="remove-item-btn"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove from cart"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart Summary Section */}
            <div className="cart-summary-section">
              <div className="cart-summary-card">
                <h3 className="summary-title">Order Summary</h3>
                
                <div className="summary-details">
                  <div className="summary-row">
                    <span>Subtotal ({itemCount} items):</span>
                    <span>{cartSubtotal}</span>
                  </div>
                  
                  {totalSavings > 0 && (
                    <div className="summary-row savings">
                      <span>Total Savings:</span>
                      <span className="savings-amount">-{getFormattedPrice(totalSavings)}</span>
                    </div>
                  )}
                  
                  <div className="summary-row shipping">
                    <span>Shipping:</span>
                    <span className="free-shipping">FREE</span>
                  </div>
                  
                  <div className="summary-row tax">
                    <span>Tax:</span>
                    <span>Calculated at checkout</span>
                  </div>
                  
                  <hr className="summary-divider" />
                  
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span className="total-amount">{cartTotal}</span>
                  </div>
                </div>

                <div className="checkout-section">
                  {!user && (
                    <div className="login-reminder">
                      <p>Sign in to save your cart and checkout faster</p>
                    </div>
                  )}
                  
                  <button 
                    className="checkout-btn"
                    onClick={handleCheckout}
                  >
                    {user ? 'Proceed to Checkout' : 'Sign in & Checkout'}
                  </button>
                  
                  <button 
                    className="continue-shopping-link"
                    onClick={continueShopping}
                  >
                    Continue Shopping
                  </button>
                </div>

                {/* Security Badge */}
                <div className="security-info">
                  <div className="security-icons">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    <span>Secure Checkout</span>
                  </div>
                  <p>Your payment information is encrypted and secure</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default CartPage;
