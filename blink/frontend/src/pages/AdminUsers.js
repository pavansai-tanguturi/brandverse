import React, { useState, useEffect } from 'react';
import AdminNav from '../components/AdminNav';

const AdminUsers = () => {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      
      const res = await fetch(`${API_BASE}/api/admin/customers`, {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        setError('Failed to fetch customers');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch customers');
    }
  };

  const viewCustomerDetails = async (customerId) => {
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      
      const res = await fetch(`${API_BASE}/api/admin/customers/${customerId}`, {
        credentials: 'include'
      });

      if (res.ok) {
        const customerData = await res.json();
        setSelectedCustomer(customerData);
        setShowDetails(true);
      } else {
        setError('Failed to fetch customer details');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch customer details');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-50" style={{ paddingTop: '64px' }}>
        <div className="max-w-8xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-gray-600 mt-1">Manage and view customer information</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Customer Tier Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Customer Tiers:</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                💎 Platinum (₹100K+ or 50+ orders)
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                🥇 Gold (₹50K+ or 25+ orders)
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                🥈 Silver (₹20K+ or 10+ orders)
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                🥉 Bronze (₹5K+ or 3+ orders)
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                ⭐ New (Less than 3 orders)
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Customer Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : customer.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.full_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {customer.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.order_count || 0}</div>
                      <div className="text-sm text-gray-500">orders</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        ₹{((customer.total_spent || 0) / 100).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.tier ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.tier.bgColor} ${customer.tier.color}`}>
                          {customer.tier.name === 'Platinum' && '💎'}
                          {customer.tier.name === 'Gold' && '🥇'}
                          {customer.tier.name === 'Silver' && '🥈'}
                          {customer.tier.name === 'Bronze' && '🥉'}
                          {customer.tier.name === 'New' && '⭐'}
                          <span className="ml-1">{customer.tier.name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                          ⭐ <span className="ml-1">New</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.marketing_opt_in 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.marketing_opt_in ? 'Subscribed' : 'Not subscribed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewCustomerDetails(customer.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No customers have been added yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Customer Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-gray-900">{selectedCustomer.full_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedCustomer.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer Since</label>
                      <p className="text-gray-900">{formatDate(selectedCustomer.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer Tier</label>
                      <div className="mt-1">
                        {selectedCustomer.tier ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedCustomer.tier.bgColor} ${selectedCustomer.tier.color}`}>
                            {selectedCustomer.tier.name === 'Platinum' && '💎'}
                            {selectedCustomer.tier.name === 'Gold' && '🥇'}
                            {selectedCustomer.tier.name === 'Silver' && '🥈'}
                            {selectedCustomer.tier.name === 'Bronze' && '🥉'}
                            {selectedCustomer.tier.name === 'New' && '⭐'}
                            <span className="ml-2">{selectedCustomer.tier.name} Customer</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-600">
                            ⭐ <span className="ml-2">New Customer</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Order Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedCustomer.order_count || 0}</p>
                      <p className="text-sm text-blue-600">Total Orders</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        ₹{((selectedCustomer.total_spent || 0) / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600">Total Spent</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">📍 Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shipping Address */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">📦</span>
                      <h5 className="font-medium text-gray-900">Shipping Address</h5>
                    </div>
                    {selectedCustomer.shipping_address ? (
                      <div className="text-gray-600 text-sm">
                        {(() => {
                          const addr = typeof selectedCustomer.shipping_address === 'string' 
                            ? JSON.parse(selectedCustomer.shipping_address) 
                            : selectedCustomer.shipping_address;
                          return (
                            <div>
                              {addr.street && <div>{addr.street}</div>}
                              {(addr.city || addr.state || addr.zip) && (
                                <div>{[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}</div>
                              )}
                              {addr.country && <div>{addr.country}</div>}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No shipping address provided</p>
                    )}
                  </div>

                  {/* Billing Address */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">💳</span>
                      <h5 className="font-medium text-gray-900">Billing Address</h5>
                    </div>
                    {selectedCustomer.billing_address ? (
                      <div className="text-gray-600 text-sm">
                        {(() => {
                          const addr = typeof selectedCustomer.billing_address === 'string' 
                            ? JSON.parse(selectedCustomer.billing_address) 
                            : selectedCustomer.billing_address;
                          return (
                            <div>
                              {addr.street && <div>{addr.street}</div>}
                              {(addr.city || addr.state || addr.zip) && (
                                <div>{[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}</div>
                              )}
                              {addr.country && <div>{addr.country}</div>}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No billing address provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              {selectedCustomer.recent_orders && selectedCustomer.recent_orders.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h4>
                  <div className="space-y-3">
                    {selectedCustomer.recent_orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                            {order.payment_method && (
                              <p className="text-xs text-gray-400">via {order.payment_method}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">₹{(order.total_cents / 100).toFixed(2)}</p>
                            <div className="flex gap-1 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                              {order.payment_status && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                  order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.payment_status}
                                </span>
                              )}
                            </div>
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
      )}
      </div>
    </>
  );
};

export default AdminUsers;