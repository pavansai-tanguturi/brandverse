import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { CustomerIcon, CartIcon } from '../components/icons';
import logo from '../assets/logos.png';
import locationIcon from '../assets/location.png';
import Footer from '../components/Footer';
import '../styles/App.css';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Use product images if available, otherwise use primary image_url, otherwise fallback
  const productImages = useMemo(() => {
    if (!product) return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    
    if (product.product_images && product.product_images.length > 0) {
      // Use all available product images with signed URLs
      const validImages = product.product_images
        .filter(img => img.url) // Only include images with valid URLs
        .map(img => img.url);
      return validImages.length > 0 ? validImages : [product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    } else if (product.image_url) {
      // Fallback to single image_url
      return [product.image_url];
    } else {
      // Final fallback to placeholder
      return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    }
  }, [product]);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        console.error('Failed to fetch product');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);



  const calculateDiscountedPrice = (price, discount) => {
    if (discount && discount > 0) {
      return (price * (1 - discount / 100)).toFixed(2);
    }
    return price;
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="modern-header">
          <div className="header-container">
            <div className="brand-section">
              <img
                src={logo}
                className="brand-logo"
                alt="Brandverse"
                onClick={() => navigate('/')}
              />
              <span className="brand-name">Brandverse</span>
            </div>
          </div>
        </header>
        
        <div className="loading-container" style={{ paddingTop: '100px' }}>
          <div className="loading-spinner"></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="modern-header">
          <div className="header-container">
            <div className="brand-section">
              <img
                src={logo}
                className="brand-logo"
                alt="Brandverse"
                onClick={() => navigate('/')}
              />
              <span className="brand-name">Brandverse</span>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-8" style={{ paddingTop: '100px' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <button 
              onClick={() => navigate('/')}
              className="banner-button"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navigation Header */}
      <header className="modern-header">
        <div className="header-container">
          {/* Logo and Brand */}
          <div className="brand-section">
            <img
              src={logo}
              className="brand-logo"
              alt="Brandverse"
              onClick={() => navigate('/')}
            />
            <span className="brand-name">Brandverse</span>
          </div>

          {/* Location Display */}
          <div className="location-section" onClick={() => navigate('/delivery-locations')}>
            <img src={locationIcon} className="location-icon" alt="location" />
            <div className="location-info">
              <span className="location-label">Deliver to</span>
              <span className="location-text">Your Location</span>
            </div>
          </div>

          {/* Search Bar */}
          <form className="search-section">
            <input 
              type="text" 
              placeholder="Search for products, brands and more..." 
              className="search-input"
            />
            <button type="submit" className="search-button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* User Actions */}
          <div className="user-actions">
            {user ? (
              <div className="user-menu">
                <Link to="/dashboard" className="user-profile">
                  <div className="customer-icon">
                    <CustomerIcon width={24} height={24} color="#F18500" />
                  </div>
                  <span>Hi, {user.name || user.email?.split('@')[0] || 'User'}</span>
                </Link>
                <button 
                  className="logout-button" 
                  onClick={() => navigate('/logout')}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-button">Login</Link>
              </div>
            )}

            {/* Cart */}
            <div className="cart-section" onClick={() => navigate('/cart')}>
              <CartIcon width={24} height={24} color="#F18500" strokeWidth={2} />
              <span className="cart-text">Cart</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8" style={{ paddingTop: '100px' }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="back-button mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image-container">
              <img 
                src={productImages[selectedImage]} 
                alt={product.title}
                className="main-product-image"
              />
              {product.discount_percent > 0 && (
                <div className="discount-badge-large">
                  {product.discount_percent}% OFF
                </div>
              )}
            </div>
            
            {productImages.length > 1 && (
              <div className="image-thumbnails">
                {productImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.title} view ${index + 1}`}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="product-details">
            <h1 className="product-title">{product.title}</h1>
            
            <div className="product-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`star ${i < 4 ? 'filled' : ''}`}>★</span>
                ))}
              </div>
              <span className="rating-text">(4.0) 125 reviews</span>
            </div>

            <div className="product-pricing-large">
              {product.discount_percent > 0 ? (
                <>
                  <span className="discounted-price">₹{calculateDiscountedPrice(product.price_cents / 100, product.discount_percent)}</span>
                  <span className="original-price">₹{(product.price_cents / 100).toFixed(2)}</span>
                  <span className="savings">You save ₹{((product.price_cents / 100) - calculateDiscountedPrice(product.price_cents / 100, product.discount_percent)).toFixed(2)}</span>
                </>
              ) : (
                <span className="current-price">₹{(product.price_cents / 100).toFixed(2)}</span>
              )}
            </div>

            <div className="product-description">
              <h3>Product Description</h3>
              <p>{product.description || 'No description available for this product.'}</p>
            </div>

            <div className="product-details-info">
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{product.category || 'General'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Stock:</span>
                <span className={`detail-value ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">SKU:</span>
                <span className="detail-value">#{product.id.toString().padStart(6, '0')}</span>
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="purchase-section">
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <div className="quantity-controls">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuantity(Math.max(1, quantity - 1));
                    }}
                    className="quantity-btn"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input 
                    id="quantity"
                    type="number" 
                    value={quantity} 
                    onChange={(e) => {
                      e.stopPropagation();
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                    }}
                    min="1"
                    max={product.stock_quantity || 99}
                    className="quantity-input"
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuantity(Math.min(product.stock_quantity || 99, quantity + 1));
                    }}
                    className="quantity-btn"
                    disabled={quantity >= (product.stock_quantity || 99)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  onClick={() => {
                    if (isInWishlist(product.id)) {
                      removeFromWishlist(product.id);
                    } else {
                      // Use the correct image from productImages array
                      const productWithCorrectImage = {
                        ...product,
                        image_url: productImages[0] // Use the first image from our computed array
                      };
                      addToWishlist(productWithCorrectImage);
                    }
                  }}
                  className={`wishlist-btn ${isInWishlist(product.id) ? 'wishlist-btn-active' : ''}`}
                  title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <svg width="20" height="20" fill={isInWishlist(product.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await addToCart(product, quantity);
                      navigate('/cart');
                    } catch (error) {
                      console.error('Error adding to cart:', error);
                      alert('Error adding product to cart');
                    }
                  }}
                  className="buy-now-btn"
                  disabled={product.stock_quantity <= 0}
                >
                  Proceed
                </button>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="delivery-info">
              <h4>Delivery Information</h4>
              <div className="delivery-options">
                <div className="delivery-option">
                  <div className="delivery-icon">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="delivery-title">Standard Delivery</p>
                    <p className="delivery-desc">5-7 business days - Free on orders over ₹2000</p>
                  </div>
                </div>
                <div className="delivery-option">
                  <div className="delivery-icon">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="delivery-title">Express Delivery</p>
                    <p className="delivery-desc">1-2 business days - ₹499</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="related-products">
          <h3 className="section-title">Related Products</h3>
          <p className="section-subtitle">You might also like these products</p>
          {/* This could be populated with related products from the same category */}
          <div className="text-center text-gray-500 py-8">
            <p>Related products coming soon...</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductPage;
