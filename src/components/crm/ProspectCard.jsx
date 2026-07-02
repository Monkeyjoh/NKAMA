import { S } from "@/styles/sharedStyles";
import { formatFCFA, initials } from "@/lib/utils";
import { Clock, ChevronRight } from "lucide-react";

/** Carte prospect (colonne Kanban). @param {{ prospect: any, onClick: () => void }} props */
export default function ProspectCard({ prospect, onClick }) {
  return (
    <button style={S.prospectRow} onClick={onClick}>
      <div style={S.prospectAvatar}>{initials(prospect.nom)}</div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={S.prospectName}>{prospect.nom}</div>
        <div style={S.prospectMeta}>{prospect.type} · {prospect.zone}</div>
        {prospect.prochaineAction && (
          <div style={S.prospectNextAction}>
            <Clock size={11} />{prospect.prochaineAction}
          </div>
        )}
      </div>
      <div style={S.prospectBudgetRow}>
        <div style={S.prospectBudget}>{formatFCFA(prospect.budget)}</div>
        <ChevronRight size={15} color="var(--ink-soft)" />
      </div>
    </button>
  );
}
