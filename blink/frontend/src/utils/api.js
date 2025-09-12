// Centralized API utility for handling environment-specific URLs
// Debug: Log environment variables
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_API_BASE: process.env.REACT_APP_API_BASE
});

// Force production URLs when deployed
const API_BASE_URL = (
  process.env.NODE_ENV === 'production' || 
  window.location.hostname !== 'localhost'
) 
  ? process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE || 'https://brandverse-46he.vercel.app'
  : 'http://localhost:3001';

console.log('Using API_BASE_URL:', API_BASE_URL);

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    return response;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Export both the utility function and base URL for backward compatibility
export { API_BASE_URL };
export default API_BASE_URL;
