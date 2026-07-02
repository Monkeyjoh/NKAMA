import { useState } from "react";
import { useForm } from "@/hooks/useForm";
import { usePermissions } from "@/hooks/usePermissions";
import { useProperties } from "@/hooks/useProperties";
import { useContractors } from "@/hooks/useContractors";
import { TICKET_CATEGORIE_OPTIONS, TICKET_PRIORITE_OPTIONS } from "@/lib/constants";
import { optionValue } from "@/lib/utils";
import { createTicket, updateTicket, deleteTicket } from "@/services/maintenanceService";
import { invalidateDashboard } from "@/services/dashboardService";
import {
  FormSheet, TextField, TextAreaField, SelectField, FormActions, FormError, ConfirmDialog,
} from "@/components/ui/FormControls";

/**
 * Création / édition d'un ticket de maintenance.
 * En création, le bien est choisi ; en édition, il est fixe (affiché en lecture).
 * @param {{ initial?: any, onClose: () => void, onSaved: () => void }} props
 */
export default function TicketForm({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const { can } = usePermissions();
  const { data: properties } = useProperties();
  const { data: contractors } = useContractors();
  const propOptions = (properties || []).map((p) => ({ value: p.id, label: p.nom }));
  const contractorOptions = (contractors || []).map((c) => ({ value: c.id, label: c.nom }));

  const { values, setField, submitting, setSubmitting, error, setError } = useForm({
    property_id: "",
    titre: initial?.titre || "",
    description: initial?.description || "",
    categorie: optionValue(TICKET_CATEGORIE_OPTIONS, initial?.categorie) || "",
    priorite: optionValue(TICKET_PRIORITE_OPTIONS, initial?.priorite) || "normal",
    contractor_id: "",
  });
  const [confirmDel, setConfirmDel] = useState(false);

  async function submit() {
    if (!isEdit && !values.property_id) {
      setError(new Error("Choisissez le bien concerné."));
      return;
    }
    if (!values.titre || !values.categorie) {
      setError(new Error("Titre et catégorie sont obligatoires."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        const patch = { titre: values.titre.trim(), description: values.description || null, categorie: values.categorie, priorite: values.priorite };
        if (values.contractor_id) patch.contractor_id = values.contractor_id;
        await updateTicket(initial.id, patch);
      } else {
        await createTicket({
          property_id: values.property_id,
          titre: values.titre.trim(),
          description: values.description || null,
          categorie: values.categorie,
          priorite: values.priorite,
          statut: "signale",
          contractor_id: values.contractor_id || null,
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
      await deleteTicket(initial.id);
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
    <FormSheet title={isEdit ? "Modifier le ticket" : "Nouveau ticket"} onClose={onClose}>
      <FormError error={error} />
      {isEdit ? (
        <TextField label="Bien" value={initial.bien} onChange={() => {}} />
      ) : (
        <SelectField label="Bien concerné" value={values.property_id} onChange={(v) => setField("property_id", v)} options={propOptions} required placeholder="Choisir un bien" />
      )}
      <TextField label="Titre" value={values.titre} onChange={(v) => setField("titre", v)} required placeholder="Fuite robinet cuisine" />
      <TextAreaField label="Description" value={values.description} onChange={(v) => setField("description", v)} />
      <SelectField label="Catégorie" value={values.categorie} onChange={(v) => setField("categorie", v)} options={TICKET_CATEGORIE_OPTIONS} required />
      <SelectField label="Priorité" value={values.priorite} onChange={(v) => setField("priorite", v)} options={TICKET_PRIORITE_OPTIONS} />
      <SelectField label="Prestataire (optionnel)" value={values.contractor_id} onChange={(v) => setField("contractor_id", v)} options={contractorOptions} placeholder="Aucun" />
      <FormActions
        onCancel={onClose} onSubmit={submit} submitting={submitting}
        submitLabel={isEdit ? "Enregistrer" : "Créer le ticket"}
        onDelete={isEdit && can("ticket.delete") ? () => setConfirmDel(true) : undefined}
      />
      {confirmDel && (
        <ConfirmDialog message="Supprimer définitivement ce ticket ?" onConfirm={remove} onCancel={() => setConfirmDel(false)} busy={submitting} />
      )}
    </FormSheet>
  );
}
