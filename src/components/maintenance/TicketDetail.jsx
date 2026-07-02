import { S } from "@/styles/sharedStyles";
import { formatFCFA } from "@/lib/utils";
import { MAINT_ETAPES, PRIORITE_META } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import PipelineSteps from "@/components/ui/PipelineSteps";
import ProofBox from "@/components/ui/ProofBox";
import ActionsForStatut from "@/components/maintenance/ActionsForStatut";
import { User, Wrench, Pencil } from "lucide-react";

/**
 * Fiche ticket détaillée (modale).
 * @param {{ ticket: any, onClose: () => void, onAdvance: Function, onEdit?: (t:any)=>void }} props
 */
export default function TicketDetail({ ticket, onClose, onAdvance, onEdit }) {
  const idx = MAINT_ETAPES.findIndex((e) => e.key === ticket.statut);
  return (
    <Modal title={ticket.titre} onClose={onClose}>
      <div style={{ ...S.metaRow, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>{ticket.bien}</span><span style={S.factsDot}>·</span>
          <span>{ticket.categorie}</span><span style={S.factsDot}>·</span>
          <span style={{ color: PRIORITE_META[ticket.priorite].color, fontWeight: 600 }}>{ticket.priorite}</span>
        </div>
        {onEdit && (
          <button onClick={() => onEdit(ticket)} aria-label="Modifier le ticket"
            style={{ background: "none", border: "none", color: "var(--ink-soft)", padding: 2 }}>
            <Pencil size={16} />
          </button>
        )}
      </div>

      <PipelineSteps steps={MAINT_ETAPES} currentIndex={idx} withLabels checkIcon="circle" />

      <div style={S.modalSectionLabel}>Preuves requises</div>
      <div style={S.proofGrid}>
        <ProofBox icon="Camera" label="Photo avant" done={ticket.photoAvant} required />
        <ProofBox icon="Camera" label="Photo après" done={ticket.photoApres} required={idx >= 2} />
        <ProofBox icon="FileText" label="Facture" done={ticket.facture} required={idx >= 2} />
      </div>

      {ticket.prestataire && (
        <div style={S.infoRow}><User size={14} /><span>Affecté à {ticket.prestataire}</span></div>
      )}
      {ticket.montant && (
        <div style={S.infoRow}><Wrench size={14} /><span>Montant facturé : {formatFCFA(ticket.montant)}</span></div>
      )}

      <ActionsForStatut ticket={ticket} onAdvance={onAdvance} />

      {ticket.statut === "cloture" && (
        <div style={S.imputableNote}>
          {ticket.imputable
            ? "Incident marqué comme imputable au locataire."
            : "Incident marqué comme non imputable au locataire (usure normale)."}
        </div>
      )}
    </Modal>
  );
}
