import {
  apiRequest,
  api,
  checkBackendConnection,
  APIError,
  NetworkError,
  API_CONFIG,
  API_ENDPOINTS,
} from '../api';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn();
const mockClearTimeout = jest.fn();
global.setTimeout = mockSetTimeout as any;
global.clearTimeout = mockClearTimeout as any;

// Mock AbortController
const mockAbort = jest.fn();
const mockAbortController = {
  abort: mockAbort,
  signal: { aborted: false },
};
global.AbortController = jest.fn(() => mockAbortController) as any;

describe('API Configuration', () => {
  it('has correct default configuration', () => {
    expect(API_CONFIG.BASE_URL).toBe('http://localhost:8888');
    expect(API_CONFIG.TIMEOUT).toBe(10000);
    expect(API_CONFIG.RETRY_ATTEMPTS).toBe(3);
    expect(API_CONFIG.RETRY_DELAY).toBe(1000);
  });

  it('generates correct API endpoints', () => {
    expect(API_ENDPOINTS.health).toBe('http://localhost:8888/api/v1/health');
    expect(API_ENDPOINTS.projects).toBe('http://localhost:8888/api/v1/projects');
    expect(API_ENDPOINTS.project(123)).toBe('http://localhost:8888/api/v1/projects/123');
    expect(API_ENDPOINTS.crewsByProject(456)).toBe('http://localhost:8888/api/v1/crews?project_id=456');
  });
});

describe('APIError', () => {
  it('creates error with correct properties', () => {
    const error = new APIError(404, 'Not Found', '/test-endpoint');
    
    expect(error.name).toBe('APIError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not Found');
    expect(error.endpoint).toBe('/test-endpoint');
  });
});

describe('NetworkError', () => {
  it('creates error with correct properties', () => {
    const error = new NetworkError('Connection failed', '/test-endpoint');
    
    expect(error.name).toBe('NetworkError');
    expect(error.message).toBe('Connection failed');
    expect(error.endpoint).toBe('/test-endpoint');
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetTimeout.mockImplementation((callback, delay) => {
      // Immediately call callback for timeout simulation
      return 'timeout-id' as any;
    });
  });

  it('makes successful GET request', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockData),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const result = await apiRequest('/test-endpoint');

    expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', {
      signal: mockAbortController.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    expect(result).toEqual({
      data: mockData,
      status: 200,
      message: 'Success',
    });
  });

  it('handles HTTP errors correctly', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: jest.fn().mockResolvedValue('{"detail": "Resource not found"}'),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    await expect(apiRequest('/test-endpoint')).rejects.toThrow(APIError);
    
    try {
      await apiRequest('/test-endpoint');
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
      expect((error as APIError).status).toBe(404);
      expect((error as APIError).message).toBe('Resource not found');
    }
  });

  it('handles non-JSON error responses', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: jest.fn().mockResolvedValue('Plain text error'),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    try {
      await apiRequest('/test-endpoint');
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
      expect((error as APIError).message).toBe('Plain text error');
    }
  });

  it('handles timeout errors with retry', async () => {
    const timeoutError = new DOMException('Timeout', 'AbortError');
    mockFetch.mockRejectedValueOnce(timeoutError);
    
    // Second attempt succeeds
    const mockData = { success: true };
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockData),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const result = await apiRequest('/test-endpoint');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual(mockData);
  });

  it('handles network errors with retry', async () => {
    const networkError = new TypeError('Network error');
    mockFetch.mockRejectedValueOnce(networkError);
    
    // Second attempt succeeds
    const mockData = { success: true };
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockData),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const result = await apiRequest('/test-endpoint');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual(mockData);
  });

  it('stops retrying after max attempts', async () => {
    const timeoutError = new DOMException('Timeout', 'AbortError');
    mockFetch.mockRejectedValue(timeoutError);

    await expect(apiRequest('/test-endpoint')).rejects.toThrow(NetworkError);
    
    // Should call fetch 4 times: initial + 3 retries
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('sets up timeout controller correctly', async () => {
    const mockData = { test: true };
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockData),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    await apiRequest('/test-endpoint');

    expect(AbortController).toHaveBeenCalled();
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), API_CONFIG.TIMEOUT);
    expect(mockClearTimeout).toHaveBeenCalled();
  });

  it('includes custom headers', async () => {
    const mockData = { test: true };
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockData),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const customHeaders = { 'Authorization': 'Bearer token' };
    await apiRequest('/test-endpoint', { headers: customHeaders });

    expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', {
      signal: mockAbortController.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      },
    });
  });

  it('re-throws API errors without retry', async () => {
    const apiError = new APIError(400, 'Bad Request');
    mockFetch.mockRejectedValueOnce(apiError);

    await expect(apiRequest('/test-endpoint')).rejects.toThrow(apiError);
    expect(mockFetch).toHaveBeenCalledTimes(1); // No retry for API errors
  });
});

describe('api convenience methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('api.get calls apiRequest with GET method', async () => {
    const mockData = { test: true };
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockData),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const result = await api.get('/test');

    expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
      method: 'GET',
    }));
    expect(result.data).toEqual(mockData);
  });

  it('api.post calls apiRequest with POST method and data', async () => {
    const postData = { name: 'Test' };
    const mockResponse = {
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ id: 1, ...postData }),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    await api.post('/test', postData);

    expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(postData),
    }));
  });

  it('api.put calls apiRequest with PUT method and data', async () => {
    const putData = { name: 'Updated' };
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(putData),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    await api.put('/test/1', putData);

    expect(mockFetch).toHaveBeenCalledWith('/test/1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify(putData),
    }));
  });

  it('api.delete calls apiRequest with DELETE method', async () => {
    const mockResponse = {
      ok: true,
      status: 204,
      json: jest.fn().mockResolvedValue(null),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    await api.delete('/test/1');

    expect(mockFetch).toHaveBeenCalledWith('/test/1', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});

describe('checkBackendConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when health check succeeds', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ status: 'healthy' }),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const result = await checkBackendConnection();

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.health,
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns false when health check fails', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: jest.fn().mockResolvedValue('Server Error'),
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const result = await checkBackendConnection();

    expect(result).toBe(false);
  });

  it('returns false when network error occurs', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

    const result = await checkBackendConnection();

    expect(result).toBe(false);
  });
});