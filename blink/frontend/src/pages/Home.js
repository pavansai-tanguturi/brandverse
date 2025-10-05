// src/pages/Home.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/App.css';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationName, setLocationName] = useState('Fetching location...');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [checkingDelivery, setCheckingDelivery] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [showDeliveryMessage, setShowDeliveryMessage] = useState(true);
  const categoriesRef = useRef(null);

  // Banners state
  const [banners, setBanners] = useState([]);

  // Fetch banners from backend
  const fetchBanners = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/banners`);
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      } else {
        console.error('Failed to fetch banners');
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  // Check scroll position and update arrow states
  const updateScrollButtons = () => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll categories left
  const scrollLeft = () => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollBy({ 
        left: -window.innerWidth * 0.8, 
        behavior: 'smooth' 
      });
    }
  };

  // Scroll categories right  
  const scrollRight = () => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollBy({ 
        left: window.innerWidth * 0.8, 
        behavior: 'smooth' 
      });
    }
  };

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        // Filter out 'All Products' category for home page display
        const filteredCategories = data.filter(cat => cat.slug !== 'all');
        setCategories(filteredCategories);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch products from admin panel
  const fetchProducts = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        
        // NEW DEBUG: Log each product ID specifically
        data.forEach((product, index) => {
          console.log(`Product ${index + 1}:`, {
            id: product.id,
            title: product.title,
            id_type: typeof product.id,
            id_length: product.id ? product.id.length : 'no id'
          });
        });
        
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

  // Updated checkDeliveryAvailability function:
  const checkDeliveryAvailability = async (country, region = null, city = null) => {
    if (!country || country === 'Unknown country') {
      setCheckingDelivery(false);
      setDeliveryAvailable(false);
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      // Build query parameters
      const params = new URLSearchParams({ country });
      if (region && region !== 'Unknown region') params.append('region', region);
      if (city && city !== 'Unknown city') params.append('city', city);

      const response = await fetch(`${API_BASE}/api/delivery/check?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setDeliveryAvailable(data.available);
        // Store the delivery message for display
        if (data.message) {
          setDeliveryMessage(data.message);
          setShowDeliveryMessage(true);
          // Hide the message after 1 second if delivery is available
          if (data.available) {
            setTimeout(() => setShowDeliveryMessage(false), 3000);
          }
        }
      } else {
        console.log('Delivery check failed, defaulting to unavailable');
        setDeliveryAvailable(false);
      }
    } catch (error) {
      console.log('Error checking delivery availability:', error);
      setDeliveryAvailable(false);
    }
    setCheckingDelivery(false);
  };

  // Banner carousel functionality
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change banner every 4 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

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

  // Initialize scroll buttons when categories load
  useEffect(() => {
    if (categories.length > 0) {
      setTimeout(updateScrollButtons, 100);
    }
  }, [categories]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchBanners();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          // Extract location details with better fallbacks
          const city = data.address.city || 
                      data.address.town || 
                      data.address.village || 
                      data.address.municipality || 
                      'Unknown city';
          const region = data.address.state || 
                        data.address.province || 
                        data.address.county || 
                        null;
          const country = data.address.country || 'Unknown country';
          setLocationName(`${city}${region ? `, ${region}` : ''}, ${country}`);
          setUserLocation({ 
            city, 
            region, 
            country, 
            latitude, 
            longitude,
            fullAddress: data.display_name
          });
          // Check delivery availability with all location details
          await checkDeliveryAvailability(country, region, city);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-16 lg:pb-0">
      <Navigation showSearch={true} />

      {/* Enhanced Delivery Status Banner */}
      {!checkingDelivery && showDeliveryMessage && (
        <div className={`border-l-4 p-4 mx-4 my-4 rounded-lg ${
          deliveryAvailable 
            ? 'bg-emerald-50 border-emerald-400' 
            : 'bg-amber-50 border-amber-400'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {deliveryAvailable ? (
                <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <div className="flex items-center space-x-2 mb-1">
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Current location: {locationName}
                </span>
              </div>
              <p className={`text-sm font-medium ${
                deliveryAvailable ? 'text-emerald-800' : 'text-amber-800'
              }`}>
                {deliveryMessage}
              </p>
              {!deliveryAvailable && (
                <p className="text-sm text-amber-600 mt-1">
                  We're working to expand our delivery locations. Please check back later or contact us for updates!
                </p>
              )}
              {deliveryAvailable && (
                <p className="text-sm text-emerald-600 mt-1">
                  You can place orders and enjoy our delivery service!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading state for delivery check */}
      {checkingDelivery && (
        <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 mx-4 my-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-emerald-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-emerald-800">
                Checking delivery availability for {locationName}...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Banner Carousel - FULL WIDTH */}
      <div className="w-full py-6">
        <div className="w-full">
          <div className="relative rounded-none overflow-hidden shadow-2xl group">
            {banners.length > 0 && banners[currentBannerIndex] ? (
              <>
                <div 
                  className="h-64 md:h-96 bg-cover bg-center relative flex items-center transition-all duration-700 ease-out w-full"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 40%, transparent 70%), url(${banners[currentBannerIndex].image_url})`,
                    backgroundColor: banners[currentBannerIndex].color || '#059669'
                  }}
                >
                  {/* Content Container */}
                  <div className="relative z-10 w-full px-6 sm:px-12 md:px-16 lg:px-20">
                    <div className="max-w-xl">
                      <div className="overflow-hidden mb-2">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in leading-tight tracking-tight">
                          {banners[currentBannerIndex].title}
                        </h1>
                      </div>
                      <div className="overflow-hidden mb-6">
                        <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-8 leading-relaxed font-light animate-fade-in-delay">
                          {banners[currentBannerIndex].subtitle}
                        </p>
                      </div>
                      <button 
                        className="bg-white text-gray-900 font-bold px-10 py-3.5 rounded-md transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl uppercase tracking-wide text-sm hover:bg-gray-50 animate-fade-in-delay-2"
                        onClick={() => {
                          const slug = banners[currentBannerIndex].category_slug;
                          if (slug) {
                            navigate(`/products?category=${slug}`);
                          }
                        }}
                      >
                        {banners[currentBannerIndex].button_text || 'Shop Now'}
                      </button>
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  {banners.length > 1 && (
                    <>
                      <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
                        onClick={() => setCurrentBannerIndex((currentBannerIndex - 1 + banners.length) % banners.length)}
                        aria-label="Previous banner"
                      >
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
                        onClick={() => setCurrentBannerIndex((currentBannerIndex + 1) % banners.length)}
                        aria-label="Next banner"
                      >
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Banner Navigation Dots */}
                {banners.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        className={`transition-all duration-300 rounded-full ${
                          index === currentBannerIndex 
                            ? 'w-8 h-2 bg-white shadow-lg' 
                            : 'w-2 h-2 bg-white/60 hover:bg-white/90 hover:scale-125'
                        }`}
                        onClick={() => setCurrentBannerIndex(index)}
                        aria-label={`Go to banner ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-64 md:h-96 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse w-full">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <span className="text-gray-500 text-lg font-medium">Loading banners...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }
      `}</style>

      {/* Myntra-style Circular Categories Section - FULL WIDTH CAROUSEL */}
      <div className="py-8 bg-white/90 backdrop-blur-sm w-full">
        <div className="w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Shop by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of products
            </p>
          </div>
          
          <div className="relative w-full">
            {/* Navigation Arrows */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm shadow-2xl rounded-full p-3 transition-all duration-300 hover:scale-110 hover:shadow-3xl hidden sm:block"
              >
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm shadow-2xl rounded-full p-3 transition-all duration-300 hover:scale-110 hover:shadow-3xl hidden sm:block"
              >
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Scrollable Circular Categories - FULL WIDTH */}
            <div 
              ref={categoriesRef}
              className="flex gap-6 sm:gap-8 md:gap-10 overflow-x-auto scrollbar-hide px-4 py-4 w-full"
              onScroll={updateScrollButtons}
            >
              {categories.length === 0 ? (
                // Loading skeleton for circular categories
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center flex-shrink-0 animate-pulse">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gray-300 mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                  </div>
                ))
              ) : (
                categories.map((category, index) => (
                  <div
                    key={category.id || index}
                    className="group cursor-pointer flex flex-col items-center flex-shrink-0"
                    onClick={() => navigate(`/products?category=${category.slug}`)}
                  >
                    <div className="relative mb-3">
                      {/* Circular Image Container */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 p-1 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 border-2 border-white">
                        <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden">
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </div>
                      
                      {/* Hover Effect Ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-emerald-300 transition-all duration-300 scale-110"></div>
                    </div>
                    
                    {/* Category Name */}
                    <p className="text-xs sm:text-sm font-medium text-gray-700 text-center group-hover:text-emerald-600 transition-colors duration-300 max-w-[80px] sm:max-w-[100px] truncate">
                      {category.name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section - 2 PRODUCTS PER ROW ON SMALL SCREENS */}
      <div className="py-16 bg-gradient-to-b from-white to-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Featured Products
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Handpicked items just for you
              </p>
            </div>
            <Link to="/products" className="bg-white text-emerald-600 hover:text-emerald-700 font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group border border-emerald-100 hidden sm:flex">
              <span className="text-sm sm:text-base">View All</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden group border border-gray-100"
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{ minHeight: '220px', maxHeight: '260px' }}
                >
                  <div className="relative">
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80'} 
                      alt={product.title || 'Product'}
                      className="w-full h-28 sm:h-48 md:h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {product.discount_percent && Number(product.discount_percent) > 0 ? (
                      <div className="absolute top-1 left-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg">
                        {Number(product.discount_percent)}% OFF
                      </div>
                    ) : null}
                    {/* Stock Status Badge */}
                    {product.stock_quantity <= 0 && (
                      <div className="absolute top-1 right-1 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Out of Stock
                      </div>
                    )}
                  </div>
                  <div className="p-2 sm:p-4 md:p-6">
                    <h3 className="font-bold text-xs sm:text-lg text-gray-900 mb-1 sm:mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {product.title || 'Product Name'}
                    </h3>
                    {/* Category */}
                    {product.category && (
                      <p className="text-[10px] sm:text-sm text-gray-500 mb-1 sm:mb-3">
                        {product.category.name}
                      </p>
                    )}
                    <p className="text-gray-600 text-[10px] sm:text-sm mb-2 sm:mb-4 line-clamp-2 leading-relaxed hidden sm:block">
                      {product.description || 'No description available'}
                    </p>
                    {/* Price Section */}
                    <div className="mb-2 sm:mb-4">
                      {product.discount_percent && Number(product.discount_percent) > 0 ? (
                        <div className="space-y-0.5 sm:space-y-2">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <span className="text-sm sm:text-xl md:text-2xl font-bold text-emerald-600">
                              ₹{((product.price_cents / 100) * (1 - product.discount_percent / 100)).toFixed(2)}
                            </span>
                            <span className="text-gray-500 line-through text-[10px] sm:text-sm">
                              ₹{(product.price_cents / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <span className="text-emerald-600 font-semibold text-[10px]">
                              Save ₹{((product.price_cents / 100) * (product.discount_percent / 100)).toFixed(2)}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] font-bold">
                              {Number(product.discount_percent)}% OFF
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm sm:text-xl md:text-2xl font-bold text-gray-900">
                          ₹{(product.price_cents / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {/* Add to Cart Button */}
                    <button 
                      className={`w-full py-1 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-xl font-semibold transition-all duration-300 text-[10px] sm:text-sm ${
                        product.stock_quantity <= 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
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
              
              {/* View More Products */}
              {products.length > 8 && (
                <div className="col-span-full flex justify-center mt-8">
                  <Link to="/products" className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base">
                    View More Products
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              )}
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default Home;