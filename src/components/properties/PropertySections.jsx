import { S } from "@/styles/sharedStyles";
import { formatFCFA, initials, whatsappLink } from "@/lib/utils";
import ScoreBar from "@/components/ui/ScoreBar";
import {
  ChevronRight, MessageCircle, Phone, Wrench, CheckCircle2,
  FileText, Download, Plus, TrendingUp,
} from "lucide-react";

/** Onglet Locataire. */
export function LocataireSection({ tenant, onVacantClick }) {
  if (!tenant) {
    return (
      <div style={S.sectionBody}>
        <div style={S.emptyInline}>
          Aucun locataire — bien vacant.{" "}
          {onVacantClick && (
            <button style={S.linkBtn} onClick={onVacantClick}>Mettre en location</button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div style={S.sectionBody}>
      <div style={S.tenantCard}>
        <div style={S.tenantTop}>
          <div style={S.avatar40}>{initials(tenant.nom)}</div>
          <div style={{ flex: 1 }}>
            <div style={S.tenantName}>{tenant.nom}</div>
            <div style={S.tenantSince}>Locataire depuis {tenant.depuis}</div>
          </div>
          <ChevronRight size={16} color="var(--ink-soft)" />
        </div>
        <ScoreBar score={tenant.score} />
        <div style={S.quickActions}>
          <a style={S.quickActionBtn} href={whatsappLink(tenant.tel)} target="_blank" rel="noreferrer">
            <MessageCircle size={14} /> WhatsApp
          </a>
          <a style={S.quickActionBtn} href={`tel:${tenant.tel}`}>
            <Phone size={14} /> Appeler
          </a>
        </div>
      </div>
      <p style={S.scoreNote}>
        Le score est calculé automatiquement à partir de la ponctualité des loyers, des incidents
        déclarés et de l'ancienneté. Il ne peut pas être modifié manuellement.
      </p>
    </div>
  );
}

/** Onglet Travaux. */
export function TravauxSection({ travaux = [], onAddTicket }) {
  return (
    <div style={S.sectionBody}>
      <div style={S.sectionBodyHeader}>
        <span style={S.sectionBodySubtitle}>Historique des interventions</span>
        <button style={S.miniAddBtn} onClick={onAddTicket}><Plus size={13} strokeWidth={2} /> Ticket</button>
      </div>
      <div style={S.list}>
        {travaux.length === 0 && <div style={S.emptyInline}>Aucune intervention enregistrée.</div>}
        {travaux.map((t) => (
          <div key={t.id} style={S.rowCard}>
            <div style={S.iconWrap32}><Wrench size={15} /></div>
            <div style={{ flex: 1 }}>
              <div style={S.propertyName}>{t.titre}</div>
              <div style={S.propertyMeta}>{t.date}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={S.amount}>{formatFCFA(t.montant)}</div>
              <span style={S.validatedTag}><CheckCircle2 size={11} /> Validé</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Onglet Documents. */
export function DocumentsSection({ documents = [] }) {
  return (
    <div style={S.sectionBody}>
      <div style={S.sectionBodyHeader}>
        <span style={S.sectionBodySubtitle}>{documents.length} fichiers</span>
        <button style={S.miniAddBtn}><Plus size={13} strokeWidth={2} /> Ajouter</button>
      </div>
      <div style={S.list}>
        {documents.length === 0 && <div style={S.emptyInline}>Aucun document.</div>}
        {documents.map((d) => (
          <button key={d.id} style={S.rowCard}>
            <div style={S.iconWrap32}><FileText size={15} /></div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={S.propertyName}>{d.nom}</div>
              <div style={S.propertyMeta}>{d.taille}</div>
            </div>
            <Download size={16} color="var(--ink-soft)" />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Onglet Finances. */
export function FinanceSection({ rentabilite }) {
  return (
    <div style={S.sectionBody}>
      <div style={S.financeGrid}>
        <div style={S.financeCard}>
          <div style={S.bienCardLabel}>Encaissé (12 mois)</div>
          <div style={S.financeValue}>{formatFCFA(rentabilite.encaisse12m)}</div>
        </div>
        <div style={S.financeCard}>
          <div style={S.bienCardLabel}>Dépenses (12 mois)</div>
          <div style={S.financeValue}>{formatFCFA(rentabilite.depenses12m)}</div>
        </div>
      </div>
      <div style={S.netCard}>
        <div style={S.netCardLeft}>
          <TrendingUp size={18} color="var(--olive)" />
          <div>
            <div style={S.bienCardLabel}>Rentabilité nette</div>
            <div style={{ ...S.financeValue, color: "var(--olive)" }}>{rentabilite.net}%</div>
          </div>
        </div>
        <span style={S.netFormula}>(Encaissé − Dépenses) / Encaissé</span>
      </div>
    </div>
  );
}
