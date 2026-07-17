import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

/**
 * The app's demo-vs-live data rule, in one place:
 *
 *  - Signed OUT ("Try the Demo"): always the built-in dummy data — works with no backend,
 *    never breaks a live demo in front of people.
 *  - Signed IN: only real backend data. A brand-new user sees honest empty states
 *    (fresh-app feel), never the dummy content. If the request fails, real users see
 *    `emptyData` (default: the demo data's empty shape) rather than fake content.
 *
 * Freshness:
 *  - Refetches every time the screen regains focus — so a post created on another
 *    screen is visible the moment you come back (feed, profile, chats…).
 *  - Optional `pollMs` re-fetches on an interval while the screen is focused, for
 *    near-real-time surfaces like the home feed. Polls are silent (no loading flicker).
 *
 * Returns `setData` too so screens can optimistically update after mutations.
 */
export function useLiveOrDemo<T>(
  fetcher: () => Promise<T>,
  demoData: T,
  emptyData?: T,
  pollMs?: number,
) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<T>(demoData);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(isAuthenticated);
  // The fetcher is usually an inline arrow (new identity each render); a ref keeps
  // `refresh` stable so focus/poll effects don't re-subscribe every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!isAuthenticated) {
        setData(demoData);
        setIsLive(false);
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      try {
        setData(await fetcherRef.current());
        setIsLive(true);
      } catch {
        // Real user + unreachable/failed backend → fresh-app empty state, never dummy data.
        setData(emptyData ?? (Array.isArray(demoData) ? ([] as T) : demoData));
        setIsLive(false);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    // demoData/emptyData are inline literals at call sites; depending on them would
    // re-run this on every render. Auth state is the only real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated],
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
      if (!pollMs || !isAuthenticated) return undefined;
      const interval = setInterval(() => refresh({ silent: true }), pollMs);
      return () => clearInterval(interval);
    }, [refresh, pollMs, isAuthenticated]),
  );

  return { data, setData, isLive, loading, refresh };
}
