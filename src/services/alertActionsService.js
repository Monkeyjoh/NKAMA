/**
 * NKAMA — Service Actions d'alerte (Phase 6).
 *
 * « Marquer traité » (table `alert_states`, partagé au niveau du compte) et
 * « programmer un rappel » (table `reminders`, par utilisateur). Les deux
 * passent par des RPC security invoker (RLS). Toute mutation invalide les
 * caches dashboard + notifications : l'alerte disparaît / le rappel
 * apparaîtra partout de façon cohérente.
 */
import { requireSupabase } from "@/services/_helpers";
import { invalidateNotifications } from "@/services/notificationsService";
import { invalidateDashboard } from "@/services/dashboardService";

/**
 * Marque une alerte comme traitée (elle disparaît du dashboard et des
 * notifications pour tout le compte). Sur une clé `rappel:<id>`, termine
 * le rappel de l'utilisateur courant.
 * @param {string} key clé stable de l'alerte (`type:entity_id`)
 * @returns {Promise<void>}
 */
export async function markAlertTreated(key) {
  const sb = requireSupabase();
  const { error } = await sb.rpc("mark_alert_treated", { p_key: key });
  if (error) throw error;
  invalidateNotifications();
  invalidateDashboard();
}

/**
 * Programme un rappel : il apparaîtra comme notification `rappel` à
 * l'échéance, pour l'utilisateur courant uniquement.
 * @param {{ titre: string, remindAt: string|Date, detail?: string,
 *           alertKey?: string, entityType?: string, entityId?: string }} params
 * @returns {Promise<string>} id du rappel créé
 */
export async function createAlertReminder({ titre, remindAt, detail, alertKey, entityType, entityId }) {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("create_alert_reminder", {
    p_titre: titre,
    p_remind_at: remindAt instanceof Date ? remindAt.toISOString() : remindAt,
    p_detail: detail ?? null,
    p_alert_key: alertKey ?? null,
    p_entity_type: entityType ?? null,
    p_entity_id: entityId ?? null,
  });
  if (error) throw error;
  invalidateNotifications();
  invalidateDashboard();
  return data;
}
