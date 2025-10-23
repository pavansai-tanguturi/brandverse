import React, { createContext, useContext, useState, useEffect } from "react";

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [imageCache, setImageCache] = useState(new Set());

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE || "http://localhost:3001";

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Preload images
  const preloadImage = (url) => {
    if (!url || imageCache.has(url)) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setImageCache(prev => new Set([...prev, url]));
        resolve();
      };
      img.onerror = (error) => {
        console.warn('Failed to preload image:', url);
        resolve(); // Resolve instead of reject to continue batch
      };
      // Set crossOrigin for Supabase images
      if (url.includes('supabase')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = url;
    });
  };

  // Preload product images with concurrency limit
  const preloadProductImages = async (productList) => {
    const imagesToPreload = productList
      .slice(0, 10) // Reduced from 20 to 10 for better performance
      .map(product => product.image_url)
      .filter(url => url && !imageCache.has(url));

    // Batch load images - 3 at a time to avoid network congestion
    const batchSize = 3;
    for (let i = 0; i < imagesToPreload.length; i += batchSize) {
      const batch = imagesToPreload.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(url => preloadImage(url)));
      // Small delay between batches to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const shouldRefetch = () => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  };

  const fetchCategories = async (force = false) => {
    if (!force && categories.length > 0 && !shouldRefetch()) {
      return categories;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter((cat) => cat.slug !== "all");
        setCategories(filtered);
        return filtered;
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
    return categories;
  };

  const fetchProducts = async (force = false) => {
    if (!force && products.length > 0 && !shouldRefetch()) {
      return products;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        // Preload first 20 product images
        preloadProductImages(data);
        return data;
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    return products;
  };

  const fetchAll = async (force = false) => {
    if (!force && products.length > 0 && categories.length > 0 && !shouldRefetch()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await Promise.all([fetchCategories(force), fetchProducts(force)]);
      setLastFetch(Date.now());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchAll();
  }, []);

  const refetch = () => fetchAll(true);

  const value = {
    products,
    categories,
    loading,
    fetchCategories,
    fetchProducts,
    fetchAll,
    refetch,
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
};

export default ProductContext;
