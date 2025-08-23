// src/pages/Login.js

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/Login.css';

const Login = () => {
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
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setError(error.message);
      } else {
        setOtpStep(true);
        setMessage('OTP sent to your email. Enter the 6-digit code.');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'magiclink',
          });
          if (error) {
            setError(error.message);
          } else {
            const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
            // store access token for admin dashboard calls if available
            const accessToken = data?.session?.access_token || data?.access_token || null;
            if (accessToken) {
              try { localStorage.setItem('adminToken', accessToken); } catch (e) { /* ignore */ }
            }
            const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
            if (adminEmail && email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
              // create server session by email so backend recognizes admin via session
              try {
                await fetch(`${API_BASE}/api/auth/session-from-email`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ email })
                });
              } catch (err) {
                // ignore — we'll still redirect but admin routes may be restricted if session not created
              }
              window.location.href = '/admin/dashboard';
            } else {
              setMessage('Login successful!');
              setTimeout(() => {
                window.location.href = '/';
              }, 1200);
            }
      }
    } catch (err) {
      setError('Network error');
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
