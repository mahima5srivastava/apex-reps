/**
 * IndexedDB caching for food search results using @vueuse/integrations useIDBKeyval.
 * Provides query-based caching with TTL and offline support.
 */

import { useIDBKeyval } from "@vueuse/integrations/useIDBKeyval";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DB_KEY = "food-search-cache";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type CacheStore = Record<string, CacheEntry<unknown>>;

/**
 * Composable for caching food search results in IndexedDB.
 * Key format: `food-search:{normalizedQuery}`
 */
export function useFoodCache() {
  const { data: cacheStore, set: setCacheStore } = useIDBKeyval<CacheStore>(
    DB_KEY,
    {},
  );

  /**
   * Generate cache key from search query.
   */
  function getCacheKey(query: string): string {
    return `food-search:${query.trim().toLowerCase()}`;
  }

  /**
   * Check if cached entry is still valid (within TTL).
   */
  function isValid(entry: CacheEntry<unknown> | null): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
  }

  /**
   * Get cached results for a query.
   * Returns null if not cached or expired.
   */
  async function get<T>(query: string): Promise<T | null> {
    try {
      const key = getCacheKey(query);
      const store = cacheStore.value ?? {};
      const entry = store[key];
      if (isValid(entry ?? null)) {
        return entry?.data as T;
      }
      // Expired - remove it
      if (entry) {
        await remove(key);
      }
      return null;
    } catch {
      // IndexedDB not available (e.g., private browsing) - fail gracefully
      return null;
    }
  }

  /**
   * Set cached results for a query.
   */
  async function set<T>(query: string, data: T): Promise<void> {
    try {
      const key = getCacheKey(query);
      const store = cacheStore.value ?? {};
      store[key] = {
        data,
        timestamp: Date.now(),
      };
      await setCacheStore(store);
    } catch {
      // IndexedDB not available - fail gracefully
    }
  }

  /**
   * Clear all cached entries.
   */
  async function clear(): Promise<void> {
    try {
      await setCacheStore({});
    } catch {
      // Ignore
    }
  }

  /**
   * Remove a specific cached query.
   */
  async function remove(key: string): Promise<void> {
    try {
      const store = { ...(cacheStore.value ?? {}) };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
      await setCacheStore(store);
    } catch {
      // Ignore
    }
  }

  return {
    get,
    set,
    clear,
    remove,
  };
}

/**
 * Debounce utility for search input.
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = ((...args: unknown[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T;

  return debouncedFn;
}
