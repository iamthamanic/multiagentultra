'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for batching state updates to improve performance
 * Useful when multiple state updates happen in quick succession
 */
export function useBatchedState<T>(
  initialState: T
): [T, (updater: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdatesRef = useRef<Array<(prev: T) => T>>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length > 0) {
      setState(prevState => {
        let newState = prevState;
        pendingUpdatesRef.current.forEach(updater => {
          newState = updater(newState);
        });
        return newState;
      });
      pendingUpdatesRef.current = [];
    }
    timeoutRef.current = null;
  }, []);

  const batchedSetState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const updateFn = typeof updater === 'function' ? (updater as (prev: T) => T) : () => updater;

      pendingUpdatesRef.current.push(updateFn);

      if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(flushUpdates, 0);
      }
    },
    [flushUpdates]
  );

  const forceFlush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      flushUpdates();
    }
  }, [flushUpdates]);

  return [state, batchedSetState, forceFlush];
}

/**
 * Hook for managing multiple related state values with batching
 */
export function useBatchedStateObject<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T> | ((prev: T) => Partial<T>)) => void, () => void] {
  const [state, batchedSetState, forceFlush] = useBatchedState<T>(initialState);

  const updateState = useCallback(
    (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      batchedSetState(prevState => {
        const newUpdates = typeof updates === 'function' ? updates(prevState) : updates;
        return { ...prevState, ...newUpdates };
      });
    },
    [batchedSetState]
  );

  return [state, updateState, forceFlush];
}

/**
 * Hook for managing array state with batching and common operations
 */
export function useBatchedArrayState<T>(initialState: T[] = []): [
  T[],
  {
    add: (item: T) => void;
    remove: (index: number) => void;
    update: (index: number, item: T) => void;
    clear: () => void;
    set: (items: T[]) => void;
  },
  () => void,
] {
  const [state, batchedSetState, forceFlush] = useBatchedState<T[]>(initialState);

  const add = useCallback(
    (item: T) => {
      batchedSetState(prev => [...prev, item]);
    },
    [batchedSetState]
  );

  const remove = useCallback(
    (index: number) => {
      batchedSetState(prev => prev.filter((_, i) => i !== index));
    },
    [batchedSetState]
  );

  const update = useCallback(
    (index: number, item: T) => {
      batchedSetState(prev => prev.map((current, i) => (i === index ? item : current)));
    },
    [batchedSetState]
  );

  const clear = useCallback(() => {
    batchedSetState([]);
  }, [batchedSetState]);

  const set = useCallback(
    (items: T[]) => {
      batchedSetState(items);
    },
    [batchedSetState]
  );

  return [state, { add, remove, update, clear, set }, forceFlush];
}
