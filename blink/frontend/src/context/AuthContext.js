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
  const [user, setUser] = useState(() => {
    // Try to get user from localStorage on initial load
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Save user to localStorage whenever user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Check if user is logged in on app start
  useEffect(() => {
    checkUserSession();
  }, []);

    const checkUserSession = useCallback(async () => {
    try {
      // First check localStorage for backed up user data
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
        } catch (e) {
          console.error('Failed to parse cached user data:', e);
          localStorage.removeItem('user');
        }
      }

      const response = await apiCall('/api/auth/user', {
        method: 'GET',
      });

      if (response.user) {
        setUser(response.user);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        // If session check fails, clear everything
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Keep cached user if available, otherwise clear
      const cachedUser = localStorage.getItem('user');
      if (!cachedUser) {
        setUser(null);
      }
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
          // Session is now stored server-side, update user state and localStorage
          setUser(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
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
      // Call logout endpoint to clear session
      await apiCall('/api/auth/logout', {
        method: 'POST'
      });
      
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if server request fails
      setUser(null);
      localStorage.removeItem('user');
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
