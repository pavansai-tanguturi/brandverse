// src/pages/Home.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const categoriesRef = useRef(null);

  // Get category image based on slug
  const getCategoryImage = (slug) => {
    const imageMap = {
      'dairy': "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=200&q=80",
      'vegetables': "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=200&q=80",
      'drinks': "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=200&q=80",
      'bakery': "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80",
      'grains': "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80",
      'beverages': "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=200&q=80",
      'personal-care': "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=200&q=80",
      'cleaning': "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=200&q=80",
      'frozen': "https://images.unsplash.com/photo-1571197119011-ee0bb51c1535?auto=format&fit=crop&w=200&q=80",
      'beauty': "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=200&q=80",
      'organic': "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=200&q=80"
    };
    return imageMap[slug] || "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=200&q=80";
  };

  // Banner data - moved before useEffect that references it
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
      const isMobile = window.innerWidth < 640;
      const scrollAmount = isMobile 
        ? 320 + 16 // Category width (320px) + gap (16px)
        : Math.min(500, categoriesRef.current.clientWidth * 0.8);
      categoriesRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  // Scroll categories right  
  const scrollRight = () => {
    if (categoriesRef.current) {
      const isMobile = window.innerWidth < 640;
      const scrollAmount = isMobile 
        ? 320 + 16 // Category width (320px) + gap (16px)
        : Math.min(500, categoriesRef.current.clientWidth * 0.8);
      categoriesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories');
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
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change banner every 4 seconds

    return () => clearInterval(interval);
  }, [banners.length]); // Added proper dependency array

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation showSearch={true} />

      {/* Enhanced Delivery Status Banner */}
      {!checkingDelivery && (
        <div className={`border-l-4 p-4 mx-4 my-4 rounded-lg ${
          deliveryAvailable 
            ? 'bg-green-50 border-green-400' 
            : 'bg-red-50 border-red-400'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {deliveryAvailable ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
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
                deliveryAvailable ? 'text-green-800' : 'text-red-800'
              }`}>
                {deliveryMessage || (deliveryAvailable 
                  ? `Great! We deliver to your location.` 
                  : `We're sorry, but we currently don't deliver to your area.`
                )}
              </p>
              {!deliveryAvailable && (
                <p className="text-sm text-red-600 mt-1">
                  We're working to expand our delivery locations. Please check back later or contact us for updates!
                </p>
              )}
              {deliveryAvailable && (
                <p className="text-sm text-green-600 mt-1">
                  You can place orders and enjoy our delivery service!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading state for delivery check */}
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
                Checking delivery availability for {locationName}...
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
      <div className="bg-white/70 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                    {product.discount_percent && Number(product.discount_percent) > 0 ? (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {Number(product.discount_percent)}% OFF
                      </div>
                    ) : null}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {product.title || 'Product Name'}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description || 'No description available'}
                    </p>
                    <div className="mb-4">
                      {product.discount_percent && Number(product.discount_percent) > 0 ? (
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
                              {Number(product.discount_percent)}% OFF
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
      <div className="py-16 bg-white/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Shop by Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover everything you need, organized just for you
            </p>
          </div>
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={scrollLeft}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm shadow-xl rounded-full p-3 transition-all duration-300 ${
                canScrollLeft ? 'opacity-100 hover:shadow-2xl hover:bg-white' : 'opacity-30 cursor-not-allowed'
              }`}
              disabled={!canScrollLeft}
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Arrow */}
            <button
              onClick={scrollRight}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm shadow-xl rounded-full p-3 transition-all duration-300 ${
                canScrollRight ? 'opacity-100 hover:shadow-2xl hover:bg-white' : 'opacity-30 cursor-not-allowed'
              }`}
              disabled={!canScrollRight}
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Scrollable Categories Container */}
            <div 
              ref={categoriesRef}
              className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide px-4 py-4"
              onScroll={updateScrollButtons}
            >
              {categories.length === 0 ? (
                // Loading skeleton for categories
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-80 sm:w-80 md:w-96 lg:w-[28rem] xl:w-[32rem] animate-pulse">
                    <div className="mb-6 overflow-hidden rounded-lg">
                      <div className="w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 bg-gray-300"></div>
                    </div>
                    <div className="bg-gray-300 h-6 rounded mx-auto w-3/4"></div>
                  </div>
                ))
              ) : (
                categories.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="group cursor-pointer flex-shrink-0 w-80 sm:w-80 md:w-96 lg:w-[28rem] xl:w-[32rem]"
                    onClick={() => navigate(`/products?category=${item.slug}`)}
                  >
                    <div className="mb-6 overflow-hidden rounded-lg">
                      <img 
                        src={getCategoryImage(item.slug)} 
                        alt={item.name || 'Category'} 
                        className="w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                    <p className="text-center text-lg sm:text-xl md:text-2xl font-medium text-gray-900 group-hover:text-blue-600 transition-colors px-2">
                      {item.name || 'Category'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;