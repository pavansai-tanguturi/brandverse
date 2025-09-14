import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { items, getCartTotal, getCartSubtotal, getTotalDiscount, clearCart } = useCart();
  const navigate = useNavigate();

  // Helper function to calculate discounted price for an item
  const getItemDiscountedPrice = (item) => {
    if (item.discount_percent > 0) {
      return item.price_cents * (1 - item.discount_percent / 100);
    }
    return item.price_cents;
  };

  const [step, setStep] = useState(1); // 1: Review, 2: Address, 3: Payment
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: user?.full_name || user?.name || '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    landmark: '',
    type: 'both', // Default to 'both' for shipping and billing
    is_default: true
  });
  // const [orderData, setOrderData] = useState(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE}/api/addresses`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        const defaultAddr = data.find(addr => addr.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr);
      } else if (response.status === 401) {
        console.error('User not authenticated for addresses');
        // User not authenticated, redirect to login
        navigate('/login');
      } else {
        console.error('Failed to fetch addresses:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchAddresses();
  }, [user, items, navigate, fetchAddresses]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/api/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newAddress)
      });

      if (response.ok) {
        const address = await response.json();
        setAddresses(prev => [address, ...prev]);
        setSelectedAddress(address);
        setShowAddressForm(false);
        setNewAddress({
          full_name: '',
          phone: '',
          address_line_1: '',
          address_line_2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'India',
          landmark: '',
          type: 'both',
          is_default: true
        });
      } else if (response.status === 401) {
        console.error('User not authenticated for address creation');
        navigate('/login');
      } else {
        try {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to create address');
        } catch {
          setError(`Failed to create address (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error creating address:', error);
      setError('Failed to create address');
    } finally {
      setLoading(false);
    }
  };

  const createOrderAndPayment = async () => {
    try {
      setLoading(true);
      setError('');
      
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      // Create order with Razorpay
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          shipping_cents: 0,
          tax_cents: 0,
          discount_cents: 0,
          payment_method: 'razorpay',
          create_razorpay_order: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await response.json();

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      // Configure Razorpay options
      const options = {
        key: order.razorpay_key_id,
        amount: order.total_cents,
        currency: 'INR',
        name: 'Brandverse',
        description: `Order #${order.id}`,
        order_id: order.razorpay_order_id,
        handler: async function (response) {
          await handlePaymentSuccess(response, order.id);
        },
        prefill: {
          name: user.name || user.email?.split('@')[0] || '',
          email: user.email || '',
          contact: selectedAddress?.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setError('Payment was cancelled. You can retry the payment.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Order creation error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse, orderId) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/api/orders/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          order_id: orderId
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Clear cart and redirect to success page
        clearCart();
        navigate('/order-success', { 
          state: { 
            order: result.order,
            message: result.message 
          } 
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment confirmation failed');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setError(`Payment successful but confirmation failed: ${error.message}. Please contact support.`);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  if (!user || items.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingTop: '80px' }}>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your order and complete payment</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-0.5 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-16 text-sm text-gray-600">
              <span>Review</span>
              <span>Address</span>
              <span>Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Step 1: Review Items */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Review Your Order</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 py-4 border-b">
                      <img 
                        src={item.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=100&q=80'} 
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-gray-500">Quantity: {item.quantity}</p>
                        {item.discount_percent > 0 ? (
                          <div className="space-y-1">
                            <p className="text-gray-500">
                              Price: ₹{(getItemDiscountedPrice(item) / 100).toFixed(2)} each
                              <span className="ml-2 text-xs text-gray-400 line-through">₹{(item.price_cents / 100).toFixed(2)}</span>
                            </p>
                            <p className="text-green-600 text-sm">
                              Save ₹{((item.price_cents - getItemDiscountedPrice(item)) / 100).toFixed(2)} ({item.discount_percent}% off)
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500">Price: ₹{(item.price_cents / 100).toFixed(2)} each</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{((getItemDiscountedPrice(item) / 100) * item.quantity).toFixed(2)}</p>
                        {item.discount_percent > 0 && (
                          <p className="text-xs text-gray-400 line-through">₹{((item.price_cents / 100) * item.quantity).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to Address
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Delivery Address */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                
                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddress?.id === address.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{address.full_name}</p>
                            <p className="text-gray-600">{address.address_line_1}</p>
                            {address.address_line_2 && <p className="text-gray-600">{address.address_line_2}</p>}
                            <p className="text-gray-600">
                              {address.city}, {address.state} {address.postal_code}
                            </p>
                            <p className="text-gray-600">{address.phone}</p>
                          </div>
                          <input
                            type="radio"
                            name="selectedAddress"
                            checked={selectedAddress?.id === address.id}
                            onChange={() => setSelectedAddress(address)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        + Add New Address
                      </button>
                    </div>

                    {showAddressForm && (
                      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                          <h3 className="text-lg font-medium mb-4">Add New Address</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.full_name}
                                onChange={(e) => setNewAddress(prev => ({...prev, full_name: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                required
                                value={newAddress.phone}
                                onChange={(e) => setNewAddress(prev => ({...prev, phone: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.address_line_1}
                              onChange={(e) => setNewAddress(prev => ({...prev, address_line_1: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Line 2 (Optional)
                            </label>
                            <input
                              type="text"
                              value={newAddress.address_line_2}
                              onChange={(e) => setNewAddress(prev => ({...prev, address_line_2: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.city}
                                onChange={(e) => setNewAddress(prev => ({...prev, city: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                State *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.state}
                                onChange={(e) => setNewAddress(prev => ({...prev, state: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postal Code *
                              </label>
                              <input
                                type="text"
                                required
                                value={newAddress.postal_code}
                                onChange={(e) => setNewAddress(prev => ({...prev, postal_code: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Landmark (Optional)
                            </label>
                            <input
                              type="text"
                              value={newAddress.landmark}
                              onChange={(e) => setNewAddress(prev => ({...prev, landmark: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="flex justify-between pt-4">
                            <button
                              type="button"
                              onClick={() => setShowAddressForm(false)}
                              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              {loading ? 'Adding...' : 'Add Address'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {!showAddressForm ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No addresses found. Please add a delivery address.</p>
                        <button
                          onClick={() => setShowAddressForm(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add New Address
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <h3 className="text-lg font-medium mb-4">Add New Address</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.full_name}
                              onChange={(e) => setNewAddress(prev => ({...prev, full_name: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress(prev => ({...prev, phone: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 1 *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddress.address_line_1}
                            onChange={(e) => setNewAddress(prev => ({...prev, address_line_1: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 2 (Optional)
                          </label>
                          <input
                            type="text"
                            value={newAddress.address_line_2}
                            onChange={(e) => setNewAddress(prev => ({...prev, address_line_2: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.city}
                              onChange={(e) => setNewAddress(prev => ({...prev, city: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.state}
                              onChange={(e) => setNewAddress(prev => ({...prev, state: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Postal Code *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.postal_code}
                              onChange={(e) => setNewAddress(prev => ({...prev, postal_code: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Landmark (Optional)
                          </label>
                          <input
                            type="text"
                            value={newAddress.landmark}
                            onChange={(e) => setNewAddress(prev => ({...prev, landmark: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(false)}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {loading ? 'Adding...' : 'Add Address'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
                
                {selectedAddress && addresses.length > 0 && (
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Payment</h2>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Razorpay</p>
                        <p className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking, Wallets</p>
                      </div>
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Delivery Address:</h3>
                  <p className="text-sm text-gray-600">
                    {selectedAddress?.full_name}<br/>
                    {selectedAddress?.address_line_1}<br/>
                    {selectedAddress?.address_line_2 && `${selectedAddress.address_line_2}, `}
                    {selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.postal_code}<br/>
                    Phone: {selectedAddress?.phone}
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    onClick={createOrderAndPayment}
                    disabled={loading || !selectedAddress}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : `Pay ₹${(getCartTotal() / 100).toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items):</span>
                  <span>₹{(getCartSubtotal() / 100).toFixed(2)}</span>
                </div>
                {getTotalDiscount() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{(getTotalDiscount() / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₹0.00</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>₹{(getCartTotal() / 100).toFixed(2)}</span>
                </div>
                {getTotalDiscount() > 0 && (
                  <div className="text-green-600 text-sm text-right">
                    You saved ₹{(getTotalDiscount() / 100).toFixed(2)}!
                  </div>
                )}
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                  <span>Secure checkout powered by Razorpay</span>
                </div>
                <p className="text-center">Your payment information is encrypted and secure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
