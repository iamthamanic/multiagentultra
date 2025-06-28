import { renderHook, act } from '@testing-library/react';
import { useBatchedState, useBatchedStateObject, useBatchedArrayState } from '../useBatchedState';

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('useBatchedState', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with initial state', () => {
    const { result } = renderHook(() => useBatchedState('initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('should batch multiple state updates', () => {
    const { result } = renderHook(() => useBatchedState(0));

    act(() => {
      const [, setState] = result.current;
      setState(1);
      setState(2);
      setState(3);
    });

    // State should still be initial before timer fires
    expect(result.current[0]).toBe(0);

    // Fire the timer
    act(() => {
      jest.runAllTimers();
    });

    // Now state should be updated to the final value
    expect(result.current[0]).toBe(3);
  });

  it('should handle function updates correctly', () => {
    const { result } = renderHook(() => useBatchedState(0));

    act(() => {
      const [, setState] = result.current;
      setState(prev => prev + 1);
      setState(prev => prev + 2);
      setState(prev => prev + 3);
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toBe(6); // 0 + 1 + 2 + 3
  });

  it('should allow force flush', () => {
    const { result } = renderHook(() => useBatchedState(0));

    act(() => {
      const [, setState, forceFlush] = result.current;
      setState(5);
      forceFlush();
    });

    expect(result.current[0]).toBe(5);
  });
});

describe('useBatchedStateObject', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with initial object state', () => {
    const initial = { name: 'test', count: 0 };
    const { result } = renderHook(() => useBatchedStateObject(initial));

    expect(result.current[0]).toEqual(initial);
  });

  it('should batch object updates', () => {
    const { result } = renderHook(() => useBatchedStateObject({ name: 'test', count: 0 }));

    act(() => {
      const [, updateState] = result.current;
      updateState({ name: 'updated' });
      updateState({ count: 5 });
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 });
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useBatchedStateObject({ count: 0 }));

    act(() => {
      const [, updateState] = result.current;
      updateState(prev => ({ count: prev.count + 1 }));
      updateState(prev => ({ count: prev.count + 2 }));
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toEqual({ count: 3 });
  });
});

describe('useBatchedArrayState', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with empty array by default', () => {
    const { result } = renderHook(() => useBatchedArrayState<number>());

    expect(result.current[0]).toEqual([]);
  });

  it('should initialize with provided initial array', () => {
    const { result } = renderHook(() => useBatchedArrayState([1, 2, 3]));

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('should add items correctly', () => {
    const { result } = renderHook(() => useBatchedArrayState<number>());

    act(() => {
      const [, { add }] = result.current;
      add(1);
      add(2);
      add(3);
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('should remove items correctly', () => {
    const { result } = renderHook(() => useBatchedArrayState([1, 2, 3, 4, 5]));

    act(() => {
      const [, { remove }] = result.current;
      remove(1); // Remove index 1 (value 2)
      remove(2); // Remove index 2 (value 4, but after first removal it's value 3)
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toEqual([1, 5]);
  });

  it('should update items correctly', () => {
    const { result } = renderHook(() => useBatchedArrayState([1, 2, 3]));

    act(() => {
      const [, { update }] = result.current;
      update(1, 20);
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toEqual([1, 20, 3]);
  });

  it('should clear array', () => {
    const { result } = renderHook(() => useBatchedArrayState([1, 2, 3]));

    act(() => {
      const [, { clear }] = result.current;
      clear();
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toEqual([]);
  });

  it('should set new array', () => {
    const { result } = renderHook(() => useBatchedArrayState([1, 2, 3]));

    act(() => {
      const [, { set }] = result.current;
      set([4, 5, 6]);
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toEqual([4, 5, 6]);
  });
});
