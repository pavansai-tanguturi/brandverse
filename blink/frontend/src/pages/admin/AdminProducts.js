import React, { useState, useEffect } from "react";
import AdminNav from "../../components/admin/AdminNav";

const AdminProducts = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [discount, setDiscount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function to get auth token
  const getAuthToken = () => {
    try {
      return (
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token") ||
        ""
      );
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return "";
    }
  };

  // Helper function to get auth headers with better error handling
  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  // Helper function to get auth headers for FormData (without Content-Type)
  const getAuthHeadersForFormData = () => {
    const token = getAuthToken();
    const headers = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    let data = null;

    try {
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { error: text || "Unknown error occurred" };
        }
      }
    } catch (error) {
      data = { error: "Failed to parse response" };
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Clear invalid token
        try {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("token");
        } catch (e) {
          console.error("Error clearing localStorage:", e);
        }
        throw new Error(
          data?.error || "Authentication failed. Please login again.",
        );
      }
      throw new Error(
        data?.error || `API Error: ${response.status} ${response.statusText}`,
      );
    }

    return data;
  };

  // Get API base URL
  const getApiBase = () => {
    return import.meta.env.VITE_API_BASE || "http://localhost:3001";
  };

  // Fetch products and categories on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/api/categories`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await handleApiResponse(response);
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError(err.message);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/api/products`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await handleApiResponse(response);
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.title?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.categories?.name?.toLowerCase().includes(query)
    );
  });

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setStock("");
    setDescription("");
    setImageFiles([]);
    setExistingImages([]);
    setCategoryId("");
    setDiscount("");
    setEditingProduct(null);
    setShowAddForm(false);
    setMessage("");
    setError("");
    setExistingImageUrl(null);
  };

  const handleEdit = async (product) => {
    try {
      // Set form with available data immediately
      setEditingProduct(product);
      setTitle(product.title || "");
      setPrice(((product.price_cents || 0) / 100).toString());
      setStock((product.stock_quantity || 0).toString());
      setDescription(product.description || "");
      setCategoryId(product.category_id || "");
      setDiscount((product.discount_percent || 0).toString());
      setExistingImageUrl(product.image_url || null);
      setShowAddForm(true);

      // Fetch additional details
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/api/products/${product.id}`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await handleApiResponse(response);

      // Update with fresh data
      setExistingImages(data.product_images || []);
      if (data.product_images && data.product_images.length > 0) {
        setExistingImageUrl(data.product_images[0].url);
      }

      // Update fields if different
      if (data.title !== product.title) setTitle(data.title || "");
      if (data.price_cents !== product.price_cents)
        setPrice(((data.price_cents || 0) / 100).toString());
      if (data.stock_quantity !== product.stock_quantity)
        setStock((data.stock_quantity || 0).toString());
      if (data.description !== product.description)
        setDescription(data.description || "");
      if (data.category_id !== product.category_id)
        setCategoryId(data.category_id || "");
      if (data.discount_percent !== product.discount_percent)
        setDiscount((data.discount_percent || 0).toString());
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError(err.message);
      setExistingImages([]);
    }
  };

  const handleDelete = async (productId, force = false) => {
    if (!force) {
      if (!window.confirm("Are you sure you want to delete this product?"))
        return;
    }

    setError("");
    setMessage("");
    setDeletingProduct(productId);

    try {
      const API_BASE = getApiBase();
      const url = force
        ? `${API_BASE}/api/products/${productId}?force=true`
        : `${API_BASE}/api/products/${productId}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      // Check if product is in active carts
      if (!response.ok && response.status === 400) {
        const data = await response.json();
        if (data.cartCount && data.cartCount > 0) {
          // Show confirmation for force delete
          const forceDelete = window.confirm(
            `${data.message}\n\nDo you want to force delete this product? This will remove it from ${data.cartCount} active cart(s).`,
          );

          if (forceDelete) {
            // Retry with force=true
            setDeletingProduct(null);
            return handleDelete(productId, true);
          } else {
            setDeletingProduct(null);
            return;
          }
        }
      }

      await handleApiResponse(response);
      setMessage(
        force
          ? "Product deleted and removed from all carts successfully"
          : "Product deleted successfully",
      );
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(err.message);
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    if (!editingProduct) return;

    setDeletingImageId(imageId);

    try {
      const API_BASE = getApiBase();
      const response = await fetch(
        `${API_BASE}/api/products/${editingProduct.id}/images/${imageId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        },
      );

      await handleApiResponse(response);

      // Remove the deleted image from state
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      setMessage("Image deleted successfully");

      // Clear fallback if no images left
      if (existingImages.length <= 1) {
        setExistingImageUrl(null);
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      setError(err.message);
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const API_BASE = getApiBase();

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-");

      // Convert price to cents
      const convertToCents = (priceStr) => {
        if (!priceStr || priceStr === "") return 0;
        const cleanPrice = priceStr.toString().trim();
        const [wholePart, decimalPart = ""] = cleanPrice.split(".");
        const wholePartCents = parseInt(wholePart || "0", 10) * 100;
        const decimalPartCents = parseInt(
          (decimalPart + "00").substring(0, 2),
          10,
        );
        return wholePartCents + decimalPartCents;
      };

      const body = {
        title,
        slug,
        price_cents: convertToCents(price),
        stock_quantity: parseInt(stock, 10) || 0,
        description: description || "",
        category_id: categoryId || null,
        discount_percent: parseFloat(discount) || 0,
      };

      const isEditing = editingProduct !== null;
      const url = isEditing
        ? `${API_BASE}/api/products/${editingProduct.id}`
        : `${API_BASE}/api/products`;
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await handleApiResponse(response);

      // Handle image upload if there are files
      if (imageFiles.length > 0) {
        const productId = isEditing ? editingProduct.id : data.id;
        const formData = new FormData();

        for (const file of imageFiles) {
          formData.append("images", file);
        }

        const replaceParam = isEditing ? "?replace=false" : "";

        const imgResponse = await fetch(
          `${API_BASE}/api/products/${productId}/images${replaceParam}`,
          {
            method: "POST",
            headers: getAuthHeadersForFormData(),
            credentials: "include",
            body: formData,
          },
        );

        await handleApiResponse(imgResponse);
      }

      setMessage(`Product ${isEditing ? "updated" : "created"} successfully`);
      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-50" style={{ paddingTop: "64px" }}>
        <div className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your product catalog and inventory
              </p>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center">
              <svg
                className="w-5 h-5 mr-3 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center">
              <svg
                className="w-5 h-5 mr-3 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {error}
            </div>
          )}

          {/* Add/Edit Product Form */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
                  title="Close form"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Product Title *
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="Enter product title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Price (₹) *
                    </label>
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Discount (%)
                    </label>
                    <input
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Stock Quantity *
                    </label>
                    <input
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                      placeholder="0"
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Product Images
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        setImageFiles(Array.from(e.target.files))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {/* Existing Images Preview */}
                {existingImages.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Current Images
                      </label>
                      <span className="text-xs text-gray-500">
                        {existingImages.length} image(s)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {existingImages.map((img, index) => (
                        <div key={img.id || index} className="relative group">
                          <div className="aspect-square relative overflow-hidden rounded-lg border-2 border-gray-200">
                            <img
                              src={img.url}
                              alt={`Product view ${index + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            {img.is_primary && (
                              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                Primary
                              </div>
                            )}
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              disabled={deletingImageId === img.id}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                              title="Delete image"
                            >
                              {deletingImageId === img.id ? (
                                <svg
                                  className="w-3 h-3 animate-spin"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  ></path>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback for single image */}
                {existingImages.length === 0 && existingImageUrl && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Current Image
                    </label>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-300">
                        <img
                          src={existingImageUrl}
                          alt="Current product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Product Image
                        </p>
                        <p className="text-sm text-gray-600">
                          Upload new images above to replace or add more
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter detailed product description..."
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="w-4 h-4 mr-2 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        {editingProduct ? "Update Product" : "Create Product"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Product Inventory
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {searchQuery
                      ? `${filteredProducts.length} of ${products.length}`
                      : `Total: ${products.length}`}{" "}
                    products
                  </span>
                  <button
                    onClick={() =>
                      showAddForm ? resetForm() : setShowAddForm(true)
                    }
                    className={`flex items-center px-4 py-2 font-medium rounded-lg transition-colors shadow-sm ${
                      showAddForm
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {showAddForm ? (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                        Cancel
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          ></path>
                        </svg>
                        Add Product
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name, description, or category..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      title="Clear search"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loadingProducts ? (
              <div className="flex justify-center py-12">
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-6 h-6 animate-spin text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-gray-600">Loading products...</span>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9l3-3 3 3"
                  ></path>
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No products yet
                </h4>
                <p className="text-gray-600 mb-6">
                  Get started by adding your first product to the inventory
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    ></path>
                  </svg>
                  Add First Product
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h4>
                <p className="text-gray-600 mb-4">
                  No products match your search "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Pricing
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 w-12 h-12">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.title}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                  <svg
                                    className="w-6 h-6 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    ></path>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {product.title}
                              </h4>
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {product.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.categories?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {(() => {
                              const originalPrice = product.price_cents / 100;
                              const discountPercent =
                                product.discount_percent || 0;
                              const finalPrice =
                                originalPrice * (1 - discountPercent / 100);

                              return (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                      ₹{finalPrice.toFixed(2)}
                                    </span>
                                    {discountPercent > 0 && (
                                      <span className="text-xs text-gray-500 line-through">
                                        ₹{originalPrice.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                  {discountPercent > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      {discountPercent}% OFF
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              product.stock_quantity > 10
                                ? "bg-green-100 text-green-800"
                                : product.stock_quantity > 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.stock_quantity} in stock
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(product.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEdit(product)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                              title="Edit product"
                            >
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                ></path>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingProduct === product.id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete product"
                            >
                              {deletingProduct === product.id ? (
                                <>
                                  <svg
                                    className="w-3 h-3 mr-1 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    ></path>
                                  </svg>
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProducts;
