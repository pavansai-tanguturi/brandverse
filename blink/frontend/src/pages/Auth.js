// src/pages/Auth.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Reuse existing styles

function Auth() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1); // 1: email form, 2: OTP verification
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    otp: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = { email: formData.email, name: formData.name };
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.userExists === true && isSignup) {
          // User exists but trying to signup
          setError(data.error + ' Click Login below.');
        } else if (data.userExists === false && !isSignup) {
          // User doesn't exist but trying to login  
          setError(data.error);
          setTimeout(() => navigate('/signup'), 1500); // Redirect to signup page after showing error
        } else {
          setError(data.error);
        }
        return;
      }

      setMessage(data.message);
      setStep(2); // Move to OTP verification step

    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: formData.email, 
          token: formData.otp,
          type: 'magiclink'
        })
      });
      const data = await response.json();
      const token = data.token;
      if (response.ok) {
        // Store token in localStorage for admin access
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        setMessage(data.message || 'Authentication successful');
        // Only allow admin dashboard navigation if backend confirms admin
        if (data.admin === true) {
          try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
            await fetch(`${API_BASE_URL}/api/auth/refresh-session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
          } catch (e) {
            console.warn('Session refresh failed:', e);
          }
          navigate('/admin/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email,
          type: isSignup ? 'signup' : 'login' // Send correct type based on current flow
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - start countdown
          const retryAfter = data.retryAfter || 45;
          setError(`${data.error} (${retryAfter}s remaining)`);
          startCountdown(retryAfter);
        } else {
          setError(data.error);
        }
        return;
      }

      setMessage(data.message);
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown function for rate limiting
  const startCountdown = (seconds) => {
    setResendCountdown(seconds);
    setResendDisabled(true);
    
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          setError('');
          return 0;
        }
        setError(`Please wait ${prev - 1} more seconds before requesting another code.`);
        return prev - 1;
      });
    }, 1000);
  };

  const resetForm = () => {
    setStep(1);
    setFormData({ email: '', name: '', otp: '' });
    setMessage('');
    setError('');
  };

  // If user is logged in, show welcome message
  // if (user) {
  //   return (
  //     <div className="login-container">
  //       <div className="login-box">
  //         <h2>Welcome back!</h2>
  //         <p>Hello, <strong>{user.name || user.email}</strong></p>
  //         <p>You are successfully logged in to your account.</p>
          
  //         <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', marginTop: '20px' }}>
  //           <button 
  //             onClick={() => navigate('/logout')}
  //             className="login-btn"
  //             style={{ backgroundColor: '#dc3545' }}
  //           >
  //             Go to Logout Page
  //           </button>
            
  //           <button 
  //             className="back-btn"
  //             onClick={() => navigate('/')}
  //           >
  //             Back to Home
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
        
        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : 'inactive'}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : 'inactive'}`}>2</div>
        </div>
        
        {step === 1 ? (
          // Step 1: Email and Name Form
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>

            {isSignup && (
              <div className="form-group">
                <label htmlFor="name">Full Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Sending Code...' : (isSignup ? 'Send Verification Code (Signup)' : 'Send Verification Code (Login)')}
            </button>
          </form>
        ) : (
          // Step 2: OTP Verification Form
          <div>
            <div className="otp-verification-box">
              <h3>Enter Verification Code</h3>
              <p>We've sent a 6-digit verification code to:</p>
              <p><strong>{formData.email}</strong></p>
            </div>

            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label htmlFor="otp">Verification Code:</label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                  maxLength="6"
                  placeholder="000000"
                  className="otp-input"
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading || !formData.otp}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button 
                type="button" 
                onClick={handleResendOtp}
                className="back-btn"
                disabled={loading || resendDisabled}
                style={{ flex: 1 }}
              >
                {loading ? 'Sending...' : 
                 resendCountdown > 0 ? `Wait ${resendCountdown}s` : 
                 '↻ Resend Code'}
              </button>

              <button 
                type="button" 
                onClick={resetForm}
                className="back-btn"
                style={{ flex: 1 }}
              >
                ← Use Different Email
              </button>
            </div>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        {step === 1 && (
          <div className="auth-switch">
            <p>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
              <button 
                type="button" 
                className="switch-btn"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setMessage('');
                  setFormData({ email: '', name: '', otp: '' });
                }}
              >
                {isSignup ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </div>
        )}

        <button 
          className="back-btn"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default Auth;
