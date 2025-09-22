import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkExistingAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Optionally verify the token is still valid
        verifyExistingToken(token);
      }
    };
    
    checkExistingAuth();
  }, []);

  // Helper function to verify existing token
  const verifyExistingToken = async (token) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.admin) {
          navigate('/admin/dashboard');
        }
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      // Token verification failed, remove it
      localStorage.removeItem('auth_token');
      console.error('Token verification failed:', err);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.isAdmin) {
          setMessage('Admin OTP sent to your email. Please check and enter the verification code.');
        } else {
          setMessage('OTP sent to your email. Please check and enter the verification code.');
        }
        setStep(2);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP request error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email, 
          token: otp,
          type: 'magiclink'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.admin) {
          // Store the authentication token
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
            setMessage('Admin authentication successful');
            
            // Navigate to dashboard after a brief delay to show success message
            setTimeout(() => {
              navigate('/admin/dashboard');
            }, 1000);
          } else {
            setError('Authentication successful but no token received. Please try again.');
          }
        } else {
          setError('Access denied. Admin privileges required.');
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

  // Helper function to handle logout (clear token)
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setStep(1);
    setEmail('');
    setOtp('');
    setError('');
    setMessage('');
  };

  // Helper function to go back to email step
  const handleBackToEmail = () => {
    setStep(1);
    setOtp('');
    setError('');
    setMessage('');
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6' 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        width: '100%', 
        maxWidth: '400px' 
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem', 
          textAlign: 'center', 
          color: '#1f2937' 
        }}>
          Admin Login (OTP)
        </h2>
      
        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="email" 
              placeholder="Admin Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <div>
            <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280' }}>
              Verification code sent to: <strong style={{ color: '#1f2937' }}>{email}</strong>
            </p>
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Enter 6-digit code" 
                value={otp} 
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} // Only allow digits, max 6
                maxLength="6"
                required 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '18px',
                  textAlign: 'center',
                  letterSpacing: '0.1em'
                }}
              />
              <button 
                type="submit" 
                disabled={loading || !otp || otp.length !== 6}
                style={{
                  width: '100%',
                  backgroundColor: (loading || !otp || otp.length !== 6) ? '#9ca3af' : '#059669',
                  color: 'white',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: (loading || !otp || otp.length !== 6) ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                onClick={handleBackToEmail} 
                disabled={loading}
                style={{ 
                  flex: 1,
                  background: 'transparent', 
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: loading ? 0.5 : 1
                }}
              >
                ← Back to Email
              </button>
              
              <button 
                onClick={() => handleSendOtp({ preventDefault: () => {} })} 
                disabled={loading}
                style={{ 
                  flex: 1,
                  background: 'transparent', 
                  color: '#059669',
                  border: '1px solid #059669',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: loading ? 0.5 : 1
                }}
              >
                Resend Code
              </button>
            </div>
          </div>
        )}
      
        {error && (
          <div style={{ 
            color: '#dc2626', 
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '0.75rem',
            marginTop: '1rem', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        {message && (
          <div style={{ 
            color: '#059669', 
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            padding: '0.75rem',
            marginTop: '1rem', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.5rem', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <p>Current token: {localStorage.getItem('auth_token') ? 'Present' : 'Not found'}</p>
            <p>Step: {step}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;