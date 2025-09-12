import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '../../components/Navigation';
import AddressManager from '../../components/AddressManager';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('orders');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    mobile: '',
    full_name: '',
    phone: ''
  });

  // Dynamic data state
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Dynamic wishlist from context
  const wishlist = wishlistItems;

  // Temporary static data (will be implemented later)
  const [paymentMethods] = useState([]);
  const [addresses] = useState([]);
  
  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    mobile: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  });

  // API Functions
  const fetchUserProfile = useCallback(async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'https://brandverse-46he.vercel.app';
      const response = await fetch(`${API_BASE}/api/customers/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setUserInfo({
          name: profileData.full_name || profileData.name || user.email?.split('@')[0] || 'User',
          email: profileData.email || user.email || '',
          mobile: profileData.phone || profileData.mobile || '',
          full_name: profileData.full_name || '',
          phone: profileData.phone || ''
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile data');
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoadingData(true);
      const API_BASE = process.env.REACT_APP_API_BASE || 'https://brandverse-46he.vercel.app';
      const response = await fetch(`${API_BASE}/api/orders`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData || []);
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoadingData(false);
    }
  };

  const updateUserProfile = async (updatedInfo) => {
    try {
      setUpdating(true);
      const API_BASE = process.env.REACT_APP_API_BASE || 'https://brandverse-46he.vercel.app';
      
      // Only update basic profile fields that exist in the customers table
      const profileData = {
        full_name: updatedInfo.name,
        phone: updatedInfo.mobile
      };

      const response = await fetch(`${API_BASE}/api/customers/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        await fetchUserProfile(); // Refresh the profile data
        setError('');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile update error:', errorData);
        setError(errorData.error || 'Failed to update profile');
        return false;
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchUserProfile();
      fetchOrders();
    }
  }, [user, loading, navigate, fetchUserProfile]); // Note: fetchUserProfile and fetchOrders are stable functions

  const getStatusColor = (status, paymentStatus) => {
    // Payment status takes priority
    if (paymentStatus === 'failed') {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (paymentStatus === 'pending') {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    
    // Order status
    switch (status) {
      case "delivered": 
        return "bg-green-100 text-green-800 border-green-200";
      case "shipped": 
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "paid":
      case "processing": 
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: 
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8" style={{ paddingTop: '70px' }}>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Manage your orders, wishlist, and account settings
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            {/* Mobile Tab Navigation - Dropdown */}
            <div className="sm:hidden">
              <label htmlFor="tabs" className="sr-only">Select a tab</label>
              <select
                id="tabs"
                name="tabs"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="block w-full px-3 py-2 border-0 border-b border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="orders">Orders</option>
                <option value="wishlist">Wishlist</option>
                <option value="settings">Settings</option>
                <option value="payment">Payment</option>
                <option value="addresses">Addresses</option>
              </select>
            </div>
            
            {/* Desktop Tab Navigation */}
            <nav className="hidden sm:flex space-x-4 lg:space-x-8 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
              {[
                { 
                  id: 'orders', 
                  name: 'Orders', 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )
                },
                { 
                  id: 'wishlist', 
                  name: 'Wishlist', 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )
                },
                { 
                  id: 'settings', 
                  name: 'Settings', 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                },
                { 
                  id: 'payment', 
                  name: 'Payment', 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  )
                },
                { 
                  id: 'addresses', 
                  name: 'Addresses', 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Order History</h2>
                  {loadingData && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}
                
                {!loadingData && orders.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                      Start shopping to see your orders here
                    </p>
                    <button 
                      onClick={() => navigate('/')}
                      className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow space-y-3 sm:space-y-0">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()} • {order.order_items?.length || 0} items
                            </p>
                            {order.payment_method && (
                              <p className="text-xs text-gray-500">Payment: {order.payment_method}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status, order.payment_status)}`}>
                              {order.payment_status === 'failed' ? 'Payment Failed' :
                               order.payment_status === 'pending' ? 'Payment Pending' :
                               order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Processing'}
                            </span>
                            {order.payment_status === 'pending' && (
                              <button
                                onClick={() => navigate('/checkout')}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Complete Payment
                              </button>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">
                            ₹{order.total_cents ? (order.total_cents / 100).toFixed(2) : '0.00'}
                          </p>
                          <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Wishlist</h2>
                  <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs sm:text-sm font-medium">
                    {wishlist.length} items
                  </span>
                </div>
                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {wishlist.map((item) => {
                      const discountedPrice = item.discount_percent > 0 
                        ? (item.price_cents / 100) * (1 - item.discount_percent / 100)
                        : item.price_cents / 100;
                      
                      return (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="relative cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                            <img 
                              src={item.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80'} 
                              alt={item.title}
                              className="w-full h-40 sm:h-48 object-cover"
                            />
                            {item.discount_percent > 0 && (
                              <div className="absolute top-2 left-2">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                  {item.discount_percent}% OFF
                                </span>
                              </div>
                            )}
                            {item.stock_quantity <= 0 && (
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3 sm:p-4">
                            <h4 className="font-medium text-gray-900 mb-2 cursor-pointer hover:text-blue-600 text-sm sm:text-base overflow-hidden" 
                                style={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}
                                onClick={() => navigate(`/product/${item.id}`)}>
                              {item.title}
                            </h4>
                            <div className="mb-3">
                              {item.discount_percent > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-base sm:text-lg font-bold text-blue-600">
                                    ₹{discountedPrice.toFixed(2)}
                                  </span>
                                  <span className="text-xs sm:text-sm text-gray-500 line-through">
                                    ₹{(item.price_cents / 100).toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-base sm:text-lg font-bold text-blue-600">
                                  ₹{(item.price_cents / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-colors ${
                                  item.stock_quantity > 0 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                disabled={item.stock_quantity <= 0}
                                onClick={async () => {
                                  try {
                                    await addToCart(item, 1);
                                    alert('Item added to cart!');
                                  } catch (error) {
                                    console.error('Error adding to cart:', error);
                                    alert('Error adding to cart');
                                  }
                                }}
                              >
                                Add to Cart
                              </button>
                              <button 
                                className="p-1.5 sm:p-2 text-red-500 hover:text-red-700 transition-colors"
                                onClick={() => {
                                  if (window.confirm('Remove this item from your wishlist?')) {
                                    removeFromWishlist(item.id);
                                  }
                                }}
                                title="Remove from wishlist"
                              >
                                <svg width="14" height="14" className="sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h4>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                      Start adding products you love to your wishlist
                    </p>
                    <button 
                      onClick={() => navigate('/')}
                      className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      Browse Products
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={updating}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input 
                        type="tel"
                        value={userInfo.mobile}
                        onChange={(e) => setUserInfo({...userInfo, mobile: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={updating}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email"
                      value={userInfo.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      disabled={true}
                      title="Email cannot be changed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
                  </div>

                  {/* Address Management Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-blue-800 text-sm">
                        <strong>Address Management:</strong> Your shipping and billing addresses can be managed in the 
                        <button 
                          onClick={() => setActiveTab('addresses')} 
                          className="text-blue-600 underline mx-1 hover:text-blue-800"
                        >
                          Addresses
                        </button> 
                        tab.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      const success = await updateUserProfile(userInfo);
                      if (success) {
                        // Show success message or toast notification
                        alert('Profile updated successfully!');
                      }
                    }}
                    disabled={updating}
                    className={`w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                      updating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payment' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Payment Methods</h2>
                  <button className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
                    + Add Card
                  </button>
                </div>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
                            {method.type.slice(0, 4).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">**** **** **** {method.last4}</p>
                            <p className="text-sm text-gray-500">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                          {method.isDefault && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                            ✏️
                          </button>
                          <button className="p-2 text-red-500 hover:text-red-700 transition-colors">
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No payment methods added</h3>
                    <p className="text-gray-500 mb-6 text-sm sm:text-base px-4">Add a credit or debit card to make checkout faster and easier</p>
                    <button className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
                      Add Your First Card
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="px-0 sm:px-2 py-2 sm:py-4">
                <AddressManager />
              </div>
            )}

            {/* Old Addresses Implementation - REMOVED */}
            {false && activeTab === 'addresses_old' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                  <button 
                    onClick={() => setShowAddressForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Add Address
                  </button>
                </div>
                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((address) => (
                      <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-gray-900">{address.name}</p>
                              {address.isDefault && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{address.mobile}</p>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>{address.addressLine1}</p>
                              {address.addressLine2 && <p>{address.addressLine2}</p>}
                              <p>{address.city}, {address.state} {address.pincode}</p>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex gap-2">
                            <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                              ✏️ Edit
                            </button>
                            <button className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : showAddressForm ? (
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h3>
                    <form className="space-y-4" onSubmit={(e) => {
                      e.preventDefault();
                      alert('Address functionality will be implemented with backend API');
                      setShowAddressForm(false);
                      setNewAddress({
                        name: '',
                        mobile: '',
                        addressLine1: '',
                        addressLine2: '',
                        city: '',
                        state: '',
                        pincode: ''
                      });
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                          <input
                            type="tel"
                            value={newAddress.mobile}
                            onChange={(e) => setNewAddress({...newAddress, mobile: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                        <input
                          type="text"
                          value={newAddress.addressLine1}
                          onChange={(e) => setNewAddress({...newAddress, addressLine1: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Street address, house number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                        <input
                          type="text"
                          value={newAddress.addressLine2}
                          onChange={(e) => setNewAddress({...newAddress, addressLine2: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <input
                            type="text"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                          <input
                            type="text"
                            value={newAddress.pincode}
                            onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Save Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h3>
                    <p className="text-gray-500 mb-6">Add delivery addresses to speed up your checkout process</p>
                    <button 
                      onClick={() => setShowAddressForm(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Your First Address
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
