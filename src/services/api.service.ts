/**
 * @file api.service.ts
 * @description Core HTTP client for VLS API communication
 * @author VLS Team
 * @date 2026-02-15
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getApiBaseUrl } from '../config/environment.config';

/** Storage keys for auth */
const AUTH_TOKEN_KEY = 'vls_auth_token';
const AUTH_USER_KEY = 'vls_auth_user';

/**
 * Creates and configures the axios instance with interceptors
 * for authentication and error handling.
 *
 * The baseURL is resolved dynamically on each request via an interceptor
 * so that environment switches take effect without a page reload.
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 60000,
  });

  // Request interceptor: resolve baseURL dynamically + attach JWT token
  client.interceptors.request.use(
    (config) => {
      // Re-resolve baseURL on every request so env switches take effect immediately
      config.baseURL = getApiBaseUrl();

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token && config.headers) {
        // Use x-auth-token header (VLS API custom header)
        config.headers['x-auth-token'] = token;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: handle 401 and errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

/** Singleton API client instance */
const apiClient = createApiClient();

/**
 * Generic GET request
 */
export const get = async <T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.get(url, { ...config, params });
  return response.data;
};

/**
 * Generic POST request
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, data, config);
  return response.data;
};

/**
 * Generic PUT request
 */
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.put(url, data, config);
  return response.data;
};

/**
 * Generic DELETE request
 */
export const del = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.delete(url, config);
  return response.data;
};

/**
 * Upload file with multipart form data
 */
export const uploadFile = async <T = any>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/** Auth token helpers */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const setUserInfo = (user: any): void => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getUserInfo = (): any | null => {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export default apiClient;
