import { useEffect, useState } from "react";

/**
 * Delay a fast-changing value.
 *
 * Search inputs fire on every keystroke; the Django tables debounced this at
 * 300 ms via `hx-trigger="input delay:300ms"`. Same figure here so the request
 * pattern is unchanged over a thin connection.
 */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
