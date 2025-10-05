import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import MobileBottomNav from '../../components/MobileBottomNav';
import logo from '../../assets/logos.png';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, message, paymentMethod } = location.state || {};
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 shadow-2xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <Link to="/" className="flex items-center space-x-3">
                <img
                  src={logo}
                  className="h-12 w-auto object-contain rounded-lg"
                  alt="AkepatiMart"
                />
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find your order details. Please check your orders or contact support.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/dashboard?tab=orders')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all shadow-lg font-semibold"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all font-semibold"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
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
              <div className={`w-2 h-2 rounded-full ${
                ['bg-emerald-400', 'bg-teal-400', 'bg-yellow-400', 'bg-pink-400', 'bg-blue-400'][Math.floor(Math.random() * 5)]
              }`} />
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 shadow-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src={logo}
                className="h-12 w-auto object-contain rounded-lg"
                alt="AkepatiMart"
              />
            </Link>
            
            <div className="text-white text-right hidden sm:block">
              <p className="text-sm text-emerald-100">Thank you for shopping at</p>
              <p className="font-bold text-lg">AkepatiMart</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 pb-24">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100">
          
          {/* Success Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 sm:px-8 py-8 sm:py-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              {/* Success Icon with Animation */}
              <div className="mb-6 inline-block">
                <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
                🎉 Order Placed Successfully! 🎉
              </h1>
              
              <p className="text-emerald-50 text-base sm:text-lg mb-2 max-w-2xl mx-auto leading-relaxed">
                {message || 'Thank you for choosing AkepatiMart! Your order has been confirmed and is being processed.'}
              </p>
              
              <div className="inline-block bg-white/20 backdrop-blur-md rounded-full px-6 py-2 mt-4">
                <p className="text-white font-semibold text-sm sm:text-base">
                  Order ID: #{order.id}
                </p>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-20 translate-y-20"></div>
          </div>

          {/* Order Details */}
          <div className="p-6 sm:p-8">
            
            {/* Payment Method Badge */}
            {paymentMethod && (
              <div className="mb-6 text-center">
                <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full ${
                  paymentMethod === 'cod' 
                    ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-300' 
                    : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300'
                }`}>
                  <svg className={`w-5 h-5 ${paymentMethod === 'cod' ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {paymentMethod === 'cod' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    )}
                  </svg>
                  <span className={`font-bold ${paymentMethod === 'cod' ? 'text-emerald-700' : 'text-blue-700'}`}>
                    Payment Method: {paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment'}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 sm:p-8 mb-6 border border-emerald-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Order Summary
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <span className="text-gray-600 block mb-1">Order ID</span>
                  <span className="font-bold text-gray-900 text-lg">#{order.id}</span>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <span className="text-gray-600 block mb-1">Order Date</span>
                  <span className="font-bold text-gray-900">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <span className="text-gray-600 block mb-1">Payment Status</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Confirmed'}
                  </span>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <span className="text-gray-600 block mb-1">Total Amount</span>
                  <span className="font-bold text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    ₹{(order.total_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {order.razorpay_payment_id && (
                <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                  <span className="text-gray-600 block mb-1 text-sm">Transaction ID</span>
                  <span className="font-mono text-xs sm:text-sm text-gray-900 break-all">{order.razorpay_payment_id}</span>
                </div>
              )}
            </div>

            {/* What's Next */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 mb-6 border border-blue-200">
              <h3 className="font-bold text-xl text-blue-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What Happens Next?
              </h3>
              <ul className="space-y-3">
                {[
                  { icon: '📧', text: 'You will receive an order confirmation email shortly' },
                  { icon: '📦', text: 'Your order will be processed within 1-2 business days' },
                  { icon: '🚚', text: "You'll get tracking information once your order ships" },
                  { icon: '📍', text: 'Estimated delivery: 3-7 business days' },
                  ...(paymentMethod === 'upi' ? [{ icon: '💳', text: 'Complete UPI payment using the details sent to your email' }] : [])
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3 text-blue-900">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <span className="text-sm sm:text-base leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={() => navigate('/dashboard?tab=orders')}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-bold text-base sm:text-lg flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Track Your Order</span>
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-4 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all font-bold text-base sm:text-lg flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Continue Shopping</span>
              </button>
            </div>

            {/* Contact Support */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
              <p className="text-gray-700 mb-3 font-medium">Need help with your order?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button 
                  onClick={() => window.location.href = 'mailto:subashakepati@gmail.com'}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg transition-all shadow-md font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email Support</span>
                </button>
                <p className="text-sm text-gray-500">or call us at: <span className="font-semibold text-gray-700">+91 XXXXXXXXXX</span></p>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="mt-8 text-center">
              <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Thank you for shopping with AkepatiMart!
              </p>
              <p className="text-gray-600 text-sm sm:text-base">
                We appreciate your trust and look forward to serving you again.
              </p>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />

      {/* Custom CSS for confetti animation */}
      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        
        .animate-fall {
          animation: fall linear infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default OrderSuccessPage;
