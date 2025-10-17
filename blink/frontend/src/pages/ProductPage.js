import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ModernNavbar from '../components/ModernNavbar';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/App.css';

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
  const [isPending, startTransition] = useTransition();
  const [selectedSize, setSelectedSize] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // Size charts for different categories
  const sizeCharts = {
    clothing: {
      title: 'Clothing Sizes',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
      guide: 'Standard Indian Sizes'
    },
    shoes: {
      title: 'Shoe Sizes',
      sizes: ['6', '7', '8', '9', '10', '11', '12'],
      guide: 'UK Sizes'
    },
    electronics: {
      title: 'Storage',
      sizes: ['64GB', '128GB', '256GB', '512GB', '1TB'],
      guide: 'Storage Capacity'
    },
    watches: {
      title: 'Watch Sizes',
      sizes: ['38mm', '40mm', '42mm', '44mm', '46mm'],
      guide: 'Case Diameter'
    },
    default: {
      title: 'Variants',
      sizes: ['Standard'],
      guide: 'Single Variant'
    }
  };

  // Get appropriate size chart based on category
  const getSizeChart = useCallback((category) => {
    if (!category) return sizeCharts.default;
    
    const categoryName = category.name?.toLowerCase() || '';
    const categorySlug = category.slug?.toLowerCase() || '';
    
    if (categoryName.includes('shirt') || categoryName.includes('tshirt') || 
        categoryName.includes('top') || categoryName.includes('dress') ||
        categoryName.includes('jeans') || categoryName.includes('pant') ||
        categoryName.includes('clothing') || categorySlug.includes('clothing')) {
      return sizeCharts.clothing;
    } else if (categoryName.includes('shoe') || categoryName.includes('sneaker') ||
               categoryName.includes('footwear') || categorySlug.includes('shoes')) {
      return sizeCharts.shoes;
    } else if (categoryName.includes('watch') || categoryName.includes('smartwatch') ||
               categorySlug.includes('watches')) {
      return sizeCharts.watches;
    } else if (categoryName.includes('phone') || categoryName.includes('laptop') ||
               categoryName.includes('tablet') || categoryName.includes('electronic') ||
               categorySlug.includes('electronics')) {
      return sizeCharts.electronics;
    }
    
    return sizeCharts.default;
  }, []);

  const currentSizeChart = useMemo(() => 
    getSizeChart(product?.category), [product, getSizeChart]
  );

  // Product images with fallbacks
  const productImages = useMemo(() => {
    if (!product) return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    
    if (product.product_images && product.product_images.length > 0) {
      const validImages = product.product_images
        .filter(img => img.url)
        .map(img => img.url);
      return validImages.length > 0 ? validImages : [product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    } else if (product.image_url) {
      return [product.image_url];
    } else {
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
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (response.ok) {
          const result = await response.json();
          const allProducts = result.products || result || [];
          
          data = allProducts.filter(p => {
            if (p.id === currentProductId) return false;
            
            if (p.category && p.category.slug) {
              return p.category.slug === categorySlug;
            }
            if (p.category && p.category.name && product?.category?.name) {
              return p.category.name === product.category.name;
            }
            if (p.category_slug) {
              return p.category_slug === categorySlug;
            }
            if (typeof p.category === 'string') {
              return p.category === categorySlug;
            }
            return false;
          });
        }
      } catch (err) {
        console.error('Failed to fetch all products for filtering:', err);
      }

      data.sort((a, b) => {
        if (a.discount_percent > 0 && b.discount_percent === 0) return -1;
        if (a.discount_percent === 0 && b.discount_percent > 0) return 1;
        if (a.discount_percent !== b.discount_percent) {
          return (b.discount_percent || 0) - (a.discount_percent || 0);
        }
        return a.price_cents - b.price_cents;
      });
      
      const filtered = data.slice(0, 4);
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

  const handleAddToCart = async () => {
    if (addingToCart) return;
    
    setAddingToCart(true);
    try {
      await addToCart(product, quantity, selectedSize);
      // Success feedback can be added here
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (buyingNow) return;
    
    setBuyingNow(true);
    try {
      await addToCart(product, quantity, selectedSize);
      navigate('/checkout');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setBuyingNow(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ModernNavbar showSearch={true} />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <ModernNavbar showSearch={true} />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
            <p className="text-gray-600 mb-6">The product you're looking for is not available.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar showSearch={true} />
      
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 overflow-x-auto">
            <Link to="/" className="hover:text-blue-600 whitespace-nowrap">Home</Link>
            <span>/</span>
            {product.category && (
              <>
                <Link to={`/products?category=${product.category.slug}`} className="hover:text-blue-600 whitespace-nowrap">
                  {product.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-900 font-medium truncate">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Product Images */}
          <div className="space-y-3 sm:space-y-4">
            {/* Main Image */}
            <div
              className="bg-white border border-gray-200 rounded-lg overflow-hidden relative flex items-center justify-center"
              style={{ aspectRatio: "4/5", maxHeight: "600px" }}
            >
              {/* Wishlist Button - Top Right Corner */}
              <button
                onClick={() => {
                  if (isInWishlist(product.id)) {
                    removeFromWishlist(product.id);
                  } else {
                    const productWithCorrectImage = {
                      ...product,
                      image_url: productImages[0],
                    };
                    addToWishlist(productWithCorrectImage);
                  }
                }}
                className={`absolute top-3 right-3 w-10 h-10 backdrop-blur-sm border rounded-full flex items-center justify-center hover:shadow-md transition-all duration-200 z-20 ${
                  isInWishlist(product.id) 
                    ? "bg-red-50 border-red-200 hover:bg-red-100" 
                    : "bg-white/90 border-gray-200 hover:bg-white"
                }`}
              >
                <svg
                  className={`w-5 h-5 transition-all duration-200 ${
                    isInWishlist(product.id) 
                      ? "text-red-500 fill-red-500 scale-110" 
                      : "text-gray-400 hover:text-red-400"
                  }`}
                  fill={isInWishlist(product.id) ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                ))}
              </div>
            )}
              {/* Left Arrow */}
              {productImages.length > 1 && (
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 border border-gray-300 rounded-full p-1 shadow hover:bg-white z-10"
                  onClick={() => startTransition(() => setSelectedImage(selectedImage === 0 ? productImages.length - 1 : selectedImage - 1))}
                  aria-label="Previous image"
                  style={{ lineHeight: 0 }}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <img 
                src={productImages[selectedImage]} 
                alt={product.title}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80';
                }}
              />
              {/* Right Arrow */}
              {productImages.length > 1 && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 border border-gray-300 rounded-full p-1 shadow hover:bg-white z-10"
                  onClick={() => startTransition(() => setSelectedImage(selectedImage === productImages.length - 1 ? 0 : selectedImage + 1))}
                  aria-label="Next image"
                  style={{ lineHeight: 0 }}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            
            
            {/* Thumbnail Images */}
           
          </div>

          {/* Product Details */}
          <div className="space-y-4 sm:space-y-6">
            {/* Product Title and Brand */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight">{product.title}</h1>
              {product.brand && (
                <p className="text-gray-600 mb-3 text-sm sm:text-base">Brand: {product.brand}</p>
              )}
              
              {/* Rating */}
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs sm:text-sm">
                  <span className="font-medium">4.2</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <span className="text-gray-600 text-xs sm:text-sm">125 Ratings & 89 Reviews</span>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{calculateDiscountedPrice(product.price_cents / 100, product.discount_percent)}
                </span>
                {product.discount_percent > 0 && (
                  <>
                    <span className="text-lg sm:text-xl text-gray-500 line-through">
                      ₹{(product.price_cents / 100).toFixed(2)}
                    </span>
                    <span className="text-sm sm:text-lg font-semibold text-green-600">
                      {product.discount_percent}% off
                    </span>
                  </>
                )}
              </div>
              {product.discount_percent > 0 && (
                <p className="text-xs sm:text-sm text-gray-600">
                  You save: ₹{((product.price_cents / 100) - calculateDiscountedPrice(product.price_cents / 100, product.discount_percent)).toFixed(2)}
                </p>
              )}
            </div>

            {/* Tax Info */}
            <div className="text-xs sm:text-sm text-green-600 font-medium">
              Inclusive of all taxes
            </div>

            {/* Size Selector - Only show for categories that need sizes */}
            {currentSizeChart.sizes.length > 1 && (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{currentSizeChart.title}</span>
                  <button className="text-blue-600 text-xs sm:text-sm font-medium">Size Guide</button>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-wrap">
                  {currentSizeChart.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-2 sm:px-4 sm:py-3 border rounded-md text-xs sm:text-sm font-medium transition-colors min-w-[50px] sm:min-w-[60px] ${
                        selectedSize === size 
                          ? 'border-blue-500 bg-blue-50 text-blue-600' 
                          : 'border-gray-300 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{currentSizeChart.guide}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2 sm:space-y-3">
              <span className="font-medium text-gray-900 text-sm sm:text-base">Quantity</span>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:text-gray-300 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 h-8 sm:w-12 sm:h-10 flex items-center justify-center border-x border-gray-300 font-medium text-sm sm:text-base">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:text-gray-300 transition-colors"
                    disabled={quantity >= (product.stock_quantity || 99)}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-xs sm:text-sm text-gray-600">
                  {product.stock_quantity > 0 
                    ? `${product.stock_quantity} items available` 
                    : 'Out of stock'
                  }
                </span>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button 
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0 || addingToCart}
                className="flex-1 px-4 sm:px-8 py-3 sm:py-4 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                {addingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ADDING...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    ADD TO CART
                  </>
                )}
              </button>
              <button 
                onClick={handleBuyNow}
                disabled={product.stock_quantity <= 0 || buyingNow}
                className="flex-1 px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {buyingNow ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    BUY NOW
                  </>
                )}
              </button>
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
                className="w-12 h-12 sm:w-14 sm:h-14 border border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors bg-white shadow-sm"
              >
                <svg 
                  className={`w-6 h-6 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                  fill={isInWishlist(product.id) ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Delivery Info */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Delivery</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">FREE delivery</span> on orders above ₹499. 
                    Delivery by {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Return Policy</p>
                  <p className="text-xs sm:text-sm text-gray-600">Easy 14 days return and exchange available</p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6">
              <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Product Highlights</h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Premium quality material</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Machine washable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Comfortable fit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Product Details Tabs - Responsive */}
        <div className="border-t border-gray-200 pt-6 sm:pt-8 mb-8 sm:mb-12">
          <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'description' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              PRODUCT DESCRIPTION
            </button>
            <button
              onClick={() => setActiveTab('specifications')}
              className={`px-4 py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'specifications' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              SPECIFICATIONS
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reviews' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              RATINGS & REVIEWS
            </button>
          </div>

          <div className="py-4 sm:py-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {product.description || 'No description available for this product.'}
                </p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600 text-sm sm:text-base">Brand</span>
                    <span className="font-medium text-sm sm:text-base">{product.brand || 'Generic'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600 text-sm sm:text-base">Category</span>
                    <span className="font-medium text-sm sm:text-base">{product.category?.name || 'General'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600 text-sm sm:text-base">Material</span>
                    <span className="font-medium text-sm sm:text-base">Cotton Blend</span>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600 text-sm sm:text-base">Fit</span>
                    <span className="font-medium text-sm sm:text-base">Regular</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600 text-sm sm:text-base">Care Instructions</span>
                    <span className="font-medium text-sm sm:text-base">Machine Wash</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600 text-sm sm:text-base">Country of Origin</span>
                    <span className="font-medium text-sm sm:text-base">India</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-6 sm:py-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h4>
                <p className="text-gray-600 text-sm sm:text-base">Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products - Responsive Grid */}
        <div className="border-t border-gray-200 pt-6 sm:pt-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Similar Products</h2>
            {product.category && (
              <Link 
                to={`/products?category=${product.category.slug}`}
                className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
              >
                View All
              </Link>
            )}
          </div>

          {relatedLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 sm:h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="group">
                  <Link to={`/product/${relatedProduct.id}`} className="block">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-2 sm:mb-3 group-hover:shadow-md transition-shadow">
                      <div className="aspect-square relative">
                        <img
                          src={relatedProduct.product_images?.[0]?.url || relatedProduct.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80'}
                          alt={relatedProduct.title}
                          className="w-full h-full object-contain p-3 sm:p-4"
                        />
                        {relatedProduct.discount_percent > 0 && (
                          <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium">
                            {relatedProduct.discount_percent}% OFF
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 group-hover:text-blue-600 leading-tight">
                        {relatedProduct.title}
                      </h3>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                          ₹{calculateDiscountedPrice(relatedProduct.price_cents / 100, relatedProduct.discount_percent)}
                        </span>
                        {relatedProduct.discount_percent > 0 && (
                          <span className="text-xs text-gray-500 line-through">
                            ₹{(relatedProduct.price_cents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {relatedProduct.discount_percent > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          {relatedProduct.discount_percent}% off
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm sm:text-base">No similar products found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default ProductPage;