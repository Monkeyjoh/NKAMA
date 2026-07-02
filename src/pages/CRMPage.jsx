import { useEffect, useState } from "react";
import { S } from "@/styles/sharedStyles";
import { CRM_STATUTS } from "@/lib/constants";
import { useLeads } from "@/hooks/useLeads";
import { useToast } from "@/hooks/useToast";
import { updateLeadStatut } from "@/services/leadsService";
import { invalidateDashboard } from "@/services/dashboardService";
import TopHeader from "@/components/layout/TopHeader";
import KanbanColumn from "@/components/crm/KanbanColumn";
import ProspectDetail from "@/components/crm/ProspectDetail";
import LeadForm from "@/components/crm/LeadForm";
import { AsyncSection } from "@/components/ui/StateViews";
import Toast from "@/components/ui/Toast";
import { Plus } from "lucide-react";

export default function CRMPage() {
  const { data: leads, loading, error, refetch } = useLeads();
  const { toast, showToast } = useToast();
  const [prospects, setProspects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [formLead, setFormLead] = useState(null); // {} = création, objet = édition

  useEffect(() => {
    if (leads) setProspects(leads);
  }, [leads]);

  async function changeStatut(id, ns) {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, statut: ns } : p)));
    setSelected(null);
    showToast(ns === "signe" ? "Prospect converti en locataire" : `Statut mis à jour : ${CRM_STATUTS.find((s) => s.key === ns).label}`);
    try {
      await updateLeadStatut(id, ns);
      invalidateDashboard();
    } catch (e) {
      showToast("Échec de la mise à jour — rechargement");
      refetch();
    }
  }

  const counts = CRM_STATUTS.reduce((a, s) => {
    a[s.key] = prospects.filter((p) => p.statut === s.key).length;
    return a;
  }, {});

  return (
    <>
      <TopHeader title="CRM Prospects" />
      <div style={S.summaryRow}>
        {CRM_STATUTS.map((s) => (
          <div key={s.key} style={S.summaryChip}>
            <span style={{ ...S.summaryDot, background: s.color }} />
            <span style={S.summaryCount}>{counts[s.key] || 0}</span>
            <span style={S.summaryLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <main style={S.main}>
        <AsyncSection loading={loading} error={error} isEmpty={!loading && prospects.length === 0} onRetry={refetch}
          emptyTitle="Aucun prospect" emptyText="Ajoutez vos prospects pour suivre le pipeline.">
          <div style={S.kanbanVertical}>
            {CRM_STATUTS.map((statut) => (
              <KanbanColumn
                key={statut.key}
                statut={statut}
                prospects={prospects.filter((p) => p.statut === statut.key)}
                onSelect={setSelected}
              />
            ))}
          </div>
        </AsyncSection>
      </main>

      <button style={S.fab} aria-label="Ajouter un prospect" onClick={() => setFormLead({})}><Plus size={22} strokeWidth={2} /></button>

      {selected && (
        <ProspectDetail
          prospect={selected}
          onClose={() => setSelected(null)}
          onChangeStatut={changeStatut}
          onEdit={(p) => { setSelected(null); setFormLead(p); }}
        />
      )}
      {formLead && (
        <LeadForm
          initial={formLead.id ? formLead : null}
          onClose={() => setFormLead(null)}
          onSaved={refetch}
        />
      )}
      <Toast message={toast} />
    </>
  );
}
