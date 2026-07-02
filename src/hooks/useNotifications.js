import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markNotificationsRead,
} from "@/services/notificationsService";

/**
 * NKAMA — Hook du centre de notifications (Phase 5).
 *
 * Consommé par la cloche (badge de non-lues) et par la page Notifications.
 * Le cache TTL vit dans le service : plusieurs consommateurs simultanés
 * ne déclenchent qu'UN appel réseau.
 *
 * @returns {{
 *   items: import("@/services/notificationsService").Notification[],
 *   unread: number, loading: boolean, error: Error|null,
 *   refetch: () => void,
 *   markRead: (keys: string[]) => Promise<void>,
 *   markAllRead: () => Promise<void>,
 * }}
 */
export function useNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const load = useCallback((force) => {
    setLoading(true);
    setError(null);
    getNotifications({ force })
      .then((list) => mounted.current && setItems(list))
      .catch((e) => mounted.current && setError(e))
      .finally(() => mounted.current && setLoading(false));
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(false);
    return () => { mounted.current = false; };
  }, [load]);

  const markRead = useCallback(async (keys) => {
    if (!keys || keys.length === 0) return;
    const set = new Set(keys);
    // Optimiste : l'UI reflète la lecture immédiatement.
    setItems((prev) => prev.map((n) => (set.has(n.key) ? { ...n, lu: true } : n)));
    try {
      await markNotificationsRead(keys);
    } catch {
      load(true); // rollback via re-lecture serveur
    }
  }, [load]);

  const markAllRead = useCallback(
    () => markRead(items.filter((n) => !n.lu).map((n) => n.key)),
    [items, markRead]
  );

  const unread = items.filter((n) => !n.lu).length;

  return { items, unread, loading, error, refetch: () => load(true), markRead, markAllRead };
}
