import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import ModernNavbar from "../components/ModernNavbar";
import MobileBottomNav from "../components/MobileBottomNav";
import "../styles/App.css";

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    state: wishlistState,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();
  const { addToCart } = useCart();

  const [locationName, setLocationName] = useState("Fetching location...");
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [checkingDelivery, setCheckingDelivery] = useState(true);
  const [showDeliveryStatus, setShowDeliveryStatus] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localBannerIndex, setLocalBannerIndex] = useState(0);
  const [localBannerIndex2, setLocalBannerIndex2] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const [isBannerPaused2, setIsBannerPaused2] = useState(false);
  const touchStartXRef = useRef(null);
  const touchStartXRef2 = useRef(null);
  const SWIPE_THRESHOLD = 20;

  // Local category carousel banners (Carousel 1)
  const localCategoryBanners2 = [
    {
      key: "dairy",
      src: "carousel1/dairy.png",
      title: "Dairy Deals",
      link: "/products?category=dairy",
    },
    {
      key: "basmati",
      src: "carousel1/basmati.png",
      title: "Basmati Rice",
      link: "/products?category=basmati",
    },
    {
      key: "veggies",
      src: "carousel1/veggies.png",
      title: "Fresh Veggies",
      link: "/products?category=veggies",
    },
    {
      key: "cooking",
      src: "carousel1/cooking.png",
      title: "Cooking Essentials",
      link: "/products?category=cooking",
    },
    {
      key: "pet",
      src: "carousel1/pet.png",
      title: "Pet Care",
      link: "/products?category=pet",
    },
    {
      key: "meat",
      src: "carousel1/meat.png",
      title: "Fresh Meat",
      link: "/products?category=meat",
    },
    {
      key: "skincare",
      src: "carousel1/skincare.png",
      title: "Skincare",
      link: "/products?category=skincare",
    },
    {
      key: "cleaning",
      src: "carousel1/cleaning.png",
      title: "Home Cleaning",
      link: "/products?category=cleaning",
    },
  ];

  // Second carousel images (Carousel 2)
  const localCategoryBanners = [
    {
      key: "fruits",
      src: "carousel2/fruits.png",
      title: "Fresh Fruits",
      link: "/products?category=fruits",
    },
    {
      key: "snacks",
      src: "carousel2/snacks.png",
      title: "Snacks & Munchies",
      link: "/products?category=snacks",
    },
    {
      key: "beverages",
      src: "carousel2/beverages.png",
      title: "Beverages",
      link: "/products?category=beverages",
    },
    {
      key: "bakery",
      src: "carousel2/bakery.png",
      title: "Bakery",
      link: "/products?category=bakery",
    },
    {
      key: "personalcare",
      src: "carousel2/personalcare.png",
      title: "Personal Care",
      link: "/products?category=personalcare",
    },
    {
      key: "babycare",
      src: "carousel2/babycare.png",
      title: "Baby Care",
      link: "/products?category=babycare",
    },
    {
      key: "gourmet",
      src: "carousel2/gourmet.png",
      title: "Gourmet Foods",
      link: "/products?category=gourmet",
    },
    {
      key: "stationery",
      src: "carousel2/stationery.png",
      title: "Stationery",
      link: "/products?category=stationery",
    },
  ];

  // Spotlight quick filters
  const spotlightItems = [
    {
      label: "Under ₹99 Deals",
      link: "/products?maxPrice=99",
      image: "under-99.png",
    },
    {
      label: "Mega Savers",
      link: "/products?sort=discount",
      image: "mega-savers.png",
    },
    {
      label: "Great Deal",
      link: "/products?tag=great-deal",
      image: "great-deal.png",
    },
    {
      label: "New Arrivals",
      link: "/products?sort=new",
      image: "new-arrivals.png",
    },
    {
      label: "Flat 50% Off",
      link: "/products?discount=50",
      image: "flat-50.png",
    },
  ];

  // Wishlist helper functions
  const isInWishlist = (productId) => {
    if (!wishlistState || !wishlistState.items) return false;
    return wishlistState.items.some((item) => item.id === productId);
  };

  const handleWishlistToggle = async (e, product) => {
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  // Carousel navigation for grouped slides
  // Compute group count based on responsive group size (1 on mobile, 2 on sm, 3 on lg)
  const getGroupSize = () => {
    if (typeof window === "undefined") return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  const [groupSize, setGroupSize] = useState(getGroupSize());
  const resizeTimerRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        setGroupSize(getGroupSize());
      }, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, []);

  const groupCount = Math.max(1, Math.ceil(localCategoryBanners.length / groupSize));
  const groupCount2 = Math.max(1, Math.ceil(localCategoryBanners2.length / groupSize));

  // Ensure indexes stay in range when group counts change
  useEffect(() => {
    setLocalBannerIndex((prev) => (prev % groupCount));
  }, [groupCount]);

  useEffect(() => {
    setLocalBannerIndex2((prev) => (prev % groupCount2));
  }, [groupCount2]);

  const handlePrevLocalBanner = () => {
    setLocalBannerIndex((prev) => (prev - 1 + groupCount) % groupCount);
  };

  const handleNextLocalBanner = () => {
    setLocalBannerIndex((prev) => (prev + 1) % groupCount);
  };

  const handlePrevLocalBanner2 = () => {
    setLocalBannerIndex2((prev) => (prev - 1 + groupCount2) % groupCount2);
  };

  const handleNextLocalBanner2 = () => {
    setLocalBannerIndex2((prev) => (prev + 1) % groupCount2);
  };

  // Autoplay for carousels
  const localBannerTimerRef = useRef(null);
  const localBannerTimerRef2 = useRef(null);

  useEffect(() => {
    if (localCategoryBanners.length === 0) return;
    if (localBannerTimerRef.current) clearInterval(localBannerTimerRef.current);
    if (!isBannerPaused) {
      localBannerTimerRef.current = setInterval(() => {
        setLocalBannerIndex((prev) => (prev + 1) % groupCount);
      }, 4000);
    }
    return () =>
      localBannerTimerRef.current && clearInterval(localBannerTimerRef.current);
  }, [isBannerPaused, groupCount]);

  useEffect(() => {
    if (localCategoryBanners2.length === 0) return;
    if (localBannerTimerRef2.current)
      clearInterval(localBannerTimerRef2.current);
    if (!isBannerPaused2) {
      console.debug("carousel2: starting autoplay", { groupCount2, isBannerPaused2 });
      localBannerTimerRef2.current = setInterval(() => {
        setLocalBannerIndex2((prev) => {
          const next = (prev + 1) % groupCount2;
          console.debug("carousel2: tick", { prev, next });
          return next;
        });
      }, 4000);
    } else {
      console.debug("carousel2: paused", { isBannerPaused2 });
    }
    return () =>
      localBannerTimerRef2.current &&
      clearInterval(localBannerTimerRef2.current);
  }, [isBannerPaused2, groupCount2]);

  // Fetch categories and products
  const fetchCategories = async () => {
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.filter((cat) => cat.slug !== "all"));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check delivery availability
  const checkDeliveryAvailability = async (
    country,
    region = null,
    city = null,
  ) => {
    if (!country || country === "Unknown country") {
      setCheckingDelivery(false);
      setDeliveryAvailable(false);
      return;
    }
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const params = new URLSearchParams({ country });
      if (region && region !== "Unknown region")
        params.append("region", region);
      if (city && city !== "Unknown city") params.append("city", city);
      const response = await fetch(
        `${API_BASE}/api/delivery/check?${params.toString()}`,
      );
      if (response.ok) {
        const data = await response.json();
        setDeliveryAvailable(data.available);

        // Auto-hide delivery status after 2 seconds on mobile if delivery is available
        if (data.available && window.innerWidth < 768) {
          setTimeout(() => {
            setShowDeliveryStatus(false);
          }, 2000);
        }
      } else {
        setDeliveryAvailable(false);
      }
    } catch (error) {
      setDeliveryAvailable(false);
    }
    setCheckingDelivery(false);
  };

  // Initial data fetch and geolocation
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            );
            const data = await response.json();
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              "Unknown city";
            const region = data.address.state || data.address.province || null;
            const country = data.address.country || "Unknown country";
            setLocationName(
              `${city}${region ? `, ${region}` : ""}, ${country}`,
            );
            await checkDeliveryAvailability(country, region, city);
          } catch (error) {
            setLocationName("Location unavailable");
            setCheckingDelivery(false);
          }
        },
        () => {
          setLocationName("Location permission denied");
          setCheckingDelivery(false);
        },
      );
    } else {
      setLocationName("Geolocation not supported");
      setCheckingDelivery(false);
    }
  }, []);

  // Admin access check
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else if (window.location.pathname.includes("/admin")) {
      navigate("/401");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      <ModernNavbar showSearch={true} />

      {/* Delivery Status Strip */}
   {!checkingDelivery && showDeliveryStatus && (
  <div
    className={`mx-2 sm:mx-4 my-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-500 ${
      deliveryAvailable
        ? "bg-green-100 text-green-800"
        : "bg-yellow-100 text-yellow-800"
    }`}
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      {/* Left side: location + status */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink min-w-0">
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
          />
        </svg>

        {/* Responsive text truncation */}
        <span className="truncate max-w-[160px] sm:max-w-xs">
          {locationName} •{" "}
          {deliveryAvailable
            ? "Delivery Available"
            : "Delivery Unavailable"}
        </span>
      </div>

      {/* Close button */}
      <button
        onClick={() => setShowDeliveryStatus(false)}
        className="p-1 hover:bg-black/10 rounded-full transition-colors"
      >
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
)}

      {/* Category Navigation */}
      <div className="bg-white py-4 sm:py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto scrollbar-hide space-x-4 sm:space-x-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/products?category=${cat.slug}`)}
              className="flex flex-col items-center justify-center flex-shrink-0 w-20 sm:w-24 cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                <img
                  src={cat.image_url || `/categories/${cat.slug}.png`}
                  alt={cat.name}
                  className="w-full h-full object-contain rounded-full"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to local image if database image fails
                    e.target.src = `/categories/${cat.slug}.png`;
                  }}
                />
              </div>
              <div className="flex items-center gap-1 mt-1 sm:mt-2">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 text-center whitespace-nowrap">
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Combined Category Carousels Section */}
      <div className="w-full">
        {" "}
        {/* Changed max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 to w-full to remove outer padding and max width */}
        {/* Section Heading (shared) */}
        <div className="bg-white py-2 sm:py-3 px-0">
          {/* Heading */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0 px-4 sm:px-6 lg:px-8">
            Featured & More Categories
          </h2>

          {/* Subtext */}
          <p className="text-gray-600 text-sm sm:text-base mb-0 px-4 sm:px-6 lg:px-8">
            Browse top picks, deals, and discover more essentials
          </p>
        </div>
        {/* Carousel 1 */}
        <div
          className="relative rounded-none overflow-hidden shadow-none mb-0" // Removed rounded, shadow, and mb (margin-bottom)
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
          {/* Slides - single banner on mobile, grid on larger screens */}
          <div className="relative w-full bg-white min-h-[180px] sm:min-h-[220px] md:min-h-[240px]">
            {" "}
            {/* Changed bg-gray-50 to bg-white for a cleaner look */}
              {(() => {
              // Group banners using the responsive groupSize state (1/2/3)
              const groups = [];
              for (let i = 0; i < localCategoryBanners.length; i += groupSize) {
                groups.push(localCategoryBanners.slice(i, i + groupSize));
              }
              return groups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    groupIndex === localBannerIndex
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  } sm:grid sm:grid-cols-2 sm:gap-0 lg:grid-cols-3 lg:gap-0 p-0`} // Removed all gap and padding for maximum density
                >
                  {group.map((item) => (
                    <div
                      key={item.key}
                      className="relative w-full h-full rounded-none overflow-hidden shadow-none sm:hover:shadow-md sm:transition-transform sm:transform sm:hover:-translate-y-0.5 cursor-pointer" // Removed rounded, shadow, subtle hover effect
                      onClick={() => navigate(item.link)}
                      role="button"
                    >
                      <img
                        src={item.src}
                        alt={item.title}
                        className="w-full h-[180px] sm:h-[200px] md:h-[220px] lg:h-[260px] object-cover"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex flex-col sm:flex-row sm:items-end sm:justify-between p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent">
                        <div className="text-white text-base sm:text-lg font-semibold max-w-[80%] sm:max-w-[70%] leading-tight drop-shadow">
                          {item.title}
                        </div>
                        {/* <button
                    onClick={() => navigate(item.link)}
                    className="mt-2 sm:mt-0 bg-emerald-500 text-white font-medium text-sm px-4 py-2 rounded-full shadow hover:bg-emerald-600 transition whitespace-nowrap"
                  >
                    Shop Now
                  </button> */}
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>

          {/* Arrows - hidden on mobile */}
          <button
            aria-label="Previous"
            className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-none p-3 shadow-none" // Removed rounded, shadow, increased padding for click area
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
            className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-none p-3 shadow-none" // Removed rounded, shadow, increased padding for click area
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

          {/* Dots removed */}
        </div>
        <hr className="border-gray-200" />{" "}
        {/* Added a divider for visual separation since margins are removed */}
        {/* Carousel 2 */}
        <div
          className="relative rounded-none overflow-hidden shadow-none mb-0" // Removed rounded, shadow, and mb (margin-bottom)
          onMouseEnter={() => setIsBannerPaused2(true)}
          onMouseLeave={() => setIsBannerPaused2(false)}
          onTouchStart={(e) => {
            setIsBannerPaused2(true);
            touchStartXRef2.current = e.touches?.[0]?.clientX ?? null;
            console.debug('carousel2 touchstart', { x: touchStartXRef2.current });
          }}
          onTouchEnd={(e) => {
            const endX = e.changedTouches?.[0]?.clientX ?? null;
            const startX = touchStartXRef2.current;
            console.debug('carousel2 touchend', { startX, endX, delta: endX != null && startX != null ? endX - startX : null });
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
          {/* Slides - single banner on mobile, grid on larger screens */}
          <div className="relative w-full bg-white min-h-[180px] sm:min-h-[220px] md:min-h-[240px]">
            {" "}
            {/* Changed bg-gray-50 to bg-white for a cleaner look */}
              {(() => {
              // Group banners using the responsive groupSize state (1/2/3)
              const groups2 = [];
              for (let i = 0; i < localCategoryBanners2.length; i += groupSize) {
                groups2.push(localCategoryBanners2.slice(i, i + groupSize));
              }
              return groups2.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    groupIndex === localBannerIndex2
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  } sm:grid sm:grid-cols-2 sm:gap-0 lg:grid-cols-3 lg:gap-0 p-0`} // Removed all gap and padding for maximum density
                >
                  {group.map((item) => (
                    <div
                      key={item.key}
                      className="relative w-full h-full rounded-none overflow-hidden shadow-none sm:hover:shadow-md sm:transition-transform sm:transform sm:hover:-translate-y-0.5 cursor-pointer" // Removed rounded, shadow, subtle hover effect
                      onClick={() => navigate(item.link)}
                      role="button"
                    >
                      <img
                        src={item.src}
                        alt={item.title}
                        className="w-full h-[180px] sm:h-[200px] md:h-[220px] lg:h-[260px] object-cover"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex flex-col sm:flex-row sm:items-end sm:justify-between p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent">
                        <div className="text-white text-base sm:text-lg font-semibold max-w-[80%] sm:max-w-[70%] leading-tight drop-shadow">
                          {item.title}
                        </div>
                        {/* <button
                    onClick={() => navigate(item.link)}
                    className="mt-2 sm:mt-0 bg-emerald-500 text-white font-medium text-sm px-4 py-2 rounded-full shadow hover:bg-emerald-600 transition whitespace-nowrap"
                  >
                    Shop Now
                  </button> */}
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>

          {/* Arrows - hidden on mobile */}
          <button
            aria-label="Previous"
            className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-none p-3 shadow-none" // Removed rounded, shadow, increased padding for click area
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
            className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-none p-3 shadow-none" // Removed rounded, shadow, increased padding for click area
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

          {/* Dots removed */}
        </div>
      </div>

      {/* Spotlight Section */}
      <div className="bg-white py-4 border-t border-gray-200">
  <div className="max-w-7xl mx-auto px-4">
    <h2 className="text-xl font-bold text-gray-900 mb-3">Quick Filters</h2>

    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
      {spotlightItems.map((item) => (
        <button
          key={item.image}
          onClick={() => navigate(item.link)}
          className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
        >
          <img
            src={`/spotlights/${item.image}`}
            alt={item.label || "Quick Filter"}
            className="w-full h-full object-cover rounded-xl"
          /> 
        </button>
      ))}
    </div>
  </div>
</div>


      {/* Category-Based Product Sections */}
      <div className="pb-20 lg:pb-0">
        {categories.slice(0, 4).map((category) => (
          <div key={category.id} className="py-4">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {category.name}
                </h2>
                <Link
                  to={`/products?category=${category.slug}`}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  View All
                </Link>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {products
                    .filter((p) => p.category_id === category.id)
                    .slice(0, 8)
                    .map((product) => {
                      const hasDiscount = (product.discount_percent || 0) > 0;
                      const price = (product.price_cents || 0) / 100;
                      const finalPrice = hasDiscount
                        ? price * (1 - product.discount_percent / 100)
                        : price;
                      return (
                        <div
                          key={product.id}
                          className="flex-none w-36 sm:w-40 bg-white rounded-lg shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden group border border-gray-200"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          <div className="relative">
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            {hasDiscount && (
                              <div className="absolute top-1 left-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                                {product.discount_percent}% OFF
                              </div>
                            )}

                            {product.stock_quantity <= 5 &&
                              product.stock_quantity > 0 && (
                                <div className="absolute bottom-1 right-1 bg-amber-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                                  {product.stock_quantity} left
                                </div>
                              )}
                            {product.stock_quantity <= 0 && (
                              <div className="absolute bottom-1 right-1 bg-rose-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                                Out of Stock
                              </div>
                            )}
                          </div>
                          <div className="p-2 sm:p-3">
                            <h3 className="font-medium text-xs sm:text-sm text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight min-h-[2rem]">
                              {product.title}
                            </h3>

                            {/* Price Section - Compact */}
                            <div className="mb-2">
                              {hasDiscount ? (
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm sm:text-base font-bold text-emerald-600">
                                      ₹{finalPrice.toFixed(2)}
                                    </span>
                                    <span className="text-gray-500 line-through text-xs">
                                      ₹{price.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-emerald-600 font-semibold text-xs">
                                      Save ₹{(price - finalPrice).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm sm:text-base font-bold text-gray-900">
                                  ₹{finalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <button
                              className={`w-full py-1.5 px-2 rounded text-xs font-medium transition-all duration-200 ${
                                product.stock_quantity <= 0
                                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                              }`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (product.stock_quantity <= 0) return;
                                try {
                                  await addToCart(product, 1);
                                  navigate("/cart");
                                } catch (err) {
                                  console.error("Add to cart failed", err);
                                }
                              }}
                              disabled={product.stock_quantity <= 0}
                            >
                              {product.stock_quantity <= 0
                                ? "Out of Stock"
                                : "Add to Cart"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <MobileBottomNav />
      {/* Home Specials - two prominent image cards */}
      <div className="bg-white mt-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Home Specials
              </h2>
              <p className="text-sm text-gray-600">
                Handpicked pantry and breakfast essentials — curated for you.
              </p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="hidden sm:inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              Browse all
              <svg
                className="w-4 h-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              role="button"
              onClick={() => navigate('/products?category=pantry')}
              className="relative h-44 sm:h-56 lg:h-[400px] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1 cursor-pointer bg-gray-50"
            >
              <img
                src="/home-specials/pantry.png"
                alt="Pantry Specials"
                className="w-full h-full lg:h-full object-cover"
                loading="lazy"
                onError={(e) => (e.target.src = '/logo192.png')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">Pantry Essentials</h3>
                  <p className="text-white text-xs opacity-90">Staples and bulk buys for your kitchen</p>
                </div>
              </div>
            </div>

            <div
              role="button"
              onClick={() => navigate('/products?category=breakfast')}
              className="relative h-44 sm:h-56 lg:h-[400px] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1 cursor-pointer bg-gray-50"
            >
              <img
                src="/home-specials/breakfast.png"
                alt="Breakfast Specials"
                className="w-full h-full lg:h-full object-cover"
                loading="lazy"
                onError={(e) => (e.target.src = '/logo192.png')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">Breakfast Picks</h3>
                  <p className="text-white text-xs opacity-90">Kickstart your day with healthy choices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;