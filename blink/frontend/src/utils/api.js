// Centralized API utility for handling environment-specific URLs
const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Try to get token from localStorage or cookie
  let token = localStorage.getItem("auth_token");
  if (!token && typeof document !== "undefined") {
    // Try to get from cookie if not in localStorage
    const match = document.cookie.match(/auth_token=([^;]+)/);
    if (match) token = match[1];
  }

  const defaultOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Export both the utility function and base URL for backward compatibility
export { API_BASE_URL };
export default API_BASE_URL;
