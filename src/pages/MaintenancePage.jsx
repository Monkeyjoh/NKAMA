import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { useMaintenanceTickets } from "@/hooks/useMaintenanceTickets";
import { useToast } from "@/hooks/useToast";
import { updateTicketStatut } from "@/services/maintenanceService";
import { invalidateDashboard } from "@/services/dashboardService";
import { logAction, LOG } from "@/services/logService";
import TopHeader from "@/components/layout/TopHeader";
import TicketCard from "@/components/maintenance/TicketCard";
import TicketDetail from "@/components/maintenance/TicketDetail";
import TicketForm from "@/components/maintenance/TicketForm";
import { AsyncSection } from "@/components/ui/StateViews";
import Toast from "@/components/ui/Toast";
import { Plus } from "lucide-react";

const NEXT_STATUT = {
  affecter: "affecte",
  demarrer: "en_cours",
  envoyer_validation: "validation",
  valider: "cloture",
  reouvrir: "en_cours",
};

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useMaintenanceTickets();
  const { toast, showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("actifs");
  const [selected, setSelected] = useState(null);
  const [formTicket, setFormTicket] = useState(null); // {} = création, objet = édition

  useEffect(() => {
    if (data) setTickets(data);
  }, [data]);

  async function advance(id, action, payload = {}) {
    const next = NEXT_STATUT[action];
    const t = tickets.find((x) => x.id === id) || selected;
    setTickets((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload, statut: next } : x)));
    setSelected(null);
    if (action === "valider") showToast("Ticket clôturé et dépense enregistrée");
    else if (action === "reouvrir") showToast("Ticket rouvert — litige enregistré");
    else showToast("Ticket mis à jour");
    try {
      await updateTicketStatut(id, next, payload);
      if (action === "valider") {
        await logAction(LOG.changement_statut, "maintenance_ticket", id,
          { label: `Ticket clôturé — ${t?.titre || ""} (${t?.bien || ""})`, montant: t?.montant });
      }
      invalidateDashboard();
    } catch (e) {
      showToast("Échec — rechargement");
      refetch();
    }
  }

  const visible = tickets.filter((t) => (filter === "actifs" ? t.statut !== "cloture" : t.statut === "cloture"));
  const counts = {
    actifs: tickets.filter((t) => t.statut !== "cloture").length,
    clotures: tickets.filter((t) => t.statut === "cloture").length,
  };

  return (
    <>
      <TopHeader title="Maintenance" onBack={() => navigate(ROUTES.plus)} />
      <div style={S.dashTabsFlat}>
        <button style={{ ...S.flatTabBtn, display: "flex", alignItems: "center", gap: 6, ...(filter === "actifs" ? S.flatTabBtnActive : {}) }} onClick={() => setFilter("actifs")}>
          Actifs <span style={S.tabCount}>{counts.actifs}</span>
        </button>
        <button style={{ ...S.flatTabBtn, display: "flex", alignItems: "center", gap: 6, ...(filter === "clotures" ? S.flatTabBtnActive : {}) }} onClick={() => setFilter("clotures")}>
          Clôturés <span style={S.tabCount}>{counts.clotures}</span>
        </button>
      </div>

      <main style={S.main}>
        <div style={S.screen}>
          <AsyncSection loading={loading} error={error} isEmpty={!loading && visible.length === 0} onRetry={refetch}
            emptyTitle="Aucun ticket" emptyText={filter === "actifs" ? "Aucun ticket actif." : "Aucun ticket clôturé."}>
            <div style={S.list}>
              {visible.map((t) => (
                <TicketCard key={t.id} ticket={t} onClick={() => setSelected(t)} />
              ))}
            </div>
          </AsyncSection>
        </div>
      </main>

      <button style={S.fab} aria-label="Nouveau ticket" onClick={() => setFormTicket({})}><Plus size={22} strokeWidth={2} /></button>

      {selected && (
        <TicketDetail
          ticket={selected}
          onClose={() => setSelected(null)}
          onAdvance={advance}
          onEdit={(t) => { setSelected(null); setFormTicket(t); }}
        />
      )}
      {formTicket && (
        <TicketForm
          initial={formTicket.id ? formTicket : null}
          onClose={() => setFormTicket(null)}
          onSaved={refetch}
        />
      )}
      <Toast message={toast} />
    </>
  );
}
