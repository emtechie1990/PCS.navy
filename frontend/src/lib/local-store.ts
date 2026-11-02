import { useEffect, useState } from "react";

/** State that survives reloads on this device only (no account, nothing sent to the server). */
export function useLocalState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode or quota: state still works for this session */
    }
  }, [key, value]);
  return [value, setValue];
}

export const uid = () => Math.random().toString(36).slice(2, 10);
