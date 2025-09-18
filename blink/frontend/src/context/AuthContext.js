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
      setLoading(true);
      console.log('[AuthContext] Checking user session...');
      
      const response = await apiCall('/api/auth/user', {
        method: 'GET',
      });

      console.log('[AuthContext] Session response:', response);

      if (response.user) {
        setUser(response.user);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('[AuthContext] Session check successful:', response.user.email);
      } else {
        // If session check fails, try session test for debugging
        console.log('[AuthContext] No user in response, testing session functionality...');
        
        try {
          const testResponse = await apiCall('/api/auth/session-test', {
            method: 'GET',
          });
          console.log('[AuthContext] Session test result:', testResponse);
        } catch (testError) {
          console.log('[AuthContext] Session test failed:', testError.message);
        }
        
        // Try to use cached user data if available
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            console.log('[AuthContext] Using cached user data:', userData.email);
            setUser(userData);
            return; // Exit early, don't clear localStorage
          } catch (e) {
            console.error('[AuthContext] Failed to parse cached user data:', e);
          }
        }
        
        console.log('[AuthContext] Clearing user data - no session found');
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      
      // Try to use cached user data if server is unreachable
      const cachedUser = localStorage.getItem('user');
      if (cachedUser && error.message.includes('Network')) {
        try {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          console.log('Using cached user data due to network error');
        } catch (e) {
          console.error('Failed to parse cached user data:', e);
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        // Clear user data for other types of errors
        setUser(null);
        localStorage.removeItem('user');
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
