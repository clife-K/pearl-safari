// Configuration for API base URL and environment
const getApiConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const apiPort = process.env.PORT || 5000;
  
  return {
    isDevelopment,
    apiPort,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    apiUrl: isDevelopment 
      ? `http://localhost:${apiPort}`
      : process.env.API_URL || 'https://api.pearlsafari.ug',
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
  };
};

module.exports = { getApiConfig };
