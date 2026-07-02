import { S } from "@/styles/sharedStyles";
import { formatFCFA } from "@/lib/utils";

/** Barres comparatives encaissé vs attendu (SVG/CSS, sans lib externe). */
export function BarComparisonChart({ data }) {
  const max = Math.max(...data.map((d) => Math.max(d.attendu, d.encaisse)));
  return (
    <div style={S.barChartWrap}>
      {data.map((d) => {
        const hA = (d.attendu / max) * 100;
        const hE = (d.encaisse / max) * 100;
        const sous = d.encaisse < d.attendu;
        return (
          <div key={d.mois} style={S.barGroup}>
            <div style={S.barPair}>
              <div style={{ ...S.barAttendu, height: `${hA}%` }} />
              <div style={{ ...S.barEncaisse, height: `${hE}%`, background: sous ? "#D98654" : "var(--terracotta)" }} />
            </div>
            <span style={S.barLabel}>{d.mois}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Point de légende. */
export function LegendDot({ color, label, outline }) {
  return (
    <div style={S.legendItem}>
      <span style={{ ...S.legendDot, background: outline ? "transparent" : color, border: outline ? "1.5px solid var(--line)" : "none" }} />
      <span style={S.legendLabel}>{label}</span>
    </div>
  );
}

/** Barres horizontales : dépenses par catégorie. */
export function DepensesBarList({ data }) {
  const total = data.reduce((s, d) => s + d.montant, 0);
  return (
    <div style={S.depensesBarList}>
      {data.map((d) => {
        const pct = total ? Math.round((d.montant / total) * 100) : 0;
        return (
          <div key={d.categorie}>
            <div style={S.depensesBarTop}>
              <span style={S.depensesBarLabel}>{d.categorie}</span>
              <span style={S.depensesBarMontant}>{formatFCFA(d.montant)}</span>
            </div>
            <div style={S.depensesBarTrack}>
              <div style={{ ...S.depensesBarFill, width: `${pct}%`, background: d.couleur }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
