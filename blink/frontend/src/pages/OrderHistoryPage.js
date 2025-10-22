import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ModernNavbar from "../components/ModernNavbar";
import MobileBottomNav from "../components/MobileBottomNav";

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`${API_BASE}/api/orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
      case "paid":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "pending":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "processing":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "shipped":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "delivered":
        return "text-green-700 bg-green-50 border-green-200";
      case "cancelled":
      case "failed":
        return "text-rose-600 bg-rose-50 border-rose-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case "paid":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "cod_pending":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "pending":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "failed":
        return "text-rose-600 bg-rose-50 border-rose-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "shipped":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        );
      case "processing":
        return (
          <svg
            className="w-4 h-4"
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
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const toggleOrderItems = (orderId) => {
    setExpandedOrders((prev) => {
      const newState = {
        ...prev,
        [orderId]: !prev[orderId],
      };
      return newState;
    });
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "all") return true;
    return order.status === activeFilter;
  });

  const orderFilters = [
    { key: "all", label: "All Orders", count: orders.length },
    {
      key: "pending",
      label: "Pending",
      count: orders.filter((o) => o.status === "pending").length,
    },
    {
      key: "processing",
      label: "Processing",
      count: orders.filter((o) => o.status === "processing").length,
    },
    {
      key: "shipped",
      label: "Shipped",
      count: orders.filter((o) => o.status === "shipped").length,
    },
    {
      key: "delivered",
      label: "Delivered",
      count: orders.filter((o) => o.status === "delivered").length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: orders.filter((o) => o.status === "cancelled").length,
    },
  ];

  if (!user) {
    return (
      <>
        <ModernNavbar showSearch={true} />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-24 px-4 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Login Required
              </h1>
              <p className="text-gray-600 mb-6">
                Please login to view your order history and track your orders.
              </p>
              <button
                onClick={() => (window.location.href = "/login")}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Login to Continue
              </button>
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  return (
    <>
      <ModernNavbar showSearch={true} />

      {/* Back Navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-8 px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Orders
                </h1>
                <p className="text-gray-600">
                  Track and manage all your orders in one place
                </p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 relative">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-800 font-semibold">Filter Orders</h3>

              {/* Dropdown Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-200"
              >
                <span>
                  {orderFilters.find((f) => f.key === activeFilter)?.label ||
                    "Select Filter"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-4 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 animate-fadeIn">
                {orderFilters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => {
                      setActiveFilter(filter.key);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 flex justify-between items-center rounded-lg transition-all duration-150 ${
                      activeFilter === filter.key
                        ? "bg-emerald-100 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        activeFilter === filter.key
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <div className="flex items-center space-x-2 text-rose-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">Loading your orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {activeFilter === "all"
                  ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                  : `No ${activeFilter} orders found.`}
              </p>
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  {/* Compact Order Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-emerald-50 p-2 rounded-lg">
                          <svg
                            className="w-4 h-4 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">
                          ₹{(order.total_cents / 100).toFixed(2)}
                        </p>
                        <div className="flex gap-1 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compact Progress Tracker */}
                  <div className="px-4 py-3 bg-gray-50">
                    {(() => {
                      const steps = [
                        "placed",
                        "confirmed",
                        "processing",
                        "shipped",
                        "delivered",
                      ];
                      const currentStepIndex = (() => {
                        switch (order.status) {
                          case "pending":
                            return 0;
                          case "confirmed":
                            return 1;
                          case "processing":
                            return 2;
                          case "shipped":
                            return 3;
                          case "delivered":
                            return 4;
                          default:
                            return 0;
                        }
                      })();

                      if (
                        order.status === "cancelled" ||
                        order.payment_status === "failed"
                      ) {
                        return (
                          <div className="flex items-center justify-center py-2">
                            <span className="text-red-600 text-xs font-medium">
                              {order.payment_status === "failed"
                                ? "Payment Failed"
                                : "Order Cancelled"}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-center justify-between">
                          {steps.map((step, index) => (
                            <div
                              key={step}
                              className="flex flex-col items-center flex-1 relative"
                            >
                              {index < steps.length - 1 && (
                                <div
                                  className={`absolute top-2 left-1/2 w-full h-0.5 ${
                                    index < currentStepIndex
                                      ? "bg-emerald-400"
                                      : "bg-gray-300"
                                  }`}
                                  style={{
                                    left: "50%",
                                    right: "-50%",
                                    zIndex: 1,
                                  }}
                                />
                              )}
                              <div
                                className={`relative z-10 w-4 h-4 rounded-full border-2 ${
                                  index <= currentStepIndex
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "bg-white border-gray-300"
                                }`}
                              />
                              <span
                                className={`text-xs mt-1 ${
                                  index <= currentStepIndex
                                    ? "text-emerald-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {step === "placed"
                                  ? "Placed"
                                  : step === "confirmed"
                                    ? "Confirmed"
                                    : step === "processing"
                                      ? "Processing"
                                      : step === "shipped"
                                        ? "Shipped"
                                        : "Delivered"}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Compact Order Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => toggleOrderItems(order.id)}
                          className="flex items-center gap-2 font-medium text-gray-900 text-sm hover:text-emerald-600 transition-colors"
                        >
                          <span>Items ({order.order_items.length})</span>
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              expandedOrders[order.id] ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        <span className="text-xs text-gray-500">
                          {order.payment_method === "cod"
                            ? "Cash on Delivery"
                            : "Online Payment"}
                        </span>
                      </div>

                      {/* Conditional rendering based on expandedOrders state */}
                      {expandedOrders[order.id] && (
                        <div className="space-y-2 animate-fadeIn">
                          {order.order_items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt={item.title}
                                      className="w-6 h-6 object-cover rounded"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                          "block";
                                      }}
                                    />
                                  ) : null}
                                  <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{
                                      display: item.image_url
                                        ? "none"
                                        : "block",
                                    }}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm leading-tight break-words">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Qty: {item.quantity} × ₹
                                    {(item.unit_price_cents / 100).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <p className="font-semibold text-gray-900 text-sm">
                                ₹{(item.total_cents / 100).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Delivery Estimate for active orders */}
                      {order.status !== "delivered" &&
                        order.status !== "cancelled" &&
                        order.payment_status !== "failed" && (
                          <div className="mt-3 p-2 bg-emerald-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-3 h-3 text-emerald-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-xs text-emerald-700">
                                Est. delivery:{" "}
                                {(() => {
                                  const orderDate = new Date(order.created_at);
                                  const estimatedDays =
                                    order.payment_method === "cod" ? 5 : 3;
                                  const estimatedDelivery = new Date(orderDate);
                                  estimatedDelivery.setDate(
                                    orderDate.getDate() + estimatedDays,
                                  );
                                  return estimatedDelivery.toLocaleDateString(
                                    "en-IN",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    },
                                  );
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
};

export default OrderHistoryPage;
