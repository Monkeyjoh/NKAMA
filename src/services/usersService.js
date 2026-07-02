/**
 * NKAMA — Service Utilisateurs (app_users) + affectations agent↔bien.
 * Supabase exclusivement. La RLS (migration 0005) gère qui peut quoi ;
 * ce service expose les opérations, l'UI masque selon les permissions.
 */
import { requireSupabase } from "@/services/_helpers";

/** Liste des utilisateurs du propriétaire courant. */
export async function listUsers() {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("app_users")
    .select("id, nom, telephone, email, role, statut, derniere_connexion")
    .order("role")
    .order("nom");
  if (error) throw error;
  return data;
}

/** Crée un utilisateur (invitation : il se connecte ensuite par lien magique). */
export async function createUser({ ownerId, nom, telephone, email, role }) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("app_users")
    .insert({ owner_id: ownerId, nom, telephone, email, role, statut: "actif" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** @param {string} id @param {Object} patch */
export async function updateUser(id, patch) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("app_users").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id @param {"actif"|"suspendu"} statut */
export function setUserStatut(id, statut) {
  return updateUser(id, { statut });
}

/** @param {string} id */
export async function deleteUser(id) {
  const sb = requireSupabase();
  const { error } = await sb.from("app_users").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/* ── Affectations agent ↔ biens ───────────────────────────── */

/** @param {string} userId @returns {Promise<string[]>} ids de biens affectés */
export async function listUserAssignments(userId) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("property_assignments")
    .select("property_id")
    .eq("app_user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => r.property_id);
}

/** Remplace l'ensemble des biens affectés à un utilisateur. */
export async function setUserAssignments(userId, ownerId, propertyIds) {
  const sb = requireSupabase();
  const { error: e1 } = await sb.from("property_assignments").delete().eq("app_user_id", userId);
  if (e1) throw e1;
  if (propertyIds.length) {
    const rows = propertyIds.map((pid) => ({ app_user_id: userId, property_id: pid, owner_id: ownerId }));
    const { error: e2 } = await sb.from("property_assignments").insert(rows);
    if (e2) throw e2;
  }
  return true;
}

/* ── Profil (compte courant) ──────────────────────────────── */

/** Change le mot de passe du compte connecté (optionnel ; login reste magique). */
export async function changePassword(password) {
  const sb = requireSupabase();
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
  return true;
}
