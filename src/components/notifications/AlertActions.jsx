import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { formatFCFA, whatsappLink, telLink } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { markAlertTreated, createAlertReminder } from "@/services/alertActionsService";
import { invalidateNotifications } from "@/services/notificationsService";
import { invalidateDashboard } from "@/services/dashboardService";
import { decideExpense } from "@/services/expensesService";
import { updateTicket, updateTicketStatut } from "@/services/maintenanceService";
import { listContractors } from "@/services/contractorsService";
import { logAction, LOG } from "@/services/logService";
import {
  FormSheet, TextField, TextAreaField, SelectField, FormActions, FormError,
} from "@/components/ui/FormControls";
import {
  Phone, MessageCircle, Send, BellRing, CheckCircle2, RefreshCw,
  ExternalLink, UserCog, CheckCheck, XCircle, FileQuestion,
} from "lucide-react";

/**
 * NKAMA — Actions contextuelles d'une alerte (Phase 6).
 *
 * Affiche une rangée de boutons adaptés au type d'alerte, en réutilisant
 * les services existants (paiements, contrats, maintenance, dépenses) :
 *   • loyer_retard   : Appeler · WhatsApp · Relance · Rappel · Traité
 *   • contrat        : Renouveler · Prévenir · Rappel · Traité
 *   • bien_vacant    : Voir le bien · CRM · Rappel · Traité
 *   • ticket_ancien  : Ouvrir · Affecter · Clôturer · Rappel · Traité
 *   • depense_*      : Valider · Refuser · Demander justificatif · Rappel · Traité
 *   • rappel         : Ouvrir · Terminé
 *
 * « Marquer traité » masque l'alerte pour tout le compte (table
 * `alert_states`) ; « Rappel » crée un rappel personnel (table `reminders`)
 * qui reviendra en notification à l'échéance. Les caches dashboard +
 * notifications sont invalidés par le service.
 *
 * @param {{
 *   alert: { key: string, type: string, titre: string, detail: string,
 *            entity_type: string|null, entity_id: string|null,
 *            meta?: Object|null },
 *   onDone: (message: string) => void,  // toast + refetch côté parent
 *   onError?: (message: string) => void,
 * }} props
 */
