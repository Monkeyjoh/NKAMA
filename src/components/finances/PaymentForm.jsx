import { useEffect, useMemo, useState } from "react";
import { S } from "@/styles/sharedStyles";
import { PAYMENT_MODE_OPTIONS } from "@/lib/constants";
import { formatFCFA } from "@/lib/utils";
import { formatMonthFr } from "@/lib/mappers";
import { useForm } from "@/hooks/useForm";
import { listContractPayments, recordRentPayment } from "@/services/paymentsService";
import { invalidateDashboard } from "@/services/dashboardService";
import { logAction, LOG } from "@/services/logService";
import {
  FormSheet, TextField, NumberField, SelectField, TextAreaField, FormActions, FormError,
} from "@/components/ui/FormControls";

/** ISO "YYYY-MM-01" du 1er du mois, avec décalage en mois. */
function monthIso(base, offset = 0) {
  const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Enregistrement d'un loyer (phase 7) : mois multiples, paiement partiel
 * (un seul mois), mode de paiement, note. Owner/admin uniquement.
 * @param {{
 *   tenant: { nom: string, contrats: Array<any> },
 *   onClose: () => void, onSaved: () => void,
 * }} props
 */
export default function PaymentForm({ tenant, onClose, onSaved }) {
  const contrats = tenant.contrats || [];
  const defaultContract = contrats.find((c) => c.actif) || contrats[0];
  const [contractId, setContractId] = useState(defaultContract?.id || "");
  const contract = contrats.find((c) => c.id === contractId) || defaultContract;

  const [months, setMonths] = useState([]); // [{ iso, label, statut, reste }]
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [selected, setSelected] = useState([]); // iso[]
  const { values, setField, submitting, setSubmitting, error, setError } = useForm({
    montant: "",
    mode: "especes",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  /* Mois proposés : du début du bail (18 mois max) au mois prochain. */
  useEffect(() => {
    if (!contract?.id) return;
    let cancelled = false;
    (async () => {
      setLoadingMonths(true);
      setSelected([]);
      try {
        const rows = await listContractPayments(contract.id);
        if (cancelled) return;
        const byMois = Object.fromEntries(rows.map((r) => [String(r.mois).slice(0, 10), r]));
        const now = new Date();
        const start = contract.debut ? new Date(contract.debut) : now;
        const list = [];
        for (let off = 1; off >= -17; off--) {
          const iso = monthIso(now, off);
          if (iso < monthIso(start, 0)) break;
          const row = byMois[iso];
          const loyer = row?.montant ?? contract.loyer ?? 0;
          const paye = row?.montant_paye ?? 0;
          const statut = row
            ? (row.statut === "paye" ? "paye" : paye > 0 ? "partiel" : row.statut)
            : "attendu";
          list.push({ iso, label: formatMonthFr(iso), statut, reste: Math.max(loyer - paye, 0) });
        }
        setMonths(list);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoadingMonths(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contract?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedMonths = useMemo(
    () => months.filter((m) => selected.includes(m.iso)),
    [months, selected]
  );
  const totalReste = selectedMonths.reduce((s, m) => s + m.reste, 0);
  const single = selectedMonths.length === 1;

  /* Montant par défaut : reste dû du mois sélectionné. */
  useEffect(() => {
    if (single) setField("montant", selectedMonths[0].reste);
  }, [selected.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(iso) {
    setSelected((prev) => (prev.includes(iso) ? prev.filter((x) => x !== iso) : [...prev, iso]));
  }

  async function submit() {
    setError(null);
    if (!contract?.id) { setError(new Error("Sélectionnez un bail.")); return; }
    if (selectedMonths.length === 0) { setError(new Error("Sélectionnez au moins un mois.")); return; }
    const montant = Number(values.montant);
    if (single && (!montant || montant <= 0)) { setError(new Error("Montant invalide.")); return; }
    if (single && montant > selectedMonths[0].reste) {
      setError(new Error(`Le montant dépasse le reste dû (${formatFCFA(selectedMonths[0].reste)}).`));
      return;
    }
    setSubmitting(true);
    try {
      // Mois multiples : chaque mois est soldé ; mois unique : montant saisi
      // (paiement partiel possible).
      const ordered = [...selectedMonths].sort((a, b) => (a.iso < b.iso ? -1 : 1));
      for (const m of ordered) {
        await recordRentPayment(
          contract.id, m.iso,
          single ? montant : m.reste,
          values.mode, values.date, values.note || null
        );
      }
      invalidateDashboard();
      logAction(LOG.creation, "payment", contract.id, {
        label: `Loyer encaissé — ${tenant.nom} (${ordered.map((m) => m.label).join(", ")})`,
        montant: single ? montant : totalReste,
      }).catch(() => {});
      onSaved();
      onClose();
    } catch (e) {
      setError(e);
      setSubmitting(false);
    }
  }

  const contractOptions = contrats.map((c) => ({
    value: c.id,
    label: `${c.bien}${c.actif ? "" : " (terminé)"} — ${formatFCFA(c.loyer)}`,
  }));

  return (
    <FormSheet title={`Encaisser un loyer — ${tenant.nom}`} onClose={onClose}>
      <FormError error={error} />
      {contrats.length > 1 && (
        <SelectField label="Bail" value={contractId} onChange={setContractId}
          options={contractOptions} required placeholder="Choisir un bail" />
      )}

      <div style={st.label}>Mois concernés *</div>
      {loadingMonths && <div style={S.emptyInline}>Chargement des mois…</div>}
      {!loadingMonths && (
        <div style={st.monthList}>
          {months.map((m) => {
            const isPaye = m.statut === "paye";
            const checked = selected.includes(m.iso);
            return (
              <label key={m.iso} style={{ ...st.monthRow, opacity: isPaye ? 0.45 : 1 }}>
                <input type="checkbox" checked={checked} disabled={isPaye}
                  onChange={() => toggle(m.iso)} style={st.checkbox} />
                <span style={{ flex: 1, textTransform: "capitalize" }}>{m.label}</span>
                <span style={st.monthMeta}>
                  {isPaye ? "Payé" : m.statut === "partiel"
                    ? `Reste ${formatFCFA(m.reste)}`
                    : formatFCFA(m.reste)}
                </span>
              </label>
            );
          })}
          {months.length === 0 && <div style={S.emptyInline}>Aucun mois disponible.</div>}
        </div>
      )}

      {single ? (
        <NumberField label="Montant encaissé (FCFA)" value={values.montant}
          onChange={(v) => setField("montant", v)} required
          placeholder={String(selectedMonths[0]?.reste || "")} />
      ) : selectedMonths.length > 1 ? (
        <div style={st.totalNote}>
          {selectedMonths.length} mois seront soldés — total : <b>{formatFCFA(totalReste)}</b>
        </div>
      ) : null}
      {single && Number(values.montant) > 0 && Number(values.montant) < selectedMonths[0].reste && (
        <div style={st.partialNote}>
          Paiement partiel : il restera {formatFCFA(selectedMonths[0].reste - Number(values.montant))} à percevoir.
        </div>
      )}

      <SelectField label="Mode de paiement" value={values.mode}
        onChange={(v) => setField("mode", v)} options={PAYMENT_MODE_OPTIONS} required placeholder="—" />
      <TextField label="Date d'encaissement" type="date" value={values.date}
        onChange={(v) => setField("date", v)} required />
      <TextAreaField label="Note (optionnel)" value={values.note}
        onChange={(v) => setField("note", v)} placeholder="Référence Mobile Money, remarque…" rows={2} />

      <FormActions onCancel={onClose} onSubmit={submit} submitting={submitting}
        submitLabel="Enregistrer le paiement" />
    </FormSheet>
  );
}

const st = {
  label: { fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 },
  monthList: { border: "1px solid var(--line)", borderRadius: 10, background: "white", maxHeight: 210, overflowY: "auto", marginBottom: 14 },
  monthRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "1px solid var(--line)", fontSize: 13 },
  checkbox: { width: 16, height: 16, accentColor: "var(--terracotta)" },
  monthMeta: { fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 600 },
  totalNote: { fontSize: 12.5, color: "var(--ink)", background: "var(--paper-dim)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", marginBottom: 14 },
  partialNote: { fontSize: 11.5, color: "var(--terracotta)", marginTop: -8, marginBottom: 12 },
};
