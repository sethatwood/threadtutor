const STORAGE_KEY = "threadtutor:apiKey";

/**
 * Read the API key from localStorage.
 * Returns null during SSR (no window) or if no key is stored.
 */
export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Write an API key to localStorage.
 */
export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

/**
 * Remove the API key from localStorage.
 */
export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}
