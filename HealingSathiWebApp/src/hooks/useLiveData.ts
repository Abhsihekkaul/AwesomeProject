"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

/**
 * The web twin of the app's useLiveOrDemo — the same demo-vs-live contract:
 *
 *  - Signed OUT (demo mode): always the built-in dummy data, no requests.
 *  - Signed IN: only real backend data. Failure = honest empty state
 *    (emptyData), never fake content.
 *
 * Freshness comes from React Query: refetch on window focus (provider default)
 * plus optional pollMs, matching the app's focus-refetch + silent polling.
 */
export function useLiveData<T>(
  key: readonly unknown[],
  fetcher: () => Promise<T>,
  demoData: T,
  options?: { emptyData?: T; pollMs?: number },
) {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: [...key, isAuthenticated],
    queryFn: fetcher,
    enabled: isAuthenticated,
    refetchInterval: options?.pollMs,
  });

  const emptyFallback =
    options?.emptyData ?? ((Array.isArray(demoData) ? [] : demoData) as T);

  const data: T = !isAuthenticated
    ? demoData
    : query.isSuccess
      ? query.data
      : query.isError
        ? emptyFallback
        : emptyFallback;

  return {
    data,
    isLive: isAuthenticated && query.isSuccess,
    loading: isAuthenticated && query.isPending,
    refresh: query.refetch,
  };
}
