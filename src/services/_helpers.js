/**
 * NKAMA — Helpers communs aux services.
 *
 * L'application est désormais pilotée exclusivement par Supabase : aucune
 * donnée mock ne subsiste dans le code. Les services exigent un client
 * configuré ; sinon une erreur explicite est levée et l'UI affiche un état
 * d'erreur (cf. composants LoadingState / ErrorState / EmptyData).
 *
 * Les données de démonstration vivent uniquement dans supabase/seed.sql.
 */
import { getSupabase } from "@/lib/supabase";

/** Erreur levée lorsque Supabase n'est pas configuré. */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase n'est pas configuré. Renseignez VITE_SUPABASE_URL et " +
        "VITE_SUPABASE_ANON_KEY dans .env (voir supabase/README.md)."
    );
    this.name = "SupabaseNotConfiguredError";
    this.code = "SUPABASE_NOT_CONFIGURED";
  }
}

/**
 * Retourne le client Supabase ou lève une erreur si non configuré.
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export function requireSupabase() {
  const sb = getSupabase();
  if (!sb) throw new SupabaseNotConfiguredError();
  return sb;
}
