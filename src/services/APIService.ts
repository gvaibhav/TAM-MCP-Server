import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '../utils/index.js';

/**
 * Base API service class with common HTTP functionality
 */
export class APIService {
  protected client: AxiosInstance;
  protected baseUrl: string;

  constructor(baseUrl: string, config?: AxiosRequestConfig) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      ...config
    });

    // Add response interceptor for logging (if interceptors exist)
    if (this.client && this.client.interceptors) {
      this.client.interceptors.response.use(
        (response) => {
          logger.debug(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
          return response;
        },
        (error) => {
          logger.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`, {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message
          });
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Make a GET request
   */
  protected async get(endpoint: string, config?: AxiosRequestConfig): Promise<any> {
    const response = await this.client.get(endpoint, config);
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
   * Set request headers
   */
  setHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers, headers);
  }

  /**
   * Get the axios instance (for advanced usage)
   */
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Default implementation for availability check
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  protected async handleRateLimit(retryCount: number = 0, maxRetries: number = 3): Promise<void> {
    if (retryCount >= maxRetries) {
      throw new Error('Max retries exceeded for rate limiting');
    }
    
    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    logger.warn(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
