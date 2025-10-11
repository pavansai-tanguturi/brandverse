// src/pages/Home.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import ModernNavbar from '../components/ModernNavbar';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/App.css';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state: wishlistState, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
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

  // Local category carousel banners from public folder (Carousel 1)
  const localCategoryBanners = [
    { key: 'dairy', src: '/dairy.png', title: 'Dairy Deals', link: '/products?category=dairy' },
    { key: 'basmati', src: '/basmati.png', title: 'Basmati Rice', link: '/products?category=basmati' },
    { key: 'veggies', src: '/veggies.png', title: 'Fresh Veggies', link: '/products?category=veggies' },
    { key: 'cooking', src: '/cooking.png', title: 'Cooking Essentials', link: '/products?category=cooking' },
    { key: 'pet', src: '/pet.png', title: 'Pet Care', link: '/products?category=pet' },
    { key: 'meat', src: '/meat.png', title: 'Fresh Meat', link: '/products?category=meat' },
    { key: 'skincare', src: '/skincare.png', title: 'Skincare', link: '/products?category=skincare' },
    { key: 'cleaning', src: '/cleaning.png', title: 'Home Cleaning', link: '/products?category=cleaning' }
  ];
  const [localBannerIndex, setLocalBannerIndex] = useState(0);

  // Second carousel images (Carousel 2)
  const localCategoryBanners2 = [
    { key: 'fruits', src: '/fruits.png', title: 'Fresh Fruits', link: '/products?category=fruits' },
    { key: 'snacks', src: '/snacks.png', title: 'Snacks & Munchies', link: '/products?category=snacks' },
    { key: 'beverages', src: '/beverages.png', title: 'Beverages', link: '/products?category=beverages' },
    { key: 'bakery', src: '/bakery.png', title: 'Bakery', link: '/products?category=bakery' },
    { key: 'personalcare', src: '/personalcare.png', title: 'Personal Care', link: '/products?category=personalcare' },
    { key: 'babycare', src: '/babycare.png', title: 'Baby Care', link: '/products?category=babycare' },
    { key: 'gourmet', src: '/gourmet.png', title: 'Gourmet Foods', link: '/products?category=gourmet' },
    { key: 'stationery', src: '/stationery.png', title: 'Stationery', link: '/products?category=stationery' }
  ];
  const [localBannerIndex2, setLocalBannerIndex2] = useState(0);


  // Ensure localBannerIndex stays in bounds for grouped slides (Carousel 1)
  useEffect(() => {
    const maxIndex = Math.ceil(localCategoryBanners.length / 3) - 1;
    if (localBannerIndex > maxIndex) {
      setLocalBannerIndex(0);
    }
  }, [localCategoryBanners.length, localBannerIndex]);
  const localBannerTimerRef = useRef(null);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const touchStartXRef = useRef(null);
  const SWIPE_THRESHOLD = 40;

  // Ensure localBannerIndex2 stays in bounds for grouped slides (Carousel 2)
  useEffect(() => {
    const maxIndex2 = Math.ceil(localCategoryBanners2.length / 3) - 1;
    if (localBannerIndex2 > maxIndex2) {
      setLocalBannerIndex2(0);
    }
  }, [localCategoryBanners2.length, localBannerIndex2]);
  const localBannerTimerRef2 = useRef(null);
  const [isBannerPaused2, setIsBannerPaused2] = useState(false);
  const touchStartXRef2 = useRef(null);


  // Carousel navigation for grouped slides (Carousel 1)
  const groupCount = Math.ceil(localCategoryBanners.length / 3);
  const handlePrevLocalBanner = () => {
    setLocalBannerIndex((prev) => (prev - 1 + groupCount) % groupCount);
  };
  const handleNextLocalBanner = () => {
    setLocalBannerIndex((prev) => (prev + 1) % groupCount);
  };

  // Carousel navigation for grouped slides (Carousel 2)
  const groupCount2 = Math.ceil(localCategoryBanners2.length / 3);
  const handlePrevLocalBanner2 = () => {
    setLocalBannerIndex2((prev) => (prev - 1 + groupCount2) % groupCount2);
  };
  const handleNextLocalBanner2 = () => {
    setLocalBannerIndex2((prev) => (prev + 1) % groupCount2);
  };

  // Spotlight quick filters under Top picks
 const spotlightItems = [
  { label: 'Under ₹99 Deals', link: '/products?maxPrice=99', image: 'under-99.png' },
  { label: 'Mega Savers', link: '/products?sort=discount', image: 'mega-savers.png' },
  { label: 'Great deal', link: '/products?tag=great-deal', image: 'great-deal.png' },
  { label: 'New Arrivals', link: '/products?sort=new', image: 'new-arrivals.png' },
  { label: 'Flat 50% Off', link: '/products?discount=50', image: 'flat-50.png' },
];


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


  // Autoplay for local category carousel with pause support (Carousel 1)
  useEffect(() => {
    if (localCategoryBanners.length === 0) return;
    if (localBannerTimerRef.current) clearInterval(localBannerTimerRef.current);
    if (!isBannerPaused) {
      localBannerTimerRef.current = setInterval(() => {
        setLocalBannerIndex((prev) => (prev + 1) % groupCount);
      }, 4000);
    }
    return () => localBannerTimerRef.current && clearInterval(localBannerTimerRef.current);
  }, [isBannerPaused, groupCount]);

  // Autoplay for local category carousel with pause support (Carousel 2)
  useEffect(() => {
    if (localCategoryBanners2.length === 0) return;
    if (localBannerTimerRef2.current) clearInterval(localBannerTimerRef2.current);
    if (!isBannerPaused2) {
      localBannerTimerRef2.current = setInterval(() => {
        setLocalBannerIndex2((prev) => (prev + 1) % groupCount2);
      }, 4000);
    }
    return () => localBannerTimerRef2.current && clearInterval(localBannerTimerRef2.current);
  }, [isBannerPaused2, groupCount2]);

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
  const dealOfDay = products.filter(p => p.discount_percent >= 30).slice(0, 4);
  const [bestSellers, setBestSellers] = useState([]);

  // Fetch best sellers by buying rate
  useEffect(() => {
    const loadBestSellers = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
        const res = await fetch(`${API_BASE_URL}/api/products/top-selling?limit=12`);
        if (res.ok) {
          const data = await res.json();
          setBestSellers(Array.isArray(data) ? data : []);
          return;
        }
      } catch (e) {
        // Fallback silently
      }
      // Fallback to discount-based if API not available
      setBestSellers(products.filter(p => (p.total_sales || 0) > 0 || (p.discount_percent || 0) > 0).slice(0, 8));
    };
    loadBestSellers();
  }, [products]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-16 lg:pb-0">
      <ModernNavbar showSearch={true} />
        {/* Compact delivery/status strip */}
      {!checkingDelivery && showDeliveryMessage && (
        <div className={`mx-4 my-3 px-3 py-2 rounded-md text-sm ${deliveryAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="truncate">{locationName} • {deliveryMessage}</span>
          </div>
        </div>
      )}
        {/* Category Navigation */}
      <div className="bg-white py-6 border-b border-gray-100">
  <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto scrollbar-hide">
    {categories.map((cat) => (
      <div
        key={cat.id}
        onClick={() => navigate(`/products?category=${cat.slug}`)}
        className="flex flex-col items-center justify-center flex-shrink-0 w-24 cursor-pointer"
      >
        <div className="w-16 h-16 flex items-center justify-center">
          <img
            src={cat.image_url}
            alt={cat.name}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-1 mt-2">
          <p className="text-sm font-semibold text-gray-800 text-center whitespace-nowrap">
            {cat.name}
          </p>
          {cat.hasDropdown && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3 h-3 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
    



      {/* Combined Category Carousels Section */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Heading (shared) */}
        <div className="py-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured & More Categories</h2>
          <p className="text-gray-600 text-base mb-4">Browse top picks, deals, and discover more essentials</p>
        </div>
        {/* Carousel 1 */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-md mb-6"
          onMouseEnter={() => setIsBannerPaused(true)}
          onMouseLeave={() => setIsBannerPaused(false)}
          onTouchStart={(e) => {
            setIsBannerPaused(true);
            touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const endX = e.changedTouches?.[0]?.clientX ?? null;
            const startX = touchStartXRef.current;
            if (startX != null && endX != null) {
              const delta = endX - startX;
              if (Math.abs(delta) > SWIPE_THRESHOLD) {
                if (delta < 0) handleNextLocalBanner();
                else handlePrevLocalBanner();
              }
            }
            touchStartXRef.current = null;
            setTimeout(() => setIsBannerPaused(false), 150);
          }}
        >
          {/* Slides - grouped banners */}
          <div className="relative w-full bg-gray-50 min-h-[240px]">
            {(() => {
              const groups = [];
              for (let i = 0; i < localCategoryBanners.length; i += 3) {
                groups.push(localCategoryBanners.slice(i, i + 3));
              }
              return groups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    groupIndex === localBannerIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full">
                    {group.map((item) => (
                      <div
                        key={item.key}
                        className="relative rounded-xl overflow-hidden shadow hover:shadow-lg transition-transform transform hover:-translate-y-1 cursor-pointer"
                        onClick={() => navigate(item.link)}
                        role="button"
                      >
                        <img
                          src={item.src}
                          alt={item.title}
                          className="w-full h-[220px] md:h-[260px] object-cover"
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                        />
                        <div className="absolute inset-0 flex items-end justify-between p-3 bg-gradient-to-t from-black/60 to-transparent">
                          <div className="text-white text-lg font-semibold max-w-[70%] leading-tight drop-shadow">
                            {item.title}
                          </div>
                          <button
                            onClick={() => navigate(item.link)}
                            className="bg-white text-gray-800 font-medium text-sm px-3 py-1.5 rounded-full shadow hover:bg-emerald-500 hover:text-white transition"
                          >
                            Order Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Arrows */}
          <button
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md"
            onClick={handlePrevLocalBanner}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md"
            onClick={handleNextLocalBanner}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {(() => {
              const groups = [];
              for (let i = 0; i < localCategoryBanners.length; i += 3) {
                groups.push(localCategoryBanners.slice(i, i + 3));
              }
              return groups.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLocalBannerIndex(i)}
                  className={`w-3 h-3 rounded-full transition ${
                    i === localBannerIndex ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ));
            })()}
          </div>
        </div>

        {/* Carousel 2 (immediately below Carousel 1, same section) */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-md mb-6"
          onMouseEnter={() => setIsBannerPaused2(true)}
          onMouseLeave={() => setIsBannerPaused2(false)}
          onTouchStart={(e) => {
            setIsBannerPaused2(true);
            touchStartXRef2.current = e.touches?.[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const endX = e.changedTouches?.[0]?.clientX ?? null;
            const startX = touchStartXRef2.current;
            if (startX != null && endX != null) {
              const delta = endX - startX;
              if (Math.abs(delta) > SWIPE_THRESHOLD) {
                if (delta < 0) handleNextLocalBanner2();
                else handlePrevLocalBanner2();
              }
            }
            touchStartXRef2.current = null;
            setTimeout(() => setIsBannerPaused2(false), 150);
          }}
        >
          {/* Slides - grouped banners */}
          <div className="relative w-full bg-gray-50 min-h-[240px]">
            {(() => {
              const groups2 = [];
              for (let i = 0; i < localCategoryBanners2.length; i += 3) {
                groups2.push(localCategoryBanners2.slice(i, i + 3));
              }
              return groups2.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    groupIndex === localBannerIndex2 ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full">
                    {group.map((item) => (
                      <div
                        key={item.key}
                        className="relative rounded-xl overflow-hidden shadow hover:shadow-lg transition-transform transform hover:-translate-y-1 cursor-pointer"
                        onClick={() => navigate(item.link)}
                        role="button"
                      >
                        <img
                          src={item.src}
                          alt={item.title}
                          className="w-full h-[220px] md:h-[260px] object-cover"
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                        />
                        <div className="absolute inset-0 flex items-end justify-between p-3 bg-gradient-to-t from-black/60 to-transparent">
                          <div className="text-white text-lg font-semibold max-w-[70%] leading-tight drop-shadow">
                            {item.title}
                          </div>
                          <button
                            onClick={() => navigate(item.link)}
                            className="bg-white text-gray-800 font-medium text-sm px-3 py-1.5 rounded-full shadow hover:bg-emerald-500 hover:text-white transition"
                          >
                            Order Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Arrows */}
          <button
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md"
            onClick={handlePrevLocalBanner2}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md"
            onClick={handleNextLocalBanner2}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {(() => {
              const groups2 = [];
              for (let i = 0; i < localCategoryBanners2.length; i += 3) {
                groups2.push(localCategoryBanners2.slice(i, i + 3));
              }
              return groups2.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLocalBannerIndex2(i)}
                  className={`w-3 h-3 rounded-full transition ${
                    i === localBannerIndex2 ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ));
            })()}
          </div>
        </div>
      </div>

    


      {/* Standalone Spotlight Chips Section */}
      {/* 🔆 Spotlight Section */}
<section className="bg-white py-6 border-b border-gray-100">
  <div className="max-w-7xl mx-auto px-4">
    {/* Section Heading */}
    <h2 className="text-xl font-semibold text-gray-800 mb-4">
      🔆 Spotlight Categories
    </h2>

    {/* Spotlight Cards with Images */}
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 min-w-max">
        {spotlightItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.link)}
            className="flex items-center justify-center min-w-[100px] min-h-[100px] bg-emerald-50 border-2 border-dotted border-emerald-300 rounded-xl hover:bg-emerald-100 hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            {/* Image inside card */}
            <img
              src={`/spotlights/${item.image}`}
              alt={item.label}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  </div>
</section>



      {/* Top picks grid (minimal) */}
     <div className="py-4">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Top picks for you</h2>
      <Link to="/products" className="text-sm sm:text-base text-emerald-600 hover:text-emerald-700">
        View all
      </Link>
    </div>
    
    {loading ? (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    ) : (
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 flex-nowrap">
          {products.slice(0, 12).map((product) => {
            const hasDiscount = (product.discount_percent || 0) > 0;
            const price = (product.price_cents || 0) / 100;
            const finalPrice = hasDiscount
              ? price * (1 - product.discount_percent / 100)
              : price;

            return (
              <div
                key={product.id}
                className="flex-none w-40 sm:w-44 md:w-48 lg:w-[calc((100%-32px)/5)] bg-white border border-gray-200 rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="relative">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-28 sm:h-32 md:h-36 object-cover"
                  />
                  {hasDiscount && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {product.discount_percent}% OFF
                    </span>
                  )}
                  {/* Wishlist */}
                  <button
                    onClick={(e) => handleWishlistToggle(e, product)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full shadow ${
                      isInWishlist(product.id)
                        ? 'bg-red-50 ring-1 ring-red-200'
                        : 'bg-white/90'
                    }`}
                    aria-label={
                      isInWishlist(product.id)
                        ? 'Remove from wishlist'
                        : 'Add to wishlist'
                    }
                  >
                    {isInWishlist(product.id) ? (
                      <svg
                        className="w-4 h-4 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="p-2">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 min-h-[2rem] group-hover:text-emerald-600">
                    {product.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-gray-900">
                      ₹{finalPrice.toFixed(0)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs sm:text-sm text-gray-500 line-through">
                        ₹{price.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <button
                    className={`mt-2 w-full text-sm sm:text-base py-1 rounded-md font-medium ${
                      product.stock_quantity <= 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-400 text-white hover:bg-emerald-500 ring-1 ring-emerald-400 hover:ring-emerald-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    }`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (product.stock_quantity <= 0) return;
                      try {
                        await addToCart(product, 1);
                        navigate('/cart');
                      } catch (err) {
                        console.error('Add to cart failed', err);
                      }
                    }}
                    disabled={product.stock_quantity <= 0}
                  >
                    {product.stock_quantity <= 0 ? 'Out of stock' : 'Add to cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
</div>


     {/* Best sellers (minimal) */}
{bestSellers.length > 0 && (
  <div className="py-4">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Best sellers</h2>
        <Link to="/products" className="text-sm sm:text-base text-emerald-600 hover:text-emerald-700">
          View all
        </Link>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 flex-nowrap">
          {bestSellers.slice(0, 8).map((product) => {
            const hasDiscount = (product.discount_percent || 0) > 0;
            const price = (product.price_cents || 0) / 100;
            const finalPrice = hasDiscount ? price * (1 - product.discount_percent / 100) : price;

            return (
              <div
                key={product.id}
                className="flex-none w-40 sm:w-44 md:w-48 lg:basis-[calc((100%-32px)/5)] bg-white border border-gray-200 rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="relative">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-28 sm:h-32 md:h-36 object-cover"
                  />
                  {hasDiscount && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {product.discount_percent}% OFF
                    </span>
                  )}
                  <button
                    onClick={(e) => handleWishlistToggle(e, product)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full shadow ${
                      isInWishlist(product.id) ? 'bg-red-50 ring-1 ring-red-200' : 'bg-white/90'
                    }`}
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isInWishlist(product.id) ? (
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="p-2">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 min-h-[2rem] group-hover:text-emerald-600">
                    {product.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-gray-900">₹{finalPrice.toFixed(0)}</span>
                    {hasDiscount && <span className="text-xs sm:text-sm text-gray-500 line-through">₹{price.toFixed(0)}</span>}
                  </div>
                  <button
                    className={`mt-2 w-full text-sm sm:text-base py-1 rounded-md font-medium ${
                      product.stock_quantity <= 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-400 text-white hover:bg-emerald-500 ring-1 ring-emerald-400 hover:ring-emerald-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    }`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (product.stock_quantity <= 0) return;
                      try {
                        await addToCart(product, 1);
                        navigate('/cart');
                      } catch (err) {
                        console.error('Add to cart failed', err);
                      }
                    }}
                    disabled={product.stock_quantity <= 0}
                  >
                    {product.stock_quantity <= 0 ? 'Out of stock' : 'Add to cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
)}

{/* New arrivals (minimal) */}
<div className="py-4">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">New arrivals</h2>
      <Link to="/products" className="text-sm sm:text-base text-emerald-600 hover:text-emerald-700">
        View all
      </Link>
    </div>
    {loading ? (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    ) : (
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 flex-nowrap">
          {newArrivals.map((product) => {
            const hasDiscount = (product.discount_percent || 0) > 0;
            const price = (product.price_cents || 0) / 100;
            const finalPrice = hasDiscount ? price * (1 - product.discount_percent / 100) : price;

            return (
              <div
                key={product.id}
                className="flex-none w-40 sm:w-44 md:w-48 lg:basis-[calc((100%-32px)/5)] bg-white border border-gray-200 rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="relative">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-28 sm:h-32 md:h-36 object-cover"
                  />
                  {hasDiscount && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {product.discount_percent}% OFF
                    </span>
                  )}
                  <button
                    onClick={(e) => handleWishlistToggle(e, product)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full shadow ${
                      isInWishlist(product.id) ? 'bg-red-50 ring-1 ring-red-200' : 'bg-white/90'
                    }`}
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isInWishlist(product.id) ? (
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="p-2">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 min-h-[2rem] group-hover:text-emerald-600">
                    {product.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-gray-900">₹{finalPrice.toFixed(0)}</span>
                    {hasDiscount && <span className="text-xs sm:text-sm text-gray-500 line-through">₹{price.toFixed(0)}</span>}
                  </div>
                  <button
                    className={`mt-2 w-full text-sm sm:text-base py-1 rounded-md font-medium ${
                      product.stock_quantity <= 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-400 text-white hover:bg-emerald-500 ring-1 ring-emerald-400 hover:ring-emerald-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    }`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (product.stock_quantity <= 0) return;
                      try {
                        await addToCart(product, 1);
                        navigate('/cart');
                      } catch (err) {
                        console.error('Add to cart failed', err);
                      }
                    }}
                    disabled={product.stock_quantity <= 0}
                  >
                    {product.stock_quantity <= 0 ? 'Out of stock' : 'Add to cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
         {/* Specials: Stock Up & Savor */}
 <div className="py-8 bg-gradient-to-b from-white to-gray-50">
  <div className="max-w-7xl mx-auto px-4">
    {/* Section Header */}
    <div className="text-center mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Stock Up & Savor: <span className="text-emerald-700">AkepatiMart</span> Delivers
      </h2>
      <p className="text-gray-600 text-sm md:text-base">
        Your daily essentials — fresh, fast, and always at your doorstep.
      </p>
    </div>

    {/* Grid Layout with Proper Spacing */}
    <div className="flex flex-wrap justify-center gap-17 md:gap-33">
      {/* Pantry Card */}
      <div
        className="group relative aspect-square max-w-[640px] w-full sm:w-[46%] md:w-[40%] overflow-hidden rounded-2xl border border-gray-200 shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        onClick={() => navigate('/products?category=pantry')}
      >
        <img
          src="/home-specials/pantry.png"
          alt="Pantry Essentials"
          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
          draggable={false}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-rose-900/90 h-14 px-6 flex items-center justify-between border-t-2 border-dotted border-white/70">
          <span className="text-white font-semibold uppercase tracking-wide text-base md:text-lg">
            Pantry Essentials
          </span>
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white text-rose-800 shadow group-hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>

      {/* Breakfast Card */}
      <div
        className="group relative aspect-square max-w-[640px] w-full sm:w-[46%] md:w-[40%] overflow-hidden rounded-2xl border border-gray-200 shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        onClick={() => navigate('/products?category=breakfast')}
      >
        <img
          src="/home-specials/breakfast.png"
          alt="Breakfast Essentials"
          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
          draggable={false}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-emerald-900/90 h-14 px-6 flex items-center justify-between border-t-2 border-dotted border-white/70">
          <span className="text-white font-semibold uppercase tracking-wide text-base md:text-lg">
            Breakfast Essentials
          </span>
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white text-emerald-800 shadow group-hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

    
      <MobileBottomNav />
    </div>
  );
}

export default Home;
