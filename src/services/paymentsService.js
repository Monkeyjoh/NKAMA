/**
 * NKAMA — Service Paiements (payments). Supabase exclusivement.
 * Les agrégats financiers (mensuel, KPI) sont fournis par get_dashboard()
 * (voir dashboardService) — calculés intégralement côté base.
 *
 * Phase 7 : enregistrement des loyers via la RPC `record_rent_payment`
 * (mois multiples, paiement partiel, mode de paiement).
 */
import { requireSupabase } from "@/services/_helpers";

/** Modes de paiement admis (miroir de la contrainte SQL). */
export const PAYMENT_MODES = ["especes", "mobile_money", "virement", "cheque", "autre"];

/** @param {Object} payload */
export async function recordPayment(payload) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("payments").insert(payload).select().single();
  if (error) throw error;
  return data;
}

/**
 * Historique complet des paiements d'un contrat (du plus récent au plus
 * ancien). Sert au formulaire d'encaissement et aux quittances.
 * @param {string} contractId
 */
export async function listContractPayments(contractId) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("payments")
    .select("id, mois, montant, montant_paye, statut, mode_paiement, date_paiement, note")
    .eq("contract_id", contractId)
    .order("mois", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Enregistre un loyer (total ou partiel) pour un mois donné.
 * La RPC crée la ligne du mois si nécessaire, cumule les paiements
 * partiels et passe le statut à « payé » quand le loyer est soldé.
 *
 * @param {string} contractId
 * @param {string} mois        ISO "YYYY-MM-01"
 * @param {number} montant     montant encaissé (FCFA)
 * @param {string} [mode]      especes | mobile_money | virement | cheque | autre
 * @param {string} [date]      date d'encaissement (ISO)
 * @param {string} [note]
 */
export async function recordRentPayment(contractId, mois, montant, mode = "especes", date = null, note = null) {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("record_rent_payment", {
    p_contract_id: contractId,
    p_mois: mois,
    p_montant: montant,
    p_mode: mode,
    p_date: date || new Date().toISOString().slice(0, 10),
    p_note: note,
  });
  if (error) throw error;
  return data;
}
