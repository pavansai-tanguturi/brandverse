// src/pages/Login.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [message, setMessage] = useState('');
  
  const { user, login, logout } = useAuth();

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email);
    
    if (result.success) {
      setLinkSent(true);
      setMessage(result.message);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    setLinkSent(false);
    setEmail('');
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
      <h2>Login with Magic Link</h2>
      
      {!linkSent ? (
        <form className="login-form" onSubmit={handleSendMagicLink}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
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
        <div className="login-form">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3>Check your email!</h3>
            <p>We've sent a magic link to <strong>{email}</strong></p>
            <p>Click the link in your email to complete the login process.</p>
          </div>
          <button 
            type="button" 
            onClick={() => {
              setLinkSent(false);
              setMessage('');
              setError('');
            }}
            style={{ marginTop: '20px', backgroundColor: '#666' }}
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
        </div>
      )}
      
      {message && <div style={{ color: 'green', marginTop: '10px' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
    </div>
  );
}

export default Login;
