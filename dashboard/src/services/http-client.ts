import { HttpClient, RequestConfig, ApiResponse, Logger } from '@/types/core';
import { container } from '@/lib/container';

export class HttpClientImpl implements HttpClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  private defaultTimeout = 30000;
  private logger: Logger;

  constructor() {
    this.logger = container.resolve<Logger>('Logger');
  }

  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const timeout = config?.timeout || this.defaultTimeout;
    const retries = config?.retries || 3;

    const requestConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      signal: AbortSignal.timeout(timeout),
    };

    if (data && method !== 'GET') {
      requestConfig.body = JSON.stringify(data);
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        this.logger.debug(`HTTP ${method} ${fullUrl}`, { attempt, data });

        const response = await fetch(fullUrl, requestConfig);
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${responseData.message || response.statusText}`);
        }

        const result: ApiResponse<T> = {
          data: responseData,
          status: response.status,
          message: responseData.message,
        };

        this.logger.debug(`HTTP ${method} ${fullUrl} success`, { status: response.status });
        return result;

      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`HTTP ${method} ${fullUrl} failed`, { attempt, error: lastError.message });

        if (attempt === retries) {
          break;
        }

        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    this.logger.error(`HTTP ${method} ${fullUrl} failed after ${retries + 1} attempts`, lastError);
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class AuthenticatedHttpClient extends HttpClientImpl {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return super.get(url, this.addAuthHeader(config));
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return super.post(url, data, this.addAuthHeader(config));
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return super.put(url, data, this.addAuthHeader(config));
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return super.delete(url, this.addAuthHeader(config));
  }

  private addAuthHeader(config?: RequestConfig): RequestConfig {
    const token = this.getAuthToken();
    const headers = { ...config?.headers };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return {
      ...config,
      headers,
    };
  }
}
