import { useCallback, useEffect, useRef, useState } from "react";
import { getDashboard } from "@/services/dashboardService";

/**
 * NKAMA — Hook du tableau de bord.
 * Un seul appel RPC agrégé (get_dashboard), mis en cache (TTL).
 * `refetch()` force le rafraîchissement.
 */
export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const load = useCallback((force) => {
    setLoading(true);
    setError(null);
    getDashboard({ force })
      .then((d) => mounted.current && setData(d))
      .catch((e) => mounted.current && setError(e))
      .finally(() => mounted.current && setLoading(false));
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(false);
    return () => { mounted.current = false; };
  }, [load]);

  return { data, loading, error, refetch: () => load(true) };
}
