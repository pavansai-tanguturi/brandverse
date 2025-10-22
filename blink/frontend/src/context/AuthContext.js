import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { apiCall } from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
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
      // Get token from localStorage for authorization
      const token = localStorage.getItem("auth_token");

      // Check if user has active session on server
      const response = await apiCall("/api/auth/me", {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, otp = null) => {
    try {
      if (!otp) {
        // Step 1: Send OTP
        const response = await apiCall("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email }),
        });

        if (response.message) {
          return { success: true, message: response.message };
        } else {
          return { success: false, error: response.error || "Login failed" };
        }
      } else {
        // Step 2: Verify OTP and login
        const response = await apiCall("/api/auth/verify-otp", {
          method: "POST",
          body: JSON.stringify({ email, token: otp }),
        });

        if (response.token && response.user) {
          // Store JWT token in localStorage as backup
          localStorage.setItem("auth_token", response.token);
          setUser(response.user);
          // Debug: log cookies after login
          console.log("Cookies after login:", document.cookie);
          // Force a session check after a brief delay to ensure cookie is set
          setTimeout(() => {
            checkUserSession();
          }, 100);
          return {
            success: true,
            message: response.message || "Login successful",
          };
        } else {
          return {
            success: false,
            error: response.error || "OTP verification failed",
          };
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    try {
      // Get token for logout request
      const token = localStorage.getItem("auth_token");

      // Call logout endpoint to destroy session
      await apiCall("/api/auth/logout", {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear user state and token
      setUser(null);
      localStorage.removeItem("auth_token");
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
