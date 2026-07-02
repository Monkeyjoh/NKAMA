/**
 * NKAMA — Service Biens (properties). Supabase exclusivement.
 * @typedef {import("@/types/domain").Property} Property
 */
import { requireSupabase } from "@/services/_helpers";
import { mapProperty, formatDateFr } from "@/lib/mappers";

/** @returns {Promise<Property[]>} */
export async function listProperties() {
  const sb = requireSupabase();
  const { data, error } = await sb.from("properties_view").select("*").order("nom");
  if (error) throw error;
  return data.map(mapProperty);
}

/** @param {string} id @returns {Promise<Property | null>} */
export async function getProperty(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("properties_view").select("*").eq("id", id).single();
  if (error) throw error;
  const property = mapProperty(data);

  const [{ data: tickets }, { data: docs }] = await Promise.all([
    sb.from("tickets_view").select("*").eq("property_id", id).eq("statut", "cloture"),
    sb.from("documents").select("*").eq("entity_type", "property").eq("entity_id", id),
  ]);
  property.travaux = (tickets || []).map((t) => ({
    id: t.id, date: formatDateFr(t.created_at), titre: t.titre, montant: t.montant_facture, statut: "validee",
  }));
  property.documents = (docs || []).map((d) => ({
    id: d.id, nom: d.nom_fichier, type: d.type_fichier, taille: "",
  }));
  return property;
}

/** @param {Partial<Property>} payload */
export async function createProperty(payload) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("properties").insert(payload).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id @param {Partial<Property>} payload */
export async function updateProperty(id, payload) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("properties").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id */
export async function deleteProperty(id) {
  const sb = requireSupabase();
  const { error } = await sb.from("properties").delete().eq("id", id);
  if (error) throw error;
  return true;
}
