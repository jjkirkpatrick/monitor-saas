import { apiClient } from "../client";
import { API_CONFIG } from "../config";
import { Settings, UpdateSettingsRequest } from "../types";

export const settingsApi = {
  /**
   * Get user settings
   */
  get: async () => {
    return apiClient.get<Settings>(API_CONFIG.endpoints.settings);
  },

  /**
   * Update user settings
   * @param data Settings update data
   */
  update: async (data: UpdateSettingsRequest) => {
    return apiClient.put<Settings>(API_CONFIG.endpoints.settings, data);
  },

  /**
   * Test webhook configuration
   * @param url Webhook URL to test
   */
  testWebhook: async (url: string) => {
    return apiClient.post<{ success: boolean }>(
      `${API_CONFIG.endpoints.settings}/test-webhook`,
      { url }
    );
  },
};
