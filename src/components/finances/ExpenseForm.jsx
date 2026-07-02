import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { useProperties } from "@/hooks/useProperties";
import { EXPENSE_CATEGORIE_OPTIONS } from "@/lib/constants";
import { optionValue } from "@/lib/utils";
import { createExpense, updateExpense, deleteExpense } from "@/services/expensesService";
import { invalidateDashboard } from "@/services/dashboardService";
import {
  FormSheet, TextField, NumberField, SelectField, FormActions, FormError, ConfirmDialog,
} from "@/components/ui/FormControls";

/**
 * Création / édition d'une dépense.
 * En création, le bien est choisi (ou « Tous biens ») ; en édition, il est fixe.
 * @param {{ initial?: any, onClose: () => void, onSaved: () => void }} props
 */
export default function ExpenseForm({ initial, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = Boolean(initial?.id);
  const { data: properties } = useProperties();
  const propOptions = [{ value: "", label: "Tous biens (dépense globale)" }, ...(properties || []).map((p) => ({ value: p.id, label: p.nom }))];

  const { values, setField, submitting, setSubmitting, error, setError } = useForm({
    property_id: "",
    categorie: optionValue(EXPENSE_CATEGORIE_OPTIONS, initial?.categorie) || "",
    montant: initial?.montant ?? "",
  });
  const [confirmDel, setConfirmDel] = useState(false);

  async function submit() {
    if (!values.categorie || values.montant === "") {
      setError(new Error("Catégorie et montant sont obligatoires."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await updateExpense(initial.id, { categorie: values.categorie, montant: Number(values.montant) });
      } else {
        await createExpense({
          owner_id: user.owner_id,
          property_id: values.property_id || null,
          categorie: values.categorie,
          montant: Number(values.montant),
          statut: "en_attente",
        });
      }
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
      await deleteExpense(initial.id);
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
    <FormSheet title={isEdit ? "Modifier la dépense" : "Nouvelle dépense"} onClose={onClose}>
      <FormError error={error} />
      {isEdit ? (
        <TextField label="Bien concerné" value={initial.bien} onChange={() => {}} />
      ) : (
        <SelectField label="Bien concerné" value={values.property_id} onChange={(v) => setField("property_id", v)} options={propOptions} placeholder="Tous biens (dépense globale)" />
      )}
      <SelectField label="Catégorie" value={values.categorie} onChange={(v) => setField("categorie", v)} options={EXPENSE_CATEGORIE_OPTIONS} required />
      <NumberField label="Montant" value={values.montant} onChange={(v) => setField("montant", v)} suffix="FCFA" required />
      <p style={{ fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: -4 }}>
        Les dépenses « maintenance » sont générées automatiquement depuis les tickets (avec leur facture) et ne se créent pas ici.
      </p>
      <FormActions
        onCancel={onClose} onSubmit={submit} submitting={submitting}
        submitLabel={isEdit ? "Enregistrer" : "Ajouter la dépense"}
        onDelete={isEdit ? () => setConfirmDel(true) : undefined}
      />
      {confirmDel && (
        <ConfirmDialog message="Supprimer définitivement cette dépense ?" onConfirm={remove} onCancel={() => setConfirmDel(false)} busy={submitting} />
      )}
    </FormSheet>
  );
}
