import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = useCallback(async () => {
    try {
      // Check if user has active session on server
      const response = await apiCall('/api/auth/me');
      
      if (response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, otp = null) => {
    try {
      if (!otp) {
        // Step 1: Send OTP
        const response = await apiCall('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        
        if (response.message) {
          return { success: true, message: response.message };
        } else {
          return { success: false, error: response.error || 'Login failed' };
        }
      } else {
        // Step 2: Verify OTP and login
        const response = await apiCall('/api/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email, token: otp }),
        });
        
        if (response.user) {
          // Session is now stored server-side, just update user state
          setUser(response.user);
          return { success: true, message: response.message || 'Login successful' };
        } else {
          return { success: false, error: response.error || 'OTP verification failed' };
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to destroy session
      await apiCall('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await checkUserSession();
  };

  const value = {
    user,
    login,
    logout,
    loading,
    setUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
