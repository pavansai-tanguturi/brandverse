// src/pages/Login.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');
  
  const { user, login, logout } = useAuth();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email);
    
    if (result.success) {
      setOtpSent(true);
      setMessage(result.message);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, otp);
    
    if (result.success) {
      setMessage(result.message);
      // User will be automatically logged in via context
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    setOtpSent(false);
    setEmail('');
    setOtp('');
    setMessage('');
    setError('');
  };

  // If user is logged in, show logout option
  if (user) {
    return (
      <div className="login-container">
        <h2>Welcome back!</h2>
        <div className="login-form">
          <p>Hello, <strong>{user.name || user.email}</strong></p>
          <p>You are successfully logged in.</p>
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: '#dc3545', marginTop: '20px' }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h2>Login with Verification Code</h2>
      
      {!otpSent ? (
        <form className="login-form" onSubmit={handleSendOtp}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending Code...' : 'Send Verification Code'}
          </button>
          
          {/* Signup link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Don't have an account? 
              <Link 
                to="/signup" 
                style={{ 
                  color: '#007bff', 
                  textDecoration: 'none',
                  marginLeft: '5px',
                  fontWeight: 'bold'
                }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <form className="login-form" onSubmit={handleVerifyOtp}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3>Enter Verification Code</h3>
            <p>We've sent a verification code to <strong>{email}</strong></p>
            <p>Enter the code from your email to complete the login process.</p>
          </div>
          
          <label>Verification Code</label>
          <input
            type="text"
            placeholder="Enter the 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength="6"
            style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
          />
          
          <button type="submit" disabled={loading || !otp}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          
          <button 
            type="button" 
            onClick={() => {
              setOtpSent(false);
              setMessage('');
              setError('');
              setOtp('');
            }}
            style={{ marginTop: '10px', backgroundColor: '#666' }}
          >
            Use Different Email
          </button>
          
          {/* Signup link also available here */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Don't have an account? 
              <Link 
                to="/signup" 
                style={{ 
                  color: '#007bff', 
                  textDecoration: 'none',
                  marginLeft: '5px',
                  fontWeight: 'bold'
                }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      )}
      
      {message && <div style={{ color: 'green', marginTop: '10px' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
    </div>
  );
}

export default Login;
