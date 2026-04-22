// api-config.js - Dynamically load API configuration
// This file should be included in all HTML pages before other scripts

(async function initializeAPIConfig() {
  try {
    // Try to fetch config from server
    const response = await fetch('/api/config');
    const config = await response.json();
    window.API_BASE = config.apiUrl;
  } catch (error) {
    // Fallback for development
    console.warn('Failed to load API config, using default localhost:', error);
    window.API_BASE = 'http://localhost:5000/api';
  }
  
  console.log('API Base URL:', window.API_BASE);
})();
