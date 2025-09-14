import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const performSearch = async (query = searchQuery) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(`http://localhost:3001/api/products/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Search failed');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Update URL with search query
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch();
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
                  {products.length > 0 
                    ? `Found ${products.length} result${products.length !== 1 ? 's' : ''} for "${searchQuery}"`
                    : `No results found for "${searchQuery}"`
                  }
                </h2>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-white/20"
                    >
                      <div className="relative overflow-hidden rounded-t-2xl">
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        {product.discount > 0 && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
                            -{product.discount}%
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            {product.discount > 0 ? (
                              <>
                                <span className="text-lg font-bold text-gray-900">
                                  ₹{(product.price * (1 - product.discount / 100)).toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{product.price}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                ₹{product.price}
                              </span>
                            )}
                          </div>
                          
                          <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg text-sm">
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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