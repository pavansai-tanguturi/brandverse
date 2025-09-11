// src/pages/Home.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CustomerIcon, CartIcon } from '../components/icons';
import logo from '../assets/logos.png';
import locationIcon from '../assets/location.png';
import Footer from '../components/Footer';
import '../styles/App.css';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationName, setLocationName] = useState('Fetching location...');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [checkingDelivery, setCheckingDelivery] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Fetch products from admin panel
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched products:', data); // Debug log
        setProducts(data.slice(0, 12)); // Show first 12 products on home page
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Banner carousel functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change banner every 4 seconds

    return () => clearInterval(interval);
  }); // Removed dependency array to avoid stale closure

  // Prevent admin access from customer interface
  const checkAdminAccess = useCallback(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }
    
    // If customer tries to access admin routes, show 401 error
    if (window.location.pathname.includes('/admin')) {
      navigate('/401');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const banners = [
    {
      id: 1,
      title: "Fresh Dairy, Everyday",
      subtitle: "Farm-fresh milk, cheese, and dairy products delivered to your doorstep",
      buttonText: "Shop Dairy",
      link: "/category/dairy",
      image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      color: "#2563eb"
    },
    {
      id: 2,
      title: "Fresh Groceries",
      subtitle: "Quality groceries at unbeatable prices - delivered fresh daily",
      buttonText: "Shop Groceries",
      link: "/category/groceries",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      color: "#059669"
    },
    {
      id: 3,
      title: "Health & Wellness",
      subtitle: "Your health is our priority - pharmacy and wellness products",
      buttonText: "Shop Health",
      link: "/category/pharmacy",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      color: "#dc2626"
    },
    {
      id: 4,
      title: "Pet Care Essentials",
      subtitle: "Everything your furry friends need for a happy, healthy life",
      buttonText: "Shop Pet Care",
      link: "/category/pet-care",
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      color: "#7c3aed"
    }
  ];

  const categories = [
    { name: "Dairy & Breakfast", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=200&q=80", path: "dairy" },
    { name: "Vegetables & Fruits", image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=200&q=80", path: "vegetables" },
    { name: "Cold Drinks & Juices", image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=200&q=80", path: "drinks" },
    { name: "Bakery & Biscuits", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80", path: "bakery" },
    { name: "Dry Fruits, Masala & Oil", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=200&q=80", path: "dry-fruits" },
    { name: "Ice Creams & Desserts", image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=200&q=80", path: "ice-cream" },
    { name: "Beauty & Cosmetics", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=200&q=80", path: "beauty" },
    { name: "Stationery Needs", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=200&q=80", path: "stationery" },
    { name: "Instant & Frozen Food", image: "https://images.unsplash.com/photo-1571197119011-ee0bb51c1535?auto=format&fit=crop&w=200&q=80", path: "frozen" },
    { name: "Sweet Tooth", image: "https://images.unsplash.com/photo-1571506165871-eafa2e5cd440?auto=format&fit=crop&w=200&q=80", path: "sweets" },
    { name: "Sauces & Spreads", image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=200&q=80", path: "sauces" },
    { name: "Organic & Premium", image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=200&q=80", path: "organic" },
    { name: "Cleaning Essentials", image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=200&q=80", path: "cleaning" },
    { name: "Personal Care", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=200&q=80", path: "personal-care" },
    { name: "Fashion & Accessories", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80", path: "fashion" },
    { name: "Tea, Coffee & Health Drinks", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=200&q=80", path: "beverages" },
    { name: "Atta, Rice & Dal", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80", path: "grains" },
    { name: "Baby Care", image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=200&q=80", path: "baby-care" },
    { name: "Pet Care", image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=200&q=80", path: "pet-care" }
  ];

  useEffect(() => {
    fetchProducts();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || 'Unknown location';
          const country = data.address.country || '';
          
          setLocationName(city);
          setUserLocation({ city, country, latitude, longitude });
          
          // Check delivery availability
          await checkDeliveryAvailability(country);
        } catch (error) {
          console.error('Error fetching location name:', error);
          setLocationName('Location unavailable');
          setCheckingDelivery(false);
        }
      }, () => {
        setLocationName('Location permission denied');
        setCheckingDelivery(false);
      });
    } else {
      setLocationName('Geolocation not supported');
      setCheckingDelivery(false);
    }
  }, []);

  const checkDeliveryAvailability = async (country) => {
    if (!country) {
      setCheckingDelivery(false);
      return;
    }

    try {
      const API_BASE = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${API_BASE}/api/delivery/check?country=${encodeURIComponent(country)}`);
      
      if (response.ok) {
        const data = await response.json();
        setDeliveryAvailable(data.available);
      } else {
        console.log('Delivery check failed, defaulting to available');
        setDeliveryAvailable(true); // Default to available if check fails
      }
    } catch (error) {
      console.log('Error checking delivery availability, defaulting to available:', error);
      setDeliveryAvailable(true); // Default to available if check fails
    }
    
    setCheckingDelivery(false);
  };

  return (
    <div className="App">
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
              <span className="location-text">{locationName}</span>
            </div>
          </div>

          {/* Search Bar */}
          <form className="search-section" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search for products, brands and more..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Delivery Restriction Banner */}
      {!checkingDelivery && !deliveryAvailable && userLocation?.country && (
        <div className="delivery-banner error">
          <div className="delivery-banner-content">
            <div className="banner-icon">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="banner-text">
              <p className="banner-message">
                We're sorry, but we currently don't deliver to {userLocation.country}.
              </p>
              <p className="banner-submessage">
                We're working to expand our delivery locations. Please check back later!
              </p>
            </div>
          </div>
        </div>
      )}

      {checkingDelivery && (
        <div className="delivery-banner loading">
          <div className="delivery-banner-content">
            <div className="banner-icon">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="banner-text">
              <p className="banner-message">Checking delivery availability for your location...</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Banner Carousel */}
      <div className="banner-carousel">
        <div className="banner-container">
          <div 
            className="banner-slide"
            style={{ 
              backgroundImage: `url(${banners[currentBannerIndex].image})`,
              backgroundColor: banners[currentBannerIndex].color || '#2563eb'
            }}
          >
            <div className="banner-overlay"></div>
            <div className="banner-content">
              <h1 className="banner-title">{banners[currentBannerIndex].title}</h1>
              <p className="banner-subtitle">{banners[currentBannerIndex].subtitle}</p>
              <button 
                className="banner-button"
                onClick={() => navigate(banners[currentBannerIndex].link)}
              >
                {banners[currentBannerIndex].buttonText}
              </button>
            </div>
          </div>
          
          {/* Banner Navigation Dots */}
          <div className="banner-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`banner-dot ${index === currentBannerIndex ? 'active' : ''}`}
                onClick={() => setCurrentBannerIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="products-section">
        <div className="section-header">
          <h2 className="section-title">Featured Products</h2>
          <Link to="/products" className="view-all-link">View All Products →</Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="product-image-container">
                  <img 
                    src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80'} 
                    alt={product.title || 'Product'}
                    className="product-image"
                  />
                  {product.discount_percent && product.discount_percent > 0 && (
                    <div className="discount-badge">
                      {product.discount_percent}% OFF
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.title || 'Product Name'}</h3>
                  <p className="product-description">{product.description || 'No description available'}</p>
                  <div className="product-pricing">
                    {product.discount_percent && product.discount_percent > 0 ? (
                      <>
                        <div className="product-discount-info">
                          <span className="product-price">₹{((product.price_cents / 100) * (1 - product.discount_percent / 100)).toFixed(2)}</span>
                          <span className="product-original-price">₹{(product.price_cents / 100).toFixed(2)}</span>
                        </div>
                        <div className="product-discount-info">
                          <span className="product-savings">Save ₹{((product.price_cents / 100) * (product.discount_percent / 100)).toFixed(2)}</span>
                          <span className="product-discount-percent">{product.discount_percent}% OFF</span>
                        </div>
                      </>
                    ) : (
                      <span className="product-price">₹{(product.price_cents / 100).toFixed(2)}</span>
                    )}
                  </div>
                  <button className="add-to-cart-btn">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products">
            <p>No products available at the moment. Please check back later!</p>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="categories-section">
        <div className="section-header">
          <h2 className="section-title">Shop by Categories</h2>
          <p className="section-subtitle">Discover everything you need, organized just for you</p>
        </div>
        <div className="categories-grid">
          {categories.map((item, index) => (
            <div
              className="category-card"
              key={index}
              onClick={() => navigate(`/category/${item.path || 'category'}`)}
            >
              <div className="category-image-container">
                <img src={item.image} alt={item.name || 'Category'} className="category-image" />
              </div>
              <p className="category-name">{item.name || 'Category'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;
