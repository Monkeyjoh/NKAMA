/**
 * NKAMA — Journal des décisions (audit).
 *
 * Enregistre les actions sensibles via la RPC `log_action` (auteur + IP
 * déterminés côté serveur, non falsifiables ; table append-only).
 * Non bloquant : un échec de journalisation n'interrompt jamais l'action.
 */
import { getSupabase } from "@/lib/supabase";

/** Types d'action (alignés sur l'enum log_action_type). */
export const LOG = {
  creation: "creation",
  modification: "modification",
  suppression: "suppression_logique",
  validation: "validation",
  rejet: "rejet",
  changement_statut: "changement_statut",
};

/**
 * @param {string} action  valeur de LOG
 * @param {string} entityType  ex. "expense", "maintenance_ticket", "property", "app_user", "parametre"
 * @param {string|null} entityId
 * @param {{label?:string, montant?:number}|null} apres
 * @param {string|null} motif  commentaire éventuel
 */
export async function logAction(action, entityType, entityId, apres = null, motif = null) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.rpc("log_action", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId || null,
      p_apres: apres,
      p_motif: motif,
    });
  } catch {
    /* journalisation best-effort */
  }
}
