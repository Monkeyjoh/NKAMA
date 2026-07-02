import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { rentOutProperty } from "@/services/contractsService";
import { invalidateDashboard } from "@/services/dashboardService";
import {
  FormSheet, TextField, NumberField, CheckboxField, FormActions, FormError,
} from "@/components/ui/FormControls";

/**
 * Mise en location d'un bien vacant : crée le locataire + le bail actif,
 * et (option) génère 12 mois de loyers payés.
 * @param {{ property: any, onClose: () => void, onSaved: () => void }} props
 */
export default function RentOutForm({ property, onClose, onSaved }) {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const { values, setField, submitting, setSubmitting, error, setError } = useForm({
    nom: "", telephone: "", whatsapp: "", email: "",
    dateDebut: today, dateFin: "", loyer: property?.loyer ?? "",
    generatePayments: true,
  });

  async function submit() {
    if (!values.nom || !values.telephone || values.loyer === "") {
      setError(new Error("Nom du locataire, téléphone et loyer sont obligatoires."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await rentOutProperty({
        ownerId: user.owner_id,
        propertyId: property.id,
        loyer: Number(values.loyer),
        dateDebut: values.dateDebut,
        dateFin: values.dateFin || null,
        tenant: { nom: values.nom.trim(), telephone: values.telephone.trim(), whatsapp: values.whatsapp, email: values.email },
        generatePayments: values.generatePayments,
      });
      invalidateDashboard();
      onSaved();
      onClose();
    } catch (e) {
      setError(e);
      setSubmitting(false);
    }
  }

  return (
    <FormSheet title={`Mettre en location — ${property?.nom || ""}`} onClose={onClose}>
      <FormError error={error} />
      <TextField label="Nom du locataire" value={values.nom} onChange={(v) => setField("nom", v)} required />
      <TextField label="Téléphone" value={values.telephone} onChange={(v) => setField("telephone", v)} required placeholder="+241 06 00 00 00" />
      <TextField label="WhatsApp" value={values.whatsapp} onChange={(v) => setField("whatsapp", v)} />
      <TextField label="Email" value={values.email} onChange={(v) => setField("email", v)} type="email" />
      <TextField label="Début du bail" value={values.dateDebut} onChange={(v) => setField("dateDebut", v)} type="date" required />
      <TextField label="Fin du bail (optionnel)" value={values.dateFin} onChange={(v) => setField("dateFin", v)} type="date" />
      <NumberField label="Loyer mensuel" value={values.loyer} onChange={(v) => setField("loyer", v)} suffix="FCFA" required />
      <CheckboxField
        label="Générer 12 mois de loyers payés (pour des données réalistes)"
        checked={values.generatePayments} onChange={(v) => setField("generatePayments", v)}
      />
      <FormActions onCancel={onClose} onSubmit={submit} submitting={submitting} submitLabel="Mettre en location" />
    </FormSheet>
  );
}
