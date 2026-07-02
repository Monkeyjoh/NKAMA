/**
 * NKAMA — Service Contrats (baux). Supabase exclusivement.
 * @typedef {import("@/types/domain").Contract} Contract
 */
import { requireSupabase } from "@/services/_helpers";
import { mapContract } from "@/lib/mappers";

/** @returns {Promise<Contract[]>} */
export async function listContracts() {
  const sb = requireSupabase();
  const { data, error } = await sb.from("contracts_view").select("*").order("date_debut", { ascending: false });
  if (error) throw error;
  return data.map(mapContract);
}

/** @param {Object} payload */
export async function createContract(payload) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("contracts").insert(payload).select().single();
  if (error) throw error;
  return data;
}

/** @param {string} id */
export async function endContract(id) {
  const sb = requireSupabase();
  const { error } = await sb.from("contracts").update({ actif: false, date_fin: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * Met un bien en location : crée le locataire, le bail actif, et (option)
 * génère 12 mois de loyers payés. Le bien devient « occupé ».
 * @param {{ ownerId:string, propertyId:string, loyer:number, dateDebut:string,
 *           dateFin?:string|null, tenant:{nom:string,telephone:string,whatsapp?:string,email?:string},
 *           generatePayments?:boolean }} params
 */
export async function rentOutProperty(params) {
  const { ownerId, propertyId, loyer, dateDebut, dateFin, tenant, generatePayments } = params;
  const sb = requireSupabase();

  // 1. Locataire
  const { data: t, error: e1 } = await sb
    .from("tenants")
    .insert({
      owner_id: ownerId, nom: tenant.nom, telephone: tenant.telephone,
      whatsapp: tenant.whatsapp || null, email: tenant.email || null,
    })
    .select()
    .single();
  if (e1) throw e1;

  // 2. Bail actif
  const { data: c, error: e2 } = await sb
    .from("contracts")
    .insert({
      property_id: propertyId, tenant_id: t.id, date_debut: dateDebut,
      date_fin: dateFin || null, loyer_mensuel: loyer, actif: true,
    })
    .select()
    .single();
  if (e2) throw e2;

  // 3. (option) 12 mois de loyers payés (sans décalage de fuseau)
  if (generatePayments) {
    const now = new Date();
    const rows = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mois = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      rows.push({ contract_id: c.id, mois, montant: loyer, statut: "paye", date_paiement: mois });
    }
    const { error: e3 } = await sb.from("payments").insert(rows);
    if (e3) throw e3;
  }
  return c;
}

/**
 * Fiche détaillée d'un contrat : bien, locataire, dates, historique de loyers.
 * @param {string} id
 */
export async function getContractDetail(id) {
  const sb = requireSupabase();
  const { data: c, error } = await sb
    .from("contracts")
    .select("id, date_debut, date_fin, loyer_mensuel, actif, properties(id, nom, quartier), tenants(id, nom, telephone, whatsapp)")
    .eq("id", id)
    .single();
  if (error) throw error;

  const { data: pays } = await sb
    .from("payments")
    .select("mois, montant, statut, date_paiement")
    .eq("contract_id", id)
    .order("mois", { ascending: false })
    .limit(12);

  return {
    id: c.id,
    bien: c.properties?.nom || "",
    quartier: c.properties?.quartier || "",
    propertyId: c.properties?.id || null,
    locataire: c.tenants?.nom || "",
    tel: c.tenants?.telephone || "",
    whatsapp: c.tenants?.whatsapp || c.tenants?.telephone || "",
    tenantId: c.tenants?.id || null,
    debut: c.date_debut,
    fin: c.date_fin,
    loyer: c.loyer_mensuel,
    actif: c.actif,
    paiements: pays || [],
  };
}
