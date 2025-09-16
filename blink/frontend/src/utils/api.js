// Centralized API utility for handling environment-specific URLs
const API_BASE_URL = (
  import.meta.env.MODE === 'production' || 
  window.location.hostname !== 'localhost'
) 
  ? 'https://brandverse-46he.vercel.app'
  : 'http://localhost:3001';

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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
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