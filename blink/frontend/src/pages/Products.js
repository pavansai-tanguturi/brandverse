// src/pages/Products.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartIcon, CustomerIcon } from '../components/icons';
import logo from '../assets/logos.png';
import locationIcon from '../assets/location.png';
// import Footer from '../components/Footer';

function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Category filter - FIXED
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(product => {
      // Check if product has category relationship (singular)
      if (product.category && product.category.slug) {
        return product.category.slug === selectedCategory;
      }
      // Fallback to direct category field if exists
      if (product.category_slug) {
        return product.category_slug === selectedCategory;
      }
      // Another fallback for different API structures
      if (typeof product.category === 'string') {
        return product.category === selectedCategory;
      }
      return false;
    });
  }

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
  setCurrentPage(1); // Reset to first page when filters change
}, [products, searchQuery, selectedCategory, sortBy]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation Header */}
      <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl sticky top-0 z-50">
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
                <Link to="/dashboard" className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl px-4 py-2 text-white transition-all shadow-lg">
                  <div className="bg-white/20 rounded-full p-1">
                    <CustomerIcon width={16} height={16} color="white" />
                  </div>
                  
                </Link>
              ) : (
                <Link to="/login" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl transition-all shadow-lg">
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

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm">
          <Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600">All Products</span>
          {searchQuery && (
            <>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-600">Search: "{searchQuery}"</span>
            </>
          )}
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <div className="lg:w-1/4">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-md"
              >
                <span className="font-semibold">Filters</span>
                <svg className={`w-5 h-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              
              {/* Categories Filter */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.slug)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                        selectedCategory === category.slug
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-sm">{category.name}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{category.count}</span>
                    </button>
                  ))}
                </div>
              </div>             
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            
            {/* Results Header */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} results
                  </p>
                </div>
                
                {/* Sort Options */}
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">Name A-Z</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="discount">Best Discount</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : currentProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {currentProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden group"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="relative">
                      <img 
                        src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80'} 
                        alt={product.title ? product.title : 'Product'}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {product.discount_percent > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          {product.discount_percent}% OFF
                        </div>
                      )}
                      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                        <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          Only {product.stock_quantity} left!
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {product.title ? product.title : 'Product Name'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description ? product.description : 'No description available'}
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
              <div className="text-center py-20 bg-white rounded-xl shadow-md">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setPriceRange([0, 1000]);
                    setSearchParams({});
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
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
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {/* <Footer /> */}
    </div>
  );
}

export default Products;