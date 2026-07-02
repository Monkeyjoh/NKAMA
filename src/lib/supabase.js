/**
 * NKAMA — Client Supabase.
 *
 * Le client n'est initialisé que si les variables d'environnement sont
 * présentes (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY). Sinon
 * `getSupabase()` renvoie null et toute la couche services bascule
 * automatiquement sur les données de démonstration (repli mock).
 *
 * Pour activer Supabase :
 *   1. npm install @supabase/supabase-js   (déjà dans package.json)
 *   2. Copier .env.example → .env et renseigner URL + clé anon
 *   3. Déployer supabase/schema.sql puis supabase/seed.sql
 */
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/** Indique si la configuration Supabase est présente. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** @type {import("@supabase/supabase-js").SupabaseClient | null} */
let _client = null;

/**
 * Retourne le client Supabase (singleton), ou null en mode mock.
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 */
export function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}

export const supabase = getSupabase();
