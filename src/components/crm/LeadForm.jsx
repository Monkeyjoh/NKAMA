import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { PROPERTY_TYPE_OPTIONS, LEAD_SOURCE_OPTIONS } from "@/lib/constants";
import { optionValue } from "@/lib/utils";
import { createLead, updateLead, deleteLead } from "@/services/leadsService";
import { invalidateDashboard } from "@/services/dashboardService";
import {
  FormSheet, TextField, NumberField, SelectField, CheckboxField, FormActions, FormError, ConfirmDialog,
} from "@/components/ui/FormControls";

/**
 * Création / édition d'un prospect (CRM).
 * @param {{ initial?: any, onClose: () => void, onSaved: () => void }} props
 */
export default function LeadForm({ initial, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = Boolean(initial?.id);
  const { values, setField, submitting, setSubmitting, error, setError } = useForm({
    nom: initial?.nom || "",
    telephone: initial?.tel || "",
    whatsapp: initial?.whatsapp || "",
    email: initial?.email || "",
    budget: initial?.budget ?? "",
    type_recherche: optionValue(PROPERTY_TYPE_OPTIONS, initial?.type) || "",
    zone: initial?.zone || "",
    source: optionValue(LEAD_SOURCE_OPTIONS, initial?.source) || "autre",
    prochaine_action: initial?.prochaineAction || "",
    dossier_complet: Boolean(initial?.dossierComplet),
  });
  const [confirmDel, setConfirmDel] = useState(false);

  function buildPayload() {
    return {
      nom: values.nom.trim(),
      telephone: values.telephone.trim(),
      whatsapp: values.whatsapp || null,
      email: values.email || null,
      budget_max: values.budget === "" ? null : Number(values.budget),
      type_recherche: values.type_recherche || null,
      zone_recherchee: values.zone || null,
      source: values.source || "autre",
      prochaine_action: values.prochaine_action || null,
      dossier_complet: values.dossier_complet,
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
      if (isEdit) await updateLead(initial.id, buildPayload());
      else await createLead({ ...buildPayload(), owner_id: user.owner_id, statut: "nouveau" });
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
      await deleteLead(initial.id);
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
    <FormSheet title={isEdit ? "Modifier le prospect" : "Nouveau prospect"} onClose={onClose}>
      <FormError error={error} />
      <TextField label="Nom" value={values.nom} onChange={(v) => setField("nom", v)} required />
      <TextField label="Téléphone" value={values.telephone} onChange={(v) => setField("telephone", v)} required placeholder="+241 06 00 00 00" />
      <TextField label="WhatsApp" value={values.whatsapp} onChange={(v) => setField("whatsapp", v)} />
      <TextField label="Email" value={values.email} onChange={(v) => setField("email", v)} type="email" />
      <NumberField label="Budget max" value={values.budget} onChange={(v) => setField("budget", v)} suffix="FCFA" />
      <SelectField label="Type recherché" value={values.type_recherche} onChange={(v) => setField("type_recherche", v)} options={PROPERTY_TYPE_OPTIONS} />
      <TextField label="Zone recherchée" value={values.zone} onChange={(v) => setField("zone", v)} />
      <SelectField label="Source" value={values.source} onChange={(v) => setField("source", v)} options={LEAD_SOURCE_OPTIONS} />
      <TextField label="Prochaine action" value={values.prochaine_action} onChange={(v) => setField("prochaine_action", v)} placeholder="Premier contact" />
      <CheckboxField label="Dossier complet" checked={values.dossier_complet} onChange={(v) => setField("dossier_complet", v)} />
      <FormActions
        onCancel={onClose} onSubmit={submit} submitting={submitting}
        submitLabel={isEdit ? "Enregistrer" : "Ajouter le prospect"}
        onDelete={isEdit ? () => setConfirmDel(true) : undefined}
      />
      {confirmDel && (
        <ConfirmDialog message="Supprimer définitivement ce prospect ?" onConfirm={remove} onCancel={() => setConfirmDel(false)} busy={submitting} />
      )}
    </FormSheet>
  );
}
