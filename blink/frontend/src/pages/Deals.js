// src/pages/Deals.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartIcon, CustomerIcon } from '../components/icons';
import MobileBottomNav from '../components/MobileBottomNav';
import logo from '../assets/logos.png';
import locationIcon from '../assets/location.png';

function Deals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationName, setLocationName] = useState('Fetching location...');

  // Product state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Sort options
  const [sortBy, setSortBy] = useState('discount');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  // Fetch products
  const fetchProducts = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        // Filter only products with discounts
        const discountedProducts = data.filter(product =>
          product.discount_percent && product.discount_percent > 0
        );
        setProducts(discountedProducts);
        setFilteredProducts(discountedProducts);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'discount':
          return (b.discount_percent || 0) - (a.discount_percent || 0);
        case 'price-low':
          return a.price_cents - b.price_cents;
        case 'price-high':
          return b.price_cents - a.price_cents;
        case 'name':
        default:
          return (a.title || '').localeCompare(b.title || '');
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, sortBy]);

  // Get location
  useEffect(() => {
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

            {/* Search Bar - Hidden on mobile, shown on desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search deals..."
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
                  onClick={() => navigate('/products')}
                  readOnly
                />
                <button type="button" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
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

              {/* Cart */}
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-3 py-2 cursor-pointer hover:bg-white/20 transition-all" onClick={() => navigate('/cart')}>
                <CartIcon width={20} height={20} color="white" strokeWidth={2} />
                <span className="hidden md:inline text-white text-sm">Cart</span>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search deals..."
                className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onClick={() => navigate('/products')}
                readOnly
              />
              <button type="button" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm">
          <Link to="/" className="text-emerald-600 hover:text-emerald-800">Home</Link>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600">Deals & Offers</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Deals Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Deals & Offers</h3>
                  <p className="text-sm text-gray-600">Exclusive discounts on selected items</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Deals</span>
                    <span className="text-lg font-bold text-emerald-600">{products.length}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Average Savings</span>
                    <span className="text-lg font-bold text-amber-600">
                      {products.length > 0
                        ? Math.round(products.reduce((acc, p) => acc + (p.discount_percent || 0), 0) / products.length)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">

            {/* Results Header */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Deals & Offers</span>
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} deals
                  </p>
                </div>

                {/* Sort Options */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-600 font-medium">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                  >
                    <option value="discount">Best Discount</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="mt-3 text-gray-600 text-sm">Loading deals...</p>
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
                      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                          {product.stock_quantity} left
                        </div>
                      )}
                      {product.stock_quantity <= 0 && (
                        <div className="absolute top-1 right-1 bg-rose-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-3">
                      <h3 className="font-medium text-xs sm:text-sm text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight min-h-[2rem]">
                        {product.title ? product.title : 'Product Name'}
                      </h3>

                      {/* Price Section */}
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
                        {product.stock_quantity <= 0 ? 'Out of Stock' : 'View Deal'}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals available</h3>
                <p className="text-gray-600 text-sm mb-4">Check back later for amazing offers and discounts</p>
                <button
                  onClick={() => navigate('/products')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2 rounded-lg transition-all duration-200 shadow-sm text-sm"
                >
                  Browse All Products
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

export default Deals;