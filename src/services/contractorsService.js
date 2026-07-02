/**
 * NKAMA — Service Prestataires (contractors). Supabase exclusivement.
 *
 * Les prestataires sont un annuaire partagé entre propriétaires. La note de
 * confiance est propre à la relation propriétaire ↔ prestataire
 * (table property_owner_contractors).
 * @typedef {import("@/types/domain").Contractor} Contractor
 */
import { requireSupabase } from "@/services/_helpers";
import { mapContractor } from "@/lib/mappers";

/** @returns {Promise<Contractor[]>} */
export async function listContractors() {
  const sb = requireSupabase();
  const { data, error } = await sb.from("contractors_view").select("*").order("nom");
  if (error) throw error;
  return data.map(mapContractor);
}

/** @param {string} id @returns {Promise<Contractor | null>} */
export async function getContractor(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("contractors_view").select("*").eq("id", id).single();
  if (error) throw error;
  return mapContractor(data);
}

/**
 * Crée un prestataire et le rattache au propriétaire courant (avec sa note).
 * @param {{ nom:string, telephone:string, whatsapp?:string, zone_intervention?:string,
 *           categorie?:string, note?:number }} payload
 * @param {string} ownerId
 */
export async function createContractor(payload, ownerId) {
  const sb = requireSupabase();
  const { categorie, note, ...rest } = payload;
  const { data: contractor, error } = await sb
    .from("contractors")
    .insert({ ...rest, categories: categorie ? [categorie] : [] })
    .select()
    .single();
  if (error) throw error;

  const { error: e2 } = await sb
    .from("property_owner_contractors")
    .insert({ owner_id: ownerId, contractor_id: contractor.id, note_moyenne: note ?? null });
  if (e2) throw e2;
  return contractor;
}

/**
 * Met à jour un prestataire (champs annuaire) et, si fournie, sa note relation.
 * @param {string} id @param {Object} payload @param {string} ownerId
 */
export async function updateContractor(id, payload, ownerId) {
  const sb = requireSupabase();
  const { categorie, note, ...rest } = payload;
  const patch = { ...rest };
  if (categorie) patch.categories = [categorie];
  const { data, error } = await sb.from("contractors").update(patch).eq("id", id).select().single();
  if (error) throw error;

  if (note != null && ownerId) {
    await sb
      .from("property_owner_contractors")
      .upsert({ owner_id: ownerId, contractor_id: id, note_moyenne: note }, { onConflict: "owner_id,contractor_id" });
  }
  return data;
}

/**
 * Retire le prestataire de l'annuaire du propriétaire courant (relation).
 * @param {string} id @param {string} ownerId
 */
export async function unlinkContractor(id, ownerId) {
  const sb = requireSupabase();
  const { error } = await sb
    .from("property_owner_contractors")
    .delete()
    .eq("owner_id", ownerId)
    .eq("contractor_id", id);
  if (error) throw error;
  return true;
}
