// src/pages/SignUp.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Signup.css';

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [signupComplete, setSignupComplete] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email, 
          name: formData.name 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Signup failed');
      } else {
        setSignupComplete(true);
        
        if (result.type === 'existing_user_login') {
          setIsExistingUser(true);
          setMessage(`Welcome back! We've sent a magic link to ${formData.email} for login.`);
        } else {
          setIsExistingUser(false);
          setMessage('Account created successfully! Please check your email to confirm your account.');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>

      {!signupComplete ? (
        <form className="signup-form" onSubmit={handleSignup}>
          <label>Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          {/* Login link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Already have an account? 
              <Link 
                to="/login" 
                style={{ 
                  color: '#007bff', 
                  textDecoration: 'none',
                  marginLeft: '5px',
                  fontWeight: 'bold'
                }}
              >
                Login
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <div className="signup-form">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            {isExistingUser ? (
              <>
                <h3>👋 Welcome Back!</h3>
                <p>You already have an account with us.</p>
                <p>We've sent a magic link to <strong>{formData.email}</strong></p>
                <p>Please check your inbox and click the link to login instantly.</p>
              </>
            ) : (
              <>
                <h3>🎉 Account Created!</h3>
                <p>We've sent a confirmation email to <strong>{formData.email}</strong></p>
                <p>Please check your inbox and click the confirmation link to activate your account.</p>
                <p>After confirming, you can use the magic link login.</p>
              </>
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link 
              to="/login" 
              style={{ 
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px'
              }}
            >
              {isExistingUser ? 'Check Email & Login' : 'Go to Login'}
            </Link>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button 
              onClick={() => {
                setSignupComplete(false);
                setIsExistingUser(false);
                setFormData({ name: '', email: '' });
                setMessage('');
                setError('');
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #ccc',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Try Different Email
            </button>
          </div>
        </div>
      )}

      {message && <div style={{ color: 'green', marginTop: '10px' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
    </div>
  );
}

export default SignUp;
