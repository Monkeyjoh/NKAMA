/**
 * NKAMA — Service Locataires (tenants). Supabase exclusivement.
 * @typedef {import("@/types/domain").Tenant} Tenant
 */
import { requireSupabase } from "@/services/_helpers";
import { mapTenant } from "@/lib/mappers";

/** @returns {Promise<Tenant[]>} */
export async function listTenants() {
  const sb = requireSupabase();
  const { data, error } = await sb.from("tenants_view").select("*").order("nom");
  if (error) throw error;
  return data.map(mapTenant);
}

/** @param {string} id @returns {Promise<Tenant | null>} */
export async function getTenant(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("tenants_view").select("*").eq("id", id).single();
  if (error) throw error;
  return mapTenant(data);
}

/** @param {string} id */
export async function recalcTenantScore(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("calculate_tenant_score", { p_tenant_id: id });
  if (error) throw error;
  return data;
}

/** @param {Object} payload */
export async function createTenant(payload) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("tenants").insert(payload).select().single();
  if (error) throw error;
  return data;
}

/**
 * Fiche détaillée d'un locataire : profil + bail + historique de paiements.
 * @param {string} id
 */
export async function getTenantDetail(id) {
  const sb = requireSupabase();
  const { data: t, error } = await sb.from("tenants_view").select("*").eq("id", id).single();
  if (error) throw error;

  const { data: contrats } = await sb
    .from("contracts")
    .select("id, date_debut, date_fin, loyer_mensuel, actif, properties(nom, quartier)")
    .eq("tenant_id", id)
    .order("date_debut", { ascending: false });

  const contractIds = (contrats || []).map((c) => c.id);
  let paiements = [];
  if (contractIds.length) {
    const { data: pays } = await sb
      .from("payments")
      .select("mois, montant, montant_paye, statut, mode_paiement, date_paiement, contract_id")
      .in("contract_id", contractIds)
      .order("mois", { ascending: false })
      .limit(12);
    paiements = pays || [];
  }

  return {
    id,
    nom: t.nom,
    bien: t.bien || "",
    tel: t.telephone,
    depuis: t.depuis || "",
    score: t.score ?? 0,
    contrats: (contrats || []).map((c) => ({
      id: c.id,
      bien: c.properties?.nom || "",
      quartier: c.properties?.quartier || "",
      debut: c.date_debut,
      fin: c.date_fin,
      loyer: c.loyer_mensuel,
      actif: c.actif,
    })),
    paiements,
  };
}
