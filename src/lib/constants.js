/**
 * NKAMA — Constantes métier & configuration UI.
 */

/** Chemins de routes centralisés. */
export const ROUTES = {
  dashboard: "/",
  biens: "/biens",
  bien: (id = ":id") => `/biens/${id}`,
  crm: "/crm",
  finances: "/finances",
  plus: "/plus",
  maintenance: "/maintenance",
  locataires: "/locataires",
  locataire: (id = ":id") => `/locataires/${id}`,
  prestataires: "/prestataires",
  contrats: "/contrats",
  contrat: (id = ":id") => `/contrats/${id}`,
  controle: "/controle",
  parametres: "/parametres",
  utilisateurs: "/utilisateurs",
  profil: "/profil",
  notifications: "/notifications",
};

/**
 * Onglets de la barre de navigation basse.
 * `roles` = rôles autorisés (absent → tous les rôles).
 */
export const NAV_ITEMS = [
  { key: "dashboard", label: "Accueil", icon: "Home", path: ROUTES.dashboard },
  { key: "biens", label: "Biens", icon: "Building2", path: ROUTES.biens },
  { key: "crm", label: "CRM", icon: "UserPlus", path: ROUTES.crm, roles: ["owner", "admin"] },
  { key: "finances", label: "Finances", icon: "Wallet", path: ROUTES.finances, roles: ["owner", "admin"] },
  { key: "plus", label: "Plus", icon: "ClipboardList", path: ROUTES.plus },
];

/** Étapes du pipeline CRM (prospects). */
export const CRM_STATUTS = [
  { key: "nouveau", label: "Nouveau", color: "var(--ink-soft)" },
  { key: "visite", label: "Visite prévue", color: "#8A6A1F" },
  { key: "dossier", label: "Dossier reçu", color: "var(--terracotta)" },
  { key: "signe", label: "Signé", color: "var(--olive)" },
  { key: "refuse", label: "Refusé", color: "var(--rust)" },
];

/** Étapes du pipeline Maintenance. */
export const MAINT_ETAPES = [
  { key: "signale", label: "Signalé" },
  { key: "affecte", label: "Affecté" },
  { key: "en_cours", label: "En cours" },
  { key: "validation", label: "Validation" },
  { key: "cloture", label: "Clôturé" },
];

/** Métadonnées d'affichage des statuts de ticket. */
export const STATUT_META = {
  signale: { label: "Signalé", color: "var(--ink-soft)", bg: "var(--paper-dim)" },
  affecte: { label: "Affecté", color: "#8A6A1F", bg: "#FBF1DE" },
  en_cours: { label: "En cours", color: "var(--terracotta)", bg: "var(--terracotta-dim)" },
  validation: { label: "À valider", color: "#8A6A1F", bg: "#FBF1DE" },
  cloture: { label: "Clôturé", color: "var(--olive)", bg: "#E7EDE0" },
};

/** Couleurs par priorité de ticket. */
export const PRIORITE_META = {
  Urgent: { color: "var(--rust)" },
  Normal: { color: "var(--terracotta)" },
  Préventif: { color: "var(--ink-soft)" },
};

/** Métadonnées d'affichage des statuts de paiement. */
export const PAY_STATUT = {
  paye: { label: "Payé", color: "var(--olive)", bg: "#E7EDE0" },
  en_retard: { label: "En retard", color: "var(--rust)", bg: "#FBE9E2" },
  attendu: { label: "Attendu", color: "#8A6A1F", bg: "#FBF1DE" },
};

/** Métadonnées d'affichage des statuts de dépense. */
export const EXP_STATUT = {
  en_attente: { label: "En attente", color: "#8A6A1F", bg: "#FBF1DE" },
  validee: { label: "Validée", color: "var(--olive)", bg: "#E7EDE0" },
  rejetee: { label: "Rejetée", color: "var(--rust)", bg: "#FBE9E2" },
};

/* ── Options de formulaires (valeur DB → libellé affiché) ──── */

export const PROPERTY_TYPE_OPTIONS = [
  { value: "studio", label: "Studio" },
  { value: "appartement", label: "Appartement" },
  { value: "villa", label: "Villa" },
  { value: "local_commercial", label: "Local commercial" },
];

export const LEAD_SOURCE_OPTIONS = [
  { value: "recommandation", label: "Recommandation" },
  { value: "annonce", label: "Annonce" },
  { value: "agent", label: "Agent" },
  { value: "autre", label: "Autre" },
];

export const TICKET_CATEGORIE_OPTIONS = [
  { value: "electricite", label: "Électricité" },
  { value: "plomberie", label: "Plomberie" },
  { value: "maconnerie", label: "Maçonnerie" },
  { value: "autre", label: "Autre" },
];

export const TICKET_PRIORITE_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "normal", label: "Normal" },
  { value: "preventif", label: "Préventif" },
];

export const CONTRACTOR_CATEGORIE_OPTIONS = [
  { value: "electricien", label: "Électricien" },
  { value: "plombier", label: "Plombier" },
  { value: "macon", label: "Maçon" },
  { value: "agent_immobilier", label: "Agent immobilier" },
  { value: "gardien", label: "Gardien" },
  { value: "autre", label: "Autre" },
];

// Les dépenses « maintenance » sont générées depuis les tickets (justificatif
// obligatoire en base) → on ne propose ici que les catégories manuelles.
export const EXPENSE_CATEGORIE_OPTIONS = [
  { value: "taxes", label: "Taxes" },
  { value: "assurance", label: "Assurance" },
  { value: "gestion", label: "Gestion" },
  { value: "autre", label: "Autre" },
];
