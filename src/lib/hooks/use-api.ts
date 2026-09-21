"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal data hook for the MEMEOS API envelope.
 * Handles loading / error / retry / 503-unavailable (with requiredEnv) and
 * optional polite background refresh. No external data-fetching dependency.
 */

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
  requiredEnv?: string[];
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  requiredEnv?: string[];
  retry: () => void;
  /** Client-side fetch time of the current data (null before first success). */
  fetchedAt: number | null;
}

export function useApi<T>(url: string, options?: { refreshMs?: number }): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiredEnv, setRequiredEnv] = useState<string[] | undefined>();
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const alive = useRef(true);

  const retry = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    alive.current = true;
    const run = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json()) as ApiEnvelope<T>;
        if (!alive.current) return;
        if (json.ok && json.data !== undefined) {
          setData(json.data);
          setError(null);
          setRequiredEnv(undefined);
          setFetchedAt(Date.now());
        } else {
          setError(json.error ?? "Data temporarily unavailable.");
          setRequiredEnv(json.requiredEnv);
        }
      } catch {
        if (alive.current) setError("Network error — could not reach MEMEOS services.");
      } finally {
        if (alive.current) setLoading(false);
      }
    };
    run();
    let timer: ReturnType<typeof setInterval> | undefined;
    if (options?.refreshMs) {
      timer = setInterval(run, options.refreshMs);
    }
    return () => {
      alive.current = false;
      if (timer) clearInterval(timer);
    };
  }, [url, tick, options?.refreshMs]);

  return { data, loading, error, requiredEnv, retry, fetchedAt };
}
