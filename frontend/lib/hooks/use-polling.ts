"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_INTERVAL_MS = 60_000;

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = DEFAULT_INTERVAL_MS
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const fetcherRef = useRef(fetcher);
  const dataRef = useRef<T | null>(null);

  fetcherRef.current = fetcher;
  dataRef.current = data;

  const refresh = useCallback(async (silent = false) => {
    const hasData = dataRef.current !== null;
    if (!silent && !hasData) setLoading(true);

    try {
      const result = await fetcherRef.current();
      setData(result);
      setLastSyncedAt(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      if (!silent || !hasData) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(false);
    const id = setInterval(() => refresh(true), intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { data, loading, error, lastSyncedAt, refresh };
}
