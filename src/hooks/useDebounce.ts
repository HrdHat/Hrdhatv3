import { useCallback, useRef, useEffect } from 'react';

export interface DebounceOptions {
  delay: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  flush: () => void;
  cancel: () => void;
  pending: () => boolean;
}

/**
 * Advanced debouncing hook with comprehensive options
 * 
 * @param fn - Function to debounce
 * @param options - Debouncing configuration
 * @returns Debounced function with control methods
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  options: DebounceOptions
): DebouncedFunction<T> {
  const {
    delay,
    maxWait,
    leading = false,
    trailing = true,
  } = options;

  const fnRef = useRef(fn);
  const timersRef = useRef<{
    timeout?: NodeJS.Timeout;
    maxTimeout?: NodeJS.Timeout;
  }>({});
  const lastCallTimeRef = useRef<number | undefined>(undefined);
  const lastInvokeTimeRef = useRef<number | undefined>(undefined);
  const argsRef = useRef<Parameters<T> | undefined>(undefined);
  const resultRef = useRef<ReturnType<T> | undefined>(undefined);

  // Update function reference
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timersRef.current.timeout) {
        clearTimeout(timersRef.current.timeout);
      }
      if (timersRef.current.maxTimeout) {
        clearTimeout(timersRef.current.maxTimeout);
      }
    };
  }, []);

  const invokeFunc = useCallback(() => {
    const args = argsRef.current;
    if (args) {
      lastInvokeTimeRef.current = Date.now();
      resultRef.current = fnRef.current(...args);
      return resultRef.current;
    }
  }, []);

  const timerExpired = useCallback(() => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timersRef.current.timeout = setTimeout(timerExpired, remainingWait(time));
  }, []);

  const leadingEdge = useCallback(() => {
    lastInvokeTimeRef.current = Date.now();
    timersRef.current.timeout = setTimeout(timerExpired, delay);
    return leading ? invokeFunc() : resultRef.current;
  }, [delay, leading, invokeFunc, timerExpired]);

  const remainingWait = useCallback((time: number) => {
    const timeSinceLastCall = time - (lastCallTimeRef.current || 0);
    const timeSinceLastInvoke = time - (lastInvokeTimeRef.current || 0);
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }, [delay, maxWait]);

  const shouldInvoke = useCallback((time: number) => {
    const timeSinceLastCall = time - (lastCallTimeRef.current || 0);
    const timeSinceLastInvoke = time - (lastInvokeTimeRef.current || 0);

    return (
      lastCallTimeRef.current === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }, [delay, maxWait]);

  const trailingEdge = useCallback((time: number) => {
    timersRef.current.timeout = undefined;

    if (trailing && argsRef.current) {
      return invokeFunc();
    }
    argsRef.current = undefined;
    return resultRef.current;
  }, [trailing, invokeFunc]);

  const cancel = useCallback(() => {
    if (timersRef.current.timeout) {
      clearTimeout(timersRef.current.timeout);
    }
    if (timersRef.current.maxTimeout) {
      clearTimeout(timersRef.current.maxTimeout);
    }
    lastInvokeTimeRef.current = undefined;
    lastCallTimeRef.current = undefined;
    argsRef.current = undefined;
    timersRef.current = {};
  }, []);

  const flush = useCallback(() => {
    if (timersRef.current.timeout) {
      return trailingEdge(Date.now());
    }
    return resultRef.current;
  }, [trailingEdge]);

  const pending = useCallback(() => {
    return timersRef.current.timeout !== undefined;
  }, []);

  const debounced = useCallback((...args: Parameters<T>) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastCallTimeRef.current = time;
    argsRef.current = args;

    if (isInvoking) {
      if (timersRef.current.timeout === undefined) {
        return leadingEdge();
      }
      if (maxWait !== undefined) {
        timersRef.current.timeout = setTimeout(timerExpired, delay);
        timersRef.current.maxTimeout = setTimeout(invokeFunc, maxWait);
        return leading ? invokeFunc() : resultRef.current;
      }
    }
    if (timersRef.current.timeout === undefined) {
      timersRef.current.timeout = setTimeout(timerExpired, delay);
    }
    return resultRef.current;
  }, [delay, shouldInvoke, leadingEdge, maxWait, leading, invokeFunc, timerExpired]) as DebouncedFunction<T>;

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

/**
 * Simple debounce hook for common use cases
 */
export function useSimpleDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  return useDebounce(fn, { delay });
}

/**
 * Debounce with max wait to ensure function is called within a maximum time
 */
export function useDebounceWithMaxWait<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  maxWait: number
): DebouncedFunction<T> {
  return useDebounce(fn, { delay, maxWait });
} 