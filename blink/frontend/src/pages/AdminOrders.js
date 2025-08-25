import React, { useState, useEffect } from 'react';
import AdminNav from '../components/AdminNav';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [updatingAction, setUpdatingAction] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [sortByStatus, setSortByStatus] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchOrders = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_BASE;
      const res = await fetch(`${API_BASE}/api/orders/admin`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to fetch orders: ' + err.message);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const statusActions = {
      'accepted': 'accept',
      'packing': 'mark as packing done',
      'ready': 'mark as ready',
      'shipped': 'ship',
      'delivered': 'mark as delivered',
      'cancelled': 'cancel'
    };
    
    const actionText = statusActions[newStatus] || newStatus;
    
    setUpdatingOrder(orderId);
    setUpdatingAction(newStatus);
    setMessage('');
    setError('');
    
    try {
      const API_BASE = process.env.REACT_APP_API_BASE;
      
      const res = await fetch(`${API_BASE}/api/orders/admin/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        setMessage(`Order ${actionText} successfully`);
        await fetchOrders(); // Refresh orders list
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrder(null);
      setUpdatingAction(null);
    }
  };

  const getStatusDisplayName = (status) => {
    const statusNames = {
      pending: 'Pending',
      paid: 'Paid',
      accepted: 'Preparing Package',
      packing: 'Package Ready',
      ready: 'Ready to Ship',
      shipped: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    return statusNames[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-order-pending-100 text-order-pending-800',
      paid: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      packing: 'bg-order-packing-100 text-order-packing-800',
      ready: 'bg-purple-100 text-purple-800',
      shipped: 'bg-order-shipped-100 text-order-shipped-800',
      delivered: 'bg-order-delivered-100 text-order-delivered-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get button styling based on the target status
  const getButtonStyle = (targetStatus, isDisabled) => {
    const buttonStyles = {
      accepted: {
        normal: 'bg-green-500 hover:bg-green-600 text-white border-green-500',
        disabled: 'bg-green-200 text-green-700 border-green-200'
      },
      packing: {
        normal: 'bg-order-packing-500 hover:bg-order-packing-600 text-white border-order-packing-500',
        disabled: 'bg-order-packing-200 text-order-packing-700 border-order-packing-200'
      },
      ready: {
        normal: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500',
        disabled: 'bg-purple-200 text-purple-700 border-purple-200'
      },
      shipped: {
        normal: 'bg-order-shipped-500 hover:bg-order-shipped-600 text-white border-order-shipped-500',
        disabled: 'bg-order-shipped-200 text-order-shipped-700 border-order-shipped-200'
      },
      delivered: {
        normal: 'bg-order-delivered-500 hover:bg-order-delivered-600 text-white border-order-delivered-500',
        disabled: 'bg-order-delivered-200 text-order-delivered-700 border-order-delivered-200'
      },
      cancelled: {
        normal: 'bg-red-500 hover:bg-red-600 text-white border-red-500',
        disabled: 'bg-red-200 text-red-700 border-red-200'
      }
    };

    const style = buttonStyles[targetStatus] || buttonStyles.accepted;
    const baseClasses = 'px-4 py-2 rounded-md text-sm font-medium border-2 transition-all';
    
    if (isDisabled) {
      return `${baseClasses} ${style.disabled} cursor-not-allowed opacity-60`;
    } else {
      return `${baseClasses} ${style.normal} shadow-md hover:shadow-lg`;
    }
  };

  const canAccept = (status) => status === 'pending' || status === 'paid';
  const canReject = (status) => status === 'pending' || status === 'paid';
  const canStartPacking = (status) => status === 'accepted';
  const canMarkReady = (status) => status === 'packing';
  const canShip = (status) => status === 'ready';
  const canDeliver = (status) => status === 'shipped';

  const isButtonLoading = (orderId, action) => {
    return updatingOrder === orderId && updatingAction === action;
  };

  const isButtonDisabled = (orderId) => {
    return updatingOrder === orderId;
  };

  const sortOrdersByStatus = (orders) => {
    const statusPriority = {
      'pending': 1,
      'paid': 2,
      'accepted': 3,
      'packing': 4,
      'ready': 5,
      'shipped': 6,
      'delivered': 7,
      'cancelled': 8,
      'refunded': 9
    };

    return [...orders].sort((a, b) => {
      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, sort by creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-100" style={{ paddingTop: '64px' }}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Manage Orders</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setSortByStatus(!sortByStatus)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortByStatus 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {sortByStatus ? 'Sort by Status ✓' : 'Sort by Date'}
                </button>
                <button
                  onClick={fetchOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

        {/* Enhanced Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800 font-medium">{message}</p>
              <button 
                onClick={() => setMessage('')}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Status Summary */}
        {!loading && orders.length > 0 && sortByStatus && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Order Status Summary:</h3>
            <div className="flex flex-wrap gap-3">
              {['pending', 'paid', 'accepted', 'packing', 'ready', 'shipped', 'delivered'].map(status => {
                const count = orders.filter(order => order.status === status).length;
                if (count === 0) return null;
                return (
                  <div key={status} className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {getStatusDisplayName(status)}: {count}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Order ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Address</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Items</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {(sortByStatus ? sortOrdersByStatus(orders) : orders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))).map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {order.customers ? (
                        <div>
                          <div className="font-medium">{order.customers.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{order.customers.email || ''}</div>
                          {order.customers.phone && (
                            <div className="text-sm text-gray-500">{order.customers.phone}</div>
                          )}
                        </div>
                      ) : (
                        `Customer #${order.customer_id?.slice(0, 8) || 'Unknown'}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="space-y-1">
                        {/* Shipping Address */}
                        {(order.shipping_address || order.customers?.shipping_address) ? (
                          <div className="text-sm">
                            <div className="font-medium text-green-700 mb-1">📦 Shipping:</div>
                            {(() => {
                              const addr = order.shipping_address || order.customers?.shipping_address;
                              return typeof addr === 'string' ? (
                                <div className="text-gray-600">{addr}</div>
                              ) : (
                                <div className="text-gray-600">
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
                          <div className="text-sm text-gray-400">📦 No shipping address</div>
                        )}
                        
                        {/* Billing Address - only show if different from shipping */}
                        {(order.billing_address || order.customers?.billing_address) && 
                         JSON.stringify(order.billing_address || order.customers?.billing_address) !== 
                         JSON.stringify(order.shipping_address || order.customers?.shipping_address) && (
                          <div className="text-sm mt-2 pt-2 border-t border-gray-200">
                            <div className="font-medium text-blue-700 mb-1">💳 Billing:</div>
                            {(() => {
                              const addr = order.billing_address || order.customers?.billing_address;
                              return typeof addr === 'string' ? (
                                <div className="text-gray-600">{addr}</div>
                              ) : (
                                <div className="text-gray-600">
                                  {addr.street && <div>{addr.street}</div>}
                                  {(addr.city || addr.state || addr.zip) && (
                                    <div>{[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}</div>
                                  )}
                                  {addr.country && <div>{addr.country}</div>}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex items-center space-x-2">
                        <span>{order.order_items?.length || 0} items</span>
                        <button
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {expandedOrder === order.id ? 'Hide' : 'View'}
                        </button>
                      </div>
                      {expandedOrder === order.id && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          {order.order_items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between py-1">
                              <span>{item.title}</span>
                              <span>{item.quantity}x ₹{(item.unit_price_cents / 100).toFixed(2)}</span>
                            </div>
                          )) || 'No items'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      ₹{(order.total_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusDisplayName(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {canAccept(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'accepted')}
                            disabled={isButtonDisabled(order.id)}
                            className={getButtonStyle('accepted', isButtonDisabled(order.id))}
                          >
                            {isButtonLoading(order.id, 'accepted') ? 'Accepting...' : 'Accept'}
                          </button>
                        )}
                        
                        {canStartPacking(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'packing')}
                            disabled={isButtonDisabled(order.id)}
                            className={getButtonStyle('packing', isButtonDisabled(order.id))}
                          >
                            {isButtonLoading(order.id, 'packing') ? 'Processing...' : 'Packing Done'}
                          </button>
                        )}
                        
                        {canMarkReady(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            disabled={isButtonDisabled(order.id)}
                            className={getButtonStyle('ready', isButtonDisabled(order.id))}
                          >
                            {isButtonLoading(order.id, 'ready') ? 'Marking...' : 'Mark Ready'}
                          </button>
                        )}
                        
                        {canShip(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            disabled={isButtonDisabled(order.id)}
                            className={getButtonStyle('shipped', isButtonDisabled(order.id))}
                          >
                            {isButtonLoading(order.id, 'shipped') ? 'Shipping...' : 'Out for Shipment'}
                          </button>
                        )}
                        
                        {canDeliver(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            disabled={isButtonDisabled(order.id)}
                            className={getButtonStyle('delivered', isButtonDisabled(order.id))}
                          >
                            {isButtonLoading(order.id, 'delivered') ? 'Marking...' : 'Mark Delivered'}
                          </button>
                        )}
                        
                        {canReject(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            disabled={isButtonDisabled(order.id)}
                            className={getButtonStyle('cancelled', isButtonDisabled(order.id))}
                          >
                            {isButtonLoading(order.id, 'cancelled') ? 'Rejecting...' : 'Reject'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrders;