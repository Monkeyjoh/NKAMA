/**
 * NKAMA — Quittances de loyer & reçus de paiement (PDF, phase 7).
 *
 * Génération 100 % côté client avec jsPDF : aucun serveur, le PDF est
 * téléchargé directement. Mise en page sobre reprenant la palette de
 * l'application (terracotta / encre).
 */
import { PAYMENT_MODE_LABEL } from "@/lib/constants";
import { formatMonthFr } from "@/lib/mappers";

const INK = [42, 36, 32];        // var(--ink)
const INK_SOFT = [130, 120, 112];
const TERRACOTTA = [193, 88, 55];
const LINE = [225, 218, 210];

/* ── Nombre en toutes lettres (français) ───────────────────── */
const UNITS = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante",
  "soixante", "quatre-vingt", "quatre-vingt"];

function below100(n) {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) return TENS[t] + (u === 1 && t === 7 ? " et " : "-") + UNITS[10 + u];
  if (u === 0) return TENS[t] + (t === 8 ? "s" : "");
  if (u === 1 && t < 8) return TENS[t] + " et un";
  return TENS[t] + "-" + UNITS[u];
}
function below1000(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let s = "";
  if (h === 1) s = "cent";
  else if (h > 1) s = UNITS[h] + " cent" + (r === 0 ? "s" : "");
  if (r > 0) s += (s ? " " : "") + below100(r);
  return s || "zéro";
}

/** Convertit un entier (0 – 999 999 999) en toutes lettres. */
export function numberToFrench(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "zéro";
  const millions = Math.floor(n / 1e6);
  const thousands = Math.floor((n % 1e6) / 1e3);
  const rest = n % 1e3;
  const parts = [];
  if (millions) parts.push(millions === 1 ? "un million" : below1000(millions) + " millions");
  if (thousands) parts.push(thousands === 1 ? "mille" : below1000(thousands) + " mille");
  if (rest) parts.push(below1000(rest));
  return parts.join(" ");
}

function fcfa(n) {
  return `${Number(n || 0).toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
}
function frDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Génère et télécharge une quittance de loyer (paiement soldé) ou un reçu
 * de paiement partiel.
 *
 * @param {{
 *   bailleur: string,          // nom du bailleur / gestionnaire
 *   locataire: string,
 *   bien: string,
 *   quartier?: string,
 *   mois: string,              // ISO "YYYY-MM-01"
 *   loyer: number,             // loyer du mois (FCFA)
 *   montantPaye: number,       // total encaissé pour ce mois
 *   mode?: string,             // especes | mobile_money | …
 *   datePaiement?: string,     // ISO
 *   ville?: string,
 * }} data
 */
export async function generateRentReceipt(data) {
  // jsPDF est chargé à la demande : il ne pèse pas sur le bundle initial.
  const { jsPDF } = await import("jspdf");
  const {
    bailleur, locataire, bien, quartier, mois, loyer, montantPaye,
    mode, datePaiement, ville = "Libreville",
  } = data;
  const partiel = Number(montantPaye) < Number(loyer);
  const reste = Math.max(Number(loyer) - Number(montantPaye), 0);
  const periode = formatMonthFr(mois);
  const titre = partiel ? "REÇU DE PAIEMENT PARTIEL" : "QUITTANCE DE LOYER";

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 22; // marge
  let y = 26;

  /* En-tête */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...TERRACOTTA);
  doc.text("NKAMA", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK_SOFT);
  doc.text("Gestion locative", M, y + 5);
  doc.setDrawColor(...TERRACOTTA);
  doc.setLineWidth(0.8);
  doc.line(M, y + 10, W - M, y + 10);

  /* Titre + période */
  y += 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text(titre, W / 2, y, { align: "center" });
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...INK_SOFT);
  doc.text(`Période : ${periode}`, W / 2, y, { align: "center" });

  /* Bloc parties */
  y += 14;
  const rows = [
    ["Bailleur / Gestionnaire", bailleur || "—"],
    ["Locataire", locataire || "—"],
    ["Bien loué", [bien, quartier].filter(Boolean).join(" — ") || "—"],
  ];
  doc.setFontSize(10.5);
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK_SOFT);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(String(value), M + 58, y);
    y += 7;
  });

  /* Tableau montants */
  y += 4;
  const amounts = [
    ["Loyer du mois", fcfa(loyer)],
    ["Montant encaissé", fcfa(montantPaye)],
    ...(partiel ? [["Reste à percevoir", fcfa(reste)]] : []),
    ["Mode de paiement", PAYMENT_MODE_LABEL[mode] || mode || "—"],
    ["Date de paiement", frDate(datePaiement)],
  ];
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  amounts.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 246, 242);
      doc.rect(M, y - 5, W - 2 * M, 8, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK_SOFT);
    doc.setFontSize(10.5);
    doc.text(label, M + 3, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(String(value), W - M - 3, y, { align: "right" });
    y += 8;
  });
  doc.rect(M, y - 5 - amounts.length * 8, W - 2 * M, amounts.length * 8);

  /* Mention légale */
  y += 8;
  const somme = `${numberToFrench(montantPaye)} (${fcfa(montantPaye)})`;
  const mention = partiel
    ? `Je soussigné(e), ${bailleur}, déclare avoir reçu de ${locataire} la somme de ${somme} en paiement partiel du loyer du bien « ${bien} » pour la période de ${periode}. Le solde restant dû au titre de cette période s'élève à ${fcfa(reste)}. Ce reçu ne vaut pas quittance.`
    : `Je soussigné(e), ${bailleur}, déclare avoir reçu de ${locataire} la somme de ${somme} au titre du loyer et des charges du bien « ${bien} » pour la période de ${periode}, et lui en donne quittance, sous réserve de tous mes droits.`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(mention, W - 2 * M);
  doc.text(lines, M, y);
  y += lines.length * 5.5;

  /* Signature */
  y += 14;
  const today = new Date();
  doc.text(`Fait à ${ville}, le ${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`, M, y);
  y += 16;
  doc.setDrawColor(...INK_SOFT);
  doc.line(W - M - 60, y, W - M, y);
  doc.setFontSize(9);
  doc.setTextColor(...INK_SOFT);
  doc.text("Signature du bailleur / gestionnaire", W - M - 60, y + 5);

  /* Pied de page */
  doc.setFontSize(8);
  doc.setTextColor(...INK_SOFT);
  doc.text("Document généré par NKAMA — gestion locative", W / 2, 285, { align: "center" });

  const safe = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  const prefix = partiel ? "recu" : "quittance";
  doc.save(`${prefix}-${safe(locataire)}-${String(mois).slice(0, 7)}.pdf`);
}
