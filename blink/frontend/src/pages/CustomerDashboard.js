import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    mobile: ''
  });

  // Mock data
  const [orders] = useState([
    {
      id: "ORD001",
      date: "2024-01-15",
      status: "delivered",
      total: 129.99,
      items: 3
    },
    {
      id: "ORD002", 
      date: "2024-01-20",
      status: "shipped",
      total: 79.99,
      items: 1
    },
    {
      id: "ORD003",
      date: "2024-01-25", 
      status: "processing",
      total: 199.99,
      items: 2
    }
  ]);

  const [wishlist] = useState([
    {
      id: "1",
      name: "Wireless Headphones",
      price: 79.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
      inStock: true
    },
    {
      id: "2",
      name: "Smart Watch",
      price: 299.99,
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200",
      inStock: false
    }
  ]);

  const [paymentMethods] = useState([
    {
      id: "1",
      type: "Visa",
      last4: "1234",
      expiryMonth: "12",
      expiryYear: "2025",
      isDefault: true
    },
    {
      id: "2", 
      type: "Mastercard",
      last4: "5678",
      expiryMonth: "06",
      expiryYear: "2026",
      isDefault: false
    }
  ]);

  const [addresses] = useState([
    {
      id: "1",
      name: "John Doe",
      mobile: "+1234567890",
      addressLine1: "123 Main Street",
      addressLine2: "Apt 4B",
      city: "New York",
      state: "NY",
      pincode: "10001",
      isDefault: true
    },
    {
      id: "2",
      name: "John Doe", 
      mobile: "+1234567890",
      addressLine1: "456 Office Blvd",
      addressLine2: "Suite 200",
      city: "New York", 
      state: "NY",
      pincode: "10002",
      isDefault: false
    }
  ]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      setUserInfo({
        name: user.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        mobile: user.mobile || ''
      });
    }
  }, [user, loading, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered": 
        return "bg-green-100 text-green-800 border-green-200";
      case "shipped": 
        return "bg-blue-100 text-blue-800 border-blue-200";
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingTop: '80px' }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your orders, wishlist, and account settings
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'orders', name: 'Orders', icon: '📦' },
                { id: 'wishlist', name: 'Wishlist', icon: '❤️' },
                { id: 'settings', name: 'Settings', icon: '⚙️' },
                { id: 'payment', name: 'Payment', icon: '💳' },
                { id: 'addresses', name: 'Addresses', icon: '📍' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order History</h2>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.id}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.date).toLocaleDateString()} • {order.items} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <p className="font-semibold text-gray-900">${order.total}</p>
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">My Wishlist</h2>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    {wishlist.length} items
                  </span>
                </div>
                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-48 object-cover"
                          />
                          {!item.inStock && (
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900 mb-2">{item.name}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-blue-600">
                              ${item.price.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-2">
                              <button 
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                  item.inStock 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                disabled={!item.inStock}
                              >
                                Add to Cart
                              </button>
                              <button className="p-1 text-red-500 hover:text-red-700 transition-colors">
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">❤️</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h4>
                    <p className="text-gray-600 mb-6">
                      Start adding products you love to your wishlist
                    </p>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Browse Products
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input 
                        type="tel"
                        value={userInfo.mobile}
                        onChange={(e) => setUserInfo({...userInfo, mobile: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payment' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    + Add Card
                  </button>
                </div>
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
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    + Add Address
                  </button>
                </div>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
