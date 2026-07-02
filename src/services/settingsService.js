/**
 * NKAMA — Service Paramètres (utilisateurs applicatifs + seuils).
 * Supabase exclusivement.
 */
import { requireSupabase } from "@/services/_helpers";

/** Liste des utilisateurs applicatifs (rôles). */
export async function listAppUsers() {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("app_users")
    .select("id, nom, role, telephone")
    .order("role");
  if (error) throw error;
  return (data || []).map((u) => ({
    nom: u.nom,
    role: ROLE_LABEL[u.role] || u.role,
    tel: u.telephone || "",
  }));
}

const ROLE_LABEL = {
  owner: "Propriétaire (owner)",
  admin: "Administrateur (admin)",
  agent: "Agent",
};

/** Seuils d'anomalie configurables du propriétaire courant. */
export async function getOwnerSettings() {
  const sb = requireSupabase();
  const { data, error } = await sb.from("owner_settings").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

/** Met à jour les seuils. @param {string} ownerId @param {Object} patch */
export async function updateOwnerSettings(ownerId, patch) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("owner_settings")
    .update(patch)
    .eq("owner_id", ownerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
