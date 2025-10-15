import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ModernNavbar from "../components/ModernNavbar";
import MobileBottomNav from "../components/MobileBottomNav";

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortOption, setSortOption] = useState("relevance");
  const [spellingSuggestions, setSpellingSuggestions] = useState(null);
  const [didYouMean, setDidYouMean] = useState(null);
  const [correctedResults, setCorrectedResults] = useState(false);
  const loadingTimeout = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE || "http://localhost:3001";
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories([{ id: "all", name: "All Categories" }, ...data]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Get initial search query and category from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get("q") || "";
    const category = urlParams.get("category") || "all";
    setSearchQuery(query);
    setSelectedCategory(category);
    if (query || category !== "all") {
      performSearch(query, category);
    }
  }, [location.search]);

  // Validate search query
  const isValidQuery = (q) => /^[a-zA-Z0-9\s.,'-]+$/.test(q) || q === "";

  // Debounce search API calls
  const searchDebounce = useRef(null);
  const performSearch = async (
    query = searchQuery,
    category = selectedCategory,
  ) => {
    if (!query.trim() && category === "all") {
      setProducts([]);
      setHasSearched(true);
      setLoading(false);
      setSuggestions([]);
      return;
    }

    if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    loadingTimeout.current = setTimeout(() => setLoading(true), 50);
    setHasSearched(true);
    setShowSuggestions(false);

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const queryParams = new URLSearchParams();
      if (query.trim()) queryParams.set("q", query);
      if (category !== "all") queryParams.set("category", category);
      if (sortOption) queryParams.set("sort", sortOption);

      const response = await fetch(
        `${API_BASE_URL}/api/products/search?${queryParams.toString()}`,
      );

      if (!response.ok) {
        console.error("Search failed:", response.status);
        setProducts([]);
        setLoading(false);
        return;
      }

      let data = await response.json();

      // Handle new response format with suggestions
      if (data.products) {
        // New format with spell checking
        let products = data.products;
        if (query.length === 1 && query.trim()) {
          products = products.filter((product) =>
            product.title?.toLowerCase().startsWith(query.toLowerCase()),
          );
        }
        setProducts(products);

        // Handle spelling suggestions
        setSpellingSuggestions(data.suggestions || null);
        setDidYouMean(data.didYouMean || null);
        setCorrectedResults(data.correctedResults || false);
      } else {
        // Fallback for old format
        if (query.length === 1 && query.trim()) {
          data = data.filter((product) =>
            product.title?.toLowerCase().startsWith(query.toLowerCase()),
          );
        }
        setProducts(data);
      }
    } catch (error) {
      console.error("Error searching products:", error);
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
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const response = await fetch(
        `${API_BASE_URL}/api/products/search/suggestions?q=${encodeURIComponent(query)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Handle input changes with debounce
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (searchQuery.trim() || selectedCategory !== "all") {
      getSuggestions(searchQuery);
      setShowSuggestions(true);
      searchDebounce.current = setTimeout(() => {
        performSearch(searchQuery, selectedCategory);
      }, 200);
    } else {
      setProducts([]);
      setSuggestions([]);
      setHasSearched(false);
      setShowSuggestions(false);
    }
  }, [searchQuery, selectedCategory, sortOption]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() || selectedCategory !== "all") {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.set("q", searchQuery);
      if (selectedCategory !== "all")
        queryParams.set("category", selectedCategory);
      navigate(`/search?${queryParams.toString()}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    const queryParams = new URLSearchParams();
    queryParams.set("q", suggestion);
    if (selectedCategory !== "all")
      queryParams.set("category", selectedCategory);
    navigate(`/search?${queryParams.toString()}`);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const queryParams = new URLSearchParams();
    if (searchQuery.trim()) queryParams.set("q", searchQuery);
    if (categoryId !== "all") queryParams.set("category", categoryId);
    navigate(`/search?${queryParams.toString()}`);
  };

  const handleSortChange = (sort) => {
    setSortOption(sort);
    performSearch(searchQuery, selectedCategory);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const popularSearches = [
    "Milk",
    "Bread",
    "Eggs",
    "Rice",
    "Fruits",
    "Vegetables",
    "Snacks",
    "Beverages",
    "Dairy",
    "Cleaning",
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ModernNavbar showSearch={true} />

      <div className="container mx-auto px-4 py-6 pt-24">
        {/* Search Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Search Products
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Explore our wide range of products by name or category
          </p>

          {/* Search Form and Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-md mb-8">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-4 items-center"
            >
              <div className="relative flex-1 w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for products, brands, or categories..."
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-6 py-3 pl-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          <span className="text-gray-700">{suggestion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-all duration-300 font-medium"
              >
                Search
              </button>
            </form>

            {/* Sort Options */}
            <div className="mt-4 flex justify-end">
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Popular Searches */}
          {!hasSearched && (
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Popular Searches
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-emerald-300 transition-all duration-200"
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
              <span className="text-gray-600 text-lg">
                Searching products...
              </span>
            </div>
          )}

          {!loading && hasSearched && (
            <>
              <div className="mb-8">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {!isValidQuery(searchQuery) ? (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        <span>Please enter a valid search term</span>
                      </div>
                    ) : products.length > 0 ? (
                      `Found ${products.length} result${products.length !== 1 ? "s" : ""} for "${searchQuery || selectedCategory !== "all" ? categories.find((c) => c.id === selectedCategory)?.name : "All"}"`
                    ) : (
                      `No results found for "${searchQuery || selectedCategory !== "all" ? categories.find((c) => c.id === selectedCategory)?.name : "All"}"`
                    )}
                  </h2>
                  {products.length > 0 && (
                    <p className="text-gray-600">
                      Browse our matching products
                    </p>
                  )}

                  {/* Did You Mean? Section */}
                  {correctedResults && didYouMean && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 text-blue-800">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm">
                          Showing results for <strong>"{didYouMean}"</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Spelling Suggestions (when no results found) */}
                  {products.length === 0 &&
                    spellingSuggestions &&
                    spellingSuggestions.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-start space-x-2 text-yellow-800">
                          <svg
                            className="w-5 h-5 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-medium">Did you mean?</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {spellingSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setSearchQuery(suggestion.suggestions[0]);
                                    performSearch(
                                      suggestion.suggestions[0],
                                      selectedCategory,
                                    );
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  {suggestion.suggestions[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                  {products.map((product) => {
                    const originalPrice = (product.price_cents || 0) / 100;
                    const discountPercent = product.discount_percent || 0;
                    const finalPrice =
                      originalPrice * (1 - discountPercent / 100);

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden group"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={
                              product.image_url ||
                              "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80"
                            }
                            alt={product.title}
                            className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {discountPercent > 0 && (
                            <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold">
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
                          <p className="text-xs text-gray-500 mb-2">
                            {product.category_name || "General"}
                          </p>
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
                                <span className="text-emerald-600 text-xs font-semibold">
                                  Save ₹
                                  {(originalPrice - finalPrice).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                ₹{originalPrice.toFixed(2)}
                              </span>
                            )}
                            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg transition-all duration-300 text-sm font-medium">
                              View Product
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                hasSearched &&
                (isValidQuery(searchQuery) || selectedCategory !== "all") && (
                  <div className="text-center py-16">
                    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-amber-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No products found
                      </h3>
                      <p className="text-gray-600 mb-6">
                        We couldn't find any products matching your criteria.
                        Try different keywords or categories.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => navigate("/products")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-all duration-300 font-medium"
                        >
                          Browse All Products
                        </button>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("all");
                            navigate("/search");
                          }}
                          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-lg transition-all duration-300 font-medium"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </>
          )}

          {!hasSearched && !loading && (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Start your search
                </h3>
                <p className="text-gray-600 mb-4">
                  Enter keywords or select a category to find products
                </p>
                <p className="text-sm text-gray-500">
                  Try searching for items like milk, bread, or select a category
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
