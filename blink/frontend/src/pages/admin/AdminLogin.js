import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

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
      // Send OTP via Supabase
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      setMessage('OTP sent to your email. Please check and enter the verification code.');
      setStep(2);
    } catch (err) {
      console.error('OTP request error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/verify-otp', {
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
        setMessage('Admin authentication successful');
        navigate('/admin/dashboard');
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
    <div className="admin-login-container">
      <h2>Admin Login</h2>
      
      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <input 
            type="email" 
            placeholder="Admin Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending Code...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <div>
          <p>Verification code sent to: <strong>{email}</strong></p>
          <form onSubmit={handleVerifyOtp}>
            <input 
              type="text" 
              placeholder="Enter 6-digit code" 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              maxLength="6"
              required 
            />
            <button type="submit" disabled={loading || !otp}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
          <button 
            onClick={() => setStep(1)} 
            style={{ marginTop: '10px', background: 'transparent', color: '#007bff' }}
          >
            ← Back to Email
          </button>
        </div>
      )}
      
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </div>
  );
};

export default AdminLogin;
