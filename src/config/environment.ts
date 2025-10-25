// Environment configuration for different deployment environments

interface EnvironmentConfig {
  API_BASE_URL: string;
  APP_NAME: string;
  VERSION: string;
  ENVIRONMENT: 'development' | 'production' | 'staging';
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;
  
  // Get the API URL from environment variables or use defaults
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (isDevelopment 
      ? 'http://localhost:3000' 
      : 'https://kmrcl-backend.onrender.com'
    );

  return {
    API_BASE_URL,
    APP_NAME: 'KMRCL Metro Document Intelligence',
    VERSION: '2.0.0',
    ENVIRONMENT: isDevelopment ? 'development' : 'production'
  };
};

export const config = getEnvironmentConfig();

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: `${config.API_BASE_URL}/health`,
  INGEST: `${config.API_BASE_URL}/ingest`,
  ASK: `${config.API_BASE_URL}/ask`,
  SEARCH_MULTI: `${config.API_BASE_URL}/search-multi`,
  SEARCH_BY_TAGS: `${config.API_BASE_URL}/search-by-tags`,
  STATS: `${config.API_BASE_URL}/stats`,
  CLEAR: `${config.API_BASE_URL}/clear`
};

// Console log the configuration in development
if (config.ENVIRONMENT === 'development') {
  console.log('🔧 Environment Configuration:', config);
  console.log('🌐 API Endpoints:', API_ENDPOINTS);
}