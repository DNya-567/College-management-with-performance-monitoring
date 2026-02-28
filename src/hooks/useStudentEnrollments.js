// Shared hook for student enrollments — fetches /enrollments/mine ONCE per mount cycle
// and caches the result so multiple student pages don't fire duplicate requests.
// Must NOT contain UI, routing, or auth logic.
import { useCallback, useEffect, useRef, useState } from "react";
import { listMyEnrollments } from "../api/enrollments.api";

// Module-level cache: shared across all hook instances
let cachedEnrollments = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

/**
 * Returns { enrollments, loading, error, refetch }.
 * First caller fetches from API; subsequent callers within CACHE_TTL
 * receive the cached value instantly (no duplicate request).
 */
export function useStudentEnrollments() {
  const [enrollments, setEnrollments] = useState(cachedEnrollments || []);
  const [loading, setLoading] = useState(!cachedEnrollments);
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  const fetch = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedEnrollments && now - cacheTimestamp < CACHE_TTL) {
      setEnrollments(cachedEnrollments);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await listMyEnrollments();
      const list = response.data?.classes || [];
      cachedEnrollments = list;
      cacheTimestamp = Date.now();
      if (isMounted.current) {
        setEnrollments(list);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || "Failed to load enrollments.");
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

  return { enrollments, loading, error, refetch };
}

/**
 * Call after joining/leaving a class to bust the cache.
 */
export function invalidateStudentEnrollments() {
  cachedEnrollments = null;
  cacheTimestamp = 0;
}

