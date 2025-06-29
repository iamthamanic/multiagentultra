import { renderHook, act, waitFor } from '@testing-library/react';
import { useDataLoader, useFilteredDataLoader, useDataLoaderWithRetry } from '../useDataLoader';

// Mock the API
jest.mock('@/config/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('useDataLoader', () => {
  const mockApi = require('@/config/api').api;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useDataLoader('/test-endpoint'));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(true); // immediate = true by default
    expect(result.current.error).toBe(null);
  });

  it('initializes with loading false when immediate is false', () => {
    const { result } = renderHook(() => 
      useDataLoader('/test-endpoint', [], { immediate: false })
    );

    expect(result.current.loading).toBe(false);
  });

  it('loads data successfully', async () => {
    const mockData = [{ id: 1, name: 'Test Item' }];
    mockApi.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useDataLoader('/test-endpoint'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(mockApi.get).toHaveBeenCalledWith('/test-endpoint');
  });

  it('handles API errors correctly', async () => {
    const errorMessage = 'API Error';
    mockApi.get.mockRejectedValueOnce(new Error(errorMessage));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useDataLoader('/test-endpoint'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Data loading error for /test-endpoint:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('reloads data when dependencies change', async () => {
    const mockData1 = [{ id: 1, name: 'Item 1' }];
    const mockData2 = [{ id: 2, name: 'Item 2' }];
    
    mockApi.get.mockResolvedValueOnce({ data: mockData1 });

    const { result, rerender } = renderHook(
      ({ dep }) => useDataLoader('/test-endpoint', [dep]),
      { initialProps: { dep: 'value1' } }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Change dependency
    mockApi.get.mockResolvedValueOnce({ data: mockData2 });
    rerender({ dep: 'value2' });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(mockApi.get).toHaveBeenCalledTimes(2);
  });

  it('applies transform function when provided', async () => {
    const mockData = [{ id: 1, name: 'test' }];
    const transformedData = [{ id: 1, name: 'TEST' }];
    mockApi.get.mockResolvedValueOnce({ data: mockData });

    const transform = (item: any) => ({ ...item, name: item.name.toUpperCase() });

    const { result } = renderHook(() => 
      useDataLoader('/test-endpoint', [], { transform })
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(transformedData);
    });
  });

  it('applies filter function when provided', async () => {
    const mockData = [
      { id: 1, active: true },
      { id: 2, active: false },
      { id: 3, active: true },
    ];
    const filteredData = [
      { id: 1, active: true },
      { id: 3, active: true },
    ];
    mockApi.get.mockResolvedValueOnce({ data: mockData });

    const filter = (item: any) => item.active;

    const { result } = renderHook(() => 
      useDataLoader('/test-endpoint', [], { filter })
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(filteredData);
    });
  });

  it('calls success callback on successful load', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    const onSuccess = jest.fn();
    mockApi.get.mockResolvedValueOnce({ data: mockData });

    renderHook(() => 
      useDataLoader('/test-endpoint', [], { onSuccess })
    );

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });
  });

  it('calls error callback on failed load', async () => {
    const error = new Error('Test Error');
    const onError = jest.fn();
    mockApi.get.mockRejectedValueOnce(error);

    renderHook(() => 
      useDataLoader('/test-endpoint', [], { onError })
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('provides reload function that works correctly', async () => {
    const mockData1 = [{ id: 1 }];
    const mockData2 = [{ id: 2 }];
    
    mockApi.get.mockResolvedValueOnce({ data: mockData1 });

    const { result } = renderHook(() => useDataLoader('/test-endpoint'));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Trigger reload
    mockApi.get.mockResolvedValueOnce({ data: mockData2 });
    
    act(() => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(mockApi.get).toHaveBeenCalledTimes(2);
  });

  it('provides loadMore function for pagination', async () => {
    const mockData1 = [{ id: 1 }];
    const mockData2 = [{ id: 2 }];
    const combinedData = [{ id: 1 }, { id: 2 }];
    
    mockApi.get.mockResolvedValueOnce({ data: mockData1 });

    const { result } = renderHook(() => useDataLoader('/test-endpoint'));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Load more data
    mockApi.get.mockResolvedValueOnce({ data: mockData2 });
    
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(combinedData);
    });
  });

  it('provides reset function that clears state', () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 1 }] });

    const { result } = renderHook(() => useDataLoader('/test-endpoint'));

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});

