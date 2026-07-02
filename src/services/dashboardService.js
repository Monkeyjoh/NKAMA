/**
 * NKAMA — Service Tableau de bord.
 *
 * Tout le tableau de bord est calculé côté base via la fonction RPC
 * `get_dashboard()` (une seule requête, un seul round-trip). Un cache mémoire
 * avec TTL évite les appels redondants ; `force: true` ou `invalidateDashboard()`
 * rafraîchit les données.
 */
import { requireSupabase } from "@/services/_helpers";

const TTL_MS = 60_000; // 60 s

/** @type {{ at: number, data: any, promise: Promise<any> | null }} */
let _cache = { at: 0, data: null, promise: null };

/**
 * Récupère l'instantané complet du tableau de bord (agrégé en SQL).
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<any>}
 */
export async function getDashboard({ force = false } = {}) {
  const sb = requireSupabase();
  const now = Date.now();

  if (!force && _cache.data && now - _cache.at < TTL_MS) return _cache.data;
  if (!force && _cache.promise) return _cache.promise;

  const promise = sb
    .rpc("get_dashboard")
    .then(({ data, error }) => {
      if (error) throw error;
      _cache = { at: Date.now(), data, promise: null };
      return data;
    })
    .catch((err) => {
      _cache.promise = null;
      throw err;
    });

  _cache.promise = promise;
  return promise;
}

/** Invalide le cache (à appeler après une mutation impactant le dashboard). */
export function invalidateDashboard() {
  _cache = { at: 0, data: null, promise: null };
}
