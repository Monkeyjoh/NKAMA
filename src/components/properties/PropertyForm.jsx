import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/constants";
import { optionValue } from "@/lib/utils";
import { createProperty, updateProperty, deleteProperty } from "@/services/propertiesService";
import { invalidateDashboard } from "@/services/dashboardService";
import { logAction, LOG } from "@/services/logService";
import {
  FormSheet, TextField, NumberField, SelectField, FormActions, FormError, ConfirmDialog,
} from "@/components/ui/FormControls";

/**
 * Formulaire de création / édition d'un bien.
 * @param {{ initial?: any, onClose: () => void, onSaved: () => void }} props
 */
export default function PropertyForm({ initial, onClose, onSaved, onDeleted }) {
  const { user } = useAuth();
  const isEdit = Boolean(initial?.id);
  const { values, setField, submitting, setSubmitting, error, setError } = useForm({
    nom: initial?.nom || "",
    adresse: initial?.adresse || "",
    quartier: initial?.quartier || "",
    type: optionValue(PROPERTY_TYPE_OPTIONS, initial?.type) || "",
    chambres: initial?.chambres ?? "",
    surface: initial?.surface ?? "",
    loyer: initial?.loyer ?? "",
  });
  const [confirmDel, setConfirmDel] = useState(false);

  function buildPayload() {
    return {
      nom: values.nom.trim(),
      adresse: values.adresse.trim(),
      quartier: values.quartier.trim(),
      type: values.type,
      chambres: values.chambres === "" ? null : Number(values.chambres),
      surface_m2: values.surface === "" ? null : Number(values.surface),
      loyer_mensuel: values.loyer === "" ? 0 : Number(values.loyer),
    };
  }

  async function submit() {
    if (!values.nom || !values.adresse || !values.quartier || !values.type || values.loyer === "") {
      setError(new Error("Merci de remplir les champs obligatoires (nom, adresse, quartier, type, loyer)."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) await updateProperty(initial.id, buildPayload());
      else await createProperty({ ...buildPayload(), owner_id: user.owner_id });
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
      await deleteProperty(initial.id);
      await logAction(LOG.suppression, "property", initial.id, { label: `Bien supprimé — ${initial.nom}` });
      invalidateDashboard();
      (onDeleted || onSaved)();
      onClose();
    } catch (e) {
      setError(e);
      setSubmitting(false);
      setConfirmDel(false);
    }
  }

  return (
    <FormSheet title={isEdit ? "Modifier le bien" : "Nouveau bien"} onClose={onClose}>
      <FormError error={error} />
      <TextField label="Nom" value={values.nom} onChange={(v) => setField("nom", v)} required placeholder="Villa Glass" />
      <TextField label="Adresse" value={values.adresse} onChange={(v) => setField("adresse", v)} required />
      <TextField label="Quartier" value={values.quartier} onChange={(v) => setField("quartier", v)} required placeholder="Glass, Libreville" />
      <SelectField label="Type" value={values.type} onChange={(v) => setField("type", v)} options={PROPERTY_TYPE_OPTIONS} required />
      <NumberField label="Chambres" value={values.chambres} onChange={(v) => setField("chambres", v)} />
      <NumberField label="Surface" value={values.surface} onChange={(v) => setField("surface", v)} suffix="m²" />
      <NumberField label="Loyer mensuel" value={values.loyer} onChange={(v) => setField("loyer", v)} suffix="FCFA" required />
      <FormActions
        onCancel={onClose} onSubmit={submit} submitting={submitting}
        submitLabel={isEdit ? "Enregistrer" : "Créer le bien"}
        onDelete={isEdit ? () => setConfirmDel(true) : undefined}
      />
      {confirmDel && (
        <ConfirmDialog
          message="Supprimer ce bien supprimera aussi ses contrats, tickets et dépenses associés. Cette action est irréversible."
          onConfirm={remove} onCancel={() => setConfirmDel(false)} busy={submitting}
        />
      )}
    </FormSheet>
  );
}
