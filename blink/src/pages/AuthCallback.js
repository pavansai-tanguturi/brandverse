// src/pages/AuthCallback.js
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Verifying your login...');

  const handleMagicLinkCallback = useCallback(async () => {
    try {
      // Check if we have token in URL hash
      const hash = window.location.hash;
      console.log('Current hash:', hash);
      
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        console.log('Found tokens in URL');
        
        if (accessToken) {
          // Send token to backend for verification and user creation
          const response = await fetch('http://localhost:3001/auth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              access_token: accessToken,
              refresh_token: refreshToken
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Auth successful:', result);
            
            if (result.user && result.access_token) {
              // Store session data
              localStorage.setItem('access_token', result.access_token);
              localStorage.setItem('user', JSON.stringify(result.user));
              
              // Update auth context
              setUser(result.user);
              
              setStatus('success');
              setMessage(`Welcome ${result.user.name || result.user.email}! Redirecting...`);
              
              // Clear URL hash
              window.location.hash = '';
              
              // Redirect to home after showing success message
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 2000);
            } else {
              throw new Error('Invalid response format');
            }
          } else {
            throw new Error('Authentication failed');
          }
        } else {
          throw new Error('No access token found');
        }
      } else {
        throw new Error('No authentication data found in URL');
      }
    } catch (error) {
      console.error('Magic link callback error:', error);
      setStatus('error');
      setMessage('Authentication failed. Please try logging in again.');
      
      // Redirect to auth page after 3 seconds
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 3000);
    }
  }, [navigate, setUser]);

  useEffect(() => {
    handleMagicLinkCallback();
  }, [handleMagicLinkCallback]);

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Authentication</h2>
        
        {status === 'processing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
            <p>{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px', color: '#28a745' }}>✅</div>
            <p style={{ color: '#28a745' }}>{message}</p>
          </div>
        )}
        
        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px', color: '#dc3545' }}>❌</div>
            <p style={{ color: '#dc3545' }}>{message}</p>
            <button 
              onClick={() => navigate('/auth')}
              className="login-btn"
              style={{ marginTop: '20px' }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
