import { useCallback, useEffect, useState } from 'react';
import { db } from '../../data/db';
import { parseAlerts, type Alert } from './parseAlerts';

export const ALERTS_URL = 'https://api.weather.gov/alerts/active?area=HI';
const AREA = 'HI';

export type AlertsState = {
  alerts: Alert[];
  fetchedAt: Date | null;
  /** Where the alerts on screen came from. */
  source: 'network' | 'cache' | 'none';
  loading: boolean;
  /** The last attempt to reach the NWS failed (offline, or the API was down). */
  failed: boolean;
};

/**
 * Shows the cached copy immediately, then tries the network. A failed fetch never
 * clears what's on screen; it just leaves the older copy with its age showing.
 */
export function useAlerts(): AlertsState & { refresh: () => void } {
  const [state, setState] = useState<AlertsState>({
    alerts: [],
    fetchedAt: null,
    source: 'none',
    loading: true,
    failed: false,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(ALERTS_URL, { headers: { Accept: 'application/geo+json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      const alerts = parseAlerts(JSON.parse(body));
      const fetchedAt = new Date();
      await db.alerts.put({ area: AREA, fetchedAt: fetchedAt.toISOString(), body });
      setState({ alerts, fetchedAt, source: 'network', loading: false, failed: false });
    } catch {
      setState((s) => ({ ...s, loading: false, failed: true }));
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const cached = await db.alerts.get(AREA);
        if (cached && active) {
          setState((s) =>
            s.source === 'network'
              ? s
              : {
                  ...s,
                  alerts: parseAlerts(JSON.parse(cached.body)),
                  fetchedAt: new Date(cached.fetchedAt),
                  source: 'cache',
                },
          );
        }
      } catch {
        // A broken cache entry is the same as no cache.
      }
      if (active) await refresh();
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  return { ...state, refresh: () => void refresh() };
}
