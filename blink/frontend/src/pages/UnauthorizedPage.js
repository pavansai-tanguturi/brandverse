import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import unauthorizedImage from "../assets/image.png";

const UnauthorizedPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = () => {
      const token = localStorage.getItem("auth_token");
      const isAdminStored = localStorage.getItem("is_admin");

      // If user is already an admin, set the flag
      if (token && isAdminStored === "true") {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, []);

  const handleAdminAccess = () => {
    if (isAdmin) {
      // If already admin, go directly to dashboard
      navigate("/admin/dashboard");
    } else {
      // Otherwise, go to login page
      navigate("/admin/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Hold Up Image - Police Officer */}
        <div className="relative">
          <div className="mx-auto w-full max-w-lg">
            <img
              src={unauthorizedImage}
              alt="Hold Up! Error 401: Unauthorized"
              className="w-full h-auto transform scale-110 object-cover transition-transform duration-500 opacity-90 mix-blend-multiply"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Return to Home
          </Link>

          <button
            onClick={handleAdminAccess}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border-2 border-blue-300 text-base font-medium rounded-xl text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            {isAdmin ? "Go to Admin Dashboard" : "Go to Admin Login"}
          </button>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500">
            {isAdmin
              ? "You're already logged in as admin. Click above to access the dashboard."
              : "If you believe this is an error, please contact your system administrator."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
