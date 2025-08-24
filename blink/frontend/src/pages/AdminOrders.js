import React, { useState, useEffect } from 'react';
import AdminNav from '../components/AdminNav';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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
    if (!window.confirm(`Are you sure you want to ${newStatus} this order?`)) return;
    
    setUpdatingOrder(orderId);
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
        setMessage(`Order ${newStatus} successfully`);
        await fetchOrders(); // Refresh orders list
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canAccept = (status) => status === 'pending' || status === 'paid';
  const canReject = (status) => status === 'pending' || status === 'paid';

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      
      <div className="max-w-7xl mx-auto mt-8 p-6 bg-white rounded shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Orders</h2>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Refresh
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
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
                {orders.map((order) => (
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
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {canAccept(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            disabled={updatingOrder === order.id}
                            className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm ${updatingOrder === order.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {updatingOrder === order.id ? 'Accepting...' : 'Accept'}
                          </button>
                        )}
                        {canReject(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            disabled={updatingOrder === order.id}
                            className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm ${updatingOrder === order.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {updatingOrder === order.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            disabled={updatingOrder === order.id}
                            className={`bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm ${updatingOrder === order.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {updatingOrder === order.id ? 'Marking...' : 'Mark Delivered'}
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
  );
};

export default AdminOrders;
