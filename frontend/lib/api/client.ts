import { createClient } from "@/utils/supabase/client";
import { API_CONFIG } from "./config";
import { ApiError, RequestOptions } from "./types";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  private async buildHeaders(options?: RequestOptions): Promise<Headers> {
    const headers = new Headers(options?.headers);
    
    // Set default headers
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Add auth token if available
    const token = await this.getAuthToken();
    if (token) {
      console.log("token", token);
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    return url.toString();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    try {
      const headers = await this.buildHeaders(options);
      const url = this.buildUrl(endpoint, params);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
        if (!response.ok) {
          throw new ApiError(response.status, response.statusText);
        }
        return response.text() as unknown as T;
      }

      // Parse JSON response
      const data = await response.json();

      // Handle API errors
      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.error || response.statusText,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network/other errors
      throw new ApiError(
        0,
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }

  // Helper methods for common HTTP methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(API_CONFIG.baseUrl);
