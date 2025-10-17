// Get JWT token for admin API calls
const token = localStorage.getItem('auth_token');
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNav from '../../components/admin/AdminNav';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', slug: '', image: null });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm((f) => ({ ...f, image: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let imageUrl = form.image;
      if (form.image && typeof form.image !== 'string') {
        // Upload image to /api/upload with JWT token if available
        const formData = new FormData();
        formData.append('image', form.image); // field name must match backend
        const imgRes = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const imgData = await imgRes.json();
        imageUrl = imgData.imageUrl;
      }
      const payload = {
        name: form.name,
        slug: form.slug,
        image_url: imageUrl,
      };
      let method = 'POST';
      let url = `${API_BASE_URL}/api/categories`;
      if (editing) {
        // Check if the category still exists before PATCH
        const exists = categories.some(cat => cat.id === editing);
        if (exists) {
          method = 'PATCH';
          url = `${API_BASE_URL}/api/categories/${editing}`;
        } else {
          setError('Category not found. Please refresh and try again.');
          setEditing(null);
          setLoading(false);
          return;
        }
      }
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      setForm({ name: '', slug: '', image: null });
      setEditing(null);
      fetchCategories();
    } catch (err) {
      setError('Failed to save category');
    }
    setLoading(false);
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, slug: cat.slug, image: cat.image_url });
    setEditing(cat.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    setLoading(true);
    try {
  await fetch(`${API_BASE_URL}/api/categories/${id}`, { method: 'DELETE', credentials: 'include' });
      fetchCategories();
    } catch (err) {
      setError('Failed to delete category');
    }
    setLoading(false);
  };

  return (
    <>
      <AdminNav />
  <div className="px-4 py-10 max-w-6xl mx-auto mt-24">
        <h2 className="text-2xl font-bold mb-6">Manage Categories</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              placeholder="Category Name"
              className="border rounded px-3 py-2 flex-1"
              required
            />
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleInputChange}
              placeholder="Slug (e.g. food-beverage)"
              className="border rounded px-3 py-2 flex-1"
              required
            />
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleInputChange}
              className="flex-1"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow w-full md:w-auto flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {editing ? 'Update Category' : 'Add Category'}
          </button>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </form>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center min-h-[340px] lg:min-h-[420px] w-full px-6 py-8 md:px-8 md:py-10 mb-4">
              <img
                src={cat.image_url || '/images/placeholder.png'}
                alt={cat.name}
                className="w-48 h-32 object-cover rounded-lg mb-5 border-2 border-gray-200 lg:w-64 lg:h-40"
              />
              <div className="font-bold text-xl mb-3 text-center">{cat.name}</div>
              <div className="text-gray-500 text-sm mb-4 text-center break-all">Slug: {cat.slug}</div>
              <div className="flex gap-4 mt-auto">
                <button onClick={() => handleEdit(cat)} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold">Edit</button>
                <button onClick={() => handleDelete(cat.id)} className="px-6 py-2 bg-red-500 hover:bg-red-700 rounded-lg text-white font-semibold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdminCategories;
