/**
 * NKAMA — Service Owner (compte bailleur). Phase 7.
 * La RLS ne laisse voir que la ligne du compte courant.
 */
import { requireSupabase } from "@/services/_helpers";

let _cache = null;

/** Nom du bailleur (pour les quittances). Mis en cache pour la session. */
export async function getOwnerName() {
  if (_cache) return _cache;
  const sb = requireSupabase();
  const { data, error } = await sb.from("owners").select("nom").limit(1).maybeSingle();
  if (error) throw error;
  _cache = data?.nom || null;
  return _cache;
}
