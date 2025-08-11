// src/pages/Auth.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css'; // Reuse existing styles

function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const endpoint = isSignup ? '/signup' : '/login';
      const payload = isSignup ? formData : { email: formData.email };

      const response = await fetch(`http://localhost:3001${endpoint}`, {
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
          setError(data.error + ' Click Sign Up below.');
        } else {
          setError(data.error);
        }
        return;
      }

      setMessage(data.message);
      // Clear form after successful submission
      setFormData({ email: '', name: '' });

    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user is logged in, show welcome message
  if (user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>Welcome back!</h2>
          <p>Hello, <strong>{user.name || user.email}</strong></p>
          <p>You are successfully logged in to your account.</p>
          
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', marginTop: '20px' }}>
            <button 
              onClick={() => navigate('/logout')}
              className="login-btn"
              style={{ backgroundColor: '#dc3545' }}
            >
              Go to Logout Page
            </button>
            
            <button 
              className="back-btn"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
        
        <form onSubmit={handleSubmit}>
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
            {loading ? 'Processing...' : (isSignup ? 'Send Magic Link (Signup)' : 'Send Magic Link (Login)')}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

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
                setFormData({ email: '', name: '' });
              }}
            >
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>

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
