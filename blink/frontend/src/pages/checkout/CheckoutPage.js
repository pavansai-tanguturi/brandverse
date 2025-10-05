import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import MobileBottomNav from '../../components/MobileBottomNav';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import logo from '../../assets/logos.png';

// Utility function for authenticated API calls
const makeAuthenticatedRequest = async (url, options = {}) => {
  let token = localStorage.getItem('auth_token');
  if (!token && typeof document !== 'undefined') {
    const match = document.cookie.match(/auth_token=([^;]+)/);
    if (match) token = match[1];
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    getCartTotal,
    getCartSubtotal,
    getTotalDiscount,
    clearCart,
    removeFromCart
  } = useCart();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [outOfStockItem, setOutOfStockItem] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [newAddress, setNewAddress] = useState({
    full_name: user?.full_name || user?.name || '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    landmark: '',
    type: 'both',
    is_default: true
  });

  const fetchAddresses = useCallback(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await makeAuthenticatedRequest(`${API_BASE}/api/addresses`);
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        const defaultAddr = data.find(addr => addr.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  }, [navigate]);

  const validateCart = () => {
    if (items.length === 0) {
      return { valid: false, issues: [{ issue: 'Cart is empty' }] };
    }
    
    const issues = [];
    items.forEach(item => {
      if (item.stock_quantity !== undefined && item.stock_quantity <= 0) {
        issues.push({ issue: `${item.title} is out of stock` });
      }
    });
    
    return { valid: issues.length === 0, issues };
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchAddresses();
  }, [user, items, navigate, fetchAddresses]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      const response = await makeAuthenticatedRequest(`${API_BASE}/api/addresses`, {
        method: 'POST',
        body: JSON.stringify(newAddress)
      });

      if (response.ok) {
        const address = await response.json();
        setAddresses(prev => [address, ...prev]);
        setSelectedAddress(address);
        setShowAddressForm(false);
        setNewAddress({
          full_name: user?.full_name || user?.name || '',
          phone: '',
          address_line_1: '',
          address_line_2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'India',
          landmark: '',
          type: 'both',
          is_default: true
        });
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create address');
      }
    } catch (error) {
      console.error('Error creating address:', error);
      setError('Failed to create address');
    } finally {
      setLoading(false);
    }
  };

  const ensureServerCartSync = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      // Clear existing server cart first
      try {
        await makeAuthenticatedRequest(`${API_BASE}/api/cart/clear`, {
          method: 'POST'
        });
      } catch (clearError) {
        console.warn('Failed to clear server cart:', clearError);
      }
      
      // Add all current items to server cart
      for (const item of items) {
        const addResponse = await makeAuthenticatedRequest(`${API_BASE}/api/cart/add`, {
          method: 'POST',
          body: JSON.stringify({
            product_id: item.id,
            quantity: item.quantity
          })
        });
        
        if (!addResponse.ok) {
          const errorData = await addResponse.json();
          throw new Error(`Failed to sync ${item.title} to server cart`);
        }
      }
      
      return true;
    } catch (syncError) {
      console.error('Server cart sync failed:', syncError);
      return false;
    }
  };

  const handleRemoveOutOfStockItem = async () => {
    if (!outOfStockItem?.item?.id) return;
    
    try {
      setLoading(true);
      await removeFromCart(outOfStockItem.item.id);
      setError('');
      setOutOfStockItem(null);
      setError(`"${outOfStockItem.name}" has been removed from your cart. You can now proceed with checkout.`);
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Failed to remove out-of-stock item:', error);
      setError('Failed to remove item from cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createCODOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      const validation = validateCart();
      if (!validation.valid) {
        throw new Error('Cart contains invalid items. Please review your cart.');
      }
      
      const syncSuccess = await ensureServerCartSync();
      if (!syncSuccess) {
        console.warn('Proceeding without server cart sync');
      }

      const response = await makeAuthenticatedRequest(`${API_BASE}/api/orders`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: paymentMethod, // Use selected payment method
          shipping_address: selectedAddress ? {
            full_name: selectedAddress.full_name,
            phone: selectedAddress.phone,
            address_line_1: selectedAddress.address_line_1,
            address_line_2: selectedAddress.address_line_2,
            city: selectedAddress.city,
            state: selectedAddress.state,
            postal_code: selectedAddress.postal_code,
            country: selectedAddress.country,
            landmark: selectedAddress.landmark,
            type: selectedAddress.type || 'both'
          } : null,
          cart_items: items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price_cents: item.discount_percent > 0
              ? Math.round(item.price_cents * (1 - item.discount_percent / 100))
              : item.price_cents
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.code === 'DELIVERY_UNAVAILABLE') {
          setError(`${errorData.message || 'Delivery not available to your location'}\n\nPlease contact us or try a different address.`);
          return;
        }
        
        if (errorData.error && errorData.error.includes('Insufficient stock')) {
          const productName = errorData.item?.title || errorData.error.split('for ')[1] || 'a product';
          const available = errorData.available || 0;
          const required = errorData.required || 0;
          
          setOutOfStockItem({
            name: productName,
            available,
            required,
            item: errorData.item
          });
          
          setError(`Sorry, "${productName}" is out of stock or has insufficient quantity. Available: ${available}, Required: ${required}. Please update your cart and try again.`);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await response.json();
      
      console.log('Order created successfully:', order);

      // Clear cart immediately after successful order creation
      clearCart();

      // Handle different payment methods
      if (paymentMethod === 'cod') {
        // Try to confirm COD order
        try {
          const confirmResponse = await makeAuthenticatedRequest(`${API_BASE}/api/orders/${order.id}/confirm-cod`, {
            method: 'POST'
          });

          if (confirmResponse.ok) {
            const result = await confirmResponse.json();
            console.log('COD order confirmed:', result);
            navigate('/order-success', { 
              state: { 
                order: result.order || order,
                message: 'Order placed successfully! You can pay cash on delivery.',
                paymentMethod: 'cod'
              } 
            });
            return;
          } else {
            console.warn('COD confirmation failed, but order was created');
          }
        } catch (confirmError) {
          console.warn('COD confirmation endpoint not available:', confirmError);
        }
        
        // Fallback: Navigate to success even if confirmation fails
        navigate('/order-success', { 
          state: { 
            order: order,
            message: 'Order placed successfully! You can pay cash on delivery.',
            paymentMethod: 'cod'
          } 
        });
        return;
        
      } else if (paymentMethod === 'upi') {
        // For UPI, redirect to order success with UPI payment instructions
        navigate('/order-success', { 
          state: { 
            order: order,
            message: 'Order placed successfully! Complete the UPI payment to confirm.',
            paymentMethod: 'upi'
          } 
        });
        return;
      }

    } catch (error) {
      console.error('Order creation error:', error);
      setError(error.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) {
    return null;
  }

  const validation = validateCart();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Modern Header */}
      <header className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center space-x-3 cursor-pointer">
              <img
                src={logo}
                className="h-12 w-auto object-contain rounded-lg"
                alt="Logo"
              />
            </Link>
            
            {/* Progress Steps - Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              {[
                { num: 1, label: 'BAG', icon: '🛍️' },
                { num: 2, label: 'ADDRESS', icon: '📍' },
                { num: 3, label: 'PAYMENT', icon: '💳' }
              ].map((item, idx) => (
                <React.Fragment key={item.num}>
                  <div className="flex items-center">
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      step >= item.num 
                        ? 'bg-white/20 text-white' 
                        : 'text-emerald-200'
                    }`}>
                      <span className={`text-lg font-bold ${
                        step === item.num ? 'scale-110' : ''
                      }`}>{item.num}</span>
                      <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                      {step === item.num && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                  {idx < 2 && (
                    <div className={`w-8 h-0.5 ${
                      step > item.num ? 'bg-white' : 'bg-white/30'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <p className="text-emerald-100 text-xs">Secure Checkout</p>
                <p className="text-white font-semibold">
                  ₹{(getCartTotal() / 100).toFixed(2)}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Mobile Progress */}
          <div className="md:hidden pb-4">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex-1 relative">
                  <div className={`h-1 ${
                    step >= num ? 'bg-white' : 'bg-white/30'
                  }`} />
                  <p className={`text-xs mt-1 text-center ${
                    step >= num ? 'text-white' : 'text-emerald-200'
                  }`}>
                    {num === 1 ? 'Bag' : num === 2 ? 'Address' : 'Payment'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Cart Validation Warning */}
        {validation && !validation.valid && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 px-6 py-4 rounded-r-xl shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="bg-amber-500 rounded-full p-1 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-1">Action Required</p>
                {validation.issues && validation.issues.map((issue, index) => (
                  <p key={index} className="text-sm text-amber-800">• {issue.issue || issue}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-rose-50 to-red-50 border-l-4 border-rose-500 px-6 py-4 rounded-r-xl shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="bg-rose-500 rounded-full p-1 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-rose-900 whitespace-pre-line">{error}</p>
                {outOfStockItem && (
                  <button
                    onClick={handleRemoveOutOfStockItem}
                    disabled={loading}
                    className="mt-3 px-5 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-all shadow-md font-medium"
                  >
                    {loading ? 'Removing...' : `Remove "${outOfStockItem.name}"`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Step 1: Review Items */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 py-3 sm:py-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="text-sm sm:text-base">Your Bag ({items.length} {items.length === 1 ? 'Item' : 'Items'})</span>
                  </h2>
                </div>
                <div className="p-3 sm:p-6 space-y-3">
                  {items.map((item) => {
                    const hasDiscount = item.discount_percent > 0;
                    const unitPrice = item.unit_price_cents !== undefined ? item.unit_price_cents : (item.discount_percent > 0 ? Math.round(item.price_cents * (1 - item.discount_percent / 100)) : item.price_cents);
                    const totalPrice = item.total_cents !== undefined ? item.total_cents : unitPrice * item.quantity;
                    
                    return (
                      <div key={item.id} className="group relative bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="flex items-start space-x-2 sm:space-x-4 p-3 sm:p-4">
                          <div className="relative flex-shrink-0">
                            <img 
                              src={item.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=100&q=80'} 
                              alt={item.title}
                              className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-gray-100 group-hover:border-emerald-300 transition-colors"
                            />
                            {hasDiscount && (
                              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg">
                                {item.discount_percent}% OFF
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight mb-1 sm:mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">{item.title}</h3>
                            <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                              <div className="bg-emerald-100 text-emerald-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold">
                                Qty: {item.quantity}
                              </div>
                              {item.stock_quantity > 0 && (
                                <div className="text-gray-500 text-xs hidden sm:block">
                                  {item.stock_quantity} in stock
                                </div>
                              )}
                            </div>
                            {hasDiscount ? (
                              <div className="space-y-0.5 sm:space-y-1">
                                <div className="flex items-baseline space-x-1 sm:space-x-2">
                                  <span className="text-base sm:text-xl font-bold text-emerald-600">
                                    ₹{(unitPrice / 100).toFixed(2)}
                                  </span>
                                  <span className="text-xs sm:text-sm text-gray-400 line-through">
                                    ₹{(item.price_cents / 100).toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-emerald-600 text-xs sm:text-sm font-semibold">
                                  Save ₹{((item.price_cents - unitPrice) / 100).toFixed(2)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-base sm:text-xl font-bold text-gray-900">₹{(item.price_cents / 100).toFixed(2)}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500 mb-0.5 sm:mb-1 hidden sm:block">Total</p>
                            <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                              ₹{(totalPrice / 100).toFixed(2)}
                            </p>
                            {hasDiscount && (
                              <p className="text-xs text-gray-400 line-through mt-1">₹{((item.price_cents / 100) * item.quantity).toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6 border-t border-gray-200">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!validation.valid}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 flex items-center justify-center space-x-2"
                  >
                    {!validation.valid ? (
                      <>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-xs sm:text-sm">Fix Cart Issues First</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm sm:text-base">Continue to Address</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900">Delivery Address</h2>
                
                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedAddress?.id === address.id
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{address.full_name}</p>
                            <p className="text-gray-600 text-sm mt-1">{address.address_line_1}</p>
                            {address.address_line_2 && <p className="text-gray-600 text-sm">{address.address_line_2}</p>}
                            <p className="text-gray-600 text-sm">
                              {address.city}, {address.state} {address.postal_code}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">{address.phone}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-4 ${
                            selectedAddress?.id === address.id
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedAddress?.id === address.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="inline-flex items-center space-x-2 px-6 py-3 text-emerald-600 border border-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200 font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add New Address</span>
                      </button>
                    </div>

                    {showAddressForm && (
                      <div className="mt-6 p-6 border border-gray-200 rounded-xl bg-gray-50">
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.full_name}
                                onChange={(e) => setNewAddress(prev => ({...prev, full_name: e.target.value}))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                required
                                value={newAddress.phone}
                                onChange={(e) => setNewAddress(prev => ({...prev, phone: e.target.value}))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.address_line_1}
                              onChange={(e) => setNewAddress(prev => ({...prev, address_line_1: e.target.value}))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Line 2 (Optional)
                            </label>
                            <input
                              type="text"
                              value={newAddress.address_line_2}
                              onChange={(e) => setNewAddress(prev => ({...prev, address_line_2: e.target.value}))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.city}
                                onChange={(e) => setNewAddress(prev => ({...prev, city: e.target.value}))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                State *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.state}
                                onChange={(e) => setNewAddress(prev => ({...prev, state: e.target.value}))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postal Code *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.postal_code}
                                onChange={(e) => setNewAddress(prev => ({...prev, postal_code: e.target.value}))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Landmark (Optional)
                            </label>
                            <input
                              type="text"
                              value={newAddress.landmark}
                              onChange={(e) => setNewAddress(prev => ({...prev, landmark: e.target.value}))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>

                          <div className="flex justify-between pt-4">
                            <button
                              type="button"
                              onClick={() => setShowAddressForm(false)}
                              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50"
                            >
                              {loading ? 'Adding...' : 'Add Address'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:justify-between">
                      <button
                        onClick={() => setStep(1)}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium text-sm sm:text-base order-2 sm:order-1"
                      >
                        ← Back to Bag
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        disabled={!selectedAddress}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2"
                      >
                        Continue to Payment →
                      </button>
                    </div>
                  </div>
                ) : (
                  // Address form when no addresses exist
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">No addresses found. Please add a delivery address.</p>
                    <div className="mt-6 p-6 border border-gray-200 rounded-xl bg-gray-50 max-w-2xl mx-auto">
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h3>
                        {/* Address form fields same as above */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={newAddress.full_name}
                              onChange={(e) => setNewAddress(prev => ({...prev, full_name: e.target.value}))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                            <input
                              type="tel"
                              required
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress(prev => ({...prev, phone: e.target.value}))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                          <input
                            type="text"
                            required
                            value={newAddress.address_line_1}
                            onChange={(e) => setNewAddress(prev => ({...prev, address_line_1: e.target.value}))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2 (Optional)</label>
                          <input
                            type="text"
                            value={newAddress.address_line_2}
                            onChange={(e) => setNewAddress(prev => ({...prev, address_line_2: e.target.value}))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                            <input
                              type="text"
                              required
                              value={newAddress.city}
                              onChange={(e) => setNewAddress(prev => ({...prev, city: e.target.value}))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                            <input
                              type="text"
                              required
                              value={newAddress.state}
                              onChange={(e) => setNewAddress(prev => ({...prev, state: e.target.value}))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                            <input
                              type="text"
                              required
                              value={newAddress.postal_code}
                              onChange={(e) => setNewAddress(prev => ({...prev, postal_code: e.target.value}))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                          <input
                            type="text"
                            value={newAddress.landmark}
                            onChange={(e) => setNewAddress(prev => ({...prev, landmark: e.target.value}))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div className="flex justify-end pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                          >
                            {loading ? 'Adding...' : 'Add Address & Continue'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 py-3 sm:py-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Choose Payment Method
                  </h2>
                </div>
                
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {/* Cash on Delivery Option */}
                  <div 
                    className={`p-4 sm:p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'cod' 
                        ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-md ring-2 ring-emerald-200' 
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          paymentMethod === 'cod'
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'cod' && (
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-900 text-sm sm:text-base">Cash on Delivery</p>
                            {paymentMethod === 'cod' && (
                              <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Pay with cash when the order is delivered to your doorstep</p>
                          <div className="mt-2 flex items-center gap-2 text-emerald-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-medium">Easy & Convenient</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-emerald-100 text-emerald-800 px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex-shrink-0">
                        Popular
                      </div>
                    </div>
                  </div>

                  {/* UPI Payment Option */}
                  <div 
                    className={`p-4 sm:p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'upi' 
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          paymentMethod === 'upi'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'upi' && (
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-900 text-sm sm:text-base">UPI Payment</p>
                            {paymentMethod === 'upi' && (
                              <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Pay instantly using Google Pay, PhonePe, Paytm & more</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-blue-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-xs font-medium">100% Secure</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-xs font-medium">Instant</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex-shrink-0">
                        Fast
                      </div>
                    </div>
                  </div>

                  {/* Payment Info Box */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-amber-900 font-medium">
                          {paymentMethod === 'cod' 
                            ? 'Keep exact change ready for a smooth delivery experience' 
                            : 'You will receive UPI payment details after placing the order'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h3>
                  <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                    <div className="flex justify-between">
                      <span>Subtotal ({items.length} items)</span>
                      <span className="font-semibold">₹{(getCartSubtotal() / 100).toFixed(2)}</span>
                    </div>
                    {getTotalDiscount() > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-₹{(getTotalDiscount() / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-600">
                      <span>Shipping</span>
                      <span className="font-semibold">FREE</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 sm:pt-3 mt-2">
                      <span className="font-bold text-gray-900 text-base sm:text-lg">Total Amount</span>
                      <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        ₹{(getCartTotal() / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white p-4 sm:p-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium text-sm sm:text-base order-2 sm:order-1"
                    >
                      ← Back to Address
                    </button>
                    <button
                      onClick={createCODOrder}
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm sm:text-base">Placing Order...</span>
                        </div>
                      ) : (
                        <span className="text-sm sm:text-base">
                          Place Order - ₹{(getCartTotal() / 100).toFixed(2)}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Price Summary
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Price ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                    <span className="font-semibold text-gray-900">₹{(getCartSubtotal() / 100).toFixed(2)}</span>
                  </div>
                  
                  {getTotalDiscount() > 0 && (
                    <div className="flex justify-between items-center py-2 bg-emerald-50 -mx-6 px-6 border-l-4 border-emerald-500">
                      <span className="text-emerald-700 font-medium">Discount</span>
                      <span className="font-bold text-emerald-600">-₹{(getTotalDiscount() / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Delivery Charges</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 line-through text-xs">₹40</span>
                      <span className="font-bold text-emerald-600">FREE</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t-2 border-dashed border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      ₹{(getCartTotal() / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {getTotalDiscount() > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-sm text-emerald-800 font-semibold flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      You will save ₹{(getTotalDiscount() / 100).toFixed(2)} on this order
                    </p>
                  </div>
                )}
              </div>
              
              {/* Security Badge */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-2 text-sm text-emerald-600 mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  <span className="font-bold">100% Secure Checkout</span>
                </div>
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Your payment & personal information is safe with us
                </p>
                
                {/* Payment Icons */}
                <div className="flex items-center justify-center space-x-3 mt-3">
                  <div className="bg-white rounded px-2 py-1 shadow-sm border border-gray-200">
                    <span className="text-xs font-semibold text-gray-600">COD</span>
                  </div>
                  <div className="bg-white rounded px-2 py-1 shadow-sm border border-gray-200">
                    <span className="text-xs font-semibold text-gray-600">UPI</span>
                  </div>
                  <div className="bg-white rounded px-2 py-1 shadow-sm border border-gray-200">
                    <span className="text-xs font-semibold text-gray-600">Cards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default CheckoutPage;