describe('useFilteredDataLoader', () => {
  const mockApi = require('@/config/api').api;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses base endpoint when filter param is null', () => {
    const getFilteredEndpoint = jest.fn();
    
    renderHook(() => 
      useFilteredDataLoader('/base', null, getFilteredEndpoint)
    );

    expect(getFilteredEndpoint).not.toHaveBeenCalled();
    expect(mockApi.get).toHaveBeenCalledWith('/base');
  });

  it('uses filtered endpoint when filter param is provided', () => {
    const getFilteredEndpoint = jest.fn(() => '/filtered/123');
    mockApi.get.mockResolvedValueOnce({ data: [] });
    
    renderHook(() => 
      useFilteredDataLoader('/base', 123, getFilteredEndpoint)
    );

    expect(getFilteredEndpoint).toHaveBeenCalledWith(123);
    expect(mockApi.get).toHaveBeenCalledWith('/filtered/123');
  });

  it('reloads when filter param changes', async () => {
    const getFilteredEndpoint = jest.fn()
      .mockReturnValueOnce('/filtered/1')
      .mockReturnValueOnce('/filtered/2');
    
    mockApi.get.mockResolvedValue({ data: [] });

    const { rerender } = renderHook(
      ({ filterParam }) => useFilteredDataLoader('/base', filterParam, getFilteredEndpoint),
      { initialProps: { filterParam: 1 } }
    );

    expect(mockApi.get).toHaveBeenCalledWith('/filtered/1');

    rerender({ filterParam: 2 });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/filtered/2');
    });
  });
});

describe('useDataLoaderWithRetry', () => {
  const mockApi = require('@/config/api').api;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with retry count of 0', () => {
    const { result } = renderHook(() => 
      useDataLoaderWithRetry('/test-endpoint')
    );

    expect(result.current.retryCount).toBe(0);
  });

  it('increments retry count on error', async () => {
    mockApi.get.mockRejectedValue(new Error('Test Error'));

    const { result } = renderHook(() => 
      useDataLoaderWithRetry('/test-endpoint', [], 2, 100)
    );

    // Wait for initial error
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Fast-forward timer to trigger retry
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.retryCount).toBe(1);
    });
  });

  it('stops retrying after max attempts', async () => {
    mockApi.get.mockRejectedValue(new Error('Test Error'));

    const { result } = renderHook(() => 
      useDataLoaderWithRetry('/test-endpoint', [], 2, 100)
    );

    // Wait for all retries to complete
    for (let i = 0; i < 3; i++) {
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
      
      act(() => {
        jest.advanceTimersByTime(100 * Math.pow(2, i));
      });
    }

    // Should stop at max retry count
    expect(result.current.retryCount).toBeLessThanOrEqual(2);
  });

  it('uses exponential backoff for retry delays', async () => {
    mockApi.get.mockRejectedValue(new Error('Test Error'));

    const { result } = renderHook(() => 
      useDataLoaderWithRetry('/test-endpoint', [], 3, 100)
    );

    // First error
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // First retry after 100ms (100 * 2^0)
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.retryCount).toBe(1);
    });

    // Second retry after 200ms (100 * 2^1)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(result.current.retryCount).toBe(2);
    });
  });

  it('succeeds after retry', async () => {
    const mockData = [{ id: 1 }];
    
    // Fail first time, succeed second time
    mockApi.get
      .mockRejectedValueOnce(new Error('First Error'))
      .mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => 
      useDataLoaderWithRetry('/test-endpoint', [], 2, 100)
    );

    // Wait for initial error
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Trigger retry
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should succeed on retry
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });
  });
});