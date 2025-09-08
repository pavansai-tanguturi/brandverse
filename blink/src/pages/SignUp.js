// src/pages/SignUp.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Signup.css';

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [signupComplete, setSignupComplete] = useState(false);

  const { signup } = useAuth();

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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const result = await signup(formData.email, formData.name, formData.password);

      if (result.success) {
        setSignupComplete(true);
        setMessage(result.message);
      } else {
        setError(result.error || 'Signup failed');
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

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />

          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength="6"
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
            <h3>🎉 Account Created!</h3>
            <p>Your account has been successfully created.</p>
            <p>You can now login with your email and password.</p>
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
              Go to Login
            </Link>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button 
              onClick={() => {
                setSignupComplete(false);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
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
              Create Another Account
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
