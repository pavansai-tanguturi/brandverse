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
      const API_BASE = import.meta.env.VITE_API_BASE;
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
    <div className="min-h-screen bg-gray-100">
      {/* Modern Navigation Header */}
      <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src={logo}
                className="h-10 w-10 md:h-12 md:w-12 rounded-lg"
                alt="Brandverse"
              />
              <span className="text-white font-bold text-lg md:text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Brandverse
              </span>
            </div>

            {/* Location Display - Hidden on small screens */}
            <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2 cursor-pointer hover:bg-white/20 transition-all" onClick={() => navigate('/delivery-locations')}>
              <img src={locationIcon} className="h-5 w-5" alt="location" />
              <div className="flex flex-col">
                <span className="text-gray-300 text-xs uppercase tracking-wide">Deliver to</span>
                <span className="text-white text-sm font-medium">{locationName}</span>
              </div>
            </div>

            {/* Search Bar - Responsive */}
            <form className="flex-1 max-w-md mx-4 hidden md:block" onSubmit={handleSearch}>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* User Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <Link to="/dashboard" className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-3 py-2 text-white hover:bg-white/20 transition-all">
                    <div className="bg-orange-500 rounded-full p-1">
                      <CustomerIcon width={16} height={16} color="white" />
                    </div>
                    <span className="text-sm">Hi, {user.name || user.email?.split('@')[0] || 'User'}</span>
                  </Link>
                  <button 
                    className="hidden md:block bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all"
                    onClick={() => navigate('/logout')}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all">
                  Login
                </Link>
              )}

              {/* Cart */}
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-3 py-2 cursor-pointer hover:bg-white/20 transition-all" onClick={() => navigate('/cart')}>
                <CartIcon width={20} height={20} color="white" strokeWidth={2} />
                <span className="hidden md:inline text-white text-sm">Cart</span>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <form className="md:hidden pb-4" onSubmit={handleSearch}>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Delivery Restriction Banner */}
      {!checkingDelivery && !deliveryAvailable && userLocation?.country && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 my-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                We're sorry, but we currently don't deliver to {userLocation.country}.
              </p>
              <p className="text-sm text-red-600 mt-1">
                We're working to expand our delivery locations. Please check back later!
              </p>
            </div>
          </div>
        </div>
      )}

      {checkingDelivery && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 my-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Checking delivery availability for your location...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Banner Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          <div 
            className="h-64 md:h-96 bg-cover bg-center relative flex items-center transition-all duration-700"
            style={{ 
              backgroundImage: `url(${banners[currentBannerIndex].image})`,
              backgroundColor: banners[currentBannerIndex].color || '#2563eb'
            }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
            
            {/* Content */}
            <div className="relative z-10 text-white px-8 md:px-16 max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {banners[currentBannerIndex].title}
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-200 leading-relaxed">
                {banners[currentBannerIndex].subtitle}
              </p>
              <button 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => navigate(banners[currentBannerIndex].link)}
              >
                {banners[currentBannerIndex].buttonText}
              </button>
            </div>
          </div>
          
          {/* Banner Navigation Dots */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentBannerIndex 
                    ? 'bg-white shadow-lg scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                onClick={() => setCurrentBannerIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Featured Products
            </h2>
            <Link to="/products" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-2 group">
              <span>View All Products</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden group"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="relative">
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80'} 
                      alt={product.title || 'Product'}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {product.discount_percent && product.discount_percent > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {product.discount_percent}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {product.title || 'Product Name'}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description || 'No description available'}
                    </p>
                    <div className="mb-4">
                      {product.discount_percent && product.discount_percent > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-green-600">
                              ₹{((product.price_cents / 100) * (1 - product.discount_percent / 100)).toFixed(2)}
                            </span>
                            <span className="text-gray-500 line-through">
                              ₹{(product.price_cents / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600 font-semibold text-sm">
                              Save ₹{((product.price_cents / 100) * (product.discount_percent / 100)).toFixed(2)}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                              {product.discount_percent}% OFF
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{(product.price_cents / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button 
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                        product.stock_quantity <= 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id}`);
                      }}
                      disabled={product.stock_quantity <= 0}
                    >
                      {product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                </svg>
                <p className="text-lg">No products available at the moment.</p>
                <p className="text-sm">Please check back later!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Shop by Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover everything you need, organized just for you
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.slice(0, 12).map((item, index) => (
              <div
                key={index}
                className="group cursor-pointer"
                onClick={() => navigate(`/category/${item.path || 'category'}`)}
              >
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 mb-3 group-hover:shadow-lg transform group-hover:scale-105 transition-all duration-300">
                  <img 
                    src={item.image} 
                    alt={item.name || 'Category'} 
                    className="w-full h-16 md:h-20 object-cover rounded-xl group-hover:scale-110 transition-transform duration-300" 
                  />
                </div>
                <p className="text-center text-sm md:text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.name || 'Category'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;
