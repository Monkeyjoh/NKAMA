/**
 * NKAMA — Fonctions utilitaires partagées.
 */

/**
 * Formate un montant en FCFA (entier, séparateur d'espace).
 * @param {number} n
 * @returns {string}
 */
export function formatFCFA(n) {
  return Number(n || 0).toLocaleString("fr-FR").replace(/,/g, " ") + " FCFA";
}

/**
 * Rentabilité nette d'un bien sur 12 mois.
 * (Encaissé − Dépenses) / Encaissé, arrondi en %.
 * @param {{ encaisse12m: number, depenses12m: number }} p
 * @returns {number}
 */
export function rentabilite(p) {
  if (!p || !p.encaisse12m) return 0;
  return Math.round(((p.encaisse12m - p.depenses12m) / p.encaisse12m) * 100);
}

/**
 * Initiales (2 lettres max) à partir d'un nom complet.
 * @param {string} nom
 * @returns {string}
 */
export function initials(nom) {
  return String(nom || "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Couleur d'un score de fiabilité (0-100).
 * @param {number} score
 * @returns {string} variable CSS
 */
export function scoreColor(score) {
  if (score >= 80) return "var(--olive)";
  if (score >= 50) return "#8A6A1F";
  return "var(--rust)";
}

/**
 * Libellé d'un score de fiabilité.
 * @param {number} score
 * @returns {string}
 */
export function scoreLabel(score) {
  if (score >= 80) return "Fiable";
  if (score >= 50) return "À surveiller";
  return "Risque élevé";
}

/**
 * Couleur d'un taux de rentabilité.
 * @param {number} r
 * @returns {string}
 */
export function rentabiliteColor(r) {
  if (r >= 75) return "var(--olive)";
  if (r >= 50) return "#8A6A1F";
  return "var(--rust)";
}

/**
 * Lien WhatsApp à partir d'un numéro (nettoyé des caractères non numériques),
 * avec message pré-rempli optionnel. Sans numéro, WhatsApp propose de
 * choisir le destinataire (utile pour « Demander un justificatif »).
 * @param {string} tel
 * @param {string} [text] message pré-rempli
 * @returns {string}
 */
export function whatsappLink(tel, text) {
  const num = String(tel || "").replace(/[^0-9]/g, "");
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${num}${query}`;
}

/**
 * Lien d'appel téléphonique (`tel:`).
 * @param {string} tel
 * @returns {string}
 */
export function telLink(tel) {
  return `tel:${String(tel || "").replace(/[^0-9+]/g, "")}`;
}

/**
 * Concatène des classes conditionnelles (helper façon `clsx`).
 * @param  {...(string|false|null|undefined)} parts
 * @returns {string}
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Retourne la valeur d'option correspondant à un libellé OU à une valeur.
 * Utile pour pré-remplir un <select> à partir d'un objet déjà mappé (libellé).
 * @param {{value:string,label:string}[]} options
 * @param {string} labelOrValue
 * @returns {string}
 */
export function optionValue(options, labelOrValue) {
  if (labelOrValue == null) return "";
  const byVal = options.find((o) => o.value === labelOrValue);
  if (byVal) return byVal.value;
  const byLabel = options.find((o) => o.label === labelOrValue);
  return byLabel ? byLabel.value : "";
}
