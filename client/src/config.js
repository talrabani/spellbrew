// Configuration for API endpoints
const config = {
  // For local development
  development: {
    apiBaseUrl: '/api', // Uses Vite proxy
  },
  
  // For network access (when accessed from other devices)
  network: {
    apiBaseUrl: 'http://192.168.1.121:5000/api', // Direct server access
  }
};

// Detect if we're accessing from another device on the network
const isNetworkAccess = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Export the appropriate configuration
export const apiConfig = isNetworkAccess ? config.network : config.development;

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${apiConfig.apiBaseUrl}${endpoint}`;
};
