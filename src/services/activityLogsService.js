/**
 * NKAMA — Service Journal d'audit (activity_logs). Supabase exclusivement.
 * @typedef {import("@/types/domain").ActivityLog} ActivityLog
 */
import { requireSupabase } from "@/services/_helpers";
import { mapActivityLog } from "@/lib/mappers";

/** @returns {Promise<ActivityLog[]>} */
export async function listActivityLogs() {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("activity_logs_view")
    .select("*")
    .order("horodatage", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map(mapActivityLog);
}
