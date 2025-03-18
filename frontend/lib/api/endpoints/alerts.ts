import { apiClient } from "../client";
import { API_CONFIG } from "../config";
import {
  Alert,
  CreateAlertRequest,
  UpdateAlertRequest,
  PaginatedResponse,
} from "../types";

export const alertsApi = {
  /**
   * List all alerts
   * @param monitorId Optional monitor ID to filter alerts
   * @param page Optional page number for pagination
   * @param pageSize Optional page size for pagination
   */
  list: async (monitorId?: string, page?: number, pageSize?: number) => {
    const params: Record<string, string> = {};
    if (monitorId) params.monitorId = monitorId;
    if (page !== undefined) params.page = page.toString();
    if (pageSize !== undefined) params.pageSize = pageSize.toString();

    return apiClient.get<PaginatedResponse<Alert>>(API_CONFIG.endpoints.alerts, {
      params,
    });
  },

  /**
   * Get a specific alert by ID
   * @param id Alert ID
   */
  get: async (id: string) => {
    return apiClient.get<Alert>(`${API_CONFIG.endpoints.alerts}/${id}`);
  },

  /**
   * Create a new alert
   * @param data Alert creation data
   */
  create: async (data: CreateAlertRequest) => {
    return apiClient.post<Alert>(API_CONFIG.endpoints.alerts, data);
  },

  /**
   * Update an existing alert
   * @param id Alert ID
   * @param data Alert update data
   */
  update: async (id: string, data: UpdateAlertRequest) => {
    return apiClient.put<Alert>(`${API_CONFIG.endpoints.alerts}/${id}`, data);
  },

  /**
   * Delete an alert
   * @param id Alert ID
   */
  delete: async (id: string) => {
    return apiClient.delete(`${API_CONFIG.endpoints.alerts}/${id}`);
  },
};
