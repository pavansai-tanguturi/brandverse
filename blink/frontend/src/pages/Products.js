// src/pages/Products.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import ModernNavbar from '../components/ModernNavbar';
import MobileBottomNav from '../components/MobileBottomNav';
import logo from '../assets/logos.png';
import locationIcon from '../assets/location.png';

function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state: wishlistState, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [locationName, setLocationName] = useState('Fetching location...');
  
  // Refs for click-outside detection
  const categoryRef = useRef(null);
  const priceRef = useRef(null);
  const stockRef = useRef(null);
  const sortRef = useRef(null);
  
  // Product state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('name');
  
  // Flipkart-style filter states
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [availability, setAvailability] = useState('all');
  
  // Collapsible filter sections
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;
  
  // Categories with dynamic counts (fetched from backend)
  const [categories, setCategories] = useState([]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search products
  useEffect(() => {
    let filtered = [...products];

    // URL-driven quick filters
    const urlMaxPriceRaw = searchParams.get('maxPrice');
    const urlMaxPrice = urlMaxPriceRaw ? parseInt(urlMaxPriceRaw, 10) : null;
    const hasMaxPrice = typeof urlMaxPrice === 'number' && !Number.isNaN(urlMaxPrice) && urlMaxPrice > 0;
    const urlDiscountRaw = searchParams.get('discount');
    const urlDiscount = urlDiscountRaw ? parseInt(urlDiscountRaw, 10) : 0;
    const urlTag = (searchParams.get('tag') || '').toLowerCase();
    const urlSort = (searchParams.get('sort') || '').toLowerCase();

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => {
        if (product.category && product.category.slug) {
          return product.category.slug === selectedCategory;
        }
        if (product.category_slug) {
          return product.category_slug === selectedCategory;
        }
        if (typeof product.category === 'string') {
          return product.category === selectedCategory;
        }
        return false;
      });
    }

    // Availability filter
    if (availability === 'in-stock') {
      filtered = filtered.filter(product => product.stock_quantity > 0);
    } else if (availability === 'out-of-stock') {
      filtered = filtered.filter(product => product.stock_quantity <= 0);
    }

    // Price range filter combined with url maxPrice
    filtered = filtered.filter(product => {
      const price = product.price_cents / 100;
      const upper = hasMaxPrice ? Math.min(priceRange[1], urlMaxPrice) : priceRange[1];
      return price >= priceRange[0] && price <= upper;
    });

    // Discount/tag filter
    const minDiscount = Math.max(0, urlDiscount, urlTag === 'great-deal' ? 30 : 0);
    if (minDiscount > 0) {
      filtered = filtered.filter(p => (p.discount_percent || 0) >= minDiscount);
    }

    // Sort products (URL param overrides local dropdown when present)
    const effectiveSort = urlSort || sortBy;
    filtered.sort((a, b) => {
      switch (effectiveSort) {
        case 'price-low':
          return a.price_cents - b.price_cents;
        case 'price-high':
          return b.price_cents - a.price_cents;
        case 'discount':
          return (b.discount_percent || 0) - (a.discount_percent || 0);
        case 'new': {
          const aDate = a.created_at ? new Date(a.created_at).getTime() : (a.id || 0);
          const bDate = b.created_at ? new Date(b.created_at).getTime() : (b.id || 0);
          return bDate - aDate;
        }
        case 'popularity': {
          const aScore = a.total_sales || a.sold_count || 0;
          const bScore = b.total_sales || b.sold_count || 0;
          if (aScore !== bScore) return bScore - aScore;
          // tie-breaker by discount
          return (b.discount_percent || 0) - (a.discount_percent || 0);
        }
        case 'name':
        default:
          return (a.title || '').localeCompare(b.title || '');
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchQuery, selectedCategory, sortBy, priceRange, availability, searchParams]);

  // Sync local state with URL search params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category') || 'all';
    const urlSort = (searchParams.get('sort') || '').toLowerCase();
    
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
    // Sync dropdown sort state for supported sorts
    if (['price-low', 'price-high', 'discount', 'name'].includes(urlSort) && urlSort !== sortBy) {
      setSortBy(urlSort);
    }
  }, [searchParams]);

  // Click-outside detection for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      if (priceRef.current && !priceRef.current.contains(event.target)) {
        setIsPriceOpen(false);
      }
      if (stockRef.current && !stockRef.current.contains(event.target)) {
        setIsStockOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  // Get location
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
          const city = data.address.city || data.address.town || data.address.village || 'Unknown location';
          setLocationName(city);
        } catch (error) {
          console.error('Error fetching location:', error);
          setLocationName('Location unavailable');
        }
      }, () => {
        setLocationName('Location permission denied');
      });
    } else {
      setLocationName('Geolocation not supported');
    }
  }, []);

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Get unique brands from products
  const brands = [...new Set(products.map(product => product.brand).filter(Boolean))];

  // Get breadcrumb text based on current filters
  const getBreadcrumbText = () => {
    if (searchQuery) {
      return `Search: "${searchQuery}"`;
    }
    if (selectedCategory !== 'all') {
      const category = categories.find(cat => cat.slug === selectedCategory);
      return category ? category.name : 'Category';
    }
    if (availability !== 'all' || priceRange[0] > 0 || priceRange[1] < 100000) {
      return 'Filtered Products';
    }
    return 'All Products';
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 100000]);
    setSelectedBrands([]);
    setSelectedRatings([]);
    setAvailability('all');
    setSearchQuery('');
    setSearchParams({});
  };

  // Wishlist helper functions
  const isInWishlist = (productId) => {
    if (!wishlistState || !wishlistState.items) return false;
    const inWishlist = wishlistState.items.some(item => item.id === productId);
    console.log(`Product ${productId} in wishlist:`, inWishlist);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-20 lg:pb-0">
      <ModernNavbar showSearch={true} />

      {/* Breadcrumb */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-gray-200">
        <nav className="flex items-center space-x-2 text-sm">
          <Link to="/" className="text-emerald-600 hover:text-emerald-800">Home</Link>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600">{getBreadcrumbText()}</span>
        </nav>
      </div>

      {/* Horizontal Filter Bar - Gromuse Style */}
   <div className="max-w-7xl mx-auto px-4 py-3">
  <div className="flex flex-wrap items-center gap-3 relative">
    
    {/* (moved) Clear All Button - will render at the right end of the row */}

    {/* Category Filter */}
    <div className="relative" ref={categoryRef}>
      <button
        onClick={() => {
          setIsCategoryOpen(!isCategoryOpen);
          setIsPriceOpen(false);
          setIsStockOpen(false);
          setIsSortOpen(false);
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
          selectedCategory !== 'all'
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500 hover:shadow-sm'
        }`}
      >
        <span className="font-medium text-sm whitespace-nowrap">
          {selectedCategory === 'all'
            ? 'All Categories'
            : categories.find(c => c.slug === selectedCategory)?.name || 'Category'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isCategoryOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isCategoryOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[250px] p-2 z-50">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setIsCategoryOpen(false);
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories
            .filter(category => {
              // compute count for this category
              const count = products.filter(p => p.category?.slug === category.slug).length;
              // Skip placeholder category with slug 'all', categories with no items,
              // or categories whose name looks like "All" to avoid duplicate entries
              return (
                category.slug !== 'all' &&
                count > 0 &&
                !/^all/i.test(category.name || '')
              );
            })
            .map(category => {
              const count = products.filter(p => p.category?.slug === category.slug).length;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.slug);
                    setIsCategoryOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    selectedCategory === category.slug
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {category.name} ({count})
                </button>
              );
            })}
        </div>
      )}
    </div>

    {/* Price Filter */}
    <div className="relative" ref={priceRef}>
      <button
        onClick={() => {
          setIsPriceOpen(!isPriceOpen);
          setIsCategoryOpen(false);
          setIsStockOpen(false);
          setIsSortOpen(false);
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
          priceRange[0] > 0 || priceRange[1] < 100000
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500 hover:shadow-sm'
        }`}
      >
        <span className="font-medium text-sm whitespace-nowrap">
          {priceRange[1] < 100000 ? `₹${priceRange[0]} - ₹${priceRange[1]}` : 'Price'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isPriceOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isPriceOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg w-[300px] p-4 z-50">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Price Range</label>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100000"
            step="100"
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full h-2 bg-gray-200 rounded-lg accent-emerald-600"
          />

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[500, 1000, 2000, 5000].map(val => (
              <button
                key={val}
                onClick={() => setPriceRange([0, val])}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  priceRange[1] === val
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-700 font-semibold'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-emerald-400'
                }`}
              >
                Under ₹{val}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Stock Filter */}
    <div className="relative" ref={stockRef}>
      <button
        onClick={() => {
          setIsStockOpen(!isStockOpen);
          setIsCategoryOpen(false);
          setIsPriceOpen(false);
          setIsSortOpen(false);
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
          availability !== 'all'
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500 hover:shadow-sm'
        }`}
      >
        <span className="font-medium text-sm whitespace-nowrap">
          {availability === 'in-stock'
            ? 'In Stock'
            : availability === 'out-of-stock'
            ? 'Out of Stock'
            : 'Stock'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isStockOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isStockOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg w-[250px] p-2 z-50">
          {[{ value: 'all', label: 'All Products', count: products.length },
            { value: 'in-stock', label: 'In Stock', count: products.filter(p => p.stock_quantity > 0).length },
            { value: 'out-of-stock', label: 'Out of Stock', count: products.filter(p => p.stock_quantity <= 0).length }].map(option => (
            <button
              key={option.value}
              onClick={() => {
                setAvailability(option.value);
                setIsStockOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                availability === option.value
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Sort Filter */}
    <div className="relative" ref={sortRef}>
      <button
        onClick={() => {
          setIsSortOpen(!isSortOpen);
          setIsCategoryOpen(false);
          setIsPriceOpen(false);
          setIsStockOpen(false);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-300 bg-white text-gray-700 hover:border-emerald-500 hover:shadow-sm transition-all"
      >
        <span className="font-medium text-sm whitespace-nowrap">
          Sort
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isSortOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg w-[250px] p-2 z-50">
          {[{ value: 'name', label: 'Name: A-Z' },
            { value: 'price-low', label: 'Price: Low to High' },
            { value: 'price-high', label: 'Price: High to Low' },
            { value: 'discount', label: 'Best Discount' }].map(option => (
            <button
              key={option.value}
              onClick={() => {
                setSortBy(option.value);
                setIsSortOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                sortBy === option.value
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Clear All Button (moved to right) */}
    <button
      onClick={() => {
        setSelectedCategory('all');
        setPriceRange([0, 100000]);
        setAvailability('all');
        setSortBy('name');
      }}
      className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-300 bg-white text-gray-700 hover:border-emerald-500 hover:shadow-sm transition-all"
    >
      Clear All
    </button>
  </div>
</div>




      {/* Main Layout - Full Width */}
      <div className="w-full">
        
          {/* Main Content - Full Width */}
          <div className="flex-1 pb-16">
            
            {/* Products Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {searchQuery ? `"${searchQuery}"` : getBreadcrumbText()}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </p>
              </div>
            </div>

            {/* Products Grid - Compact Mobile Design */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="mt-3 text-gray-600 text-sm">Loading products...</p>
              </div>
            ) : currentProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {currentProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden group border border-gray-200"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="relative">
                      <img 
                        src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80'} 
                        alt={product.title ? product.title : 'Product'}
                        className="w-full h-28 sm:h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {product.discount_percent > 0 && (
                        <div className="absolute top-1 left-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                          {product.discount_percent}% OFF
                        </div>
                      )}
                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => handleWishlistToggle(e, product)}
                        className={`absolute top-1 right-1 p-1.5 rounded-full shadow-md transition-all transform hover:scale-110 ${
                          isInWishlist(product.id) 
                            ? 'bg-red-50 hover:bg-red-100 ring-2 ring-red-200' 
                            : 'bg-white/95 hover:bg-white'
                        }`}
                        aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        {isInWishlist(product.id) ? (
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                      </button>

                      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
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
                        {product.title ? product.title : 'Product Name'}
                      </h3>
                      
                      {/* Price Section - Compact */}
                      <div className="mb-2">
                        {product.discount_percent && product.discount_percent > 0 ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm sm:text-base font-bold text-emerald-600">
                                ₹{((product.price_cents / 100) * (1 - product.discount_percent / 100)).toFixed(2)}
                              </span>
                              <span className="text-gray-500 line-through text-xs">
                                ₹{(product.price_cents / 100).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-600 font-semibold text-xs">
                                Save ₹{((product.price_cents / 100) * (product.discount_percent / 100)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm sm:text-base font-bold text-gray-900">
                            ₹{(product.price_cents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <button 
                        className={`w-full py-1.5 px-2 rounded text-xs font-medium transition-all duration-200 ${
                          product.stock_quantity <= 0 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm'
                        }`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (product.stock_quantity <= 0) return;
                          try {
                            await addToCart(product, 1);
                            navigate('/cart');
                          } catch (err) {
                            console.error('Error adding to cart:', err);
                          }
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
              <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 text-sm mb-4">Try adjusting your search or filter criteria</p>
                <button 
                  onClick={clearAllFilters}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2 rounded-lg transition-all duration-200 shadow-sm text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                
                {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default Products;