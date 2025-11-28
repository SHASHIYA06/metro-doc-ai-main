// Environment configuration for different deployment environments

interface EnvironmentConfig {
  API_BASE_URL: string;
  APP_SCRIPT_URL: string;
  APP_NAME: string;
  VERSION: string;
  ENVIRONMENT: 'development' | 'production' | 'staging';
  MAIN_FOLDER_ID: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;
  
  // Get the API URL from environment variables or use defaults
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (isDevelopment 
      ? 'http://localhost:3000' 
      : 'https://metro-doc-ai-main-production.up.railway.app'
    );

  // Google Apps Script URL for Drive integration
  const APP_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL || 
    'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';

  return {
    API_BASE_URL,
    APP_SCRIPT_URL,
    APP_NAME: 'KMRCL Metro Document Intelligence',
    VERSION: '2.0.0',
    ENVIRONMENT: isDevelopment ? 'development' : 'production',
    MAIN_FOLDER_ID: '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8'
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

// Google Apps Script endpoints
export const DRIVE_ENDPOINTS = {
  TEST: `${config.APP_SCRIPT_URL}?action=test`,
  LIST_FILES: `${config.APP_SCRIPT_URL}?action=listFiles`,
  LIST_TREE: `${config.APP_SCRIPT_URL}?action=listTree`,
  DOWNLOAD_FILE: `${config.APP_SCRIPT_URL}?action=downloadBase64`,
  UPLOAD_FILE: config.APP_SCRIPT_URL,
  SEARCH: `${config.APP_SCRIPT_URL}?action=search`
};

// Console log the configuration in development
if (config.ENVIRONMENT === 'development') {
  console.log('🔧 Environment Configuration:', config);
  console.log('🌐 API Endpoints:', API_ENDPOINTS);
}