/**
 * NKAMA — Service Paiements (payments). Supabase exclusivement.
 * Les agrégats financiers (mensuel, KPI) sont fournis par get_dashboard()
 * (voir dashboardService) — calculés intégralement côté base.
 */
import { requireSupabase } from "@/services/_helpers";

/** @param {Object} payload */
export async function recordPayment(payload) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("payments").insert(payload).select().single();
  if (error) throw error;
  return data;
}
