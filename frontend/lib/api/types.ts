// Error Types
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request Types
export interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

// Monitor Types
export interface Monitor {
  id: string;
  name: string;
  url: string;
  type: 'HTTP' | 'TCP';
  interval: string;
  status: 'up' | 'down' | 'degraded';
  lastCheck: string;
  uptime: string;
  responseTime: string;
  location: string;
}

export interface CreateMonitorRequest {
  name: string;
  url: string;
  type: Monitor['type'];
  interval: string;
  location: string;
}

export interface UpdateMonitorRequest extends Partial<CreateMonitorRequest> {}

// Alert Types
export interface Alert {
  id: string;
  monitorId: string;
  type: 'email' | 'slack' | 'webhook';
  status: 'active' | 'inactive';
  conditions: AlertCondition[];
  notifications: AlertNotification[];
}

export interface AlertCondition {
  metric: 'status' | 'response_time' | 'uptime';
  operator: '>' | '<' | '==' | '!=';
  value: string | number;
}

export interface AlertNotification {
  type: Alert['type'];
  target: string; // email address, webhook URL, etc.
}

export interface CreateAlertRequest {
  monitorId: string;
  type: Alert['type'];
  conditions: AlertCondition[];
  notifications: AlertNotification[];
}

export interface UpdateAlertRequest extends Partial<CreateAlertRequest> {}

// Settings Types
export interface Settings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  slackWebhook?: string;
  customWebhooks: WebhookConfig[];
}

export interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
  enabled: boolean;
}

export interface UpdateSettingsRequest extends Partial<Omit<Settings, 'id' | 'userId'>> {}

// Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
