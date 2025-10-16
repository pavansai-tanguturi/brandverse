import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import MobileBottomNav from "../../components/MobileBottomNav";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import logo from "../../assets/logos.png";

// Utility function for authenticated API calls
const makeAuthenticatedRequest = async (url, options = {}) => {
  let token = localStorage.getItem("auth_token");
  if (!token && typeof document !== "undefined") {
    const match = document.cookie.match(/auth_token=([^;]+)/);
    if (match) token = match[1];
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
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
    removeFromCart,
  } = useCart();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outOfStockItem, setOutOfStockItem] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [newAddress, setNewAddress] = useState({
    full_name: user?.full_name || user?.name || "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    landmark: "",
    type: "both",
    is_default: true,
  });

  const fetchAddresses = useCallback(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
      const response = await makeAuthenticatedRequest(
        `${API_BASE}/api/addresses`,
      );

      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        const defaultAddr = data.find((addr) => addr.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr);
      } else if (response.status === 401) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  }, [navigate]);

  const validateCart = () => {
    if (items.length === 0) {
      return { valid: false, issues: [{ issue: "Cart is empty" }] };
    }

    const issues = [];
    items.forEach((item) => {
      if (item.stock_quantity !== undefined && item.stock_quantity <= 0) {
        issues.push({ issue: `${item.title} is out of stock` });
      }
    });

    return { valid: issues.length === 0, issues };
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (items.length === 0) {
      navigate("/cart");
      return;
    }
    fetchAddresses();
  }, [user, items, navigate, fetchAddresses]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

      const response = await makeAuthenticatedRequest(
        `${API_BASE}/api/addresses`,
        {
          method: "POST",
          body: JSON.stringify(newAddress),
        },
      );

      if (response.ok) {
        const address = await response.json();
        setAddresses((prev) => [address, ...prev]);
        setSelectedAddress(address);
        setShowAddressForm(false);
        setNewAddress({
          full_name: user?.full_name || user?.name || "",
          phone: "",
          address_line_1: "",
          address_line_2: "",
          city: "",
          state: "",
          postal_code: "",
          country: "India",
          landmark: "",
          type: "both",
          is_default: true,
        });
      } else if (response.status === 401) {
        navigate("/login");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create address");
      }
    } catch (error) {
      console.error("Error creating address:", error);
      setError("Failed to create address");
    } finally {
      setLoading(false);
    }
  };

  const ensureServerCartSync = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

      // Clear existing server cart first
      try {
        await makeAuthenticatedRequest(`${API_BASE}/api/cart/clear`, {
          method: "POST",
        });
      } catch (clearError) {
        console.warn("Failed to clear server cart:", clearError);
      }

      // Add all current items to server cart
      for (const item of items) {
        const addResponse = await makeAuthenticatedRequest(
          `${API_BASE}/api/cart/add`,
          {
            method: "POST",
            body: JSON.stringify({
              product_id: item.id,
              quantity: item.quantity,
            }),
          },
        );

        if (!addResponse.ok) {
          const errorData = await addResponse.json();
          throw new Error(`Failed to sync ${item.title} to server cart`);
        }
      }

      return true;
    } catch (syncError) {
      console.error("Server cart sync failed:", syncError);
      return false;
    }
  };

  const handleRemoveOutOfStockItem = async () => {
    if (!outOfStockItem?.item?.id) return;

    try {
      setLoading(true);
      await removeFromCart(outOfStockItem.item.id);
      setError("");
      setOutOfStockItem(null);
      setError(
        `"${outOfStockItem.name}" has been removed from your cart. You can now proceed with checkout.`,
      );
      setTimeout(() => setError(""), 3000);
    } catch (error) {
      console.error("Failed to remove out-of-stock item:", error);
      setError("Failed to remove item from cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId, title) => {
    try {
      setRemovingId(productId);
      await removeFromCart(productId);
      setError(`"${title}" removed from your bag.`);
      setTimeout(() => setError(""), 2000);
    } catch (err) {
      console.error("Failed to remove item:", err);
      setError("Failed to remove item. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const createCODOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

      const validation = validateCart();
      if (!validation.valid) {
        throw new Error(
          "Cart contains invalid items. Please review your cart.",
        );
      }

      const syncSuccess = await ensureServerCartSync();
      if (!syncSuccess) {
        console.warn("Proceeding without server cart sync");
      }

      const response = await makeAuthenticatedRequest(
        `${API_BASE}/api/orders`,
        {
          method: "POST",
          body: JSON.stringify({
            payment_method: paymentMethod, // Use selected payment method
            shipping_address: selectedAddress
              ? {
                  full_name: selectedAddress.full_name,
                  phone: selectedAddress.phone,
                  address_line_1: selectedAddress.address_line_1,
                  address_line_2: selectedAddress.address_line_2,
                  city: selectedAddress.city,
                  state: selectedAddress.state,
                  postal_code: selectedAddress.postal_code,
                  country: selectedAddress.country,
                  landmark: selectedAddress.landmark,
                  type: selectedAddress.type || "both",
                }
              : null,
            cart_items: items.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
              unit_price_cents:
                item.discount_percent > 0
                  ? Math.round(
                      item.price_cents * (1 - item.discount_percent / 100),
                    )
                  : item.price_cents,
            })),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.code === "DELIVERY_UNAVAILABLE") {
          setError(
            `${errorData.message || "Delivery not available to your location"}\n\nPlease contact us or try a different address.`,
          );
          return;
        }

        if (errorData.error && errorData.error.includes("Insufficient stock")) {
          const productName =
            errorData.item?.title ||
            errorData.error.split("for ")[1] ||
            "a product";
          const available = errorData.available || 0;
          const required = errorData.required || 0;

          setOutOfStockItem({
            name: productName,
            available,
            required,
            item: errorData.item,
          });

          setError(
            `Sorry, "${productName}" is out of stock or has insufficient quantity. Available: ${available}, Required: ${required}. Please update your cart and try again.`,
          );
          return;
        }

        throw new Error(errorData.error || "Failed to create order");
      }

      const order = await response.json();

      console.log("Order created successfully:", order);

      // Clear cart immediately after successful order creation
      clearCart();

      // Handle different payment methods
      if (paymentMethod === "cod") {
        // Try to confirm COD order
        try {
          const confirmResponse = await makeAuthenticatedRequest(
            `${API_BASE}/api/orders/${order.id}/confirm-cod`,
            {
              method: "POST",
            },
          );

          if (confirmResponse.ok) {
            const result = await confirmResponse.json();
            console.log("COD order confirmed:", result);
            navigate("/order-success", {
              state: {
                order: result.order || order,
                message:
                  "Order placed successfully! You can pay cash on delivery.",
                paymentMethod: "cod",
              },
            });
            return;
          } else {
            console.warn("COD confirmation failed, but order was created");
          }
        } catch (confirmError) {
          console.warn(
            "COD confirmation endpoint not available:",
            confirmError,
          );
        }

        // Fallback: Navigate to success even if confirmation fails
        navigate("/order-success", {
          state: {
            order: order,
            message: "Order placed successfully! You can pay cash on delivery.",
            paymentMethod: "cod",
          },
        });
        return;
      } else if (paymentMethod === "upi") {
        // For UPI, redirect to order success with UPI payment instructions
        navigate("/order-success", {
          state: {
            order: order,
            message:
              "Order placed successfully! Complete the UPI payment to confirm.",
            paymentMethod: "upi",
          },
        });
        return;
      }
    } catch (error) {
      console.error("Order creation error:", error);
      setError(error.message || "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) {
    return null;
  }

  const validation = validateCart();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-emerald-600 text-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center space-x-3 cursor-pointer">
              <img
                src={logo}
                className="h-10 w-auto object-contain"
                alt="Logo"
              />
            </Link>

            {/* Progress Steps - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {[
                { num: 1, label: "Bag", icon: "🛍️" },
                { num: 2, label: "Address", icon: "📍" },
                { num: 3, label: "Payment", icon: "💳" },
              ].map((item, idx) => (
                <React.Fragment key={item.num}>
                  <div className="flex items-center">
                    <div
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-all ${
                        step >= item.num
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-gray-50 text-gray-400 border border-gray-200"
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${
                          step === item.num ? "scale-110" : ""
                        }`}
                      >
                        {item.num}
                      </span>
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  </div>
                  {idx < 2 && (
                    <div
                      className={`w-12 h-0.5 ${
                        step > item.num ? "bg-emerald-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <p className="text-gray-500 text-xs">Secure Checkout</p>
                <p className="text-gray-900 font-semibold">
                  ₹{(getCartTotal() / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Progress */}
      <div className="md:hidden bg-white py-2 shadow-sm mt-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex-1 relative">
              <div
                className={`h-1 mx-auto ${
                  step >= num ? "bg-emerald-500" : "bg-gray-200"
                }`}
                style={{ width: "100%" }}
              />
              <p
                className={`text-xs mt-1 text-center ${
                  step >= num ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {num === 1 ? "Bag" : num === 2 ? "Address" : "Payment"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Review Items */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 mb-6">
                    <svg
                      className="w-6 h-6 text-emerald-600"
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
                    <span>
                      Your Bag ({items.length}{" "}
                      {items.length === 1 ? "Item" : "Items"})
                    </span>
                  </h2>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-emerald-600 font-semibold">
                              ₹
                              {(item.discount_percent > 0
                                ? ((item.price_cents || 0) *
                                    (1 - item.discount_percent / 100)) /
                                  100
                                : (item.price_cents || 0) / 100
                              ).toFixed(2)}
                            </span>
                            {item.discount_percent > 0 && (
                              <span className="text-gray-400 line-through text-xs">
                                ₹{((item.price_cents || 0) / 100).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-gray-600 text-xs">
                              Qty: {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleRemoveItem(item.id, item.title)
                              }
                              className="text-red-500 hover:text-red-700 text-xs flex items-center"
                            >
                              <svg
                                className="w-3.5 h-3.5 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!validation.valid}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                    >
                      Continue to Address
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Delivery Address
                </h2>
                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedAddress?.id === address.id
                            ? "border-emerald-500 bg-emerald-50 shadow-sm"
                            : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {address.full_name}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              {address.address_line_1}, {address.address_line_2}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {address.city}, {address.state}{" "}
                              {address.postal_code}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              {address.phone}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-4 ${
                              selectedAddress?.id === address.id
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-300"
                            }`}
                          >
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
                        className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center justify-center space-x-2"
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
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span>Add New Address</span>
                      </button>
                    </div>
                    {showAddressForm && (
                      <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                        <form
                          onSubmit={handleAddressSubmit}
                          className="space-y-4"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Add New Address
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.full_name}
                                onChange={(e) =>
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    full_name: e.target.value,
                                  }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                required
                                value={newAddress.phone}
                                onChange={(e) =>
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    phone: e.target.value,
                                  }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.address_line_1}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  address_line_1: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address Line 2 (Optional)
                            </label>
                            <input
                              type="text"
                              value={newAddress.address_line_2}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  address_line_2: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                City *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.city}
                                onChange={(e) =>
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    city: e.target.value,
                                  }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                State *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.state}
                                onChange={(e) =>
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    state: e.target.value,
                                  }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Postal Code *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.postal_code}
                                onChange={(e) =>
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    postal_code: e.target.value,
                                  }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Landmark (Optional)
                            </label>
                            <input
                              type="text"
                              value={newAddress.landmark}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  landmark: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="flex justify-end space-x-3 mt-6">
                            <button
                              type="button"
                              onClick={() => setShowAddressForm(false)}
                              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50"
                            >
                              {loading ? "Adding..." : "Add Address"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Back to Bag
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        disabled={!selectedAddress}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      No addresses found. Please add a delivery address.
                    </p>
                    <div className="max-w-2xl mx-auto">
                      <form
                        onSubmit={handleAddressSubmit}
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Add New Address
                        </h3>
                        {/* Address form fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.full_name}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  full_name: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              value={newAddress.phone}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Line 1 *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddress.address_line_1}
                            onChange={(e) =>
                              setNewAddress((prev) => ({
                                ...prev,
                                address_line_1: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Line 2 (Optional)
                          </label>
                          <input
                            type="text"
                            value={newAddress.address_line_2}
                            onChange={(e) =>
                              setNewAddress((prev) => ({
                                ...prev,
                                address_line_2: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.city}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  city: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.state}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  state: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Postal Code *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.postal_code}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  postal_code: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Landmark (Optional)
                          </label>
                          <input
                            type="text"
                            value={newAddress.landmark}
                            onChange={(e) =>
                              setNewAddress((prev) => ({
                                ...prev,
                                landmark: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50"
                          >
                            {loading ? "Adding..." : "Add Address & Continue"}
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span>Choose Payment Method</span>
                </h2>
                <div className="space-y-4">
                  {/* Cash on Delivery Option */}
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      paymentMethod === "cod"
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "cod"
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-gray-300"
                          }`}
                        >
                          {paymentMethod === "cod" && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Cash on Delivery
                          </p>
                          <p className="text-sm text-gray-600">
                            Pay with cash when the order is delivered to your
                            doorstep
                          </p>
                        </div>
                      </div>
                      <div className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-bold">
                        Popular
                      </div>
                    </div>
                  </div>
                  {/* UPI Payment Option */}
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      paymentMethod === "upi"
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "upi"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {paymentMethod === "upi" && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            UPI Payment
                          </p>
                          <p className="text-sm text-gray-600">
                            Pay instantly using Google Pay, PhonePe, Paytm &
                            more
                          </p>
                        </div>
                      </div>
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                        Fast
                      </div>
                    </div>
                  </div>
                  {/* Payment Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 font-medium">
                          {paymentMethod === "cod"
                            ? "Keep exact change ready for a smooth delivery experience"
                            : "You will receive UPI payment details after placing the order"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Order Summary */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Order Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Price ({items.length} items)
                      </span>
                      <span className="font-semibold">
                        ₹{(getCartSubtotal() / 100).toFixed(2)}
                      </span>
                    </div>
                    {getTotalDiscount() > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-₹{(getTotalDiscount() / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Charges</span>
                      <span className="font-semibold text-emerald-600">
                        FREE
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="font-bold text-gray-900">
                        Total Amount
                      </span>
                      <span className="text-xl font-bold text-emerald-600">
                        ₹{(getCartTotal() / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Back to Address
                  </button>
                  <button
                    onClick={createCODOrder}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50"
                  >
                    {loading ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Price Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Price ({items.length} items)
                  </span>
                  <span className="font-semibold">
                    ₹{(getCartSubtotal() / 100).toFixed(2)}
                  </span>
                </div>
                {getTotalDiscount() > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-₹{(getTotalDiscount() / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charges</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 line-through text-xs">
                      ₹40
                    </span>
                    <span className="font-bold text-emerald-600">FREE</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-emerald-600">
                    ₹{(getCartTotal() / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              {getTotalDiscount() > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-6">
                  <p className="text-sm text-emerald-800 font-semibold flex items-center">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    You will save ₹{(getTotalDiscount() / 100).toFixed(2)} on
                    this order
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default CheckoutPage;
