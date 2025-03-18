import { apiClient } from "../client";
import { API_CONFIG } from "../config";
import {
  Monitor,
  CreateMonitorRequest,
  UpdateMonitorRequest,
  PaginatedResponse,
} from "../types";

export const monitorsApi = {
  /**
   * List all monitors
   * @param page Optional page number for pagination
   * @param pageSize Optional page size for pagination
   */
  list: async (page?: number, pageSize?: number) => {
    const params: Record<string, string> = {};
    if (page !== undefined) params.page = page.toString();
    if (pageSize !== undefined) params.pageSize = pageSize.toString();

    return apiClient.get<PaginatedResponse<Monitor>>(API_CONFIG.endpoints.monitors, {
      params,
    });
  },

  /**
   * Get a specific monitor by ID
   * @param id Monitor ID
   */
  get: async (id: string) => {
    return apiClient.get<Monitor>(`${API_CONFIG.endpoints.monitors}/${id}`);
  },

  /**
   * Create a new monitor
   * @param data Monitor creation data
   */
  create: async (data: CreateMonitorRequest) => {
    return apiClient.post<Monitor>(API_CONFIG.endpoints.monitors, data);
  },

  /**
   * Update an existing monitor
   * @param id Monitor ID
   * @param data Monitor update data
   */
  update: async (id: string, data: UpdateMonitorRequest) => {
    return apiClient.put<Monitor>(`${API_CONFIG.endpoints.monitors}/${id}`, data);
  },

  /**
   * Delete a monitor
   * @param id Monitor ID
   */
  delete: async (id: string) => {
    return apiClient.delete(`${API_CONFIG.endpoints.monitors}/${id}`);
  },
};
