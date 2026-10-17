import AppConfigs from "@/AppConfigs";
import { useUserStore } from "@/stores/user";
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

// Create a centralized axios instance
const apiClient = axios.create({
  baseURL: AppConfigs.getServerURL(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple token refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

// Process the failed queue
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore();
    const user = userStore.superUser;

    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Ensure _retry property exists
    if (!originalRequest) {
      return Promise.reject(error);
    }
    if (!originalRequest._retry) {
      originalRequest._retry = false;
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const userStore = useUserStore();
      const user = userStore.superUser;

      // Check if we have a refresh token
      if (!user?.refreshToken) {
        // No refresh token, redirect to login
        userStore.clearUser();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          AppConfigs.getServerURL() + "/auth/refresh",
          { refreshToken: user.refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const { token } = response.data;

        // Update user store with new token
        userStore.setUser({
          ...user,
          token,
        });

        // Process queued requests
        processQueue(null, token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear user and redirect to login
        processQueue(refreshError as Error, null);
        userStore.clearUser();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("[API] Access forbidden:", error.response?.data);
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error("[API] Server error:", error.response?.data);
    }

    // Handle network errors
    if (!error.response) {
      console.error("[API] Network error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default apiClient;

// Helper function to create config with custom options
export function createConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
  return {
    ...config,
  };
}

// Re-export types for convenience
export type { AxiosRequestConfig, AxiosError };