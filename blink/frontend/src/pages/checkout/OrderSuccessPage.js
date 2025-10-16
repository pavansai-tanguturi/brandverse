// src/pages/OrderSuccessPage.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import MobileBottomNav from "../../components/MobileBottomNav";
import logo from "../../assets/logos.png";
import ModernNavbar from "../../components/ModernNavbar";

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, message, paymentMethod } = location.state || {};
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your order details. Please check your orders or
            contact support.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/dashboard?tab=orders")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Order timeline steps
  const timelineSteps = [
    {
      id: 1,
      title: "Order Placed",
      description: "We've received your order",
      date: new Date(order.created_at).toLocaleDateString(),
      status: "completed",
    },
    {
      id: 2,
      title: "Processing",
      description: "Your order is being processed",
      date: null,
      status: "in-progress",
    },
    {
      id: 3,
      title: "Shipped",
      description: "Your order is on the way",
      date: null,
      status: "pending",
    },
    {
      id: 4,
      title: "Delivered",
      description: "Your order has been delivered",
      date: null,
      status: "pending",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  [
                    "bg-blue-400",
                    "bg-green-400",
                    "bg-yellow-400",
                    "bg-pink-400",
                    "bg-purple-400",
                  ][Math.floor(Math.random() * 5)]
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Header
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center">
            <img src={logo} className="h-10 w-auto" alt="AkepatiMart" />
          </Link>
        </div>
      </header> */}
      <ModernNavbar showSearch={true} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 pb-24">
        {/* Success Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {/* Success Header */}
          <div className="bg-green-600 px-6 py-8 text-center text-white">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-green-100 mb-4">
              {message ||
                "Thank you for your purchase! Your order is confirmed."}
            </p>
            <div className="inline-block bg-white/20 px-4 py-2 rounded-full">
              <p className="font-semibold">Order ID: #{order.id}</p>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="px-6 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Order Status
            </h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
              {timelineSteps.map((step, index) => (
                <div key={step.id} className="relative flex items-start mb-6">
                  <div className="z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === "completed"
                          ? "bg-green-600"
                          : step.status === "in-progress"
                            ? "bg-blue-600"
                            : "bg-gray-200"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : step.status === "in-progress" ? (
                        <svg
                          className="w-5 h-5 text-white"
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
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 pb-6">
                    <h3 className="font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                    {step.date && (
                      <p className="text-gray-500 text-xs mt-1">{step.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="px-6 py-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Order Summary
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium">
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium capitalize">
                  {paymentMethod === "cod" ? "Cash on Delivery" : "UPI Payment"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Payment Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {order.payment_status?.charAt(0).toUpperCase() +
                    order.payment_status?.slice(1) || "Confirmed"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold text-lg text-gray-900">
                  ₹{(order.total_cents / 100).toFixed(2)}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-gray-600 block text-sm mb-1">
                    Transaction ID
                  </span>
                  <span className="font-mono text-sm text-gray-900 break-all">
                    {order.razorpay_payment_id}
                  </span>
                </div>
              )}
            </div>

            {/* Products List */}
            <h3 className="font-semibold text-gray-900 mb-4">
              Your Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <img
                    src={item.image_url || "/placeholder-product.jpg"}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-md mr-4"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ₹{(item.price_cents / 100).toFixed(2)}
                    </p>
                    {item.discount_percent > 0 && (
                      <p className="text-gray-500 text-xs line-through">
                        ₹
                        {(
                          (item.price_cents / 100) *
                          (1 + item.discount_percent / 100)
                        ).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="px-6 py-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Delivery Address
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">
                {order.shipping_address?.name}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {order.shipping_address?.address_line1},{" "}
                {order.shipping_address?.address_line2}
              </p>
              <p className="text-gray-600 text-sm">
                {order.shipping_address?.city}, {order.shipping_address?.state}{" "}
                - {order.shipping_address?.pincode}
              </p>
              <p className="text-gray-600 text-sm">
                Phone: {order.shipping_address?.phone}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-8 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/dashboard?tab=orders")}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                Track Your Order
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition font-medium"
              >
                Continue Shopping
              </button>
            </div>
          </div>

          {/* Support Section */}
          <div className="px-6 py-8 border-t border-gray-200 text-center bg-gray-50 rounded-b-xl">
            <p className="text-gray-700 mb-3">
              Need help? Contact our support team
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() =>
                  (window.location.href = "mailto:subashakepati@gmail.com")
                }
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                Email Support
              </button>
              <p className="text-sm text-gray-500">
                or call us at:{" "}
                <span className="font-medium">+91 XXXXXXXXXX</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
};

export default OrderSuccessPage;
