import { S } from "@/styles/sharedStyles";
import { formatFCFA } from "@/lib/utils";
import { EXP_STATUT } from "@/lib/constants";
import { CheckCircle2, X, Clock, FileText } from "lucide-react";

/** Carte dépense. @param {{ expense: any, onClick: () => void }} props */
export default function ExpenseCard({ expense, onClick }) {
  const s = EXP_STATUT[expense.statut];
  return (
    <button style={S.expenseCard} onClick={onClick}>
      <div style={S.expenseCardTop}>
        <div>
          <div style={S.propertyName}>{expense.categorie}</div>
          <div style={S.propertyMeta}>{expense.bien} · {expense.date}</div>
        </div>
        <div style={S.expenseAmount}>{formatFCFA(expense.montant)}</div>
      </div>
      <div style={S.expenseCardBottom}>
        <span style={{ ...S.statusTag, color: s.color, background: s.bg, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {expense.statut === "validee" ? <CheckCircle2 size={12} /> : expense.statut === "rejetee" ? <X size={12} /> : <Clock size={12} />}
          {s.label}
        </span>
        {expense.justificatif ? (
          <span style={S.justifTag}><FileText size={12} /> Justificatif joint</span>
        ) : (
          <span style={S.justifTagMuted}>Sans justificatif</span>
        )}
      </div>
    </button>
  );
}
