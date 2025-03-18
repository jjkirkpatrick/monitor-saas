// Export API client
export { apiClient } from "./client";

// Export configuration
export { API_CONFIG } from "./config";

// Export endpoint modules
export { monitorsApi } from "./endpoints/monitors";
export { alertsApi } from "./endpoints/alerts";
export { settingsApi } from "./endpoints/settings";

// Export types
export type {
  // Monitor types
  Monitor,
  CreateMonitorRequest,
  UpdateMonitorRequest,
  
  // Alert types
  Alert,
  AlertCondition,
  AlertNotification,
  CreateAlertRequest,
  UpdateAlertRequest,
  
  // Settings types
  Settings,
  WebhookConfig,
  UpdateSettingsRequest,
  
  // Common types
  ApiResponse,
  PaginatedResponse,
  RequestOptions,
} from "./types";

export { ApiError } from "./types";
