/**
 * Life Tracker Pro - API Client
 * Configured axios client for backend communication
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
const apiClient: AxiosInstance = axios.create(API_CONFIG);

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to requests for cache busting
    config.params = {
      ...config.params,
      _t: Date.now(),
    };

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error: AxiosError) => {
    // Enhanced error handling
    const errorMessage = error.response?.data || error.message;
    
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login in the future
      console.warn('Unauthorized access');
    } else if (error.response?.status === 500) {
      // Handle server errors
      console.error('Server error occurred');
    } else if (!error.response) {
      // Handle network errors
      console.error('Network error - check if server is running');
    }

    return Promise.reject(error);
  }
);

// Generic API functions
export const api = {
  // GET request
  get: <T = any>(url: string, params?: any): Promise<AxiosResponse<T>> => {
    return apiClient.get(url, { params });
  },

  // POST request
  post: <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return apiClient.post(url, data);
  },

  // PUT request
  put: <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return apiClient.put(url, data);
  },

  // DELETE request
  delete: <T = any>(url: string): Promise<AxiosResponse<T>> => {
    return apiClient.delete(url);
  },

  // PATCH request
  patch: <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return apiClient.patch(url, data);
  },
};

// Health check function
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    await api.get('/api/health');
    return true;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

// Connection status checker
export const getConnectionStatus = async () => {
  try {
    const response = await api.get('/api/health');
    return {
      connected: true,
      status: 'online',
      serverInfo: response.data,
    };
  } catch (error) {
    return {
      connected: false,
      status: 'offline',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export default apiClient;