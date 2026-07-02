import { S } from "@/styles/sharedStyles";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * Carte KPI réutilisable (tableau de bord + finances).
 * @param {{ label: string, value: string, sub: string, accent: string, trend?: "hausse"|"baisse" }} props
 */
export default function KpiCard({ label, value, sub, accent, trend }) {
  return (
    <div style={{ ...S.kpiCard, borderTopColor: `var(--${accent})` }}>
      <div style={S.kpiLabel}>{label}</div>
      <div style={S.kpiValue}>{value}</div>
      <div style={S.kpiSubRow}>
        <span style={S.kpiSub}>{sub}</span>
        {trend &&
          (trend === "hausse" ? (
            <TrendingUp size={13} strokeWidth={2} color="var(--olive)" />
          ) : (
            <TrendingDown size={13} strokeWidth={2} color="var(--rust)" />
          ))}
      </div>
    </div>
  );
}
