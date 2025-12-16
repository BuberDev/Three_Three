export * from './errors';

// API Configuration
export const API_BASE_URL = __DEV__
    ? 'http://localhost:3000/api'
    : 'https://your-production-api.com/api';
