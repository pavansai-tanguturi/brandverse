import React, { useState, useEffect } from "react";
import AdminNav from "../../components/admin/AdminNav";
import AddressDisplay from "../../components/admin/AddressDisplay";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [updatingAction, setUpdatingAction] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [sortByStatus, setSortByStatus] = useState(true);
  const [deliveryLocations, setDeliveryLocations] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(25);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Get JWT token for admin API calls
  const getAuthToken = () => {
    return localStorage.getItem("auth_token");
  };

  // Helper function to get authorization headers
  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  // Fetch orders on mount and when searchQuery changes
  useEffect(() => {
    fetchOrders(typeof searchQuery === "string" ? searchQuery : "");
    fetchDeliveryLocations();
    // eslint-disable-next-line
  }, [searchQuery]);

  // Set filteredOrders directly from orders (backend already filters)
  useEffect(() => {
    setFilteredOrders(orders);
    setCurrentPage(1);
  }, [orders]);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchOrders = async (search) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const searchStr = typeof search === "string" ? search : "";
      const url = searchStr.trim()
        ? `${API_BASE}/api/orders/admin?search=${encodeURIComponent(searchStr.trim())}`
        : `${API_BASE}/api/orders/admin`;

      const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setError(""); // Clear any previous errors
      } else if (res.status === 401) {
        setError("Authentication failed. Please login again.");
        // Optionally redirect to login page
        // window.location.href = '/admin/login';
      } else {
        throw new Error(`Failed to fetch orders: ${res.status}`);
      }
    } catch (err) {
      setError("Failed to fetch orders: " + err.message);
    }
    setLoading(false);
  };

  const fetchDeliveryLocations = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const res = await fetch(`${API_BASE}/api/delivery/locations`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setDeliveryLocations(data.deliveryLocations || []);
      }
    } catch (err) {
      console.error("Failed to fetch delivery locations:", err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // Check if token exists
    const token = getAuthToken();
    if (!token) {
      setError("Authentication token missing. Please login again.");
      return;
    }

    const statusActions = {
      accepted: "accept",
      packing: "mark as packing done",
      ready: "mark as ready",
      shipped: "ship",
      delivered: "mark as delivered",
      cancelled: "cancel",
    };

    const actionText = statusActions[newStatus] || newStatus;

    setUpdatingOrder(orderId);
    setUpdatingAction(newStatus);
    setMessage("");
    setError("");

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

      const res = await fetch(
        `${API_BASE}/api/orders/admin/${orderId}/status`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (res.ok) {
        setMessage(`Order ${actionText} successfully`);
        await fetchOrders(searchQuery); // Refresh orders list
      } else if (res.status === 401) {
        setError("Authentication failed. Please login again.");
        // Optionally redirect to login page
        // window.location.href = '/admin/login';
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update order status");
      }
    } catch (err) {
      setError(err.message || "Failed to update order status");
    } finally {
      setUpdatingOrder(null);
      setUpdatingAction(null);
    }
  };

  const getStatusDisplayName = (status) => {
    const statusNames = {
      pending: "Pending",
      paid: "Paid",
      confirmed: "Confirmed (COD)",
      accepted: "Preparing Package",
      packing: "Package Ready",
      ready: "Ready to Ship",
      shipped: "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };
    return (
      statusNames[status] || status.charAt(0).toUpperCase() + status.slice(1)
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-order-pending-100 text-order-pending-800",
      paid: "bg-blue-100 text-blue-800",
      confirmed: "bg-emerald-100 text-emerald-800", // Special color for COD confirmed orders
      accepted: "bg-green-100 text-green-800",
      packing: "bg-order-packing-100 text-order-packing-800",
      ready: "bg-purple-100 text-purple-800",
      shipped: "bg-order-shipped-100 text-order-shipped-800",
      delivered: "bg-order-delivered-100 text-order-delivered-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Get button styling based on the target status
  const getButtonStyle = (targetStatus, isDisabled) => {
    const buttonStyles = {
      accepted: {
        normal: "bg-green-500 hover:bg-green-600 text-white border-green-500",
        disabled: "bg-green-200 text-green-700 border-green-200",
      },
      packing: {
        normal:
          "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500",
        disabled: "bg-yellow-200 text-yellow-700 border-yellow-200",
      },
      ready: {
        normal:
          "bg-purple-500 hover:bg-purple-600 text-white border-purple-500",
        disabled: "bg-purple-200 text-purple-700 border-purple-200",
      },
      shipped: {
        normal: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500",
        disabled: "bg-blue-200 text-blue-700 border-blue-200",
      },
      delivered: {
        normal: "bg-green-500 hover:bg-green-600 text-white border-green-500",
        disabled: "bg-green-200 text-green-700 border-green-200",
      },
      cancelled: {
        normal: "bg-red-500 hover:bg-red-600 text-white border-red-500",
        disabled: "bg-red-200 text-red-700 border-red-200",
      },
    };

    const style = buttonStyles[targetStatus] || buttonStyles.accepted;
    const baseClasses =
      "px-4 py-2 rounded-md text-sm font-medium border-2 transition-all";

    if (isDisabled) {
      return `${baseClasses} ${style.disabled} cursor-not-allowed opacity-60`;
    } else {
      return `${baseClasses} ${style.normal} shadow-md hover:shadow-lg`;
    }
  };

  // Helper function to check if delivery is restricted for an order
  const isDeliveryRestricted = (order) => {
    const addr = order.shipping_address || order.customers?.shipping_address;
    if (!addr) return false;

    let country = "";
    if (typeof addr === "string") {
      const parts = addr.split(",");
      country = parts[parts.length - 1].trim().toLowerCase();
    } else if (addr && addr.country) {
      country = addr.country.trim().toLowerCase();
    }

    if (!country) return false;

    // Check if the country is in our allowed delivery locations
    const isAllowed = deliveryLocations.some(
      (location) =>
        location.is_active && location.country.toLowerCase() === country,
    );

    return !isAllowed;
  };

  const canAccept = (status) => status === "pending" || status === "paid";
  const canReject = (status) => status === "pending" || status === "paid";
  const canStartPacking = (status) =>
    status === "accepted" || status === "confirmed"; // COD orders go directly to confirmed
  const canMarkReady = (status) => status === "packing";
  const canShip = (status) => status === "ready";
  const canDeliver = (status) => status === "shipped";

  const isButtonLoading = (orderId, action) => {
    return updatingOrder === orderId && updatingAction === action;
  };

  const isButtonDisabled = (orderId) => {
    return updatingOrder === orderId;
  };

  const sortOrdersByStatus = (orders) => {
    const statusPriority = {
      pending: 1,
      paid: 2,
      confirmed: 3, // COD orders - ready for packing
      accepted: 4,
      packing: 5,
      ready: 6,
      shipped: 7,
      delivered: 8,
      cancelled: 9,
      refunded: 10,
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

  // Pagination logic
  const getCurrentOrders = () => {
    const ordersToShow = sortByStatus
      ? sortOrdersByStatus(filteredOrders)
      : filteredOrders
          .slice()
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    return ordersToShow.slice(indexOfFirstOrder, indexOfLastOrder);
  };

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedOrder(null); // Close any expanded order when changing pages
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-50" style={{ paddingTop: "64px" }}>
        <div className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage customer orders
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSortByStatus(!sortByStatus)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortByStatus
                      ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    ></path>
                  </svg>
                  {sortByStatus ? "Sort by Status ✓" : "Sort by Date"}
                </button>
                <button
                  onClick={() => {
                    setLoading(true);
                    fetchOrders(searchQuery);
                  }}
                  className={`inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 text-white rounded-lg font-medium transition-all duration-200 shadow-sm ${loading ? "opacity-80" : ""}`}
                  disabled={loading}
                >
                  <svg
                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer Name, or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      className="h-5 w-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <span className="bg-gray-100 px-3 py-2 rounded-lg">
                  {searchQuery
                    ? `${filteredOrders.length} results`
                    : `${orders.length} total orders`}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-green-800 font-medium">{message}</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => setMessage("")}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => setError("")}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Summary */}
          {!loading && filteredOrders.length > 0 && sortByStatus && (
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Order Status Summary:
              </h3>
              <div className="flex flex-wrap gap-3">
                {[
                  "pending",
                  "paid",
                  "confirmed",
                  "accepted",
                  "packing",
                  "ready",
                  "shipped",
                  "delivered",
                ].map((status) => {
                  const count = filteredOrders.filter(
                    (order) => order.status === status,
                  ).length;
                  if (count === 0) return null;
                  return (
                    <div
                      key={status}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(status)} shadow-sm`}
                    >
                      {getStatusDisplayName(status)}: {count}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orders List */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading orders...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "No orders found" : "No orders yet"}
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? "Try adjusting your search terms."
                    : "Orders will appear here when customers place them."}
                </p>
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCurrentOrders().map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {order.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {order.customers ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.customers.full_name || "Unknown"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.customers.email || ""}
                              </div>
                              {order.customers.phone && (
                                <div className="text-sm text-gray-500">
                                  {order.customers.phone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">{`Customer #${order.customer_id?.slice(0, 8) || "Unknown"}`}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {/* Shipping Address */}
                            <div className="text-sm">
                              <div className="text-green-700 mb-1 text-xs font-medium uppercase tracking-wide">
                                Shipping
                              </div>
                              <AddressDisplay
                                address={
                                  order.shipping_address ||
                                  order.customers?.shipping_address
                                }
                                type="shipping"
                                showLabel={false}
                                className="text-xs"
                              />
                            </div>
                            {/* Delivery Restriction Message */}
                            {isDeliveryRestricted(order) && (
                              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs font-semibold flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M18.364 5.636l-1.414-1.414A9 9 0 105.636 18.364l1.414 1.414A9 9 0 1018.364 5.636z"
                                  />
                                </svg>
                                Currently not delivering to this location
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {order.order_items?.length || 0} items
                            </span>
                            <button
                              onClick={() =>
                                setExpandedOrder(
                                  expandedOrder === order.id ? null : order.id,
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                            >
                              {expandedOrder === order.id ? "Hide" : "View"}
                            </button>
                          </div>
                          {expandedOrder === order.id && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm border">
                              <div className="font-medium text-gray-700 mb-2">
                                Order Items:
                              </div>
                              {order.order_items?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between py-1 border-b border-gray-200 last:border-0"
                                >
                                  <span className="text-gray-900">
                                    {item.title}
                                  </span>
                                  <span className="text-gray-600 font-medium">
                                    {item.quantity}x ₹
                                    {(item.unit_price_cents / 100).toFixed(2)}
                                  </span>
                                </div>
                              )) || (
                                <span className="text-gray-500">No items</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            ₹{(order.total_cents / 100).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                            >
                              {getStatusDisplayName(order.status)}
                            </span>
                            {/* Payment Method Indicator */}
                            {order.payment_method && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                                  order.payment_method === "cod"
                                    ? "bg-orange-100 text-orange-800"
                                    : order.payment_method === "razorpay"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {order.payment_method === "cod" && (
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z"
                                      clipRule="evenodd"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      d="M8 9a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                {order.payment_method === "razorpay" && (
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                    <path
                                      fillRule="evenodd"
                                      d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                {order.payment_method.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const isRestricted = isDeliveryRestricted(order);
                            return (
                              <div className="flex flex-wrap gap-2">
                                {canAccept(order.status) && (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "accepted")
                                    }
                                    disabled={
                                      isButtonDisabled(order.id) || isRestricted
                                    }
                                    className={getButtonStyle(
                                      "accepted",
                                      isButtonDisabled(order.id) ||
                                        isRestricted,
                                    )}
                                  >
                                    {isButtonLoading(order.id, "accepted")
                                      ? "Accepting..."
                                      : "Accept"}
                                  </button>
                                )}
                                {canStartPacking(order.status) && (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "packing")
                                    }
                                    disabled={
                                      isButtonDisabled(order.id) || isRestricted
                                    }
                                    className={getButtonStyle(
                                      "packing",
                                      isButtonDisabled(order.id) ||
                                        isRestricted,
                                    )}
                                  >
                                    {isButtonLoading(order.id, "packing")
                                      ? "Processing..."
                                      : "Packing Done"}
                                  </button>
                                )}
                                {canMarkReady(order.status) && (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "ready")
                                    }
                                    disabled={
                                      isButtonDisabled(order.id) || isRestricted
                                    }
                                    className={getButtonStyle(
                                      "ready",
                                      isButtonDisabled(order.id) ||
                                        isRestricted,
                                    )}
                                  >
                                    {isButtonLoading(order.id, "ready")
                                      ? "Marking..."
                                      : "Mark Ready"}
                                  </button>
                                )}
                                {canShip(order.status) && (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "shipped")
                                    }
                                    disabled={
                                      isButtonDisabled(order.id) || isRestricted
                                    }
                                    className={getButtonStyle(
                                      "shipped",
                                      isButtonDisabled(order.id) ||
                                        isRestricted,
                                    )}
                                  >
                                    {isButtonLoading(order.id, "shipped")
                                      ? "Shipping..."
                                      : "Out for Shipment"}
                                  </button>
                                )}
                                {canDeliver(order.status) && (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "delivered")
                                    }
                                    disabled={
                                      isButtonDisabled(order.id) || isRestricted
                                    }
                                    className={getButtonStyle(
                                      "delivered",
                                      isButtonDisabled(order.id) ||
                                        isRestricted,
                                    )}
                                  >
                                    {isButtonLoading(order.id, "delivered")
                                      ? "Marking..."
                                      : "Mark Delivered"}
                                  </button>
                                )}
                                {canReject(order.status) && (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "cancelled")
                                    }
                                    disabled={
                                      isButtonDisabled(order.id) || isRestricted
                                    }
                                    className={getButtonStyle(
                                      "cancelled",
                                      isButtonDisabled(order.id) ||
                                        isRestricted,
                                    )}
                                  >
                                    {isButtonLoading(order.id, "cancelled")
                                      ? "Rejecting..."
                                      : "Reject"}
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(currentPage - 1) * ordersPerPage + 1} to{" "}
                      {Math.min(
                        currentPage * ordersPerPage,
                        filteredOrders.length,
                      )}{" "}
                      of {filteredOrders.length} orders
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 19l-7-7 7-7"
                          ></path>
                        </svg>
                        Previous
                      </button>

                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const pageNum =
                              Math.max(
                                1,
                                Math.min(totalPages - 4, currentPage - 2),
                              ) + i;
                            if (pageNum > totalPages) return null;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="px-2 text-gray-500">...</span>
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminOrders;
