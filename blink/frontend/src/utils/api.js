// Centralized API utility for handling environment-specific URLs
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export const apiCall = async (endpoint, options = {}, retries = 1) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        
        // Don't retry auth errors
        if (response.status === 401 || response.status === 403) {
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        // Retry other errors
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (attempt < retries && !error.message.includes('401') && !error.message.includes('403')) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
};

// Export both the utility function and base URL for backward compatibility
export { API_BASE_URL };
export default API_BASE_URL;