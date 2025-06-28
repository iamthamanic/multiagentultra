// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8888/ws',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Health
  health: `${API_CONFIG.BASE_URL}/api/v1/health`,
  
  // Projects
  projects: `${API_CONFIG.BASE_URL}/api/v1/projects`,
  project: (id: number) => `${API_CONFIG.BASE_URL}/api/v1/projects/${id}`,
  
  // Crews
  crews: `${API_CONFIG.BASE_URL}/api/v1/crews`,
  crew: (id: number) => `${API_CONFIG.BASE_URL}/api/v1/crews/${id}`,
  crewsByProject: (projectId: number) => `${API_CONFIG.BASE_URL}/api/v1/crews?project_id=${projectId}`,
  
  // Agents
  agents: `${API_CONFIG.BASE_URL}/api/v1/agents`,
  agent: (id: number) => `${API_CONFIG.BASE_URL}/api/v1/agents/${id}`,
  agentsByCrew: (crewId: number) => `${API_CONFIG.BASE_URL}/api/v1/agents?crew_id=${crewId}`,
  
  // Tasks
  tasks: `${API_CONFIG.BASE_URL}/api/v1/tasks`,
  task: (id: number) => `${API_CONFIG.BASE_URL}/api/v1/tasks/${id}`,
  tasksByCrew: (crewId: number) => `${API_CONFIG.BASE_URL}/api/v1/tasks?crew_id=${crewId}`,
  
  // RAG
  ragStores: `${API_CONFIG.BASE_URL}/api/v1/rag/stores`,
  ragSearch: `${API_CONFIG.BASE_URL}/api/v1/rag/search`,
  ragUpload: `${API_CONFIG.BASE_URL}/api/v1/rag/upload`,
  ragStats: `${API_CONFIG.BASE_URL}/api/v1/rag/stats`,
} as const;

// API Error Types
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public endpoint?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// HTTP Response Type
export interface APIResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

// Retry mechanism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced fetch with error handling and retries
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<APIResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        // If error response is not JSON, use the text as is
        errorMessage = errorText || errorMessage;
      }

      throw new APIError(response.status, errorMessage, url);
    }

    // Handle successful response
    const data = await response.json();
    return {
      data,
      status: response.status,
      message: 'Success',
    };

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
        console.warn(`Request timeout, retrying... (${retryCount + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
        await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
        return apiRequest<T>(url, options, retryCount + 1);
      }
      throw new NetworkError('Request timeout', url);
    }

    // Handle network errors
    if (error instanceof TypeError) {
      if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
        console.warn(`Network error, retrying... (${retryCount + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
        await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
        return apiRequest<T>(url, options, retryCount + 1);
      }
      throw new NetworkError('Network error - please check your connection', url);
    }

    // Re-throw API errors as-is
    if (error instanceof APIError) {
      throw error;
    }

    // Handle unknown errors
    throw new NetworkError(error instanceof Error ? error.message : 'Unknown error', url);
  }
}

// Convenience methods
export const api = {
  get: <T = any>(url: string, options?: RequestInit) => 
    apiRequest<T>(url, { method: 'GET', ...options }),
    
  post: <T = any>(url: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
    
  put: <T = any>(url: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
    
  delete: <T = any>(url: string, options?: RequestInit) => 
    apiRequest<T>(url, { method: 'DELETE', ...options }),
};

// Connection status checker
export async function checkBackendConnection(): Promise<boolean> {
  try {
    await api.get(API_ENDPOINTS.health);
    return true;
  } catch {
    return false;
  }
}