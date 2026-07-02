import { S } from "@/styles/sharedStyles";
import { STATUT_META, PRIORITE_META } from "@/lib/constants";
import ProofDot from "@/components/ui/ProofDot";
import { Wrench } from "lucide-react";

/** Carte ticket de maintenance. @param {{ ticket: any, onClick: () => void }} props */
export default function TicketCard({ ticket, onClick }) {
  const meta = STATUT_META[ticket.statut];
  return (
    <button style={S.ticketCard} onClick={onClick}>
      <div style={S.ticketCardTop}>
        <div style={S.iconWrap32}><Wrench size={16} /></div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={S.propertyName}>{ticket.titre}</div>
          <div style={S.propertyMeta}>{ticket.bien} · {ticket.categorie}</div>
        </div>
        <span style={{ ...S.statusTag, color: meta.color, background: meta.bg }}>{meta.label}</span>
      </div>
      <div style={S.ticketCardBottom}>
        <span style={{ ...S.prioriteTag, color: PRIORITE_META[ticket.priorite].color }}>● {ticket.priorite}</span>
        <div style={S.proofIcons}>
          <ProofDot done={ticket.photoAvant} label="Avant" />
          <ProofDot done={ticket.photoApres} label="Après" />
          <ProofDot done={ticket.facture} label="Facture" />
        </div>
      </div>
    </button>
  );
}
