import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartIcon from './CartIcon';
import '../styles/MiniCart.css';

const MiniCart = () => {
  const navigate = useNavigate();
  const {
    items,
    itemCount,
    cartTotal,
    getFormattedPrice,
    updateQuantity,
    removeFromCart
  } = useCart();
  
  const [isOpen, setIsOpen] = useState(false);

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const goToCart = () => {
    setIsOpen(false);
    navigate('/cart');
  };

  const goToCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <div className="mini-cart-container">
      {/* Cart Icon with Badge */}
      <div className="cart-trigger" onClick={toggleCart}>
        <div className="cart-icon">
          <CartIcon className="w-6 h-6" strokeColor="currentColor" />
          {itemCount > 0 && (
            <span className="cart-badge">{itemCount}</span>
          )}
        </div>
        <span className="cart-text">Cart</span>
      </div>

      {/* Dropdown Cart */}
      {isOpen && (
        <>
          <div className="mini-cart-overlay" onClick={() => setIsOpen(false)} />
          <div className="mini-cart-dropdown">
            <div className="mini-cart-header">
              <h3>Shopping Cart ({itemCount} items)</h3>
              <button className="close-cart" onClick={() => setIsOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mini-cart-content">
              {items.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">
                    <CartIcon className="w-12 h-12" strokeColor="currentColor" />
                  </div>
                  <p>Your cart is empty</p>
                  <button className="continue-shopping" onClick={() => setIsOpen(false)}>
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {items.map((item) => {
                      const itemPrice = item.discount_percent > 0 
                        ? (item.price_cents * (1 - item.discount_percent / 100))
                        : item.price_cents;
                      
                      return (
                        <div key={item.id} className="cart-item">
                          <div className="item-image">
                            <img 
                              src={item.image_url || '/placeholder-product.png'} 
                              alt={item.title}
                              onError={(e) => {
                                e.target.src = '/placeholder-product.png';
                              }}
                            />
                          </div>
                          
                          <div className="item-details">
                            <h4 className="item-title">{item.title}</h4>
                            <div className="item-price">
                              {item.discount_percent > 0 ? (
                                <>
                                  <span className="discounted-price">
                                    {getFormattedPrice(itemPrice)}
                                  </span>
                                  <span className="original-price">
                                    {getFormattedPrice(item.price_cents)}
                                  </span>
                                </>
                              ) : (
                                <span className="price">
                                  {getFormattedPrice(item.price_cents)}
                                </span>
                              )}
                            </div>
                            
                            <div className="quantity-controls">
                              <button 
                                className="quantity-btn"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span className="quantity">{item.quantity}</span>
                              <button 
                                className="quantity-btn"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock_quantity}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          <div className="item-actions">
                            <div className="item-total">
                              {getFormattedPrice(itemPrice * item.quantity)}
                            </div>
                            <button 
                              className="remove-item"
                              onClick={() => removeFromCart(item.id)}
                              title="Remove item"
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="cart-summary">
                    <div className="total-section">
                      <div className="total-row">
                        <span>Total:</span>
                        <span className="total-price">{cartTotal}</span>
                      </div>
                    </div>
                    
                    <div className="cart-actions">
                      <button className="view-cart-btn" onClick={goToCart}>
                        View Cart
                      </button>
                      <button className="checkout-btn" onClick={goToCheckout}>
                        Checkout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MiniCart;
