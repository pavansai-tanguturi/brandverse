import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, itemCount, cartTotal } = useCart();

  React.useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    // Redirect to cart if no items
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
  }, [user, items, navigate]);

  if (!user || items.length === 0) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div style={{ paddingTop: '100px', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1>Checkout</h1>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: '8px', 
            padding: '40px 20px',
            margin: '20px 0'
          }}>
            <h2 style={{ color: '#0ea5e9', marginBottom: '16px' }}>🚧 Coming Soon!</h2>
            <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
              The checkout functionality is currently under development. 
              This will include:
            </p>
            <ul style={{ 
              textAlign: 'left', 
              maxWidth: '400px', 
              margin: '0 auto 20px auto',
              lineHeight: '1.8'
            }}>
              <li>Shipping address form</li>
              <li>Payment method selection</li>
              <li>Order review and confirmation</li>
              <li>Payment processing integration</li>
              <li>Order tracking</li>
            </ul>
            
            <div style={{ 
              background: 'white', 
              padding: '16px', 
              borderRadius: '6px',
              margin: '20px 0'
            }}>
              <h3 style={{ margin: '0 0 8px 0' }}>Order Summary</h3>
              <p style={{ margin: '0' }}>
                <strong>{itemCount} items - Total: {cartTotal}</strong>
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/cart')}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                background: 'white',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ← Back to Cart
            </button>
            <button 
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
