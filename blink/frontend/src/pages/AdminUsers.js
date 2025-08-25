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
        <div className="max-w-8xl mx-auto p-4 sm:p-6">
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
                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
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
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium text-xs sm:text-sm">
                                {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : customer.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {customer.full_name || 'No name'}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate sm:hidden">
                              {customer.email}
                            </div>
                            <div className="text-xs text-gray-500 hidden sm:block">
                              ID: {customer.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phone || 'No phone'}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.order_count || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-500">orders</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          ₹{((customer.total_spent || 0) / 100).toFixed(2)}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewCustomerDetails(customer.id)}
                          className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm px-2 py-1 rounded hover:bg-blue-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                  </svg>
                </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 mx-auto">
              {/* Fixed Header */}
              <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <span className="text-2xl leading-none">×</span>
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="p-4 sm:p-6">
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
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                      </svg>
                      Address Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Shipping Address */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                          </svg>
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
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                          </svg>
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
          </div>
        )}
      </div>
    </>
  );
};

export default AdminUsers;
