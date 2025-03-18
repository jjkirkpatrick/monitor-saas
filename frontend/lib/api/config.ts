export const API_CONFIG = {
  baseUrl: 'http://localhost:8080',
  endpoints: {
    monitors: '/api/v1/monitors',
    alerts: '/api/v1/alerts',
    settings: '/api/v1/settings',
    health: '/api/v1/public/health',
  },
} as const;
