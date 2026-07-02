import { S } from "@/styles/sharedStyles";
import { formatFCFA } from "@/lib/utils";
import { Building2, ChevronRight } from "lucide-react";

/**
 * Ligne d'un bien dans la liste.
 * @param {{ property: import("@/types/domain").Property & any, onClick: () => void }} props
 */
export default function PropertyCard({ property, onClick }) {
  const occ = property.statut === "occupé";
  return (
    <button style={S.bienRow} onClick={onClick}>
      <div style={S.bienThumb}>
        <Building2 size={20} color="var(--ink-soft)" />
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={S.propertyName}>{property.nom}</div>
        <div style={S.propertyMeta}>{property.type} · {property.quartier}</div>
        <div style={S.bienLoyer}>{formatFCFA(property.loyer)}/mois</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <span style={{ ...S.statusTag, ...(occ ? S.statusOk : S.statusVacant) }}>{property.statut}</span>
        <ChevronRight size={16} color="var(--ink-soft)" />
      </div>
    </button>
  );
}
