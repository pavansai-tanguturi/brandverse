// src/pages/SignUp.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MobileBottomNav from "../components/MobileBottomNav";

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [signupComplete, setSignupComplete] = useState(false);
  const [otpStep, setOtpStep] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) {
      setError("");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        setError("Please enter your full name");
        setLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        setError("Please enter your email address");
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpStep(true);
        setMessage(
          data.message ||
            "An OTP has been sent to your email. Please enter the 6-digit code to verify.",
        );
      } else {
        if (response.status === 400) {
          if (
            data.error &&
            data.error.toLowerCase().includes("already exists")
          ) {
            setError(
              "This email address is already registered. Please use a different email or try logging in.",
            );
          } else if (
            data.error &&
            data.error.toLowerCase().includes("invalid email")
          ) {
            setError("Please enter a valid email address.");
          } else {
            setError(
              data.error ||
                "Invalid input. Please check your details and try again.",
            );
          }
        } else if (response.status === 409) {
          setError(
            "This email address is already registered. Please use a different email or try logging in.",
          );
        } else if (response.status === 422) {
          setError(data.error || "Please check your input and try again.");
        } else if (response.status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(data.error || "Signup failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      } else {
        setError("Network error. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!formData.otp.trim()) {
        setError("Please enter the OTP code");
        setLoading(false);
        return;
      }

      if (formData.otp.trim().length !== 6) {
        setError("OTP must be 6 digits");
        setLoading(false);
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          token: formData.otp.trim(),
          type: "email",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSignupComplete(true);

        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }

        if (data.admin) {
          setMessage(
            "Admin account verified! Redirecting to admin dashboard...",
          );
          setTimeout(() => {
            navigate("/admin/dashboard");
          }, 2000);
        } else {
          setMessage("Your account is verified! Redirecting to login...");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      } else {
        if (response.status === 400) {
          if (data.error && data.error.toLowerCase().includes("expired")) {
            setError("OTP has expired. Please request a new one.");
          } else if (
            data.error &&
            data.error.toLowerCase().includes("invalid")
          ) {
            setError("Invalid OTP. Please check and try again.");
          } else {
            setError(data.error || "OTP verification failed");
          }
        } else if (response.status === 404) {
          setError("User not found. Please start the signup process again.");
        } else {
          setError(data.error || "OTP verification failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      } else {
        setError("Network error. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

      const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          type: "email",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("A new OTP has been sent to your email.");
      } else {
        setError(data.error || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSignupComplete(false);
    setOtpStep(false);
    setFormData({ name: "", email: "", otp: "" });
    setMessage("");
    setError("");
  };

  const goBackToSignup = () => {
    setOtpStep(false);
    setMessage("");
    setError("");
    setFormData((prev) => ({ ...prev, otp: "" }));
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-24 pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          {/* Sign Up Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {otpStep ? "Verify Your Email" : "Create Account"}
              </h1>
              <p className="text-gray-600">
                {otpStep
                  ? "Enter the 6-digit code sent to your email"
                  : "Join us today and start shopping"}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    !otpStep
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  1
                </div>
                <div
                  className={`w-12 h-1 mx-2 ${
                    otpStep
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                      : "bg-gray-200"
                  }`}
                />
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    otpStep
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  2
                </div>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center space-x-2 text-emerald-700 text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{message}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="flex items-center space-x-2 text-rose-700 text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Initial Signup Form */}
            {!signupComplete && !otpStep && (
              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            )}

            {/* OTP Verification Form */}
            {otpStep && !signupComplete && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 text-sm">
                    We've sent a 6-digit code to{" "}
                    <strong className="text-emerald-600">
                      {formData.email}
                    </strong>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    6-Digit OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit code"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    maxLength="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-lg tracking-widest font-mono transition-all duration-200"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={goBackToSignup}
                    className="text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Change Email
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || formData.otp.length !== 6}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </form>
            )}

            {/* Success State */}
            {signupComplete && (
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Account Created!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your account has been successfully verified and created.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="block w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-center"
                  >
                    Go to Login
                  </Link>
                  <button
                    onClick={resetForm}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Create Another Account
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            {!signupComplete && (
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <div className="px-4 text-sm text-gray-500">or</div>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
            )}

            {/* Login Link */}
            {!signupComplete && (
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors duration-200"
                  >
                    Login here
                  </Link>
                </p>
              </div>
            )}

            {/* Security Note */}
            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                <span>Your information is secure and encrypted</span>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors duration-200 font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
}

export default SignUp;
