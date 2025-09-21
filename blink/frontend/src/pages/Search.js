import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadingTimeout = useRef(null);
  const [hasSearched, setHasSearched] = useState(false);

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
      return;
    }

    // Show loading spinner after 50ms if search is slow
    if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    loadingTimeout.current = setTimeout(() => setLoading(true), 50);
    setHasSearched(true);

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

  // Dynamic search on input change with debounce
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (searchQuery.trim()) {
      searchDebounce.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 120); // Debounce API call by 120ms
    } else {
      setProducts([]);
      setHasSearched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      // performSearch(); // No need, already handled by useEffect
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation showSearch={false} />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Search Products</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                className="w-full bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl px-6 py-4 pl-14 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl transition-all shadow-lg"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        <div className="max-w-6xl mx-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Searching...</span>
            </div>
          )}

          {!loading && hasSearched && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {!isValidQuery(searchQuery) ? (
                    <>Please enter a valid search (letters, numbers, spaces only).</>
                  ) : products.length > 0 
                    ? `Found ${products.length} result${products.length !== 1 ? 's' : ''} for "${searchQuery}"`
                    : `No results found for "${searchQuery}"`
                  }
                </h2>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => {
                    // Calculate pricing based on actual database structure
                    const originalPrice = (product.price_cents || 0) / 100;
                    const discountPercent = product.discount_percent || 0;
                    const finalPrice = originalPrice * (1 - discountPercent / 100);
                    
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-white/20"
                      >
                        <div className="relative overflow-hidden rounded-t-2xl">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'}
                            alt={product.title}
                            className="w-full h-48 object-cover"
                          />
                          {discountPercent > 0 && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              {discountPercent}% OFF
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {product.title}
                          </h3>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              {discountPercent > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg font-bold text-green-600">
                                      ₹{finalPrice.toFixed(2)}
                                    </span>
                                    <span className="text-gray-500 line-through text-sm">
                                      ₹{originalPrice.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-green-600 font-semibold text-xs">
                                      Save ₹{(originalPrice - finalPrice).toFixed(2)}
                                    </span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                                      {discountPercent}% OFF
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-gray-900">
                                  ₹{originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            
                            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg text-sm">
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : hasSearched && (
                <div className="text-center py-12">
                  <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl max-w-md mx-auto">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your search terms or browse our categories
                    </p>
                    <button 
                      onClick={() => navigate('/')}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg"
                    >
                      Browse Products
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!hasSearched && (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl max-w-md mx-auto">
                <svg className="mx-auto h-16 w-16 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
                <p className="text-gray-600">
                  Enter keywords to find products you're looking for
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Search;