/**
 * NKAMA — Service Prospects (leads / CRM). Supabase exclusivement.
 * @typedef {import("@/types/domain").Lead} Lead
 */
import { requireSupabase } from "@/services/_helpers";
import { mapLead, LEAD_STATUT_UI_TO_DB } from "@/lib/mappers";

/** @returns {Promise<Lead[]>} */
export async function listLeads() {
  const sb = requireSupabase();
  const { data, error } = await sb.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapLead);
}

/** @param {string} id @returns {Promise<Lead | null>} */
export async function getLead(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("leads").select("*").eq("id", id).single();
  if (error) throw error;
  return mapLead(data);
}

/** @param {Object} payload */
export async function createLead(payload) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("leads").insert(payload).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id @param {string} statutUi */
export async function updateLeadStatut(id, statutUi) {
  const sb = requireSupabase();
  const statut = LEAD_STATUT_UI_TO_DB[statutUi] || statutUi;
  const { data, error } = await sb.from("leads").update({ statut }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id */
export async function convertLeadToTenant(id) {
  const sb = requireSupabase();
  const { data: lead, error: e1 } = await sb.from("leads").select("*").eq("id", id).single();
  if (e1) throw e1;
  const { data: tenant, error: e2 } = await sb
    .from("tenants")
    .insert({
      owner_id: lead.owner_id, lead_origin_id: lead.id, nom: lead.nom,
      telephone: lead.telephone, whatsapp: lead.whatsapp, email: lead.email,
    })
    .select()
    .single();
  if (e2) throw e2;
  await sb.from("leads").update({ statut: "signe" }).eq("id", id);
  return tenant;
}

/** @param {string} id @param {Object} patch */
export async function updateLead(id, patch) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("leads").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id */
export async function deleteLead(id) {
  const sb = requireSupabase();
  const { error } = await sb.from("leads").delete().eq("id", id);
  if (error) throw error;
  return true;
}