export default function AlertActions({ alert, onDone, onError }) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // 'rappel' | 'affecter' | 'refuser'

  const meta = alert.meta || {};
  const tel = meta.telephone;
  const notify = (msg) => (onError || onDone)(msg);

  async function run(label, fn) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      onDone(label);
    } catch (e) {
      notify(e?.message ? `Échec — ${e.message}` : "Échec de l'action");
    } finally {
      setBusy(false);
    }
  }

  const treat = () =>
    run(alert.type === "rappel" ? "Rappel terminé" : "Alerte marquée traitée", () =>
      markAlertTreated(alert.key));

  /* ── Chips par type ─────────────────────────────────────── */
  const chips = [];
  const add = (key, icon, label, onClick, disabled = false, title) =>
    chips.push({ key, icon, label, onClick, disabled, title });

  const openExternal = (url) => window.open(url, "_blank", "noopener");

  switch (alert.type) {
    case "loyer_retard": {
      if (tel) {
        add("appeler", Phone, "Appeler", () => { window.location.href = telLink(tel); });
        add("whatsapp", MessageCircle, "WhatsApp", () => openExternal(whatsappLink(tel)));
        add("relance", Send, "Relance", () =>
          openExternal(whatsappLink(tel,
            `Bonjour ${meta.locataire || ""}, sauf erreur de notre part, le loyer de ${meta.bien || "votre logement"}` +
            `${meta.montant ? ` (${formatFCFA(meta.montant)})` : ""} reste impayé. Merci de régulariser rapidement.`)));
      }
      break;
    }
    case "contrat_echeance": {
      if (can("contract.manage") && alert.entity_id) {
        add("renouveler", RefreshCw, "Renouveler", () => navigate(ROUTES.contrat(alert.entity_id)));
      }
      if (tel) {
        add("prevenir", MessageCircle, "Prévenir", () =>
          openExternal(whatsappLink(tel,
            `Bonjour ${meta.locataire || ""}, votre bail pour ${meta.bien || "votre logement"} arrive à échéance` +
            `${meta.date_fin ? ` le ${meta.date_fin}` : " prochainement"}. Contactez-nous pour le renouvellement.`)));
      }
      break;
    }
    case "bien_vacant": {
      if (alert.entity_id) add("voir", ExternalLink, "Voir le bien", () => navigate(ROUTES.bien(alert.entity_id)));
      if (can("lead.manage")) add("crm", UserCog, "Chercher un locataire", () => navigate(ROUTES.crm));
      break;
    }
    case "ticket_ancien": {
      add("ouvrir", ExternalLink, "Ouvrir", () => navigate(ROUTES.maintenance));
      if (meta.statut === "signale" && can("ticket.update")) {
        add("affecter", UserCog, "Affecter", () => setModal("affecter"),
          meta.photo_avant === false, meta.photo_avant === false ? "Photo avant requise" : undefined);
      }
      if (meta.statut === "validation" && can("ticket.close")) {
        add("cloturer", CheckCheck, "Clôturer", () =>
          run("Ticket clôturé", async () => {
            await updateTicketStatut(alert.entity_id, "cloture");
            await logAction(LOG.changement_statut, "maintenance_ticket", alert.entity_id,
              { label: `Ticket clôturé — ${alert.detail}` });
            await markAlertTreated(alert.key);
          }));
      }
      break;
    }
    case "depense_sans_justificatif":
    case "depense_seuil": {
      if (meta.statut === "en_attente" && can("expense.validate")) {
        add("valider", CheckCheck, "Valider", () =>
          run("Dépense validée", async () => {
            await decideExpense(alert.entity_id, "validee");
            await markAlertTreated(alert.key);
          }));
        add("refuser", XCircle, "Refuser", () => setModal("refuser"));
      }
      if (alert.type === "depense_sans_justificatif") {
        add("justificatif", FileQuestion, "Demander justificatif", () =>
          openExternal(whatsappLink("",
            `Bonjour, merci d'envoyer le justificatif de la dépense${meta.montant ? ` de ${formatFCFA(meta.montant)}` : ""} (NKAMA).`)));
      }
      break;
    }
    default:
      break;
  }

  // Communes à toutes les alertes (sauf les rappels : « Terminé » suffit).
  if (alert.type !== "rappel") {
    add("rappel", BellRing, "Rappel", () => setModal("rappel"));
  }
  add("traite", CheckCircle2, alert.type === "rappel" ? "Terminé" : "Traité", treat);

  return (
    <>
      <div style={st.row} onClick={(e) => e.stopPropagation()}>
        {chips.map(({ key, icon: Icon, label, onClick, disabled, title }) => (
          <button
            key={key}
            style={{ ...st.chip, ...(disabled || busy ? st.chipDisabled : null) }}
            onClick={onClick}
            disabled={disabled || busy}
            title={title}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {modal === "rappel" && (
        <ReminderSheet alert={alert} onClose={() => setModal(null)}
          onSaved={() => { setModal(null); onDone("Rappel programmé"); }} onError={notify} />
      )}
      {modal === "affecter" && (
        <AssignSheet alert={alert} onClose={() => setModal(null)}
          onSaved={() => { setModal(null); onDone("Prestataire affecté"); }} />
      )}
      {modal === "refuser" && (
        <RejectSheet alert={alert} onClose={() => setModal(null)}
          onSaved={() => { setModal(null); onDone("Dépense refusée"); }} />
      )}
    </>
  );
}

/* ── Bottom-sheet : programmer un rappel ───────────────────── */
function ReminderSheet({ alert, onClose, onSaved, onError }) {
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const [date, setDate] = useState(tomorrow.toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    const remindAt = new Date(`${date}T${time || "09:00"}`);
    if (Number.isNaN(remindAt.getTime())) { setError(new Error("Date invalide")); return; }
    setSubmitting(true);
    setError(null);
    try {
      await createAlertReminder({
        titre: alert.titre + (alert.detail ? ` (${alert.detail})` : ""),
        detail: note || null,
        remindAt,
        alertKey: alert.key,
        entityType: alert.entity_type,
        entityId: alert.entity_id,
      });
      onSaved();
    } catch (e) {
      setError(e);
      onError?.("Échec de la programmation du rappel");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormSheet title="Programmer un rappel" onClose={onClose}>
      <TextField label="Date" type="date" value={date} onChange={setDate} required />
      <TextField label="Heure" type="time" value={time} onChange={setTime} />
      <TextAreaField label="Note (optionnel)" value={note} onChange={setNote}
        placeholder="Ex. relancer si toujours impayé" rows={2} />
      <FormError error={error} />
      <FormActions onCancel={onClose} onSubmit={submit} submitting={submitting} submitLabel="Programmer" />
    </FormSheet>
  );
}

/* ── Bottom-sheet : affecter un prestataire ────────────────── */
function AssignSheet({ alert, onClose, onSaved }) {
  const [contractors, setContractors] = useState([]);
  const [contractorId, setContractorId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listContractors()
      .then((list) => setContractors(list || []))
      .catch((e) => setError(e));
  }, []);

  async function submit() {
    if (!contractorId) { setError(new Error("Choisissez un prestataire")); return; }
    setSubmitting(true);
    setError(null);
    try {
      await updateTicket(alert.entity_id, { statut: "affecte", contractor_id: contractorId });
      await logAction(LOG.changement_statut, "maintenance_ticket", alert.entity_id,
        { label: `Ticket affecté — ${alert.detail}` });
      invalidateNotifications();
      invalidateDashboard();
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormSheet title="Affecter un prestataire" onClose={onClose}>
      <SelectField label="Prestataire" value={contractorId} onChange={setContractorId} required
        options={contractors.map((c) => ({ value: c.id, label: c.nom }))} placeholder="Choisir…" />
      <FormError error={error} />
      <FormActions onCancel={onClose} onSubmit={submit} submitting={submitting} submitLabel="Affecter" />
    </FormSheet>
  );
}

/* ── Bottom-sheet : refuser une dépense ────────────────────── */
function RejectSheet({ alert, onClose, onSaved }) {
  const [motif, setMotif] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await decideExpense(alert.entity_id, "rejetee", motif || undefined);
      await markAlertTreated(alert.key);
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormSheet title="Refuser la dépense" onClose={onClose}>
      <TextAreaField label="Motif du refus" value={motif} onChange={setMotif}
        placeholder="Ex. justificatif manquant, montant incohérent…" rows={3} />
      <FormError error={error} />
      <FormActions onCancel={onClose} onSubmit={submit} submitting={submitting} submitLabel="Refuser" />
    </FormSheet>
  );
}

const st = {
  row: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 10px", borderRadius: 99,
    border: "1px solid rgba(0,0,0,0.14)", background: "rgba(255,255,255,0.75)",
    color: "var(--ink)", fontSize: 12, fontWeight: 600, cursor: "pointer",
    lineHeight: 1.2,
  },
  chipDisabled: { opacity: 0.45, cursor: "not-allowed" },
};
