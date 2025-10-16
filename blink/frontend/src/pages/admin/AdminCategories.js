import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "../../components/admin/AdminNav";

const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", slug: "", image: null });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      // Filter out the "All Products" category for admin management
      const managedCategories = data.filter(cat => cat.id !== 'all');
      setCategories(managedCategories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to fetch categories. Please try again.");
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setError("");
    setSuccess("");
    
    if (name === "image") {
      setForm((f) => ({ ...f, image: files[0] }));
    } else if (name === "name") {
      // Auto-generate slug from name
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setForm((f) => ({ ...f, [name]: value, slug }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    // Validate form
    if (!form.name.trim()) {
      setError("Category name is required");
      setSubmitting(false);
      return;
    }
    if (!form.slug.trim()) {
      setError("Category slug is required");
      setSubmitting(false);
      return;
    }

    try {
      let imageUrl = form.image;
      
      // Upload image if it's a file
      if (form.image && typeof form.image !== "string") {
        try {
          const formData = new FormData();
          formData.append("image", form.image);
          
          const token = localStorage.getItem("auth_token");
          const headers = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          const imgRes = await fetch(`${API_BASE_URL}/api/upload`, {
            method: "POST",
            credentials: "include",
            headers,
            body: formData,
          });
          
          if (!imgRes.ok) {
            const errorData = await imgRes.json().catch(() => ({ error: 'Upload failed' }));
            console.error("Upload failed:", errorData);
            throw new Error(errorData.error || `Upload failed with status ${imgRes.status}`);
          }
          
          const imgData = await imgRes.json();
          imageUrl = imgData.imageUrl || imgData.url || imgData.filePath;
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          // Continue without image if upload fails
          setError(`Warning: ${uploadError.message}. Category will be created without image.`);
          imageUrl = null;
        }
      }

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        image_url: imageUrl || null,
      };

      let method = "POST";
      let url = `${API_BASE_URL}/api/categories`;
      
      if (editing) {
        method = "PATCH";
        url = `${API_BASE_URL}/api/categories/${editing}`;
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error(responseData.error || "Failed to save category");
      }

      setForm({ name: "", slug: "", image: null });
      setEditing(null);
      setSuccess(editing ? "Category updated successfully!" : "Category created successfully!");
      fetchCategories();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      console.error("Error saving category:", err);
      setError(err.message || "Failed to save category. Please try again.");
    }
    setSubmitting(false);
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, slug: cat.slug, image: cat.image_url });
    setEditing(cat.id);
    setError("");
    setSuccess("");
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setForm({ name: "", slug: "", image: null });
    setEditing(null);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    const category = categories.find(cat => cat.id === id);
    const confirmMessage = category?.count > 0 
      ? `This category has ${category.count} products. Are you sure you want to delete "${category.name}"?`
      : `Are you sure you want to delete "${category?.name}"?`;
      
    if (!window.confirm(confirmMessage)) return;
    
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        if (response.status === 404) {
          setError("Category not found. It may have already been deleted.");
        } else {
          throw new Error(responseData.error || "Failed to delete category");
        }
        return;
      }

      setSuccess("Category deleted successfully!");
      fetchCategories();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(err.message || "Failed to delete category. Please try again.");
    }
  };

  return (
    <>
      <AdminNav />
      <div className="px-4 py-10 max-w-6xl mx-auto mt-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
          <div className="text-sm text-gray-600">
            Total Categories: {categories.length}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Electronics, Clothing"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={submitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleInputChange}
                  placeholder="e.g. electronics, clothing"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from name, but you can customize it
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Image
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                disabled={submitting}
              />
              {form.image && typeof form.image === "string" && (
                <div className="mt-2">
                  <img 
                    src={form.image} 
                    alt="Current category" 
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 min-w-[160px]"
                disabled={submitting}
              >
                {submitting && (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                )}
                {editing ? "Update Category" : "Add Category"}
              </button>
              
              {editing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </div>
            </div>
          )}
        </form>
        {/* Categories Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading categories...</span>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first category above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg flex flex-col min-h-[380px] p-6 ${
                  editing === cat.id ? 'border-emerald-400 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Image */}
                <div className="aspect-video mb-4 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 text-center">
                    {cat.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="text-center">
                      <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                        /{cat.slug}
                      </span>
                    </div>
                    
                    {cat.count !== undefined && (
                      <div className="text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          cat.count > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {cat.count} {cat.count === 1 ? 'product' : 'products'}
                        </span>
                      </div>
                    )}
                    
                    {cat.created_at && (
                      <div className="text-center text-xs text-gray-500">
                        Created {new Date(cat.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                        editing === cat.id 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                      disabled={submitting}
                    >
                      {editing === cat.id ? 'Editing...' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-all duration-200"
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AdminCategories;
