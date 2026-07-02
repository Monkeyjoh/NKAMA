import { S } from "@/styles/sharedStyles";
import { formatFCFA } from "@/lib/utils";
import { EXP_STATUT } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import { AlertCircle, Pencil } from "lucide-react";

/**
 * Fiche dépense (modale) avec validation/rejet.
 * @param {{ expense: any, onClose: () => void, onDecide: (id:string, statut:string)=>void, onEdit?: (e:any)=>void }} props
 */
export default function ExpenseDetail({ expense, onClose, onDecide, onEdit }) {
  const s = EXP_STATUT[expense.statut];
  return (
    <Modal title={expense.categorie} onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={S.detailAmount}>{formatFCFA(expense.montant)}</div>
        {onEdit && (
          <button onClick={() => onEdit(expense)} aria-label="Modifier"
            style={{ background: "none", border: "none", color: "var(--ink-soft)", padding: 4 }}>
            <Pencil size={17} />
          </button>
        )}
      </div>
      <div style={S.detailRow}><span style={S.detailLabel}>Bien concerné</span><span style={S.detailValue}>{expense.bien}</span></div>
      <div style={S.detailRow}><span style={S.detailLabel}>Date</span><span style={S.detailValue}>{expense.date}</span></div>
      <div style={S.detailRow}><span style={S.detailLabel}>Statut</span><span style={{ ...S.statusTag, color: s.color, background: s.bg }}>{s.label}</span></div>
      {expense.motif && (
        <div style={S.motifBox}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{expense.motif}</span>
        </div>
      )}
      {expense.statut === "en_attente" && (
        <div style={S.modalActions}>
          <button style={S.validateBtnFull} onClick={() => onDecide(expense.id, "validee")}>Valider la dépense</button>
          <button style={S.rejectBtnFull} onClick={() => onDecide(expense.id, "rejetee")}>Rejeter</button>
        </div>
      )}
    </Modal>
  );
}
