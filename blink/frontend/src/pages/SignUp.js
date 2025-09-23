// Tailwind CSS is now used for styling
// src/pages/SignUp.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../styles/Signup.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [signupComplete, setSignupComplete] = useState(false);
  const [otpStep, setOtpStep] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear errors when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Validate form data before sending
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      console.log('Attempting signup with:', { 
        name: formData.name, 
        email: formData.email 
      });

      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase()
        })
      });

      const data = await response.json();
      console.log('Signup response:', { status: response.status, data });
      
      if (response.ok) {
        setOtpStep(true);
        setMessage(data.message || 'An OTP has been sent to your email. Please enter the 6-digit code to verify.');
      } else {
        // Handle different error cases
        if (response.status === 400) {
          if (data.error && data.error.toLowerCase().includes('already exists')) {
            setError('This email address is already registered. Please use a different email or try logging in.');
          } else if (data.error && data.error.toLowerCase().includes('invalid email')) {
            setError('Please enter a valid email address.');
          } else {
            setError(data.error || 'Invalid input. Please check your details and try again.');
          }
        } else if (response.status === 409) {
          // Conflict - user already exists
          setError('This email address is already registered. Please use a different email or try logging in.');
        } else if (response.status === 422) {
          // Validation error
          setError(data.error || 'Please check your input and try again.');
        } else if (response.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(data.error || 'Signup failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError('Network error. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Validate OTP input
      if (!formData.otp.trim()) {
        setError('Please enter the OTP code');
        setLoading(false);
        return;
      }

      if (formData.otp.trim().length !== 6) {
        setError('OTP must be 6 digits');
        setLoading(false);
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      console.log('Verifying OTP for:', formData.email);

      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: formData.email.trim().toLowerCase(), 
          token: formData.otp.trim(),
          type: 'email'
        })
      });

      const data = await response.json();
      console.log('OTP verification response:', { status: response.status, data });
      
      if (response.ok) {
        setSignupComplete(true);
        
        // Store authentication token if provided
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        if (data.admin) {
          setMessage('Admin account verified! Redirecting to admin dashboard...');
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 2000);
        } else {
          setMessage('Your account is verified! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        // Handle different OTP error cases
        if (response.status === 400) {
          if (data.error && data.error.toLowerCase().includes('expired')) {
            setError('OTP has expired. Please request a new one.');
          } else if (data.error && data.error.toLowerCase().includes('invalid')) {
            setError('Invalid OTP. Please check and try again.');
          } else {
            setError(data.error || 'OTP verification failed');
          }
        } else if (response.status === 404) {
          setError('User not found. Please start the signup process again.');
        } else {
          setError(data.error || 'OTP verification failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError('Network error. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: formData.email.trim().toLowerCase(),
          type: 'email'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('A new OTP has been sent to your email.');
      } else {
        setError(data.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSignupComplete(false);
    setOtpStep(false);
    setFormData({ name: '', email: '', otp: '' });
    setMessage('');
    setError('');
  };

  const goBackToSignup = () => {
    setOtpStep(false);
    setMessage('');
    setError('');
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          {otpStep ? 'Verify Your Email' : 'Customer Sign Up'}
        </h2>
        
        {/* Initial Signup Form */}
        {!signupComplete && !otpStep && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <input 
                type="text" 
                name="name" 
                placeholder="Full Name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <input 
                type="email" 
                name="email" 
                placeholder="Email Address" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending OTP...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Already have an account? 
                <Link to="/login" className="text-blue-600 hover:text-blue-800 underline font-semibold ml-2">
                  Login
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* OTP Verification Form */}
        {otpStep && !signupComplete && (
          <div>
            <p className="text-gray-600 text-center mb-4">
              We've sent a 6-digit code to <strong>{formData.email}</strong>
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  name="otp" 
                  placeholder="Enter 6-digit OTP" 
                  value={formData.otp} 
                  onChange={handleChange} 
                  required 
                  maxLength="6" 
                  className="w-full p-3 border border-gray-300 rounded text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center space-y-3">
              <button 
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-600 hover:text-blue-800 underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Didn't receive the code? Resend OTP
              </button>
              <br />
              <button 
                onClick={goBackToSignup}
                className="text-gray-600 hover:text-gray-800 underline text-sm"
              >
                Change Email Address
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {signupComplete && (
          <div className="text-center p-6">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">🎉 Account Created!</h3>
            <p className="text-gray-600 mb-6">Your account has been successfully verified and created.</p>
            <div className="space-y-3">
              <Link 
                to="/login" 
                className="inline-block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition duration-200"
              >
                Go to Login
              </Link>
              <button 
                onClick={resetForm} 
                className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition duration-200"
              >
                Create Another Account
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-center">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default SignUp;