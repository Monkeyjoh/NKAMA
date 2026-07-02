import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { CONTRACTOR_CATEGORIE_OPTIONS } from "@/lib/constants";
import { optionValue } from "@/lib/utils";
import { createContractor, updateContractor, unlinkContractor } from "@/services/contractorsService";
import { invalidateDashboard } from "@/services/dashboardService";
import {
  FormSheet, TextField, NumberField, SelectField, FormActions, FormError, ConfirmDialog,
} from "@/components/ui/FormControls";

/**
 * Création / édition d'un prestataire (annuaire partagé + note du propriétaire).
 * @param {{ initial?: any, onClose: () => void, onSaved: () => void }} props
 */
export default function ContractorForm({ initial, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = Boolean(initial?.id);
  const { values, setField, submitting, setSubmitting, error, setError } = useForm({
    nom: initial?.nom || "",
    telephone: initial?.tel || "",
    whatsapp: initial?.whatsapp || "",
    zone_intervention: initial?.zone || "",
    categorie: optionValue(CONTRACTOR_CATEGORIE_OPTIONS, initial?.categorie) || "",
    note: initial?.note ?? "",
  });
  const [confirmDel, setConfirmDel] = useState(false);

  function payload() {
    return {
      nom: values.nom.trim(),
      telephone: values.telephone.trim(),
      whatsapp: values.whatsapp || null,
      zone_intervention: values.zone_intervention || null,
      categorie: values.categorie || null,
      note: values.note === "" ? null : Number(values.note),
    };
  }

  async function submit() {
    if (!values.nom || !values.telephone) {
      setError(new Error("Nom et téléphone sont obligatoires."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) await updateContractor(initial.id, payload(), user.owner_id);
      else await createContractor(payload(), user.owner_id);
      invalidateDashboard();
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
      await unlinkContractor(initial.id, user.owner_id);
      invalidateDashboard();
      onSaved();
      onClose();
    } catch (e) {
      setError(e);
      setSubmitting(false);
      setConfirmDel(false);
    }
  }

  return (
    <FormSheet title={isEdit ? "Modifier le prestataire" : "Nouveau prestataire"} onClose={onClose}>
      <FormError error={error} />
      <TextField label="Nom" value={values.nom} onChange={(v) => setField("nom", v)} required />
      <TextField label="Téléphone" value={values.telephone} onChange={(v) => setField("telephone", v)} required />
      <TextField label="WhatsApp" value={values.whatsapp} onChange={(v) => setField("whatsapp", v)} />
      <TextField label="Zone d'intervention" value={values.zone_intervention} onChange={(v) => setField("zone_intervention", v)} placeholder="Libreville" />
      <SelectField label="Catégorie" value={values.categorie} onChange={(v) => setField("categorie", v)} options={CONTRACTOR_CATEGORIE_OPTIONS} />
      <NumberField label="Note de confiance (1 à 5)" value={values.note} onChange={(v) => setField("note", v)} />
      <FormActions
        onCancel={onClose} onSubmit={submit} submitting={submitting}
        submitLabel={isEdit ? "Enregistrer" : "Ajouter le prestataire"}
        onDelete={isEdit ? () => setConfirmDel(true) : undefined}
      />
      {confirmDel && (
        <ConfirmDialog
          title="Retirer le prestataire"
          message="Retirer ce prestataire de votre annuaire ? (il reste disponible pour les autres propriétaires)."
          confirmLabel="Retirer" onConfirm={remove} onCancel={() => setConfirmDel(false)} busy={submitting}
        />
      )}
    </FormSheet>
  );
}
