import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { CustomerIcon, CartIcon } from '../components/icons';
import Navigation from '../components/Navigation';
// import Footer from '../components/Footer';
import '../styles/App.css';

// Quick Add Button Component
const QuickAddButton = ({ product, onAddToCart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading || isSuccess) return;
    
    setIsLoading(true);
    const success = await onAddToCart(product);
    setIsLoading(false);
    
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    }
  };

  // Hide Quick Add if out of stock
  if (!product || product.stock_quantity <= 0) {
    return (
      <button
        disabled
        className="w-full mt-2 px-3 py-2 rounded-lg font-medium opacity-50 bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        style={{ pointerEvents: 'none' }}
      >
        <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" className="text-slate-400">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </div>
        Out of Stock
      </button>
    );
  }
  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isSuccess}
      className={`w-full mt-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-sm transform hover:scale-105 ${
        isSuccess 
          ? 'bg-green-600 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
        {isLoading ? (
          <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
        ) : isSuccess ? (
          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="8" height="8" viewBox="0 0 92 92" className="text-white">
            <path fill="currentColor" d="M91.8 27.3 81.1 61c-.8 2.4-2.9 4-5.4 4H34.4c-2.4 0-4.7-1.5-5.5-3.7L13.1 19H4c-2.2 0-4-1.8-4-4s1.8-4 4-4h11.9c1.7 0 3.2 1.1 3.8 2.7L36 57h38l8.5-27H35.4c-2.2 0-4-1.8-4-4s1.8-4 4-4H88c1.3 0 2.5.7 3.2 1.7.8 1 1 2.4.6 3.6zm-55.4 43c-1.7 0-3.4.7-4.6 1.9-1.2 1.2-1.9 2.9-1.9 4.6 0 1.7.7 3.4 1.9 4.6 1.2 1.2 2.9 1.9 4.6 1.9s3.4-.7 4.6-1.9c1.2-1.2 1.9-2.9 1.9-4.6 0-1.7-.7-3.4-1.9-4.6-1.2-1.2-2.9-1.9-4.6-1.9zm35.9 0c-1.7 0-3.4.7-4.6 1.9s-1.9 2.9-1.9 4.6c0 1.7.7 3.4 1.9 4.6 1.2 1.2 2.9 1.9 4.6 1.9 1.7 0 3.4-.7 4.6-1.9 1.2-1.2 1.9-2.9 1.9-4.6 0-1.7-.7-3.4-1.9-4.6s-2.9-1.9-4.6-1.9z"/>
          </svg>
        )}
      </div>
      {isLoading ? 'Adding...' : isSuccess ? 'Added!' : 'Quick Add'}
    </button>
  );
};

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Use product images if available, otherwise use primary image_url, otherwise fallback
  const productImages = useMemo(() => {
    if (!product) return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    
    if (product.product_images && product.product_images.length > 0) {
      // Use all available product images with signed URLs
      const validImages = product.product_images
        .filter(img => img.url) // Only include images with valid URLs
        .map(img => img.url);
      return validImages.length > 0 ? validImages : [product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    } else if (product.image_url) {
      // Fallback to single image_url
      return [product.image_url];
    } else {
      // Final fallback to placeholder
      return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    }
  }, [product]);

  const fetchProduct = useCallback(async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        
        if (data && data.category && data.category.slug) {
          fetchRelatedProducts(data.category.slug, data.id);
        }
      } else {
        console.error('Failed to fetch product');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchRelatedProducts = useCallback(async (categorySlug, currentProductId) => {
    try {
      setRelatedLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      let data = [];
      
      // Option 1: Try fetching all products and filter client-side (most reliable)
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (response.ok) {
          const result = await response.json();
          const allProducts = result.products || result || [];
          
          // Filter by category using the same logic as Products.js
          data = allProducts.filter(p => {
            // Skip current product
            if (p.id === currentProductId) return false;
            
            // Check if product has category relationship (singular)
            if (p.category && p.category.slug) {
              return p.category.slug === categorySlug;
            }
            // Check if product has category name match
            if (p.category && p.category.name && product?.category?.name) {
              return p.category.name === product.category.name;
            }
            // Fallback to direct category field if exists
            if (p.category_slug) {
              return p.category_slug === categorySlug;
            }
            // Another fallback for different API structures
            if (typeof p.category === 'string') {
              return p.category === categorySlug;
            }
            return false;
          });
          
          console.log(`Category filtering: Found ${data.length} products in ${categorySlug} category`);
        }
      } catch (err) {
        console.error('Failed to fetch all products for filtering:', err);
      }

      // Sort by relevance (products with discounts first, then by price)
      data.sort((a, b) => {
        // Prioritize discounted products
        if (a.discount_percent > 0 && b.discount_percent === 0) return -1;
        if (a.discount_percent === 0 && b.discount_percent > 0) return 1;
        
        // Then sort by discount percentage (highest first)
        if (a.discount_percent !== b.discount_percent) {
          return (b.discount_percent || 0) - (a.discount_percent || 0);
        }
        
        // Finally sort by price (lowest first)
        return a.price_cents - b.price_cents;
      });
      
      // Limit to 4 products
      const filtered = data.slice(0, 4);
      
      console.log(`Final related products: ${filtered.length} items for category "${categorySlug}"`);
      setRelatedProducts(filtered);
      
    } catch (error) {
      console.error('Error fetching related products:', error);
      setRelatedProducts([]);
    } finally {
      setRelatedLoading(false);
    }
  }, [product]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const calculateDiscountedPrice = (price, discount) => {
    if (discount && discount > 0) {
      return (price * (1 - discount / 100)).toFixed(2);
    }
    return price;
  };

  const handleQuickAdd = async (relatedProduct) => {
    try {
      await addToCart(relatedProduct, 1);
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation showSearch={true} />
        
        <div className="flex items-center justify-center min-h-screen pt-24">
          <div className="text-center bg-white p-12 rounded-2xl shadow-lg border border-slate-200/50 backdrop-blur-sm">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 w-16 h-16 border-4 border-blue-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading Product</h3>
            <p className="text-slate-500">Please wait while we fetch the details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation showSearch={true} />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center bg-white p-16 rounded-2xl shadow-lg border border-slate-200/50 backdrop-blur-sm max-w-lg mx-auto">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">Sorry, we couldn't find the product you're looking for. It may have been removed or is temporarily unavailable.</p>
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation showSearch={true} />
      
      <div className="container mx-auto px-4 py-6 pt-20 max-w-7xl">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-3 text-slate-600 hover:text-blue-600 bg-white px-4 py-2.5 rounded-full border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm"
        >
          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          Back to Products
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative" style={{ aspectRatio: '1/1' }}>
              <img 
                src={productImages[selectedImage]} 
                alt={product.title}
                className="w-full h-full object-contain"
                loading="eager"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80';
                }}
              />
              {product.discount_percent > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  -{product.discount_percent}%
                </div>
              )}
            </div>
            
            {productImages.length > 1 && (
              <div className="flex gap-3 justify-center overflow-x-auto pb-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} view ${index + 1}`}
                      className="w-full h-full object-contain bg-white p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 h-fit">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">{product.title}</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">4.2</span>
                    <span className="text-sm text-slate-500">•</span>
                    <span className="text-sm text-slate-500">125 reviews</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {product.discount_percent > 0 ? (
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                        ₹{calculateDiscountedPrice(product.price_cents / 100, product.discount_percent)}
                      </span>
                      <span className="text-lg text-slate-400 line-through font-medium">
                        ₹{(product.price_cents / 100).toFixed(2)}
                      </span>
                      <div className="inline-flex items-center gap-2 text-sm text-red-700 font-semibold bg-gradient-to-r from-red-50 to-red-100 px-3 py-1.5 rounded-full border border-red-200">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Save ₹{((product.price_cents / 100) - calculateDiscountedPrice(product.price_cents / 100, product.discount_percent)).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      ₹{(product.price_cents / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Product Details
                </h3>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                  {product.description || 'No description available for this product.'}
                </p>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-200">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-700">Category</span>
                  </div>
                  <div className="text-sm">
                    {product.category ? (
                      <Link 
                        to={`/products?category=${product.category.slug}`}
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        {product.category.name}
                      </Link>
                    ) : (
                      <span className="text-slate-500">General</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-700">Stock</span>
                  </div>
                  <span className={`text-sm font-semibold ${product.stock_quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}
                  </span>
                </div>
              </div>

              {/* Quantity and Actions */}
              <div className="space-y-4">
                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2a1 1 0 011 1v3" />
                      </svg>
                    </div>
                    Quantity
                  </span>
                  <div className="flex items-center bg-white border-2 border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:text-slate-300 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </div>
                    </button>
                    <input 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={product.stock_quantity || 99}
                      className="w-16 h-10 text-center border-x-2 border-slate-200 focus:outline-none focus:bg-blue-50 text-sm font-semibold"
                    />
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:text-slate-300 transition-colors"
                      disabled={quantity >= (product.stock_quantity || 99)}
                    >
                      <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (isInWishlist(product.id)) {
                        removeFromWishlist(product.id);
                      } else {
                        const productWithCorrectImage = {
                          ...product,
                          image_url: productImages[0]
                        };
                        addToWishlist(productWithCorrectImage);
                      }
                    }}
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 border rounded-lg font-medium transition-all duration-200 ${
                      isInWishlist(product.id) 
                        ? 'border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100' 
                        : 'border-slate-300 text-slate-700 hover:border-pink-300 hover:text-pink-700 hover:bg-pink-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isInWishlist(product.id) ? 'bg-pink-200' : 'bg-slate-100'
                    }`}>
                      <svg className="w-4 h-4" fill={isInWishlist(product.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    {isInWishlist(product.id) ? 'Saved' : 'Save'}
                  </button>
                  
                  <button 
                    onClick={async () => {
                      try {
                        await addToCart(product, quantity);
                        navigate('/cart');
                      } catch (error) {
                        console.error('Error adding to cart:', error);
                        alert('Error adding product to cart');
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-slate-300 disabled:text-slate-500 transition-colors flex items-center justify-center gap-3"
                    disabled={product.stock_quantity <= 0}
                  >
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="12" height="12" viewBox="0 0 92 92" className="text-white">
                        <path fill="currentColor" d="M91.8 27.3 81.1 61c-.8 2.4-2.9 4-5.4 4H34.4c-2.4 0-4.7-1.5-5.5-3.7L13.1 19H4c-2.2 0-4-1.8-4-4s1.8-4 4-4h11.9c1.7 0 3.2 1.1 3.8 2.7L36 57h38l8.5-27H35.4c-2.2 0-4-1.8-4-4s1.8-4 4-4H88c1.3 0 2.5.7 3.2 1.7.8 1 1 2.4.6 3.6zm-55.4 43c-1.7 0-3.4.7-4.6 1.9-1.2 1.2-1.9 2.9-1.9 4.6 0 1.7.7 3.4 1.9 4.6 1.2 1.2 2.9 1.9 4.6 1.9s3.4-.7 4.6-1.9c1.2-1.2 1.9-2.9 1.9-4.6 0-1.7-.7-3.4-1.9-4.6-1.2-1.2-2.9-1.9-4.6-1.9zm35.9 0c-1.7 0-3.4.7-4.6 1.9s-1.9 2.9-1.9 4.6c0 1.7.7 3.4 1.9 4.6 1.2 1.2 2.9 1.9 4.6 1.9 1.7 0 3.4-.7 4.6-1.9 1.2-1.2 1.9-2.9 1.9-4.6 0-1.7-.7-3.4-1.9-4.6s-2.9-1.9-4.6-1.9z"/>
                      </svg>
                    </div>
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                    </svg>
                  </div>
                  Delivery Options
                </h4>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm mb-1">Standard Delivery</div>
                      <div className="text-slate-600 text-xs">5-7 business days • Free on orders over ₹2000</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 shadow-sm">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm mb-1">Express Delivery</div>
                      <div className="text-slate-600 text-xs">1-2 business days • ₹499</div>
                    </div>
                  </div>
                </div>

                {/* Additional Features */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 text-xs">Secure Payment</div>
                      <div className="text-xs text-slate-500">SSL Encrypted</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 text-xs">Easy Returns</div>
                      <div className="text-xs text-slate-500">30-day policy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Related Products</h3>
              {product?.category && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  in {product.category.name}
                </span>
              )}
            </div>
            <p className="text-slate-600 text-sm">
              {product?.category ? 
                `More products from ${product.category.name} category` : 
                'Discover more products you might love'
              }
            </p>
          </div>
          
          {relatedLoading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-3 animate-spin"></div>
              <p className="text-slate-500 text-sm">Finding related products...</p>
            </div>
          ) : relatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="group">
                    <Link to={`/products/${relatedProduct.id}`} className="block">
                      <div className="relative mb-3 bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-square relative">
                          <img
                            src={relatedProduct.product_images?.[0]?.url || relatedProduct.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80'}
                            alt={relatedProduct.title}
                            className="w-full h-full object-contain p-2"
                          />
                          {relatedProduct.discount_percent > 0 && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              -{relatedProduct.discount_percent}%
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm">
                          {relatedProduct.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          {relatedProduct.discount_percent > 0 ? (
                            <>
                              <span className="font-semibold text-emerald-600 text-sm">
                                ₹{calculateDiscountedPrice(relatedProduct.price_cents / 100, relatedProduct.discount_percent)}
                              </span>
                              <span className="text-xs text-slate-400 line-through">
                                ₹{(relatedProduct.price_cents / 100).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-emerald-600 text-sm">
                              ₹{(relatedProduct.price_cents / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    
                    {/* Quick Add Button */}
                    <QuickAddButton product={relatedProduct} onAddToCart={handleQuickAdd} />
                  </div>
                ))}
              </div>
              
              {/* View More in Category Button */}
              {product?.category && (
                <div className="mt-6 text-center">
                  <Link
                    to={`/products?category=${product.category.slug}`}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    View More in {product.category.name}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="text-base font-medium text-slate-700 mb-2">No Related Products</h4>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
                {product?.category ? 
                  `No other products found in ${product.category.name} category.` :
                  'No related products available at the moment.'
                }
              </p>
              {product?.category && (
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Browse All Products
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* <Footer /> */}
    </div>
  );
};

export default ProductPage;