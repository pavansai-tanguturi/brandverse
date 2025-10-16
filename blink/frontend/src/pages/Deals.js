// src/pages/Deals.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ModernNavbar from "../components/ModernNavbar";
import MobileBottomNav from "../components/MobileBottomNav";

function Deals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationName, setLocationName] = useState("Fetching location...");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortBy, setSortBy] = useState("discount");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  const fetchProducts = async () => {
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        const discountedProducts = data.filter(
          (product) => product.discount_percent > 0,
        );
        setProducts(discountedProducts);
        setFilteredProducts(discountedProducts);
      } else {
        console.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...products];
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "discount":
          return (b.discount_percent || 0) - (a.discount_percent || 0);
        case "price-low":
          return a.price_cents - b.price_cents;
        case "price-high":
          return b.price_cents - a.price_cents;
        case "name":
        default:
          return (a.title || "").localeCompare(b.title || "");
      }
    });
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, sortBy]);

  useEffect(() => {
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
              "Unknown location";
            setLocationName(city);
          } catch (error) {
            setLocationName("Location unavailable");
          }
        },
        () => {
          setLocationName("Location permission denied");
        },
      );
    } else {
      setLocationName("Geolocation not supported");
    }
  }, []);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct,
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-20 lg:pb-0">
      <ModernNavbar showSearch={true} />

      {/* Back Navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Minimal Filter Header */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Deals</h1>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {filteredProducts.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-0 text-sm text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="discount">Best Discount</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
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
                    src={
                      product.image_url ||
                      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={product.title || "Product"}
                    className="w-full h-28 sm:h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {product.discount_percent > 0 && (
                    <div className="absolute top-1 left-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                      {product.discount_percent}% OFF
                    </div>
                  )}
                  {product.stock_quantity <= 5 &&
                    product.stock_quantity > 0 && (
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
                    {product.title || "Product Name"}
                  </h3>
                  <div className="mb-2">
                    {product.discount_percent > 0 ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm sm:text-base font-bold text-emerald-600">
                            ₹
                            {(
                              (product.price_cents / 100) *
                              (1 - product.discount_percent / 100)
                            ).toFixed(2)}
                          </span>
                          <span className="text-gray-500 line-through text-xs">
                            ₹{(product.price_cents / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-600 font-semibold text-xs">
                            Save ₹
                            {(
                              (product.price_cents / 100) *
                              (product.discount_percent / 100)
                            ).toFixed(2)}
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
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${product.id}`);
                    }}
                    disabled={product.stock_quantity <= 0}
                  >
                    {product.stock_quantity <= 0 ? "Out of Stock" : "View Deal"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No deals available
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Check back later for amazing offers and discounts
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2 rounded-lg transition-all duration-200 shadow-sm text-sm"
            >
              Browse All Products
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mb-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}

export default Deals;
