import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '../utils/index.js';

/**
 * Base class for API services providing common HTTP functionality
 */
export class APIService {
  protected client: AxiosInstance;
  protected baseUrl: string;

  constructor(baseUrl: string, config?: AxiosRequestConfig) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 seconds timeout
      ...config
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      (error) => {
        logger.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a GET request
   */
  protected async get(endpoint: string, params?: any): Promise<any> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  /**
   * Make a POST request
   */
  protected async post(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    const response = await this.client.post(endpoint, data, config);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  protected async put(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    const response = await this.client.put(endpoint, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  protected async delete(endpoint: string, config?: AxiosRequestConfig): Promise<any> {
    const response = await this.client.delete(endpoint, config);
    return response.data;
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Update default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers, headers);
  }

  /**
   * Set authentication header
   */
  setAuthToken(token: string, type: 'Bearer' | 'Basic' | 'ApiKey' = 'Bearer'): void {
    this.client.defaults.headers.Authorization = `${type} ${token}`;
  }
}
