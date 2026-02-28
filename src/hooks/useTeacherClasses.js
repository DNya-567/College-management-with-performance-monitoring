// Shared hook for teacher classes — fetches /classes/mine ONCE per mount cycle
// and caches the result in a module-level variable so multiple components
// on the same page don't fire duplicate requests.
// Must NOT contain UI, routing, or auth logic.
import { useCallback, useEffect, useRef, useState } from "react";
import { listMyClasses } from "../api/classes.api";

// Module-level cache: shared across all hook instances
let cachedClasses = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

/**
 * Returns { classes, loading, error, refetch }.
 * First caller fetches from API; subsequent callers within CACHE_TTL
 * receive the cached value instantly (no duplicate request).
 */
export function useTeacherClasses() {
  const [classes, setClasses] = useState(cachedClasses || []);
  const [loading, setLoading] = useState(!cachedClasses);
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  const fetch = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedClasses && now - cacheTimestamp < CACHE_TTL) {
      setClasses(cachedClasses);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await listMyClasses();
      const list = response.data?.classes || [];
      cachedClasses = list;
      cacheTimestamp = Date.now();
      if (isMounted.current) {
        setClasses(list);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || "Failed to load classes.");
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void fetch();
    return () => {
      isMounted.current = false;
    };
  }, [fetch]);

  const refetch = useCallback(() => fetch(true), [fetch]);

  return { classes, loading, error, refetch };
}

/**
 * Call this after creating/deleting a class to bust the cache
 * so the next useTeacherClasses() call fetches fresh data.
 */
export function invalidateTeacherClasses() {
  cachedClasses = null;
  cacheTimestamp = 0;
}

