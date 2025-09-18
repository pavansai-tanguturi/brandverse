import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send OTP via backend (consistent with regular users)
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
          setMessage('Admin authentication successful');
          navigate('/admin/dashboard');
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
                cursor: loading ? 'not-allowed' : 'pointer'
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
                onChange={e => setOtp(e.target.value)} 
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
                disabled={loading || !otp}
                style={{
                  width: '100%',
                  backgroundColor: (loading || !otp) ? '#9ca3af' : '#059669',
                  color: 'white',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: (loading || !otp) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
            <button 
              onClick={() => setStep(1)} 
              style={{ 
                marginTop: '1rem', 
                background: 'transparent', 
                color: '#3b82f6',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                width: '100%'
              }}
            >
              ← Back to Email
            </button>
          </div>
        )}
      
        {error && <p style={{ color: '#dc2626', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
        {message && <p style={{ color: '#059669', marginTop: '1rem', textAlign: 'center' }}>{message}</p>}
      </div>
    </div>
  );
};

export default AdminLogin;
