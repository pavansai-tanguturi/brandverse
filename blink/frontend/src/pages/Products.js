// src/pages/Products.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { CartIcon, CustomerIcon } from '../components/icons';
import MobileBottomNav from '../components/MobileBottomNav';
import logo from '../assets/logos.png';
import locationIcon from '../assets/location.png';

function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state: wishlistState, addToWishlist, removeFromWishlist } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const [locationName, setLocationName] = useState('Fetching location...');
  
  // Product state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  
  // Flipkart-style filter states
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [availability, setAvailability] = useState('all');
  
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

    // Price range filter
    filtered = filtered.filter(product => {
      const price = product.price_cents / 100;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price_cents - b.price_cents;
        case 'price-high':
          return b.price_cents - a.price_cents;
        case 'discount':
          return (b.discount_percent || 0) - (a.discount_percent || 0);
        case 'name':
        default:
          return (a.title || '').localeCompare(b.title || '');
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchQuery, selectedCategory, sortBy, priceRange, availability]);

  // Sync local state with URL search params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category') || 'all';
    
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [searchParams]);

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
      {/* Navigation Header */}
      <header className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src={logo}
                className="h-12 w-auto object-contain rounded-lg"
                alt="Akepatimart"
              />
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
                  className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              {/* Login/Dashboard - Hidden on mobile */}
              <div className="hidden md:flex">
                {user ? (
                  <Link to="/dashboard" className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl px-4 py-2 text-white transition-all shadow-lg">
                    <div className="bg-white/20 rounded-full p-1">
                      <CustomerIcon width={16} height={16} color="white" />
                    </div>
                    <span className="hidden md:inline text-sm">Dashboard</span>
                  </Link>
                ) : (
                  <Link to="/login" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-2 rounded-xl transition-all shadow-lg">
                    Login
                  </Link>
                )}
              </div>

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
                className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm">
          <Link to="/" className="text-emerald-600 hover:text-emerald-800">Home</Link>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600">{getBreadcrumbText()}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Flipkart-style Filters Sidebar */}
          <div className="lg:w-1/4">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="font-semibold text-gray-900">FILTERS</span>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedCategory !== 'all' && (
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-medium">
                      Active
                    </span>
                  )}
                  <svg className={`w-5 h-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
            </div>

            <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              
              {/* Filters Header */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-900">Filters</h3>
                  <button 
                    onClick={clearAllFilters}
                    className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                  >
                    CLEAR ALL
                  </button>
                </div>
                
                {/* Active Filters Count */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{filteredProducts.length} Products</span>
                  <span className="text-gray-300">•</span>
                  <span>of {products.length}</span>
                </div>
              </div>

              {/* Categories Filter */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                  <span>CATEGORIES</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full flex items-center justify-between px-2 py-2 rounded transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-sm">All Categories</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{products.length}</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.slug)}
                      className={`w-full flex items-center justify-between px-2 py-2 rounded transition-all ${
                        selectedCategory === category.slug
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-sm">{category.name}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {products.filter(p => p.category?.slug === category.slug).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">PRICE</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">₹{priceRange[0]}</span>
                    <span className="text-gray-600">₹{priceRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex space-x-2">
                    {[500, 1000, 2000, 5000].map((price) => (
                      <button
                        key={price}
                        onClick={() => setPriceRange([0, price])}
                        className="flex-1 text-xs py-1 px-2 border border-gray-300 rounded hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                      >
                        Under ₹{price}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Availability Filter */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">AVAILABILITY</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Products', count: products.length },
                    { value: 'in-stock', label: 'In Stock', count: products.filter(p => p.stock_quantity > 0).length },
                    { value: 'out-of-stock', label: 'Out of Stock', count: products.filter(p => p.stock_quantity <= 0).length }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAvailability(option.value)}
                      className={`w-full flex items-center justify-between px-2 py-2 rounded transition-all ${
                        availability === option.value
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-sm">{option.label}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{option.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options for Mobile */}
              <div className="lg:hidden bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">SORT BY</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                >
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Best Discount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            
            {/* Results Header */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {searchQuery ? `"${searchQuery}"` : 'All Products'}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} results
                  </p>
                </div>
                
                {/* Sort Options - Desktop */}
                <div className="hidden lg:flex items-center space-x-3">
                  <label className="text-sm text-gray-600 font-medium">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                  >
                    <option value="name">Name A-Z</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="discount">Best Discount</option>
                  </select>
                </div>
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