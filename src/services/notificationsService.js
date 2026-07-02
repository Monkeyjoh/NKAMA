/**
 * NKAMA — Service Notifications (Phase 5).
 *
 * Les notifications = alertes automatiques (`v_alertes`) + état lu / non-lu
 * par utilisateur (table `notification_reads`). Un seul RPC agrégé
 * `get_notifications()` (même patron que le tableau de bord), avec cache
 * mémoire TTL partagé entre la cloche (badge) et la page Notifications :
 * un seul appel réseau pour les deux.
 *
 * @typedef {{ key: string, type: string, gravite: "haute"|"moyenne",
 *             titre: string, detail: string, entity_type: string,
 *             entity_id: string|null, lu: boolean }} Notification
 */
import { requireSupabase } from "@/services/_helpers";

const TTL_MS = 60_000; // 60 s (aligné sur le dashboard)

/** @type {{ at: number, data: Notification[]|null, promise: Promise<Notification[]>|null }} */
let _cache = { at: 0, data: null, promise: null };

/**
 * Liste des notifications (non-lues d'abord, gravité haute en tête).
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<Notification[]>}
 */
export async function getNotifications({ force = false } = {}) {
  const sb = requireSupabase();
  const now = Date.now();

  if (!force && _cache.data && now - _cache.at < TTL_MS) return _cache.data;
  if (!force && _cache.promise) return _cache.promise;

  const promise = sb
    .rpc("get_notifications")
    .then(({ data, error }) => {
      if (error) throw error;
      const list = Array.isArray(data) ? data : [];
      _cache = { at: Date.now(), data: list, promise: null };
      return list;
    })
    .catch((err) => {
      _cache.promise = null;
      throw err;
    });

  _cache.promise = promise;
  return promise;
}

/**
 * Marque une liste de notifications comme lues (idempotent).
 * @param {string[]} keys  Clés stables (`type:entity_id`)
 * @returns {Promise<void>}
 */
export async function markNotificationsRead(keys) {
  if (!keys || keys.length === 0) return;
  const sb = requireSupabase();
  const { error } = await sb.rpc("mark_notifications_read", { p_keys: keys });
  if (error) throw error;
  // Mise à jour optimiste du cache (pas de refetch nécessaire).
  if (_cache.data) {
    const set = new Set(keys);
    _cache.data = _cache.data.map((n) => (set.has(n.key) ? { ...n, lu: true } : n));
  }
}

/** Invalide le cache (ex. après une mutation impactant les alertes). */
export function invalidateNotifications() {
  _cache = { at: 0, data: null, promise: null };
}
