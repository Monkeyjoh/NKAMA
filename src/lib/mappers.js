/**
 * NKAMA — Adaptateurs (mappers) lignes Supabase → modèles de vue UI.
 *
 * Les composants attendent des objets « view-model » (libellés capitalisés,
 * statuts CRM courts, dates formatées en français…). Les vues SQL
 * (properties_view, tickets_view, expenses_view) font le gros du travail ;
 * ces mappers finalisent la mise en forme et garantissent que l'UI reste
 * identique, qu'on soit en mock ou sur Supabase.
 */

/* ── Tables de correspondance enum DB ⇄ libellés UI ───────────── */

export const PROPERTY_TYPE_LABEL = {
  studio: "Studio",
  appartement: "Appartement",
  villa: "Villa",
  local_commercial: "Local commercial",
};

export const TICKET_CATEGORIE_LABEL = {
  electricite: "Électricité",
  plomberie: "Plomberie",
  maconnerie: "Maçonnerie",
  autre: "Autre",
};

export const TICKET_PRIORITE_LABEL = {
  urgent: "Urgent",
  normal: "Normal",
  preventif: "Préventif",
};

export const EXPENSE_CATEGORIE_LABEL = {
  maintenance: "Maintenance",
  taxes: "Taxes",
  assurance: "Assurance",
  gestion: "Gestion",
  autre: "Autre",
};

export const CONTRACTOR_CATEGORIE_LABEL = {
  electricien: "Électricien",
  plombier: "Plombier",
  macon: "Maçon",
  agent_immobilier: "Agent immobilier",
  gardien: "Gardien",
  autre: "Autre",
};

/** Statut prospect : DB → clé courte utilisée par l'UI CRM. */
export const LEAD_STATUT_DB_TO_UI = {
  nouveau: "nouveau",
  visite_prevue: "visite",
  dossier_recu: "dossier",
  signe: "signe",
  refuse: "refuse",
};
/** Statut prospect : clé UI → valeur DB. */
export const LEAD_STATUT_UI_TO_DB = {
  nouveau: "nouveau",
  visite: "visite_prevue",
  dossier: "dossier_recu",
  signe: "signe",
  refuse: "refuse",
};

/* ── Helpers ──────────────────────────────────────────────────── */

/** Formate une date ISO en "23 juin 2026". @param {string} iso */
export function formatDateFr(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Formate un horodatage en "23 juin 2026, 14:22". @param {string} iso */
export function formatDateFrTime(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Formate un mois ISO ("2026-06-01") en "juin 2026". */
export function formatMonthFr(iso) {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{2})/);
  if (!m) return iso;
  try {
    return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" })
      .format(new Date(Number(m[1]), Number(m[2]) - 1, 1));
  } catch {
    return iso;
  }
}

/** Formate une date ISO ("2024-03-01") en "01/03/2024" (sans décalage TZ). */
export function formatDateShort(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

/* ── Mappers ──────────────────────────────────────────────────── */

/** properties_view → modèle UI bien. */
export function mapProperty(row) {
  return {
    id: row.id,
    nom: row.nom,
    quartier: row.quartier,
    adresse: row.adresse,
    type: PROPERTY_TYPE_LABEL[row.type] || row.type,
    chambres: row.chambres,
    surface: row.surface_m2 ?? row.surface,
    loyer: row.loyer_mensuel ?? row.loyer,
    statut: row.statut, // "occupé" | "vacant" (fourni par la vue)
    photos: row.photos ?? 0,
    encaisse12m: row.encaisse12m ?? 0,
    depenses12m: row.depenses12m ?? 0,
    net: row.net ?? 0,
    tenant: row.tenant_id
      ? { nom: row.tenant_nom, tel: row.tenant_tel, depuis: row.tenant_depuis, score: row.tenant_score ?? 0 }
      : null,
    travaux: [],
    documents: [],
  };
}

/** tenants → modèle UI locataire. */
export function mapTenant(row) {
  return {
    id: row.id,
    nom: row.nom,
    bien: row.bien || "",
    tel: row.telephone || row.tel,
    depuis: row.depuis || "",
    score: row.score ?? 0,
  };
}

/** leads → modèle UI prospect. */
export function mapLead(row) {
  return {
    id: row.id,
    nom: row.nom,
    tel: row.telephone,
    whatsapp: row.whatsapp || row.telephone,
    email: row.email || "",
    budget: row.budget_max ?? 0,
    type: PROPERTY_TYPE_LABEL[row.type_recherche] || row.type_recherche || "",
    zone: row.zone_recherchee || "",
    statut: LEAD_STATUT_DB_TO_UI[row.statut] || row.statut,
    source: row.source,
    prochaineAction: row.prochaine_action || null,
    dossierComplet: Boolean(row.dossier_complet),
    historique: row.historique || [],
  };
}

/** contractors → modèle UI prestataire. */
export function mapContractor(row) {
  const cat = Array.isArray(row.categories) ? row.categories[0] : row.categorie;
  return {
    id: row.id,
    nom: row.nom,
    categorie: CONTRACTOR_CATEGORIE_LABEL[cat] || cat || "Autre",
    zone: row.zone_intervention || row.zone || "",
    tel: row.telephone || row.tel,
    note: row.note_moyenne ?? row.note ?? null,
  };
}

/** tickets_view → modèle UI ticket. */
export function mapTicket(row) {
  return {
    id: row.id,
    bien: row.bien,
    locataire: row.locataire || "",
    titre: row.titre,
    categorie: TICKET_CATEGORIE_LABEL[row.categorie] || row.categorie,
    priorite: TICKET_PRIORITE_LABEL[row.priorite] || row.priorite,
    statut: row.statut,
    photoAvant: Boolean(row.photo_avant),
    photoApres: Boolean(row.photo_apres),
    facture: Boolean(row.facture),
    prestataire: row.prestataire || null,
    montant: row.montant_facture ?? null,
    dateSignalement: formatDateFr(row.created_at),
    imputable: row.imputable_locataire ?? undefined,
  };
}

/** expenses_view → modèle UI dépense. */
export function mapExpense(row) {
  return {
    id: row.id,
    categorie: EXPENSE_CATEGORIE_LABEL[row.categorie] || row.categorie,
    bien: row.bien || "Tous biens",
    montant: row.montant,
    statut: row.statut,
    justificatif: Boolean(row.justificatif),
    date: formatDateFr(row.created_at),
    motif: row.motif_rejet || undefined,
  };
}

/** contracts_view → modèle UI contrat. */
export function mapContract(row) {
  return {
    id: row.id,
    bien: row.bien,
    locataire: row.locataire,
    debut: formatDateShort(row.date_debut),
    fin: formatDateShort(row.date_fin),
    loyer: row.loyer_mensuel,
    echeance: Boolean(row.echeance),
  };
}

/** Libellés d'action du journal. */
export const ACTION_LABELS = {
  creation: "Création",
  modification: "Modification",
  suppression_logique: "Suppression",
  validation: "Validation",
  rejet: "Rejet",
  changement_statut: "Changement de statut",
  connexion: "Connexion",
  recalcul_score: "Recalcul de score",
};

/** activity_logs_view → modèle UI journal (enrichi). */
export function mapActivityLog(row) {
  return {
    id: row.id,
    action: ACTION_LABELS[row.action_type] || row.action_type,
    entite: row.entity_label || `${row.entity_type} ${row.entity_id || ""}`,
    montant: row.montant ?? null,
    commentaire: row.motif || null,
    ip: row.ip_adresse || null,
    auteur: row.auteur_nom || "Système",
    date: formatDateFrTime(row.horodatage),
  };
}
