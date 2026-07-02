/**
 * NKAMA — Service Maintenance (tickets). Supabase exclusivement.
 * @typedef {import("@/types/domain").MaintenanceTicket} MaintenanceTicket
 */
import { requireSupabase } from "@/services/_helpers";
import { mapTicket } from "@/lib/mappers";

/** @returns {Promise<MaintenanceTicket[]>} */
export async function listTickets() {
  const sb = requireSupabase();
  const { data, error } = await sb.from("tickets_view").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapTicket);
}

/** @param {string} id @returns {Promise<MaintenanceTicket | null>} */
export async function getTicket(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("tickets_view").select("*").eq("id", id).single();
  if (error) throw error;
  return mapTicket(data);
}

/** @param {Object} payload */
export async function createTicket(payload) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("maintenance_tickets").insert(payload).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id @param {string} statut @param {Object} [payload] */
export async function updateTicketStatut(id, statut, payload = {}) {
  const sb = requireSupabase();
  const patch = { statut };
  if (typeof payload.imputable === "boolean") patch.imputable_locataire = payload.imputable;
  const { data, error } = await sb.from("maintenance_tickets").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** Met à jour les champs généraux d'un ticket. @param {string} id @param {Object} patch */
export async function updateTicket(id, patch) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("maintenance_tickets").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id */
export async function deleteTicket(id) {
  const sb = requireSupabase();
  const { error } = await sb.from("maintenance_tickets").delete().eq("id", id);
  if (error) throw error;
  return true;
}
