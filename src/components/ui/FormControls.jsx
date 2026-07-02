/**
 * NKAMA — Boîte à outils de formulaires (bottom-sheet + champs réutilisables).
 *
 * Cohérent avec le design existant (papier / terracotta). Utilisé par tous les
 * formulaires de création / édition.
 */
import { S, fontDisplay } from "@/styles/sharedStyles";
import { X, Trash2, Loader2, AlertCircle } from "lucide-react";

/* ── Conteneur bottom-sheet ──────────────────────────────── */
export function FormSheet({ title, onClose, children }) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div style={S.modalTitle}>{title}</div>
          <button style={S.modalBack} onClick={onClose} aria-label="Fermer"><X size={20} /></button>
        </div>
        <div style={S.modalBody}>{children}</div>
      </div>
    </div>
  );
}

/* ── Champs ──────────────────────────────────────────────── */
export function TextField({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <label style={st.field}>
      <span style={st.label}>{label}{required && <span style={st.req}> *</span>}</span>
      <input
        style={st.input} type={type} value={value ?? ""} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function NumberField({ label, value, onChange, placeholder, required, suffix }) {
  return (
    <label style={st.field}>
      <span style={st.label}>{label}{required && <span style={st.req}> *</span>}</span>
      <div style={st.inputRow}>
        <input
          style={{ ...st.input, border: "none", flex: 1 }} type="number" inputMode="numeric"
          value={value ?? ""} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
        {suffix && <span style={st.suffix}>{suffix}</span>}
      </div>
    </label>
  );
}

export function SelectField({ label, value, onChange, options, required, placeholder = "—" }) {
  return (
    <label style={st.field}>
      <span style={st.label}>{label}{required && <span style={st.req}> *</span>}</span>
      <select style={st.input} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label style={st.field}>
      <span style={st.label}>{label}</span>
      <textarea
        style={{ ...st.input, resize: "vertical", minHeight: 64 }} rows={rows}
        value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function CheckboxField({ label, checked, onChange }) {
  return (
    <label style={st.checkRow}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </label>
  );
}

/* ── Bandeau d'erreur ────────────────────────────────────── */
export function FormError({ error }) {
  if (!error) return null;
  const msg = error?.message || String(error);
  return (
    <div style={st.error}>
      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{msg}</span>
    </div>
  );
}

/* ── Pied de formulaire : Enregistrer / Annuler / Supprimer ── */
export function FormActions({ onCancel, onSubmit, submitting, submitLabel = "Enregistrer", onDelete }) {
  return (
    <div style={st.actions}>
      {onDelete && (
        <button type="button" style={st.deleteBtn} onClick={onDelete} disabled={submitting} aria-label="Supprimer">
          <Trash2 size={16} />
        </button>
      )}
      <button type="button" style={st.cancelBtn} onClick={onCancel} disabled={submitting}>Annuler</button>
      <button type="button" style={{ ...st.submitBtn, opacity: submitting ? 0.6 : 1 }} onClick={onSubmit} disabled={submitting}>
        {submitting ? <Loader2 size={15} className="nk-spin" /> : null} {submitLabel}
      </button>
      <style>{"@keyframes nk-spin{to{transform:rotate(360deg)}}.nk-spin{animation:nk-spin 1s linear infinite;display:inline-block;vertical-align:middle}"}</style>
    </div>
  );
}

/* ── Dialogue de confirmation (suppression) ──────────────── */
export function ConfirmDialog({ title = "Confirmer la suppression", message, confirmLabel = "Supprimer", onConfirm, onCancel, busy }) {
  return (
    <div style={{ ...S.modalOverlay, alignItems: "center", zIndex: 70 }} onClick={onCancel}>
      <div style={st.confirmCard} onClick={(e) => e.stopPropagation()}>
        <div style={st.confirmTitle}>{title}</div>
        {message && <div style={st.confirmMsg}>{message}</div>}
        <div style={st.actions}>
          <button type="button" style={st.cancelBtn} onClick={onCancel} disabled={busy}>Annuler</button>
          <button type="button" style={{ ...st.dangerBtn, opacity: busy ? 0.6 : 1 }} onClick={onConfirm} disabled={busy}>
            {busy ? "Suppression…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const st = {
  field: { display: "block", marginBottom: 14 },
  label: { display: "block", fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 },
  req: { color: "var(--rust)" },
  input: {
    width: "100%", boxSizing: "border-box", border: "1px solid var(--line)", borderRadius: 9,
    padding: "10px 12px", fontSize: 14, color: "var(--ink)", background: "white", fontFamily: "inherit",
  },
  inputRow: { display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", borderRadius: 9, padding: "0 12px", background: "white" },
  suffix: { fontSize: 12, color: "var(--ink-soft)" },
  checkRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer" },
  error: { display: "flex", gap: 8, background: "#FBE9E2", color: "var(--rust)", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, marginBottom: 12, lineHeight: 1.4 },
  actions: { display: "flex", gap: 8, marginTop: 18, alignItems: "center" },
  cancelBtn: { background: "none", color: "var(--ink-soft)", border: "1px solid var(--line)", borderRadius: 9, padding: "11px 16px", fontSize: 13, fontWeight: 600 },
  submitBtn: { flex: 1, background: "var(--terracotta)", color: "white", border: "none", borderRadius: 9, padding: "11px 16px", fontSize: 13.5, fontWeight: 600 },
  deleteBtn: { background: "none", color: "var(--rust)", border: "1px solid var(--rust)", borderRadius: 9, padding: "10px 12px", display: "flex", alignItems: "center" },
  dangerBtn: { flex: 1, background: "var(--rust)", color: "white", border: "none", borderRadius: 9, padding: "11px 16px", fontSize: 13.5, fontWeight: 600 },
  confirmCard: { background: "var(--paper)", width: "100%", maxWidth: 360, margin: "0 18px", borderRadius: 14, padding: 20 },
  confirmTitle: { fontFamily: fontDisplay, fontSize: 17, marginBottom: 8 },
  confirmMsg: { fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 },
};
