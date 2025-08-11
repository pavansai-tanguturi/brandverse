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
      // First check localStorage for saved session
      const savedToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');
      
      console.log('Checking session - Token exists:', !!savedToken, 'User exists:', !!savedUser);
      
      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('Parsed user from localStorage:', parsedUser);
          
          // Set user immediately from localStorage, then verify with server
          setUser(parsedUser);
          
          // Verify token is still valid with server
          const response = await fetch('http://localhost:3001/check-session', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Server session check result:', result);
            if (result.user) {
              // Update user data from server response
              setUser(result.user);
              // Make sure the updated data is saved
              localStorage.setItem('user', JSON.stringify(result.user));
              setLoading(false);
              return;
            }
          } else {
            console.log('Server session check failed, status:', response.status);
          }
        } catch (parseError) {
          console.error('Error parsing saved user:', parseError);
        }
      } else {
        console.log('No saved session found');
      }
      
      // Clear invalid session data only if server check failed
      console.log('Clearing session data');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      
    } catch (error) {
      console.error('Error checking session:', error);
    }
    setLoading(false);
  };

  const login = async (email) => {
    try {
      const response = await fetch('http://localhost:3001/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      if (response.ok) {
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        await fetch('http://localhost:3001/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if server request fails
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
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
