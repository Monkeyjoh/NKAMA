import { S } from "@/styles/sharedStyles";
import Icon from "@/components/ui/Icon";

/**
 * Carte d'aperçu module (tableau de bord).
 * @param {{ icon: string, titre: string, lignes: {label:string,valeur:number}[], onClick?: () => void }} props
 */
export default function ApercuCard({ icon, titre, lignes, onClick }) {
  return (
    <button style={S.apercuCard} onClick={onClick}>
      <div style={S.apercuHeader}>
        <Icon name={icon} size={16} />
        <span style={S.apercuTitre}>{titre}</span>
      </div>
      <div style={S.apercuLignes}>
        {lignes.map((l, i) => (
          <div key={i} style={S.apercuLigne}>
            <span style={S.apercuLigneLabel}>{l.label}</span>
            <span style={S.apercuLigneValeur}>{l.valeur}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
