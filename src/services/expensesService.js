/**
 * NKAMA — Service Dépenses (expenses). Supabase exclusivement.
 * @typedef {import("@/types/domain").Expense} Expense
 */
import { requireSupabase } from "@/services/_helpers";
import { mapExpense } from "@/lib/mappers";

/** @returns {Promise<Expense[]>} */
export async function listExpenses() {
  const sb = requireSupabase();
  const { data, error } = await sb.from("expenses_view").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapExpense);
}

/** @param {Object} payload */
export async function createExpense(payload) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("expenses").insert(payload).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id @param {"validee"|"rejetee"} statut @param {string} [motif] */
export async function decideExpense(id, statut, motif) {
  const sb = requireSupabase();
  const patch = { statut };
  if (statut === "rejetee" && motif) patch.motif_rejet = motif;
  const { data, error } = await sb.from("expenses").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id @param {Object} patch */
export async function updateExpense(id, patch) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("expenses").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id */
export async function deleteExpense(id) {
  const sb = requireSupabase();
  const { error } = await sb.from("expenses").delete().eq("id", id);
  if (error) throw error;
  return true;
}
