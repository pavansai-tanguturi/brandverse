import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ModernNavbar from '../components/ModernNavbar';
import MobileBottomNav from '../components/MobileBottomNav';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const loadingTimeout = useRef(null);
  const searchInputRef = useRef(null);

  // Get initial search query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [location.search]);

  // Only allow letters, numbers, spaces, and basic punctuation
  const isValidQuery = (q) => /^[a-zA-Z0-9\s.,'-]+$/.test(q);

  // Debounce API calls to avoid firing on every keystroke
  const searchDebounce = useRef(null);
  const performSearch = async (query = searchQuery) => {
    if (!query.trim() || !isValidQuery(query)) {
      setProducts([]);
      setHasSearched(true);
      setLoading(false);
      setSuggestions([]);
      return;
    }

    // Show loading spinner after 50ms if search is slow
    if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    loadingTimeout.current = setTimeout(() => setLoading(true), 50);
    setHasSearched(true);
    setShowSuggestions(false);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Search failed:', response.status, errorData);
        setProducts([]);
        setLoading(false);
        return;
      }

      let data = await response.json();
      // Filter products to only those whose title starts with the query (case-insensitive)
      if (query.length === 1) {
        data = data.filter(product => product.title && product.title.toLowerCase().startsWith(query.toLowerCase()));
      }
      setProducts(data);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      setLoading(false);
    }
  };

  // Get search suggestions
  const getSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/products/search/suggestions?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.slice(0, 5)); // Show only top 5 suggestions
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Dynamic search on input change with debounce
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    
    if (searchQuery.trim()) {
      // Get suggestions while typing
      getSuggestions(searchQuery);
      setShowSuggestions(true);
      
      // Debounce main search
      searchDebounce.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 200);
    } else {
      setProducts([]);
      setSuggestions([]);
      setHasSearched(false);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const popularSearches = [
    "Milk", "Bread", "Eggs", "Rice", "Fruits",
    "Vegetables", "Snacks", "Beverages", "Dairy", "Cleaning"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-20">
      <ModernNavbar showSearch={true} />
      
      <div className="container mx-auto px-4 py-6 pt-24">
        {/* Search Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Search Products</h1>
          <p className="text-gray-600 text-center mb-8">Find exactly what you're looking for</p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for products, brands and more..."
                className="w-full bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 pl-14 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-lg text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                Search
              </button>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-6 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-gray-700">{suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* Popular Searches */}
          {!hasSearched && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Searches</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 px-4 py-2 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <span className="text-gray-600 text-lg">Searching products...</span>
            </div>
          )}

          {!loading && hasSearched && (
            <>
              <div className="mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {!isValidQuery(searchQuery) ? (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>Please enter a valid search term</span>
                      </div>
                    ) : products.length > 0 
                      ? `Found ${products.length} result${products.length !== 1 ? 's' : ''} for "${searchQuery}"`
                      : `No results found for "${searchQuery}"`
                    }
                  </h2>
                  {products.length > 0 && (
                    <p className="text-gray-600">Browse through our matching products</p>
                  )}
                </div>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  {products.map((product) => {
                    // Calculate pricing based on actual database structure
                    const originalPrice = (product.price_cents || 0) / 100;
                    const discountPercent = product.discount_percent || 0;
                    const finalPrice = originalPrice * (1 - discountPercent / 100);
                    
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-200 overflow-hidden group"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'}
                            alt={product.title}
                            className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {discountPercent > 0 && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                              {discountPercent}% OFF
                            </div>
                          )}
                          {product.stock_quantity <= 0 && (
                            <div className="absolute top-2 right-2 bg-rose-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              Out of Stock
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm leading-tight min-h-[2.5rem]">
                            {product.title}
                          </h3>
                          
                          <div className="space-y-2">
                            {discountPercent > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-emerald-600">
                                    ₹{finalPrice.toFixed(2)}
                                  </span>
                                  <span className="text-gray-500 line-through text-sm">
                                    ₹{originalPrice.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-emerald-600 font-semibold text-xs">
                                    Save ₹{(originalPrice - finalPrice).toFixed(2)}
                                  </span>
                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">
                                    {discountPercent}% OFF
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                ₹{originalPrice.toFixed(2)}
                              </span>
                            )}
                            
                            <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm font-medium">
                              View Product
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : hasSearched && isValidQuery(searchQuery) && (
                <div className="text-center py-16">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
                    <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-6">
                      We couldn't find any products matching "{searchQuery}". Try different keywords or browse our categories.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button 
                        onClick={() => navigate('/products')}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                      >
                        Browse All Products
                      </button>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                      >
                        Clear Search
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!hasSearched && !loading && (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Start your search</h3>
                <p className="text-gray-600 mb-4">
                  Enter keywords to find products you're looking for
                </p>
                <p className="text-sm text-gray-500">
                  Try searching for items like milk, bread, fruits, or snacks
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Search;