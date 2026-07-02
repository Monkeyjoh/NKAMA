import { useEffect, useState } from "react";
import { S } from "@/styles/sharedStyles";
import { ROLE_LABELS } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useForm } from "@/hooks/useForm";
import { useProperties } from "@/hooks/useProperties";
import {
  createUser, updateUser, deleteUser, setUserStatut,
  listUserAssignments, setUserAssignments,
} from "@/services/usersService";
import { logAction, LOG } from "@/services/logService";
import {
  FormSheet, TextField, SelectField, CheckboxField, FormActions, FormError, ConfirmDialog,
} from "@/components/ui/FormControls";
import { Ban, CheckCircle2 } from "lucide-react";

/**
 * Création / édition d'un utilisateur (admin/agent) + affectation de biens.
 * @param {{ initial?: any, onClose: () => void, onSaved: () => void }} props
 */
export default function UserForm({ initial, onClose, onSaved }) {
  const { user } = useAuth();
  const { creatableRoles, canActOnUser } = usePermissions();
  const isEdit = Boolean(initial?.id);
  const roleOptions = creatableRoles().map((r) => ({ value: r, label: ROLE_LABELS[r] }));
  const { data: properties } = useProperties();

  const { values, setField, submitting, setSubmitting, error, setError } = useForm({
    nom: initial?.nom || "",
    telephone: initial?.telephone || "",
    email: initial?.email || "",
    role: initial?.role || roleOptions[0]?.value || "agent",
  });
  const [assigned, setAssigned] = useState([]);
  const [confirmDel, setConfirmDel] = useState(false);

  const effectiveRole = isEdit ? initial.role : values.role;
  const isAgent = effectiveRole === "agent";
  const canAct = isEdit && canActOnUser(initial.role);

  // Charge les affectations existantes (édition d'un agent)
  useEffect(() => {
    if (isEdit && initial.role === "agent") {
      listUserAssignments(initial.id).then(setAssigned).catch(() => {});
    }
  }, [isEdit, initial]);

  function toggleProp(id) {
    setAssigned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (!values.nom || !values.email) {
      setError(new Error("Nom et e-mail sont obligatoires."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await updateUser(initial.id, {
          nom: values.nom.trim(), telephone: values.telephone || null, email: values.email.trim(),
        });
        if (initial.role === "agent") {
          await setUserAssignments(initial.id, user.owner_id, assigned);
        }
      } else {
        const created = await createUser({
          ownerId: user.owner_id, nom: values.nom.trim(),
          telephone: values.telephone || null, email: values.email.trim(), role: values.role,
        });
        if (values.role === "agent" && assigned.length) {
          await setUserAssignments(created.id, user.owner_id, assigned);
        }
        await logAction(LOG.creation, "app_user", created.id, {
          label: `Utilisateur créé — ${values.nom.trim()} (${ROLE_LABELS[values.role]})`,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e);
      setSubmitting(false);
    }
  }

  async function toggleStatut() {
    setSubmitting(true);
    try {
      const next = initial.statut === "actif" ? "suspendu" : "actif";
      await setUserStatut(initial.id, next);
      await logAction(LOG.modification, "app_user", initial.id, {
        label: `Compte ${next === "suspendu" ? "suspendu" : "réactivé"} — ${initial.nom}`,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e);
      setSubmitting(false);
    }
  }

  async function remove() {
    setSubmitting(true);
    try {
      await deleteUser(initial.id);
      await logAction(LOG.suppression, "app_user", initial.id, {
        label: `Utilisateur supprimé — ${initial.nom}`,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e);
      setSubmitting(false);
      setConfirmDel(false);
    }
  }

  return (
    <FormSheet title={isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"} onClose={onClose}>
      <FormError error={error} />
      <TextField label="Nom" value={values.nom} onChange={(v) => setField("nom", v)} required />
      <TextField label="Téléphone" value={values.telephone} onChange={(v) => setField("telephone", v)} placeholder="+241 06 00 00 00" />
      <TextField label="Email (utilisé pour la connexion)" value={values.email} onChange={(v) => setField("email", v)} type="email" required />

      {isEdit ? (
        <div style={st.roleRow}>
          <span style={st.roleLabel}>Rôle</span>
          <span style={st.roleValue}>{ROLE_LABELS[initial.role]}</span>
        </div>
      ) : (
        <SelectField label="Rôle" value={values.role} onChange={(v) => setField("role", v)} options={roleOptions} required />
      )}

      {isAgent && (
        <>
          <div style={st.assignLabel}>Biens affectés</div>
          <div style={st.assignBox}>
            {(properties || []).length === 0 && <div style={S.emptyInline}>Aucun bien disponible.</div>}
            {(properties || []).map((p) => (
              <CheckboxField key={p.id} label={`${p.nom} · ${p.quartier}`} checked={assigned.includes(p.id)} onChange={() => toggleProp(p.id)} />
            ))}
          </div>
        </>
      )}

      {!isEdit && (
        <p style={st.note}>
          L'utilisateur recevra l'accès en se connectant par lien magique avec cet e-mail.
        </p>
      )}

      <FormActions
        onCancel={onClose} onSubmit={submit} submitting={submitting}
        submitLabel={isEdit ? "Enregistrer" : "Créer l'utilisateur"}
        onDelete={canAct ? () => setConfirmDel(true) : undefined}
      />

      {canAct && (
        <button type="button" style={initial.statut === "actif" ? st.suspendBtn : st.activateBtn}
          onClick={toggleStatut} disabled={submitting}>
          {initial.statut === "actif"
            ? <><Ban size={15} /> Suspendre le compte</>
            : <><CheckCircle2 size={15} /> Réactiver le compte</>}
        </button>
      )}

      {confirmDel && (
        <ConfirmDialog
          message={`Supprimer définitivement ${initial.nom} ? Cette action retire son accès.`}
          onConfirm={remove} onCancel={() => setConfirmDel(false)} busy={submitting}
        />
      )}
    </FormSheet>
  );
}

const st = {
  roleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)", marginBottom: 14 },
  roleLabel: { fontSize: 12, color: "var(--ink-soft)" },
  roleValue: { fontSize: 13.5, fontWeight: 600 },
  assignLabel: { fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 },
  assignBox: { border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", marginBottom: 14, background: "white" },
  note: { fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: -2, marginBottom: 4 },
  suspendBtn: { width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", color: "var(--rust)", border: "1px solid var(--rust)", borderRadius: 9, padding: "10px 14px", fontSize: 12.5, fontWeight: 600 },
  activateBtn: { width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", color: "var(--olive)", border: "1px solid var(--olive)", borderRadius: 9, padding: "10px 14px", fontSize: 12.5, fontWeight: 600 },
};
