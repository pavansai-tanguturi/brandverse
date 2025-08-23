import React, { useState, useEffect } from 'react';
import AdminNav from '../components/AdminNav';

const AdminProducts = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_BASE;
      const res = await fetch(`${API_BASE}/api/products`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
    setLoadingProducts(false);
  };

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setStock('');
    setDescription('');
    setImageFile(null);
    setEditingProduct(null);
    setShowAddForm(false);
    setMessage('');
    setError('');
    setExistingImageUrl(null);
  };

  const handleEdit = async (product) => {
    // fetch full product details to get image URLs and latest data
    try {
      const API_BASE = process.env.REACT_APP_API_BASE;
      const res = await fetch(`${API_BASE}/api/products/${product.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEditingProduct(data);
        setTitle(data.title || '');
        setPrice(((data.price_cents || 0) / 100).toString());
        setStock((data.stock_quantity || 0).toString());
        setDescription(data.description || '');
        setExistingImageUrl((data.product_images && data.product_images[0] && data.product_images[0].url) || data.image_url || null);
        setShowAddForm(true);
      } else {
        console.warn('Failed to fetch product details for edit');
        // fallback to using provided product
        setEditingProduct(product);
        setTitle(product.title || '');
        setPrice(((product.price_cents || 0) / 100).toString());
        setStock((product.stock_quantity || 0).toString());
        setDescription(product.description || '');
        setExistingImageUrl(product.image_url || null);
        setShowAddForm(true);
      }
    } catch (err) {
      console.error('Error fetching product for edit', err);
      setEditingProduct(product);
      setTitle(product.title || '');
      setPrice(((product.price_cents || 0) / 100).toString());
      setStock((product.stock_quantity || 0).toString());
      setDescription(product.description || '');
      setExistingImageUrl(product.image_url || null);
      setShowAddForm(true);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setError('');
    setMessage('');
    setDeletingProduct(productId);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE;
      const token = localStorage.getItem('adminToken') || '';

      const res = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      // try to parse response body for better error messages
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (e) { /* ignore */ }

      if (res.ok) {
        setMessage('Product deleted successfully');
        await fetchProducts();
      } else if (res.status === 403 || res.status === 401) {
        setError(parsed?.error || 'Not authorized. Please login as admin.');
        // optional: redirect to admin login page if present
        // window.location.href = '/admin/login';
      } else {
        setError(parsed?.error || `Failed to delete product: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE;
      const token = localStorage.getItem('adminToken') || '';
      
      // Generate slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
      
      const body = { 
        title, 
        slug, 
        price_cents: Math.round(parseFloat(price) * 100), // Convert price to cents
        stock_quantity: parseInt(stock, 10), 
        description 
      };

      // helper to parse responses safely
      const parseJsonSafe = async (res) => {
        const text = await res.text();
        try { return { ok: res.ok, data: JSON.parse(text), text }; }
        catch (e) { return { ok: res.ok, data: null, text }; }
      };

      const isEditing = editingProduct !== null;
      const url = isEditing ? `${API_BASE}/api/products/${editingProduct.id}` : `${API_BASE}/api/products`;
  const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const parsed = await parseJsonSafe(res);
      if (!parsed.ok) {
        throw new Error(parsed.data?.error || `Failed to ${isEditing ? 'update' : 'create'} product: ${res.status} ${res.statusText} - ${parsed.text.slice(0,200)}`);
      }
      const data = parsed.data || {};
      
      if (imageFile) {
        const productId = isEditing ? editingProduct.id : data.id;
        const form = new FormData();
        form.append('images', imageFile);
        
        // When editing, replace existing images; when creating, just add
        const replaceParam = isEditing ? '?replace=true' : '';
        const imgRes = await fetch(`${API_BASE}/api/products/${productId}/images${replaceParam}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
          body: form
        });
        const imgParsed = await parseJsonSafe(imgRes);
        if (!imgParsed.ok) {
          throw new Error(imgParsed.data?.error || `Image upload failed: ${imgRes.status} ${imgRes.statusText} - ${imgParsed.text.slice(0,200)}`);
        }
      }
      
      setMessage(`Product ${isEditing ? 'updated' : 'created'} successfully`);
      resetForm();
      fetchProducts(); // Refresh product list after creation
    } catch (err) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      
      {/* Header with Add Product Button */}
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Products</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <span className="mr-2">+</span>
            {showAddForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Add/Edit Product Form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  placeholder="Product Title"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  placeholder="Price (₹)"
                  type="number"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  required
                  placeholder="Stock Quantity"
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {/* existing image preview when editing */}
                {existingImageUrl && (
                  <div className="flex items-center space-x-3 mt-2">
                    <img src={existingImageUrl} alt="Current product" className="w-20 h-20 object-cover rounded-lg border" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Current image</p>
                      <p>Upload a new image above to replace this one</p>
                    </div>
                  </div>
                )}
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Product Description"
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg"
                >
                  {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Product List</h3>
          {loadingProducts ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No products found.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Add your first product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Image</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Price</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Stock</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="w-12 h-12 object-cover rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{product.title}</td>
                      <td className="px-4 py-3 text-gray-700">₹{(product.price_cents / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-700">{product.stock_quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingProduct === product.id}
                            className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm ${deletingProduct === product.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {deletingProduct === product.id ? 'Deleting...' : 'Delete'}
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
  );
};

export default AdminProducts;
