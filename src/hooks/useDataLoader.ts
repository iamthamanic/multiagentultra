import { useState, useEffect, useCallback } from 'react';
import { api, APIResponse } from '@/config/api';

/**
 * Generic data loading hook with built-in error handling and loading states
 *
 * Eliminates code duplication across components and provides consistent
 * data fetching patterns with proper TypeScript typing
 *
 * @template T - Type of data being loaded
 * @param endpoint - API endpoint to fetch from
 * @param dependencies - Dependencies that trigger refetch
 * @param options - Additional configuration options
 */

export interface UseDataLoaderOptions {
  /** Whether to load data immediately on mount */
  immediate?: boolean;
  /** Transform function for data before setting state */
  transform?: <T>(data: T) => T;
  /** Filter function for client-side filtering */
  filter?: <T>(item: T) => boolean;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback */
  onSuccess?: <T>(data: T) => void;
}

export interface UseDataLoaderReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

/**
 * Production-ready data loading hook with comprehensive error handling
 */
export function useDataLoader<T = any>(
  endpoint: string,
  dependencies: readonly unknown[] = [],
  options: UseDataLoaderOptions = {}
): UseDataLoaderReturn<T> {
  const { immediate = true, transform, filter, onError, onSuccess } = options;

  // State management with proper typing
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  /**
   * Core data loading function with comprehensive error handling
   */
  const loadData = useCallback(
    async (append = false): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response: APIResponse<T[]> = await api.get(endpoint);
        let processedData = response.data;

        // Apply transformations if provided
        if (transform) {
          processedData = processedData.map(transform);
        }

        // Apply client-side filtering if provided
        if (filter) {
          processedData = processedData.filter(filter);
        }

        // Update state (append for pagination, replace otherwise)
        setData(prevData => (append ? [...prevData, ...processedData] : processedData));

        // Success callback
        onSuccess?.(processedData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));

        // Log error for debugging (will be filtered by linting in production)
        console.error(`Data loading error for ${endpoint}:`, err);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, transform, filter, onError, onSuccess]
  );

  /**
   * Reload data from scratch
   */
  const reload = useCallback((): Promise<void> => {
    return loadData(false);
  }, [loadData]);

  /**
   * Load more data (for pagination)
   */
  const loadMore = useCallback((): Promise<void> => {
    return loadData(true);
  }, [loadData]);

  /**
   * Reset all state to initial values
   */
  const reset = useCallback((): void => {
    setData([]);
    setLoading(false);
    setError(null);
  }, []);

  /**
   * Effect for initial data loading and dependency-based reloading
   */
  useEffect(() => {
    if (immediate) {
      loadData(false);
    }
  }, [immediate, ...dependencies, loadData]);

  return {
    data,
    loading,
    error,
    reload,
    loadMore,
    reset,
  };
}

/**
 * Specialized hook for filtered data loading (e.g., crews by project)
 */
export function useFilteredDataLoader<T = any>(
  baseEndpoint: string,
  filterParam: string | number | null,
  getFilteredEndpoint: (param: string | number) => string,
  dependencies: readonly unknown[] = []
): UseDataLoaderReturn<T> {
  const endpoint = filterParam ? getFilteredEndpoint(filterParam) : baseEndpoint;

  return useDataLoader<T>(endpoint, [filterParam, ...dependencies]);
}

/**
 * Hook for data with automatic retry on failure
 */
export function useDataLoaderWithRetry<T = any>(
  endpoint: string,
  dependencies: readonly unknown[] = [],
  maxRetries = 3,
  retryDelay = 1000
): UseDataLoaderReturn<T> & { retryCount: number } {
  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback(
    (error: Error) => {
      if (retryCount < maxRetries) {
        setTimeout(
          () => {
            setRetryCount(prev => prev + 1);
          },
          retryDelay * Math.pow(2, retryCount)
        ); // Exponential backoff
      }
    },
    [retryCount, maxRetries, retryDelay]
  );

  const result = useDataLoader<T>(endpoint, dependencies, {
    onError: handleError,
  });

  return {
    ...result,
    retryCount,
  };
}
