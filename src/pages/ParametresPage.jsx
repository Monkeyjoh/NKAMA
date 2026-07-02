import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useOwnerSettings } from "@/hooks/useSettings";
import { updateOwnerSettings } from "@/services/settingsService";
import { logAction, LOG } from "@/services/logService";
import TopHeader from "@/components/layout/TopHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import { AsyncSection } from "@/components/ui/StateViews";
import { NumberField, FormError } from "@/components/ui/FormControls";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { ChevronRight, Users } from "lucide-react";

const FIELDS = [
  { key: "seuil_depense_montant", label: "Dépense inhabituelle (montant)", suffix: "FCFA" },
  { key: "seuil_depense_pct", label: "Dépense inhabituelle (% moyenne)", suffix: "%" },
  { key: "ticket_sla_jours", label: "SLA ticket non traité", suffix: "jours" },
  { key: "bail_echeance_jours", label: "Bail à échéance", suffix: "jours" },
  { key: "vacance_jours", label: "Bien vacant signalé après", suffix: "jours" },
  { key: "retard_jours", label: "Retard de paiement signalé après", suffix: "jours" },
];

export default function ParametresPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast, showToast } = useToast();
  const { data: settings, loading, error, refetch } = useOwnerSettings();
  const editable = can("settings.edit");

  const [vals, setVals] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  useEffect(() => {
    if (settings) setVals(settings);
  }, [settings]);

  async function save() {
    setSaving(true);
    setSaveErr(null);
    try {
      const patch = {};
      FIELDS.forEach((f) => { patch[f.key] = Number(vals[f.key]); });
      await updateOwnerSettings(user.owner_id, patch);
      await logAction(LOG.modification, "parametre", null, { label: "Seuils d'anomalie modifiés" });
      showToast("Seuils mis à jour");
      refetch();
    } catch (e) {
      setSaveErr(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopHeader title="Paramètres" onBack={() => navigate(ROUTES.plus)} />
      <main style={S.main}>
        <div style={S.screen}>
          {/* Accès rapide aux utilisateurs */}
          {can("users.view") && (
            <button style={{ ...S.menuRow, marginBottom: 18 }} onClick={() => navigate(ROUTES.utilisateurs)}>
              <div style={S.iconWrap36}><Users size={18} /></div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={S.menuLabel}>Utilisateurs</div>
                <div style={S.menuSub}>Gérer les rôles et les accès</div>
              </div>
              <ChevronRight size={17} color="var(--ink-soft)" />
            </button>
          )}

          <SectionLabel icon="ShieldAlert" text="Seuils d'anomalie" />
          <FormError error={saveErr} />
          <AsyncSection loading={loading} error={error} isEmpty={!loading && !settings} onRetry={refetch}
            emptyTitle="Seuils non définis" emptyText="Aucune configuration pour ce propriétaire.">
            {editable ? (
              <>
                {FIELDS.map((f) => (
                  <NumberField
                    key={f.key} label={f.label} suffix={f.suffix}
                    value={vals[f.key] ?? ""} onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))}
                  />
                ))}
                <button style={{ ...S.advanceBtn, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer les seuils"}
                </button>
              </>
            ) : (
              <div style={S.list}>
                {FIELDS.map((f) => (
                  <div key={f.key} style={S.settingRow}>
                    <span>{f.label}</span>
                    <span style={S.settingVal}>{settings?.[f.key]} {f.suffix}</span>
                  </div>
                ))}
                <p style={S.scoreNote}>Seul le propriétaire peut modifier les seuils.</p>
              </div>
            )}
          </AsyncSection>

          <div style={S.footerNote}>NKAMA · v1.0</div>
        </div>
      </main>
      <Toast message={toast} />
    </>
  );
}
