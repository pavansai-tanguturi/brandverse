// src/pages/ProductPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ModernNavbar from '../components/ModernNavbar';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/App.css';

// Small Toast component (no external libs)
function Toast({ message, open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <div className={`fixed right-4 bottom-24 z-50 transform transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
        {message}
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // toast
  const [toast, setToast] = useState({ open: false, message: '' });
  const showToast = (message) => setToast({ open: true, message });

  const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  // size charts
  const sizeCharts = useMemo(() => ({
    clothing: { title: 'Clothing Sizes', sizes: ['XS','S','M','L','XL','XXL','3XL'], guide: 'Standard Indian Sizes' },
    shoes: { title: 'Shoe Sizes', sizes: ['6','7','8','9','10','11','12'], guide: 'UK Sizes' },
    electronics: { title: 'Storage', sizes: ['64GB','128GB','256GB','512GB','1TB'], guide: 'Storage Capacity' },
    watches: { title: 'Watch Sizes', sizes: ['38mm','40mm','42mm','44mm','46mm'], guide: 'Case Diameter' },
    default: { title: 'Variants', sizes: ['Standard'], guide: 'Single Variant' }
  }), []);

  const getSizeChart = useCallback((category) => {
    if (!category) return sizeCharts.default;
    const name = (category.name || '').toLowerCase();
    const slug = (category.slug || '').toLowerCase();
    if (/shirt|tshirt|top|dress|jeans|pant|clothing/.test(name) || /clothing/.test(slug)) return sizeCharts.clothing;
    if (/shoe|sneaker|footwear/.test(name) || /shoes/.test(slug)) return sizeCharts.shoes;
    if (/watch|smartwatch/.test(name) || /watches/.test(slug)) return sizeCharts.watches;
    if (/phone|laptop|tablet|electronic/.test(name) || /electronics/.test(slug)) return sizeCharts.electronics;
    return sizeCharts.default;
  }, [sizeCharts]);

  const currentSizeChart = useMemo(() => getSizeChart(product?.category), [product, getSizeChart]);

  const productImages = useMemo(() => {
    if (!product) return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    if (Array.isArray(product.product_images) && product.product_images.length > 0) {
      const imgs = product.product_images.map(i => i?.url).filter(Boolean);
      return imgs.length ? imgs : [product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
    }
    return [product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80'];
  }, [product]);

  // fetch product
  useEffect(() => {
    let mounted = true;
    (async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        if (!mounted) return;
        setProduct(data);
        if (data?.category?.slug) fetchRelatedProducts(data.category.slug, data.id);
      } catch (err) {
        console.error(err);
        if (mounted) navigate('/');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // fetch related
  const fetchRelatedProducts = useCallback(async (categorySlug, currentProductId) => {
    setRelatedLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const all = Array.isArray(data) ? data : (data.products || []);
      const filtered = all.filter(p => p.id !== currentProductId && (
        (p.category?.slug && p.category.slug === categorySlug) ||
        (p.category_slug && p.category_slug === categorySlug) ||
        (typeof p.category === 'string' && p.category === categorySlug)
      ));
      filtered.sort((a,b) => (b.discount_percent||0) - (a.discount_percent||0) || a.price_cents - b.price_cents);
      setRelatedProducts(filtered.slice(0,4));
    } catch (err) {
      console.error(err);
      setRelatedProducts([]);
    } finally {
      setRelatedLoading(false);
    }
  }, []);

  const calculateDiscountedPrice = useCallback((price, discount) => {
    if (discount && discount > 0) return (price * (1 - discount/100)).toFixed(2);
    return (price).toFixed(2);
  }, []);

  // actions
  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    if (addingToCart) return;
    setAddingToCart(true);
    try {
      await addToCart(product, quantity, selectedSize);
      showToast('Added to cart');
    } catch (err) {
      console.error(err);
      showToast('Could not add to cart');
    } finally {
      setAddingToCart(false);
    }
  }, [product, quantity, selectedSize, addingToCart]);

  const handleBuyNow = useCallback(async () => {
    if (!product) return;
    if (buyingNow) return;
    setBuyingNow(true);
    try {
      await addToCart(product, quantity, selectedSize);
      navigate('/checkout');
    } catch (err) {
      console.error(err);
      showToast('Could not proceed to checkout');
    } finally {
      setBuyingNow(false);
    }
  }, [product, quantity, selectedSize, buyingNow]);

  const toggleWishlist = useCallback(() => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      showToast('Removed from wishlist');
    } else {
      const p = { ...product, image_url: productImages[0] };
      addToWishlist(p);
      showToast('Added to wishlist');
    }
  }, [product, productImages]);

  // small loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ModernNavbar showSearch={true} />
        <div className="container mx-auto px-4 py-10 max-w-7xl">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-100 h-96 rounded-lg" />
            <div>
              <div className="h-6 bg-gray-100 rounded w-3/4 mb-4" />
              <div className="h-6 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-gray-100 rounded" />
                <div className="h-12 bg-gray-100 rounded" />
                <div className="h-12 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <ModernNavbar showSearch={true} />
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the product you're looking for.</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-emerald-600 text-white rounded">Back to shop</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar showSearch={true} />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
            <Link to="/" className="hover:text-emerald-700">Home</Link>
            <span>/</span>
            {product.category && (
              <>
                <Link to={`/products?category=${product.category.slug}`} className="hover:text-emerald-700">{product.category.name}</Link>
                <span>/</span>
              </>
            )}
            <span className="font-medium text-gray-900 truncate">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - gallery */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="w-full h-[520px] flex items-center justify-center bg-white">
                <img
                  src={productImages[selectedImage]}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain p-6 transition-opacity duration-300 ease-in-out"
                />
              </div>
            </div>

            {/* thumbnails */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {productImages.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} className={`flex-shrink-0 w-20 h-20 rounded border ${selectedImage === idx ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200'} overflow-hidden bg-white` }>
                  <img src={img} alt={`${product.title} ${idx+1}`} className="w-full h-full object-contain p-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Right - details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.title}</h1>
              {product.brand && <p className="text-sm text-gray-600 mt-1">Brand: {product.brand}</p>}

              <div className="flex items-center gap-3 mt-3">
                <div className="inline-flex items-center bg-emerald-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  {(product.rating || 4.2).toFixed(1)}
                  <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                </div>
                <div className="text-sm text-gray-600">{product.total_ratings || product.total_reviews ? `${product.total_ratings || 0} Ratings` : '—'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <div className="text-3xl font-bold text-gray-900">₹{calculateDiscountedPrice(product.price_cents / 100, product.discount_percent)}</div>
                {product.discount_percent > 0 && (
                  <>
                    <div className="text-lg text-gray-500 line-through">₹{(product.price_cents / 100).toFixed(2)}</div>
                    <div className="text-sm font-semibold text-green-600">{product.discount_percent}% off</div>
                  </>
                )}
              </div>
              {product.discount_percent > 0 && (
                <div className="text-sm text-gray-600">You save ₹{((product.price_cents / 100) - calculateDiscountedPrice(product.price_cents / 100, product.discount_percent)).toFixed(2)}</div>
              )}
              <div className="text-sm text-green-600 font-medium">Inclusive of all taxes</div>
            </div>

            {/* Size selector */}
            {currentSizeChart?.sizes?.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">{currentSizeChart.title}</div>
                  <button className="text-sm text-emerald-600">Size Guide</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {currentSizeChart.sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`px-3 py-2 border rounded-md text-sm ${selectedSize === s ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-300 text-gray-700 hover:border-emerald-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500">{currentSizeChart.guide}</div>
              </div>
            )}

            {/* quantity and stock */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 disabled:opacity-50">-</button>
                <div className="px-4 font-medium">{quantity}</div>
                <button onClick={() => setQuantity(q => Math.min(product.stock_quantity || 99, q + 1))} className="px-3 py-2">+</button>
              </div>
              <div className="text-sm text-gray-600">{product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}</div>
            </div>

            {/* action buttons (desktop) */}
            <div className="hidden sm:flex items-center gap-3">
              <button onClick={handleAddToCart} disabled={product.stock_quantity <= 0 || addingToCart} className="flex-1 px-4 py-3 border border-emerald-600 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition">
                {addingToCart ? 'ADDING...' : 'ADD TO CART'}
              </button>
              <button onClick={handleBuyNow} disabled={product.stock_quantity <= 0 || buyingNow} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold shadow">
                {buyingNow ? 'PROCESSING...' : 'BUY NOW'}
              </button>
              <button onClick={toggleWishlist} className={`w-12 h-12 border rounded-lg flex items-center justify-center ${isInWishlist(product.id) ? 'text-red-500' : 'text-gray-400'}`} aria-label="wishlist">
                <svg fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* delivery + returns */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-green-600 mt-0.5">✓</div>
                <div>
                  <div className="font-medium text-sm">Free delivery</div>
                  <div className="text-sm text-gray-600">On orders above ₹499 • Delivery by <span className="font-medium">{new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-600 mt-0.5">✓</div>
                <div>
                  <div className="font-medium text-sm">Easy returns</div>
                  <div className="text-sm text-gray-600">14 days return & exchange</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {['description','specifications','reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium ${activeTab===tab ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-600'}`}>
                {tab === 'description' ? 'PRODUCT DESCRIPTION' : tab === 'specifications' ? 'SPECIFICATIONS' : 'RATINGS & REVIEWS'}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-sm text-gray-700">
                {product.description || 'No description available.'}
              </div>
            )}
            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <div className="flex justify-between py-2 border-b border-gray-100"><span>Brand</span><span className="font-medium">{product.brand || 'Generic'}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-100"><span>Category</span><span className="font-medium">{product.category?.name || 'General'}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-100"><span>Material</span><span className="font-medium">{product.material || '—'}</span></div>
                </div>
                <div>
                  <div className="flex justify-between py-2 border-b border-gray-100"><span>Fit</span><span className="font-medium">{product.fit || 'Regular'}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-100"><span>Care</span><span className="font-medium">{product.care || 'Machine wash'}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-100"><span>Country</span><span className="font-medium">{product.origin || 'India'}</span></div>
                </div>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="text-center py-8 text-sm text-gray-600">
                <div className="mb-3">No reviews yet. Be the first to review this product.</div>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded">Write a review</button>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        <div className="mt-10 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Similar Products</h3>
            {product.category && <Link to={`/products?category=${product.category.slug}`} className="text-sm text-emerald-600">View All</Link>}
          </div>

          {relatedLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({length:4}).map((_,i)=>(<div key={i} className="animate-pulse bg-gray-100 h-40 rounded"/>))}
            </div>
          ) : relatedProducts.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(r => (
                <Link to={`/product/${r.id}`} key={r.id} className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                  <div className="aspect-square flex items-center justify-center p-4">
                    <img src={r.product_images?.[0]?.url || r.image_url} alt={r.title} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-medium line-clamp-2">{r.title}</h4>
                    <div className="mt-2 text-sm font-semibold">₹{calculateDiscountedPrice(r.price_cents/100, r.discount_percent)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No similar products found.</div>
          )}
        </div>

      </div>

      {/* Mobile sticky actions */}
      <div className="fixed left-0 right-0 bottom-0 sm:hidden bg-white border-t border-gray-200 p-3 flex items-center gap-3 z-40">
        <button onClick={toggleWishlist} className={`w-12 h-12 border rounded-lg flex items-center justify-center ${isInWishlist(product.id) ? 'text-red-500' : 'text-gray-400'}`}>
          <svg fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <button onClick={handleAddToCart} disabled={product.stock_quantity <= 0 || addingToCart} className="flex-1 px-4 py-3 border border-emerald-600 text-emerald-600 rounded-lg font-semibold">
          {addingToCart ? 'ADDING...' : 'ADD TO CART'}
        </button>
        <button onClick={handleBuyNow} disabled={product.stock_quantity <= 0 || buyingNow} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold">
          {buyingNow ? 'PROCESSING...' : 'BUY NOW'}
        </button>
      </div>

      <Toast open={toast.open} message={toast.message} onClose={() => setToast({ open: false, message: '' })} />

      <MobileBottomNav />
    </div>
  );
}
