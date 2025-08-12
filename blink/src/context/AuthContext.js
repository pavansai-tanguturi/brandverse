import React, { createContext, useState, useContext, useEffect } from 'react';

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

  const checkUserSession = async () => {
    try {
      // Check session using the new /me endpoint
      const response = await fetch('http://localhost:3001/me', {
        method: 'GET',
        credentials: 'include' // Include session cookies
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Session check result:', result);
        if (result.user) {
          setUser(result.user);
          setLoading(false);
          return;
        }
      } else {
        console.log('Session check failed, status:', response.status);
      }
      
      // No valid session
      setUser(null);
      
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (email, otp = null) => {
    try {
      if (!otp) {
        // Step 1: Send OTP
        const response = await fetch('http://localhost:3001/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email }),
        });
        
        const result = await response.json();
        if (response.ok) {
          return { success: true, message: result.message };
        } else {
          return { success: false, error: result.error };
        }
      } else {
        // Step 2: Verify OTP and login
        const response = await fetch('http://localhost:3001/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include session cookies
          body: JSON.stringify({ email, token: otp }),
        });
        
        const result = await response.json();
        if (response.ok) {
          // Session is now stored server-side, update user state
          setUser(result.user);
          return { success: true, message: result.message };
        } else {
          return { success: false, error: result.error };
        }
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear session
      await fetch('http://localhost:3001/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if server request fails
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
