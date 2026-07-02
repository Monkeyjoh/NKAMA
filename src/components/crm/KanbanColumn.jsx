import { S } from "@/styles/sharedStyles";
import ProspectCard from "@/components/crm/ProspectCard";

/**
 * Colonne du pipeline CRM.
 * @param {{ statut: {key:string,label:string,color:string}, prospects: any[], onSelect: (p:any)=>void }} props
 */
export default function KanbanColumn({ statut, prospects, onSelect }) {
  return (
    <div style={S.kanbanColumn}>
      <div style={S.kanbanColumnHeader}>
        <span style={{ ...S.kanbanDot, background: statut.color }} />
        <span style={S.kanbanColumnTitle}>{statut.label}</span>
        <span style={S.kanbanColumnCount}>{prospects.length}</span>
      </div>
      <div style={S.kanbanCardsVertical}>
        {prospects.length === 0 ? (
          <div style={S.kanbanEmpty}>Aucun prospect à cette étape</div>
        ) : (
          prospects.map((p) => <ProspectCard key={p.id} prospect={p} onClick={() => onSelect(p)} />)
        )}
      </div>
    </div>
  );
}
