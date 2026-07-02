import { useState } from "react";
import { S } from "@/styles/sharedStyles";
import { formatFCFA } from "@/lib/utils";
import { MAINT_ETAPES, PRIORITE_META } from "@/lib/constants";
import { usePermissions } from "@/hooks/usePermissions";
import Modal from "@/components/ui/Modal";
import PipelineSteps from "@/components/ui/PipelineSteps";
import ProofUploadBox from "@/components/maintenance/ProofUploadBox";
import ActionsForStatut from "@/components/maintenance/ActionsForStatut";
import { NumberField } from "@/components/ui/FormControls";
import { User, Wrench, Pencil } from "lucide-react";

/**
 * Fiche ticket détaillée (modale). Phase 7 : les cases de preuves sont
 * actives — ajout par upload réel (Supabase Storage), consultation par
 * URL signée.
 * @param {{
 *   ticket: any, onClose: () => void, onAdvance: Function,
 *   onEdit?: (t:any)=>void,
 *   onProof?: (ticketId:string, kind:string, file:File, montant?:number|null)=>Promise<void>|void,
 * }} props
 */
export default function TicketDetail({ ticket, onClose, onAdvance, onEdit, onProof }) {
  const { can } = usePermissions();
  const idx = MAINT_ETAPES.findIndex((e) => e.key === ticket.statut);
  const canUpload = can("ticket.addDocument") && ticket.statut !== "cloture" && Boolean(onProof);
  const [uploading, setUploading] = useState(null); // kind en cours d'envoi
  const [pendingFacture, setPendingFacture] = useState(null); // { file }
  const [factureMontant, setFactureMontant] = useState("");
  const [proofError, setProofError] = useState(null);

  async function send(kind, file, montant = null) {
    setProofError(null);
    setUploading(kind);
    try {
      await onProof(ticket.id, kind, file, montant);
    } catch (e) {
      setProofError(e);
    } finally {
      setUploading(null);
    }
  }

  function pick(kind, file) {
    setProofError(null);
    if (kind === "facture") {
      setFactureMontant(ticket.montant ? String(ticket.montant) : "");
      setPendingFacture({ file });
      return;
    }
    send(kind, file);
  }

  function confirmFacture() {
    const m = parseInt(factureMontant, 10);
    if (!m || m <= 0) {
      setProofError(new Error("Indiquez le montant facturé."));
      return;
    }
    const { file } = pendingFacture;
    setPendingFacture(null);
    send("facture", file, m);
  }

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
        <ProofUploadBox ticketId={ticket.id} kind="photo_avant" icon="Camera"
          label={uploading === "photo_avant" ? "Envoi…" : "Photo avant"}
          done={ticket.photoAvant} required canUpload={canUpload}
          accept="image/*" onPick={(f) => pick("photo_avant", f)} onError={setProofError} />
        <ProofUploadBox ticketId={ticket.id} kind="photo_apres" icon="Camera"
          label={uploading === "photo_apres" ? "Envoi…" : "Photo après"}
          done={ticket.photoApres} required={idx >= 2} canUpload={canUpload}
          accept="image/*" onPick={(f) => pick("photo_apres", f)} onError={setProofError} />
        <ProofUploadBox ticketId={ticket.id} kind="facture" icon="FileText"
          label={uploading === "facture" ? "Envoi…" : "Facture"}
          done={ticket.facture} required={idx >= 2} canUpload={canUpload}
          accept="image/*,.pdf" onPick={(f) => pick("facture", f)} onError={setProofError} />
      </div>
      {canUpload && (
        <div style={st.hint}>
          Touchez une case pour ajouter la preuve ; touchez une preuve validée pour l'ouvrir.
        </div>
      )}
      {proofError && <div style={st.error}>{proofError.message}</div>}

      {pendingFacture && (
        <div style={st.factureBlock}>
          <div style={S.modalSectionLabel}>Montant facturé</div>
          <NumberField label="Montant (FCFA)" value={factureMontant}
            onChange={setFactureMontant} placeholder="Ex. 120000" required />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button style={{ ...S.primaryBtn, flex: 1 }} onClick={confirmFacture}>
              Joindre la facture
            </button>
            <button style={st.cancelBtn} onClick={() => setPendingFacture(null)}>
              Annuler
            </button>
          </div>
        </div>
      )}

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

const st = {
  hint: { fontSize: 10.5, color: "var(--ink-soft)", marginTop: -10, marginBottom: 14, lineHeight: 1.4 },
  error: { fontSize: 12, color: "var(--rust)", marginBottom: 12 },
  factureBlock: { border: "1px solid var(--line)", borderRadius: 10, padding: "12px 12px 4px", marginBottom: 14, background: "var(--paper-dim)" },
  cancelBtn: { background: "none", border: "1px solid var(--line)", borderRadius: 9, padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "var(--ink)" },
};
