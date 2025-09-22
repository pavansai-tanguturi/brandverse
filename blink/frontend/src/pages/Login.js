// src/pages/Login.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [otpStep, setOtpStep] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      // Use backend login endpoint for consistent flow
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        setOtpStep(true);
        setMessage(data.message || 'OTP sent to your email. Enter the 6-digit code.');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      // Use backend OTP verification for proper session creation
      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email, 
          token: otp,
          type: 'email'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Authentication successful!');
        // Store token and admin status in localStorage
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.admin) {
          localStorage.setItem('is_admin', 'true');
          navigate('/admin/dashboard');
        } else {
          setMessage('Login successful! Refreshing user session...');
          // Refresh the AuthContext to get the new user session
          await refreshUser();
          setMessage('Login successful! Redirecting to home...');
          setTimeout(() => {
            navigate('/home');
          }, 1200);
        }
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Login (OTP Only)</h2>
        {!otpStep ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded" />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Sending OTP...' : 'Send OTP'}</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required maxLength="6" className="w-full p-2 border rounded text-center tracking-widest" />
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">{loading ? 'Verifying...' : 'Verify OTP'}</button>
          </form>
        )}
        {message && <p className="text-green-500 mt-2">{message}</p>}
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <a href="/signup" className="mt-4 text-blue-600 underline block text-center">Don't have an account? Sign Up</a>
      </div>
    </div>
  );
};

export default Login;
