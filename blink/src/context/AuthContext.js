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
    
    // Listen for magic link authentication
    const handleHashChange = () => {
      if (window.location.hash.includes('access_token')) {
        // Extract token from URL and authenticate
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get('access_token');
        
        if (accessToken) {
          authenticateWithToken(accessToken);
        }
      }
    };
    
    // Check on initial load
    handleHashChange();
    
    // Listen for hash changes (magic link redirects)
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const authenticateWithToken = async (token) => {
    try {
      // Extract refresh token if available
      const params = new URLSearchParams(window.location.hash.substring(1));
      const refreshToken = params.get('refresh_token');
      
      const response = await fetch('http://localhost:3001/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          access_token: token,
          refresh_token: refreshToken
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.user) {
          setUser(result.user);
          localStorage.setItem('access_token', result.access_token);
          localStorage.setItem('user', JSON.stringify(result.user));
          
          // Clear the hash from URL
          window.location.hash = '';
          
          // Redirect to home page
          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('Error authenticating with token:', error);
    }
  };

  const checkUserSession = async () => {
    try {
      // First check localStorage for saved session
      const savedToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Verify token is still valid
          const response = await fetch('http://localhost:3001/check-session', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.user) {
              setUser(result.user);
              setLoading(false);
              return;
            }
          }
        } catch (parseError) {
          console.error('Error parsing saved user:', parseError);
        }
      }
      
      // Clear invalid session data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
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
