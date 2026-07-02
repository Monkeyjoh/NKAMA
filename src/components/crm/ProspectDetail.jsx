import { S } from "@/styles/sharedStyles";
import { formatFCFA, whatsappLink } from "@/lib/utils";
import { CRM_STATUTS } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import PipelineSteps from "@/components/ui/PipelineSteps";
import { Phone, Mail, Wallet, MapPin, MessageCircle, FileWarning, ArrowRight, Pencil } from "lucide-react";

/**
 * Fiche prospect détaillée (modale).
 * @param {{ prospect: any, onClose: () => void, onChangeStatut: (id:string, statut:string)=>void, onEdit?: (p:any)=>void }} props
 */
export default function ProspectDetail({ prospect, onClose, onChangeStatut, onEdit }) {
  const idx = CRM_STATUTS.findIndex((s) => s.key === prospect.statut);
  const terminal = prospect.statut === "signe" || prospect.statut === "refuse";
  const steps = CRM_STATUTS.filter((s) => s.key !== "refuse");

  return (
    <Modal title={prospect.nom} onClose={onClose}>
      <div style={S.contactGrid}>
        <div style={S.contactRow}><Phone size={14} /><span>{prospect.tel}</span></div>
        <div style={S.contactRow}><Mail size={14} /><span>{prospect.email}</span></div>
        <div style={S.contactRow}><Wallet size={14} /><span>{formatFCFA(prospect.budget)}</span></div>
        <div style={S.contactRow}><MapPin size={14} /><span>{prospect.zone} · {prospect.type}</span></div>
      </div>
      <div style={S.quickActions}>
        <a style={S.quickActionBtn} href={whatsappLink(prospect.whatsapp)} target="_blank" rel="noreferrer">
          <MessageCircle size={15} /> WhatsApp
        </a>
        <a style={S.quickActionBtn} href={`mailto:${prospect.email}`}><Mail size={15} /> Email</a>
        {onEdit && (
          <button style={S.quickActionBtn} onClick={() => onEdit(prospect)}>
            <Pencil size={15} /> Modifier
          </button>
        )}
      </div>

      {!prospect.dossierComplet && !terminal && (
        <div style={S.softAlert}>
          <FileWarning size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Dossier incomplet — pièce d'identité manquante. La conversion reste possible.</span>
        </div>
      )}

      {!terminal && (
        <>
          <div style={S.modalSectionLabel}>Statut</div>
          <PipelineSteps steps={steps} currentIndex={idx} />
          <div style={S.statutActions}>
            {idx < 3 && (
              <button style={S.advanceBtn} onClick={() => onChangeStatut(prospect.id, CRM_STATUTS[idx + 1].key)}>
                Faire avancer vers « {CRM_STATUTS[idx + 1].label} » <ArrowRight size={15} />
              </button>
            )}
            <button style={S.refuseBtn} onClick={() => onChangeStatut(prospect.id, "refuse")}>
              Marquer comme refusé
            </button>
          </div>
        </>
      )}

      {terminal && (
        <div style={{ ...S.terminalBanner, ...(prospect.statut === "signe" ? S.terminalBannerSigne : S.terminalBannerRefuse) }}>
          {prospect.statut === "signe"
            ? "Converti en locataire — voir la fiche complète dans le module Locataires."
            : "Dossier classé comme refusé."}
        </div>
      )}

      <div style={S.modalSectionLabel}>Historique des échanges</div>
      <div style={S.historyList}>
        {prospect.historique.map((h, i) => (
          <div key={i} style={S.historyItem}>
            <div style={S.historyDate}>{h.date} · {h.auteur}</div>
            <div style={S.historyText}>{h.texte}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
