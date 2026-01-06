import { renderHook, act } from '@testing-library/react-native';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

// Use fake timers for debounce testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be initial immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now it should be updated
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // Make rapid changes
    rerender({ value: 'change1', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'change2', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'change3', delay: 300 });

    // Should still be initial since timer keeps resetting
    expect(result.current).toBe('initial');

    // Advance past debounce delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should now be the final value
    expect(result.current).toBe('change3');
  });

  it('should work with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'test', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    // Advance 500ms - should not update yet
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('test');

    // Advance another 500ms - now should update
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });

  it('should work with number values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: number; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 0, delay: 200 } }
    );

    rerender({ value: 42, delay: 200 });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe(42);
  });

  it('should work with object values', () => {
    const initialObj = { name: 'initial' };
    const updatedObj = { name: 'updated' };

    const { result, rerender } = renderHook(
      ({ value, delay }: { value: { name: string }; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: initialObj, delay: 200 } }
    );

    rerender({ value: updatedObj, delay: 200 });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toEqual(updatedObj);
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    rerender({ value: 'updated', delay: 0 });

    // Even with 0 delay, we need to flush timers
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });

  it('should cleanup timer on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });

    // Unmount before timer fires
    unmount();

    // Advance time - should not throw
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Test passes if no error is thrown
  });
});
