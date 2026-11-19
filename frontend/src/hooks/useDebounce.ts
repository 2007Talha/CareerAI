/**
 * CareerAI — useDebounce Hook
 *
 * Debounces a value with guaranteed cleanup on component unmount
 * to avoid memory leaks and unhandled background updates.
 */

import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/constants';

/**
 * Custom hook to debounce rapid value updates.
 * @param value The value to debounce
 * @param delay Delay in milliseconds (defaults to 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = APP_CONFIG.DEBOUNCE_DELAY_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
