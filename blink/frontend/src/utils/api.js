// Centralized API utility for handling environment-specific URLs
// Force production URL when deployed on Vercel domains
const isDeployed = window.location.hostname.includes('vercel.app') || 
                  window.location.hostname !== 'localhost';

const API_BASE_URL = isDeployed 
  ? 'https://brandverse-46he.vercel.app'
  : 'http://localhost:3001';

console.log('API_BASE_URL determined:', API_BASE_URL, {
  hostname: window.location.hostname,
  isDeployed,
  NODE_ENV: process.env.NODE_ENV
});

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
