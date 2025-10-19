import React, { useState, useEffect } from "react";
import AdminNav from "../../components/admin/AdminNav";

const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    button_text: "",
    category_slug: "",
    image: null,
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setCategories([]);
    }
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/banners`);
      const data = await res.json();
      setBanners(data);
    } catch (err) {
      setError("Failed to fetch banners");
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((f) => ({ ...f, image: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) formData.append(key, value);
      });

      let url = `${API_BASE_URL}/api/banners`;
      let method = "POST";
      if (editing) {
        url += `/${editing}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save banner");
      }

      setForm({
        title: "",
        subtitle: "",
        button_text: "",
        category_slug: "",
        image: null,
      });
      setEditing(null);
      setSuccess("Image uploaded successfully!");
      fetchBanners();
    } catch (err) {
      setError(err.message || "Failed to save banner");
      setSuccess("");
    }
    setLoading(false);
  };

  const handleEdit = (banner) => {
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      button_text: banner.button_text,
      category_slug: banner.category_slug || "",
      image: null,
    });
    setEditing(banner.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete banner");
      }

      fetchBanners();
    } catch (err) {
      setError(err.message || "Failed to delete banner");
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setForm({
      title: "",
      subtitle: "",
      button_text: "",
      category_slug: "",
      image: null,
    });
    setEditing(null);
  };

  return (
    <>
      <AdminNav />
      <div className="px-4 py-10 max-w-6xl mx-auto mt-24">
        <h2 className="text-2xl font-bold mb-6">Manage Banners</h2>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 mb-8 flex flex-col gap-4"
        >
          <label className="font-semibold">Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleInputChange}
            placeholder="Banner title"
            className="border rounded px-3 py-2"
            required
          />
          <label className="font-semibold">Subtitle</label>
          <input
            type="text"
            name="subtitle"
            value={form.subtitle}
            onChange={handleInputChange}
            placeholder="Banner subtitle (optional)"
            className="border rounded px-3 py-2"
          />
          <label className="font-semibold">Button Text</label>
          <input
            type="text"
            name="button_text"
            value={form.button_text}
            onChange={handleInputChange}
            placeholder="Button text (e.g. Shop Now)"
            className="border rounded px-3 py-2"
          />
          <label className="font-semibold">Category</label>
          <select
            name="category_slug"
            value={form.category_slug}
            onChange={handleInputChange}
            className="border rounded px-3 py-2"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <label className="font-semibold">Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleInputChange}
            className="border rounded px-3 py-2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && (
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
              {editing ? "Update Banner" : "Add Banner"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded shadow"
              >
                Cancel
              </button>
            )}
          </div>
          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded border">
              {success}
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded border">
              {error}
            </div>
          )}
        </form>

        {loading && <div className="text-center py-4">Loading...</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center min-h-[340px] lg:min-h-[420px] w-full px-6 py-8 md:px-8 md:py-10 mb-4"
            >
              <img
                src={banner.image_url || "/images/placeholder.png"}
                alt={banner.title}
                className="w-48 h-32 object-cover rounded-lg mb-5 border-2 border-gray-200 lg:w-64 lg:h-40"
              />
              <div className="font-bold text-xl mb-2 text-center">
                {banner.title}
              </div>
              <div className="text-gray-600 text-center mb-2">
                {banner.subtitle}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                Button: {banner.button_text}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                Category:{" "}
                {categories.find((cat) => cat.slug === banner.category_slug)
                  ?.name ||
                  banner.category_slug ||
                  "—"}
              </div>
              {banner.color && (
                <div className="text-sm text-gray-500 mb-2">
                  Color:{" "}
                  <span style={{ color: banner.color }}>{banner.color}</span>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(banner)}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="px-6 py-2 bg-red-500 hover:bg-red-700 rounded-lg text-white font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdminBanners;
