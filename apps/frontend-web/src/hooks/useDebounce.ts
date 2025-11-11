import { useEffect, useState } from 'react';

/**
 * Hook de debounce pour retarder la mise à jour d'une valeur
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (par défaut 500ms)
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
