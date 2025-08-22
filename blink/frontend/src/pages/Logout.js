// src/pages/Logout.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css'; // Reuse existing styles

function Logout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      // Redirect to home after logout
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/'); // Go back to home
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Logout</h2>
        
        {user && (
          <div style={{ marginBottom: '20px' }}>
            <p>Hello, <strong>{user.name || user.email}</strong></p>
            <p>Are you sure you want to logout?</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button 
            onClick={handleLogout}
            className="login-btn"
            disabled={loading}
            style={{ backgroundColor: '#dc3545' }}
          >
            {loading ? 'Logging out...' : 'Yes, Logout'}
          </button>

          <button 
            onClick={handleCancel}
            className="back-btn"
            disabled={loading}
          >
            Cancel
          </button>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
            Logging out will end your current session and you'll need to login again to access your account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Logout;
