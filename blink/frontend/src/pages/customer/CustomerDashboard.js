import React, { useState, useEffect, useCallback } from "react";
import ModernNavbar from "../../components/ModernNavbar";
import MobileBottomNav from "../../components/MobileBottomNav";
import AddressManager from "../../components/AddressManager";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useAddress } from "../../context/AddressContext";
import { useNavigate, useLocation } from "react-router-dom";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, getStatusColor, navigate }) => {
  if (!order) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusText = (status, paymentStatus, paymentMethod) => {
    if (paymentStatus === "failed") return "Payment Failed";
    if (paymentStatus === "pending") return "Payment Pending";
    if (paymentStatus === "cod_pending" && paymentMethod === "cod")
      return "COD - Order Confirmed";

    switch (status) {
      case "delivered":
        return "Delivered";
      case "shipped":
        return "Shipped";
      case "confirmed":
        return "Confirmed";
      case "processing":
        return "Processing";
      case "pending":
        return "Pending";
      default:
        return status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Order #{order.id.slice(-8).toUpperCase()}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Order Status */}
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
            <h3 className="font-semibold text-gray-900 mb-3">Order Status</h3>
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={`px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status, order.payment_status)}`}
              >
                {getStatusText(
                  order.status,
                  order.payment_status,
                  order.payment_method,
                )}
              </span>
              {order.payment_method && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Payment Method:</span>
                  <span className="capitalize">
                    {order.payment_method === "cod"
                      ? "Cash on Delivery"
                      : order.payment_method}
                  </span>
                </div>
              )}
              {order.confirmed_at && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Confirmed:</span>
                  <span>{formatDate(order.confirmed_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Items ({order.order_items?.length || 0})
            </h3>
            <div className="space-y-4">
              {order.order_items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-emerald-300 transition-colors"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-semibold text-emerald-600">
                        ₹{((item.unit_price_cents || 0) / 100).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">each</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹
                      {(
                        (item.total_cents ||
                          item.unit_price_cents * item.quantity ||
                          0) / 100
                      ).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <p>No items found for this order</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-gray-50 rounded-xl p-3">
            <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{((order.subtotal_cents || 0) / 100).toFixed(2)}</span>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount:</span>
                  <span>
                    -₹{((order.discount_cents || 0) / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {order.shipping_cents > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>₹{((order.shipping_cents || 0) / 100).toFixed(2)}</span>
                </div>
              )}
              {order.tax_cents > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>₹{((order.tax_cents || 0) / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-emerald-600">
                    ₹{((order.total_cents || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Shipping Address
                </h3>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="font-medium text-gray-900">
                    {order.shipping_address.name}
                  </p>
                  {order.shipping_address.phone && (
                    <p className="text-gray-600 text-sm">
                      {order.shipping_address.phone}
                    </p>
                  )}
                  <div className="text-gray-600 text-sm mt-2 space-y-1">
                    <p>{order.shipping_address.address_line1}</p>
                    {order.shipping_address.address_line2 && (
                      <p>{order.shipping_address.address_line2}</p>
                    )}
                    <p>
                      {order.shipping_address.city},{" "}
                      {order.shipping_address.state}{" "}
                      {order.shipping_address.postal_code}
                    </p>
                    {order.shipping_address.country && (
                      <p>{order.shipping_address.country}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Actions */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
            {order.payment_status === "pending" && (
              <button
                onClick={() => {
                  onClose();
                  navigate("/checkout");
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium cursor-pointer"
              >
                Complete Payment
              </button>
            )}

            {order.status === "delivered" && (
              <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium cursor-pointer">
                Leave Review
              </button>
            )}

            {(order.status === "pending" || order.status === "confirmed") && (
              <button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium cursor-pointer">
                Cancel Order
              </button>
            )}

            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { addresses, fetchAddresses } = useAddress();
  const [activeTab, setActiveTab] = useState("");
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    mobile: "",
    full_name: "",
    phone: "",
  });

  // Dynamic data state
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  // Order details modal state
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Derived: show most recent 3 orders on dashboard
  const recentOrders = orders
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic wishlist from context
  const wishlist = wishlistItems;

  // API Functions
  const fetchUserProfile = useCallback(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const response = await fetch(`${API_BASE}/api/customers/me`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const profileData = await response.json();
        setUserInfo({
          name:
            profileData.full_name ||
            profileData.name ||
            user.email?.split("@")[0] ||
            "User",
          email: profileData.email || user.email || "",
          mobile: profileData.phone || profileData.mobile || "",
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
        });
      } else if (response.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      }
    } catch (err) {
      setError("Failed to load profile data");
    }
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoadingData(true);
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const response = await fetch(`${API_BASE}/api/orders`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData || []);
      } else if (response.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
      } else {
        setError("Failed to load orders");
      }
    } catch (err) {
      setError("Failed to load orders");
    } finally {
      setLoadingData(false);
    }
  };

  const updateUserProfile = async (updatedInfo) => {
    try {
      setUpdating(true);
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

      const profileData = {
        full_name: updatedInfo.name,
        phone: updatedInfo.mobile,
      };

      const response = await fetch(`${API_BASE}/api/customers/me`, {
        method: "PATCH",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        await fetchUserProfile();
        setError("");
        return true;
      } else if (response.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        return false;
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to update profile");
        return false;
      }
    } catch (err) {
      setError("Failed to update profile");
      return false;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchUserProfile();
      fetchOrders();
      try {
        fetchAddresses(user.id);
      } catch (err) {
        // swallow errors here; AddressContext will handle dispatching errors
        console.debug("Failed to fetch addresses on dashboard mount:", err);
      }
    }

    // Check URL parameter for tab
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (
      tabParam &&
      ["orders", "wishlist", "settings", "addresses"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    } else {
      // If no tab parameter or tab parameter is not valid, set to empty (recents view)
      setActiveTab("");
    }
  }, [
    user,
    loading,
    navigate,
    fetchUserProfile,
    fetchAddresses,
    location.search,
  ]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("is_admin");
      await logout();
      navigate("/");
    } catch (error) {}
  };

  const getStatusColor = (status, paymentStatus) => {
    if (paymentStatus === "failed") {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    if (paymentStatus === "pending") {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }

    switch (status) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "paid":
      case "processing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <ModernNavbar showSearch={true} />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ModernNavbar showSearch={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-8">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      {userInfo.name || "User"}
                    </h1>
                    <p className="text-emerald-50 mt-1">{userInfo.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Details Section */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="w-5 h-5 text-emerald-600"
                      viewBox="0 0 16 16"
                    >
                      <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                      <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900">
                      {userInfo.mobile || "Not provided"}
                    </div>
                    <div className="text-sm text-gray-600">Mobile Number</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900">
                      {(() => {
                        const defaultAddress = addresses?.find(
                          (addr) => addr.is_default,
                        );
                        if (!defaultAddress) return "No default address";
                        const addressParts = [
                          defaultAddress.address_line_1,
                          defaultAddress.city,
                          defaultAddress.state,
                        ].filter(Boolean);
                        return addressParts.length > 0
                          ? addressParts.join(", ")
                          : "Address not complete";
                      })()}
                    </div>
                    <div className="text-sm text-gray-600">Default Address</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
            <div className="flex space-x-1 overflow-x-auto">
              {[
                {
                  id: "",
                  name: "Recents",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                  count: recentOrders.length,
                },
                {
                  id: "orders",
                  name: "Orders",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  ),
                  count: orders.length,
                },
                {
                  id: "wishlist",
                  name: "Wishlist",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  ),
                  count: wishlist.length,
                },
                {
                  id: "settings",
                  name: "Settings",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "addresses",
                  name: "Address",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ),
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "orders") {
                      navigate("/orders");
                    } else if (tab.id === "") {
                      setActiveTab("");
                      navigate("/dashboard");
                    } else {
                      setActiveTab(tab.id);
                      navigate(`/dashboard?tab=${tab.id}`);
                    }
                  }}
                  className={`flex-1 min-w-0 flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
                  }`}
                >
                  <div className="flex items-center justify-center relative">
                    {tab.icon}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={`absolute -top-2 -right-2 min-w-[1.25rem] h-5 text-xs font-bold rounded-full flex items-center justify-center ${
                          activeTab === tab.id
                            ? "bg-white/20 text-white"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium mt-1 truncate w-full text-center">
                    {tab.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-24">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white">Dashboard Menu</h2>
              </div>

              <div className="p-6">
                <nav className="space-y-2">
                  {[
                    {
                      id: "",
                      name: "Recent Orders",
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ),
                      count: recentOrders.length,
                    },
                    {
                      id: "orders",
                      name: "My Orders",
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      ),
                      count: orders.length,
                    },
                    {
                      id: "wishlist",
                      name: "Wishlist",
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      ),
                      count: wishlist.length,
                    },
                    {
                      id: "settings",
                      name: "Profile Settings",
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      ),
                    },
                    {
                      id: "addresses",
                      name: "My Addresses",
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      ),
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === "orders") {
                          navigate("/orders");
                        } else if (tab.id === "") {
                          setActiveTab("");
                          navigate("/dashboard");
                        } else {
                          setActiveTab(tab.id);
                          navigate(`/dashboard?tab=${tab.id}`);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-[1.02]"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            activeTab === tab.id
                              ? "bg-white/20"
                              : "bg-emerald-100 group-hover:bg-emerald-200"
                          }`}
                        >
                          {tab.icon}
                        </div>
                        <span className="font-medium">{tab.name}</span>
                      </div>
                      {tab.count !== undefined && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            activeTab === tab.id
                              ? "bg-white/20 text-white"
                              : "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Logout Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-3 p-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all duration-200 font-medium group hover:shadow-md"
                  >
                    <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Content Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {!activeTab && "Recent Orders"}
                    {activeTab === "orders" && "Order History"}
                    {activeTab === "wishlist" && "My Wishlist"}
                    {activeTab === "settings" && "Profile Settings"}
                    {activeTab === "addresses" && "My Addresses"}
                  </h2>
                  {loadingData && (
                    <div className="flex items-center space-x-2 text-emerald-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                      <span className="text-sm font-medium">Loading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders Preview - Only show when no specific tab is active */}
              {!activeTab && (
                <div className="px-6 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recent Orders
                    </h3>
                    <button
                      onClick={() => navigate("/orders")}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      View All Orders
                    </button>
                  </div>

                  {recentOrders.length === 0 ? (
                    <div className="text-sm text-gray-600">
                      No recent orders
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {recentOrders.map((o) => (
                        <div
                          key={o.id}
                          className="p-3 bg-white border border-gray-100 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                Order #{o.id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(o.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                ₹{((o.total_cents || 0) / 100).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {o.order_items?.length || 0} items
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="p-6">
                {/* Orders Tab */}
                {/* {activeTab === "orders" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Order History
                    </h2>
                    {loadingData && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm">
                      {error}
                    </div>
                  )}

                  {!loadingData && orders.length === 0 ? (
                    <div className="text-center py-12">
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
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        No orders yet
                      </h4>
                      <p className="text-gray-600 mb-6">
                        Start shopping to see your orders here
                      </p>
                      <button
                        onClick={() => navigate("/")}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-xl focus:ring-2 focus:ring-emerald-400"
                      >
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 space-y-3 sm:space-y-0"
                        >
                          <div className="flex items-start sm:items-center gap-4">
                            <div className="bg-emerald-100 p-3 rounded-lg">
                              <svg
                                className="w-6 h-6 text-emerald-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                Order #{order.id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  order.created_at,
                                ).toLocaleDateString()}{" "}
                                • {order.order_items?.length || 0} items
                              </p>
                              {order.payment_method && (
                                <p className="text-xs text-gray-500">
                                  Payment:{" "}
                                  {order.payment_method === "cod"
                                    ? "Cash on Delivery"
                                    : order.payment_method}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                            <div className="flex flex-col items-end gap-2 text-center sm:text-right">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  order.status,
                                  order.payment_status,
                                )}`}
                              >
                                {order.payment_status === "failed"
                                  ? "Payment Failed"
                                  : order.payment_status === "pending"
                                    ? "Payment Pending"
                                    : order.payment_status === "cod_pending" &&
                                        order.payment_method === "cod"
                                      ? "COD - Confirmed"
                                      : order.status?.charAt(0).toUpperCase() +
                                          order.status?.slice(1) ||
                                        "Processing"}
                              </span>
                              <p className="font-bold text-gray-900 text-lg">
                                ₹
                                {order.total_cents
                                  ? (order.total_cents / 100).toFixed(2)
                                  : "0.00"}
                              </p>
                            </div>

                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="w-full sm:w-36 px-6 py-2.5 rounded-lg text-white font-medium bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg focus:ring-2 focus:ring-emerald-400"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedOrder && (
                    <OrderDetailsModal
                      order={selectedOrder}
                      onClose={() => setSelectedOrder(null)}
                      getStatusColor={getStatusColor}
                      navigate={navigate}
                    />
                  )}
                </div>
              )} */}

                {activeTab === "wishlist" && (
                  <div>
                    {wishlist.length > 0 ? (
                      <div className="divide-y divide-gray-200 border border-gray-100 rounded-2xl overflow-hidden">
                        {wishlist.map((item) => {
                          const discountedPrice =
                            item.discount_percent > 0
                              ? (item.price_cents / 100) *
                                (1 - item.discount_percent / 100)
                              : item.price_cents / 100;

                          return (
                            <div
                              key={item.id}
                              className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 hover:bg-gray-50 transition-all duration-300"
                            >
                              {/* Left: Image + Title */}
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div
                                  className="relative w-20 h-20 flex-shrink-0 cursor-pointer group"
                                  onClick={() =>
                                    navigate(`/product/${item.id}`)
                                  }
                                >
                                  <img
                                    src={
                                      item.image_url ||
                                      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=300&q=80"
                                    }
                                    alt={item.title}
                                    className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                  />
                                  {item.discount_percent > 0 && (
                                    <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                                      -{item.discount_percent}%
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col justify-center">
                                  <h3
                                    className="text-base font-semibold text-gray-900 hover:text-emerald-600 cursor-pointer line-clamp-2"
                                    onClick={() =>
                                      navigate(`/product/${item.id}`)
                                    }
                                  >
                                    {item.title}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    {item.discount_percent > 0 ? (
                                      <>
                                        <span className="text-lg font-bold text-emerald-600">
                                          ₹{discountedPrice.toFixed(2)}
                                        </span>
                                        <span className="text-sm text-gray-400 line-through">
                                          ₹{(item.price_cents / 100).toFixed(2)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-lg font-bold text-emerald-600">
                                        ₹{(item.price_cents / 100).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Actions */}
                              <div className="flex items-center justify-between w-full mt-2 sm:mt-0 px-1">
                                {/* Add to Cart */}
                                <button
                                  className={`p-2 rounded-lg ${
                                    item.stock_quantity > 0
                                      ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                      : "text-gray-400 cursor-not-allowed"
                                  }`}
                                  disabled={item.stock_quantity <= 0}
                                  onClick={async () => {
                                    if (item.stock_quantity > 0) {
                                      try {
                                        await addToCart(item, 1);
                                      } catch (error) {
                                        // handle error
                                      }
                                    }
                                  }}
                                  title={
                                    item.stock_quantity > 0
                                      ? "Add to Cart"
                                      : "Out of Stock"
                                  }
                                >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z"
                ></path>
              </g>
            </svg>
                                </button>

                                {/* View Details */}
                                <button
                                  className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                  title="View Details"
                                  onClick={() =>
                                    navigate(`/product/${item.id}`)
                                  }
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                </button>

                                {/* Remove */}
                                <button
                                  className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Remove from Wishlist"
                                  onClick={() => {
                                    removeFromWishlist(item.id);
                                  }}
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 4h6a1 1 0 011 1v2H8V5a1 1 0 011-1z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center shadow-md">
                          <svg
                            className="w-10 h-10 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Your wishlist is empty
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Browse our collection and add your favorite items!
                        </p>
                        <button
                          onClick={() => navigate("/")}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 shadow-md transition"
                        >
                          Start Shopping
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Settings Tab */}
                {activeTab === "settings" && (
                  <div className="space-y-8">
                    {error && (
                      <div className="bg-rose-50 border-l-4 border-rose-400 text-rose-700 px-6 py-4 rounded-xl shadow-sm">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {error}
                        </div>
                      </div>
                    )}

                    {/* Profile Form */}
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <span className="truncate">Personal Information</span>
                      </h3>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          await updateUserProfile(userInfo);
                        }}
                        className="space-y-4 sm:space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
                              <svg
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={userInfo.name}
                              onChange={(e) =>
                                setUserInfo({
                                  ...userInfo,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white"
                              required
                              placeholder="Enter your full name"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
                              <svg
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={userInfo.email}
                              disabled
                              className="w-full px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 flex items-start sm:items-center">
                              <svg
                                className="w-3 h-3 mr-1 mt-0.5 sm:mt-0 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>
                                Email cannot be changed for security reasons
                              </span>
                            </p>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
                              <svg
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              Mobile Number
                            </label>
                            <input
                              type="tel"
                              value={userInfo.mobile}
                              onChange={(e) =>
                                setUserInfo({
                                  ...userInfo,
                                  mobile: e.target.value,
                                })
                              }
                              className="w-full px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white"
                              placeholder="Enter your mobile number"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-200">
                          <button
                            type="submit"
                            disabled={updating}
                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <svg
                              className="w-4 h-4 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                              />
                            </svg>
                            <span className="truncate">
                              {updating ? "Updating..." : "Save Changes"}
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Addresses Tab */}
                {activeTab === "addresses" && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      My Addresses
                    </h2>
                    <AddressManager />
                  </div>
                )}
              </div>
            </div>
            {/* Mobile Sign Out Button */}
            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="
                  w-full flex items-center justify-center space-x-3 p-4
                  text-rose-600 hover:text-rose-700
                  bg-white hover:bg-rose-50
                  rounded-xl
                  transition-all duration-200
                  font-medium group
                  border border-rose-200 hover:border-rose-300
                "
              >
                <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default CustomerDashboard;
