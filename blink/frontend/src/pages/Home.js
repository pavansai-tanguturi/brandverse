// src/pages/Home.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Navigation from '../components/Navigation';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/App.css';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state: wishlistState, addToWishlist, removeFromWishlist } = useWishlist();
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
  const [banners, setBanners] = useState([]);

  // Wishlist helper functions
  const isInWishlist = (productId) => {
    if (!wishlistState || !wishlistState.items) return false;
    const inWishlist = wishlistState.items.some(item => item.id === productId);
    console.log(`Product ${productId} in wishlist:`, inWishlist, 'Wishlist items:', wishlistState.items);
    return inWishlist;
  };

  const handleWishlistToggle = async (e, product) => {
    e.stopPropagation(); // Prevent navigation to product page
    console.log('Toggling wishlist for product:', product);
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  // Fetch banners from backend
  const fetchBanners = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/banners`);
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const updateScrollButtons = () => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollBy({ left: -window.innerWidth * 0.8, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollBy({ left: window.innerWidth * 0.8, behavior: 'smooth' });
    }
  };

  const fetchCategories = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        const filteredCategories = data.filter(cat => cat.slug !== 'all');
        setCategories(filteredCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDeliveryAvailability = async (country, region = null, city = null) => {
    if (!country || country === 'Unknown country') {
      setCheckingDelivery(false);
      setDeliveryAvailable(false);
      return;
    }
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const params = new URLSearchParams({ country });
      if (region && region !== 'Unknown region') params.append('region', region);
      if (city && city !== 'Unknown city') params.append('city', city);
      const response = await fetch(`${API_BASE}/api/delivery/check?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDeliveryAvailable(data.available);
        if (data.message) {
          setDeliveryMessage(data.message);
          setShowDeliveryMessage(true);
          if (data.available) {
            setTimeout(() => setShowDeliveryMessage(false), 3000);
          }
        }
      } else {
        setDeliveryAvailable(false);
      }
    } catch (error) {
      setDeliveryAvailable(false);
    }
    setCheckingDelivery(false);
  };

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const checkAdminAccess = useCallback(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }
    if (window.location.pathname.includes('/admin')) {
      navigate('/401');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

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
          const city = data.address.city || data.address.town || data.address.village || 'Unknown city';
          const region = data.address.state || data.address.province || null;
          const country = data.address.country || 'Unknown country';
          setLocationName(`${city}${region ? `, ${region}` : ''}, ${country}`);
          setUserLocation({ city, region, country, latitude, longitude });
          await checkDeliveryAvailability(country, region, city);
        } catch (error) {
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

  // Get categorized products
  const newArrivals = products.slice(0, 8);
  const bestSellers = products.filter(p => p.discount_percent > 0).slice(0, 8);
  const dealOfDay = products.filter(p => p.discount_percent >= 30).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-16 lg:pb-0">
      <Navigation showSearch={true} />

      {/* Enhanced Delivery Status Banner */}
      {!checkingDelivery && showDeliveryMessage && (
        <div className={`mx-4 my-4 rounded-xl border-l-4 p-4 shadow-sm backdrop-blur-sm ${
          deliveryAvailable
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-500'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {deliveryAvailable ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {locationName}
              </p>
              <p className={`text-sm font-semibold ${deliveryAvailable ? 'text-emerald-800' : 'text-amber-800'}`}>
                {deliveryMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner Carousel */}
      <div className="relative w-full overflow-hidden">
        {banners.length > 0 ? (
          <div className="relative h-[320px] md:h-[480px] lg:h-[580px]">
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700"
              style={{
                backgroundImage: `url(${banners[currentBannerIndex].image_url})`,
                backgroundColor: banners[currentBannerIndex].color || '#10b981'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                <div className="max-w-2xl">
                  <div className="inline-block mb-4 px-4 py-2 bg-emerald-500/90 backdrop-blur-sm rounded-full">
                    <span className="text-white font-semibold text-sm">✨ Featured Collection</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 leading-tight">
                    {banners[currentBannerIndex].title}
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 mb-8 font-light">
                    {banners[currentBannerIndex].subtitle}
                  </p>
                  <button
                    className="group bg-white text-gray-900 font-bold px-10 py-4 rounded-full hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-2"
                    onClick={() => {
                      const slug = banners[currentBannerIndex].category_slug;
                      if (slug) navigate(`/products?category=${slug}`);
                    }}
                  >
                    {banners[currentBannerIndex].button_text || 'Shop Now'}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {/* Navigation Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === currentBannerIndex
                        ? 'w-10 bg-white shadow-lg'
                        : 'w-2.5 bg-white/60 hover:bg-white/90'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[320px] md:h-[480px] bg-gradient-to-r from-emerald-100 to-teal-100 animate-pulse" />
        )}
      </div>

      {/* Category Navigation */}
      <div className="bg-white py-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Shop by Category
            </h2>
            <p className="text-gray-600">Discover our curated collections</p>
          </div>
          <div className="relative">
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-emerald-50 transition-all hover:scale-110"
              >
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div
              ref={categoriesRef}
              className="flex gap-8 overflow-x-auto scrollbar-hide py-4"
              onScroll={updateScrollButtons}
            >
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/products?category=${cat.slug}`)}
                  className="flex-shrink-0 cursor-pointer group"
                >
                  <div className="relative mb-3">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:border-emerald-400 transition-all group-hover:shadow-2xl group-hover:scale-110">
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-center font-semibold text-gray-700 group-hover:text-emerald-600 transition-colors max-w-[120px]">
                    {cat.name}
                  </p>
                </div>
              ))}
            </div>
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-emerald-50 transition-all hover:scale-110"
              >
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deal of the Day */}
      {dealOfDay.length > 0 && (
        <div className="py-16 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptMCAxNWMwIDIuMjEtMS43OSA0LTQgNHMtNC0xLjc5LTQtNCAxLjc5LTQgNC00IDQgMS43OSA0IDR6bTAgMTVjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0ek0yMSAxNGMwIDIuMjEtMS43OSA0LTQgNHMtNC0xLjc5LTQtNCAxLjc5LTQgNC00IDQgMS43OSA0IDR6bTAgMTVjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0em0wIDE1YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-4">
                <svg className="w-6 h-6 text-yellow-300 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white font-bold text-lg">Deal of the Day</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">⚡ Lightning Deals</h2>
              <p className="text-emerald-100 text-lg">Massive discounts - Limited time only!</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-white font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ends in 24 hours
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {dealOfDay.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer group transform hover:scale-105"
                >
                  <div className="relative">
                    <img src={product.image_url} alt={product.title} className="w-full h-48 md:h-56 object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                      </svg>
                      {product.discount_percent}% OFF
                    </div>
                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => handleWishlistToggle(e, product)}
                      className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all transform hover:scale-110 ${
                        isInWishlist(product.id) 
                          ? 'bg-red-50 hover:bg-red-100 ring-2 ring-red-200' 
                          : 'bg-white/95 hover:bg-white'
                      }`}
                      aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      {isInWishlist(product.id) ? (
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2 text-gray-800 group-hover:text-emerald-600 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg md:text-xl font-bold text-gray-900">
                        ₹{((product.price_cents / 100) * (1 - (product.discount_percent || 0) / 100)).toFixed(0)}
                      </span>
                      {product.discount_percent > 0 && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{(product.price_cents / 100).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-105 shadow-md text-sm">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Explore All Products
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="inline-block mb-2 px-4 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-sm font-semibold">
                  🔥 Trending Now
                </div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Best Sellers
                </h2>
                <p className="text-gray-600 mt-1">Our most popular products</p>
              </div>
              <Link
                to="/products"
                className="hidden md:flex items-center gap-2 bg-white text-emerald-600 hover:text-white hover:bg-emerald-600 font-semibold px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-xl border-2 border-emerald-200 hover:border-emerald-600"
              >
                View All
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {bestSellers.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border border-gray-100 hover:border-emerald-200"
                >
                  <div className="relative overflow-hidden">
                    <img src={product.image_url} alt={product.title} className="w-full h-48 md:h-64 object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {product.discount_percent}% OFF
                    </div>
                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => handleWishlistToggle(e, product)}
                      className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all transform hover:scale-110 ${
                        isInWishlist(product.id) 
                          ? 'bg-red-50 hover:bg-red-100 ring-2 ring-red-200' 
                          : 'bg-white/95 hover:bg-white'
                      }`}
                      aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      {isInWishlist(product.id) ? (
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-emerald-600 font-semibold mb-1">{product.category?.name}</p>
                    <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2 text-gray-800 group-hover:text-emerald-600 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg md:text-xl font-bold text-gray-900">
                        ₹{((product.price_cents / 100) * (1 - product.discount_percent / 100)).toFixed(0)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ₹{(product.price_cents / 100).toFixed(0)}
                      </span>
                    </div>
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-105 shadow-md text-sm">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Arrivals */}
      <div className="py-16 bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="inline-block mb-2 px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                Fresh Collection
              </div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                New Arrivals
              </h2>
              <p className="text-gray-600 mt-1">Check out our latest products</p>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-2 bg-white text-emerald-600 hover:text-white hover:bg-emerald-600 font-semibold px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-xl border-2 border-emerald-200 hover:border-emerald-600"
            >
              View All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600" />
              <p className="mt-4 text-gray-600 font-medium">Loading amazing products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border border-gray-100 hover:border-emerald-200"
                >
                  <div className="relative overflow-hidden">
                    <img src={product.image_url} alt={product.title} className="w-full h-48 md:h-64 object-cover group-hover:scale-110 transition-transform duration-500" />
                    {product.discount_percent > 0 && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {product.discount_percent}% OFF
                      </div>
                    )}
                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => handleWishlistToggle(e, product)}
                      className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all transform hover:scale-110 ${
                        isInWishlist(product.id) 
                          ? 'bg-red-50 hover:bg-red-100 ring-2 ring-red-200' 
                          : 'bg-white/95 hover:bg-white'
                      }`}
                      aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      {isInWishlist(product.id) ? (
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-emerald-600 font-semibold mb-1">{product.category?.name}</p>
                    <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2 text-gray-800 group-hover:text-emerald-600 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg md:text-xl font-bold text-gray-900">
                        ₹{((product.price_cents / 100) * (1 - (product.discount_percent || 0) / 100)).toFixed(0)}
                      </span>
                      {product.discount_percent > 0 && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{(product.price_cents / 100).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-105 shadow-md text-sm">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptMCAxNWMwIDIuMjEtMS43OSA0LTQgNHMtNC0xLjc5LTQtNCAxLjc5LTQgNC00IDQgMS43OSA0IDR6bTAgMTVjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0ek0yMSAxNGMwIDIuMjEtMS43OSA0LTQgNHMtNC0xLjc5LTQtNCAxLjc5LTQgNC00IDQgMS43OSA0IDR6bTAgMTVjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0em0wIDE1YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Why Shop With Us?</h2>
            <p className="text-emerald-100 text-lg">Your satisfaction is our priority</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all group-hover:scale-110 shadow-xl">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">Free Shipping</h3>
              <p className="text-emerald-100 text-sm">On orders over ₹500</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all group-hover:scale-110 shadow-xl">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">Secure Payment</h3>
              <p className="text-emerald-100 text-sm">100% protected transactions</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all group-hover:scale-110 shadow-xl">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">Easy Returns</h3>
              <p className="text-emerald-100 text-sm">30-day hassle-free returns</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all group-hover:scale-110 shadow-xl">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">24/7 Support</h3>
              <p className="text-emerald-100 text-sm">Always here to help you</p>
            </div>
          </div>
        </div>
      </div>

    
      <MobileBottomNav />
    </div>
  );
}

export default Home;
