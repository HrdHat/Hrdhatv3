import { useRef, useEffect } from "react";

export function useDebouncedSave<T extends (...args: any[]) => void>(
  callback: T,
  delay = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const debouncedFn = ((...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }) as T;

  return debouncedFn;
} 