import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      const token = localStorage.getItem("auth_token");
      const isAdminStored = localStorage.getItem("is_admin");

      // Quick check: if no token AND no admin flag, redirect immediately
      if (!token && isAdminStored !== "true") {
        setShouldRedirect(true);
        setLoading(false);
        return;
      }

      // If we have token OR admin flag, allow immediate access
      setLoading(false);

      // Background verification - doesn't block UI
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE || "http://localhost:3001";
        // The backend exposes a `me` endpoint that returns { user, admin }
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const userIsAdmin = data.admin === true || data.user?.isAdmin === true;

          // Update localStorage with admin status
          if (userIsAdmin) {
            localStorage.setItem("is_admin", "true");
          } else {
            // User is authenticated but NOT admin - only then redirect
            console.warn("User is not an admin");
            localStorage.removeItem("is_admin");
            setShouldRedirect(true);
          }
        } else {
          // Token verification failed (e.g., invalid/expired token)
          console.warn("Token verification failed");
          // Only redirect if this is a fresh session (no stored admin flag)
          if (isAdminStored !== "true") {
            // Don't remove auth_token - just remove admin flag and redirect
            localStorage.removeItem("is_admin");
            setShouldRedirect(true);
          } else {
            // Keep user in, they might be offline or server issue
            console.warn(
              "Keeping admin in despite verification failure (stored admin flag exists)",
            );
          }
        }
      } catch (error) {
        console.error("Admin verification error:", error);
        // Network error - if admin flag exists, keep user in
        if (isAdminStored === "true") {
          console.warn(
            "Network error during verification, but admin flag exists. Allowing access.",
          );
        } else {
          // Fresh session with network error - only remove admin flag, keep auth_token
          localStorage.removeItem("is_admin");
          setShouldRedirect(true);
        }
      }
    };

    verifyAdminAccess();
  }, []);

  // Only show loading for a split second to check localStorage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (shouldRedirect) {
    return <Navigate to="/401" replace />;
  }

  return children;
};

export default ProtectedRoute;
