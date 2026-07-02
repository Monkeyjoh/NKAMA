import { useNavigate, useParams } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES, PAY_STATUT } from "@/lib/constants";
import { formatFCFA, whatsappLink } from "@/lib/utils";
import { formatMonthFr, formatDateShort } from "@/lib/mappers";
import { useContract } from "@/hooks/useContracts";
import TopHeader from "@/components/layout/TopHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import { LoadingState, ErrorState, EmptyData } from "@/components/ui/StateViews";
import { MessageCircle, Phone, ChevronRight, Building2, User } from "lucide-react";

export default function ContratDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contract, loading, error, refetch } = useContract(id);

  if (loading || error || !contract) {
    return (
      <>
        <TopHeader title="Fiche contrat" onBack={() => navigate(ROUTES.contrats)} />
        <main style={S.main}>
          {loading && <LoadingState />}
          {!loading && error && <ErrorState error={error} onRetry={refetch} />}
          {!loading && !error && !contract && <EmptyData title="Contrat introuvable" />}
        </main>
      </>
    );
  }

  return (
    <>
      <TopHeader title="Fiche contrat" onBack={() => navigate(ROUTES.contrats)} />
      <main style={S.main}>
        <div style={S.screen}>
          {/* Récap bail */}
          <div style={S.bienFinanceCard}>
            <div style={S.bienCardTop}>
              <div>
                <div style={S.propertyName}>{contract.bien}</div>
                <div style={S.propertyMeta}>{contract.quartier}</div>
              </div>
              {contract.actif
                ? <span style={{ ...S.statusTag, ...S.statusOk }}>En cours</span>
                : <span style={{ ...S.statusTag, color: "var(--ink-soft)", background: "var(--paper-dim)" }}>Terminé</span>}
            </div>
            <div style={S.bienCardGrid}>
              <div>
                <div style={S.bienCardLabel}>Début → Fin</div>
                <div style={S.bienCardValue}>
                  {formatDateShort(contract.debut)} → {formatDateShort(contract.fin) || "—"}
                </div>
              </div>
              <div>
                <div style={S.bienCardLabel}>Loyer mensuel</div>
                <div style={S.bienCardValue}>{formatFCFA(contract.loyer)}</div>
              </div>
            </div>
          </div>

          {/* Liens bien / locataire */}
          <SectionLabel icon="Users" text="Parties" />
          <div style={S.list}>
            {contract.propertyId && (
              <button style={S.rowCard} onClick={() => navigate(ROUTES.bien(contract.propertyId))}>
                <div style={S.iconWrap32}><Building2 size={15} /></div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={S.propertyName}>{contract.bien}</div>
                  <div style={S.propertyMeta}>Voir la fiche du bien</div>
                </div>
                <ChevronRight size={16} color="var(--ink-soft)" />
              </button>
            )}
            {contract.tenantId && (
              <button style={S.rowCard} onClick={() => navigate(`${ROUTES.locataires}/${contract.tenantId}`)}>
                <div style={S.iconWrap32}><User size={15} /></div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={S.propertyName}>{contract.locataire}</div>
                  <div style={S.propertyMeta}>Voir la fiche locataire</div>
                </div>
                <ChevronRight size={16} color="var(--ink-soft)" />
              </button>
            )}
          </div>

          {contract.tel && (
            <div style={S.quickActions}>
              <a style={S.quickActionBtn} href={whatsappLink(contract.whatsapp)} target="_blank" rel="noreferrer">
                <MessageCircle size={14} /> WhatsApp
              </a>
              <a style={S.quickActionBtn} href={`tel:${contract.tel}`}>
                <Phone size={14} /> Appeler
              </a>
            </div>
          )}

          {/* Historique des loyers */}
          <SectionLabel icon="Wallet" text="Historique des loyers" />
          <div style={S.list}>
            {(contract.paiements || []).length === 0 && (
              <div style={S.emptyInline}>Aucun paiement enregistré.</div>
            )}
            {(contract.paiements || []).map((p, i) => {
              const meta = PAY_STATUT[p.statut] || { label: p.statut, color: "var(--ink-soft)", bg: "var(--paper-dim)" };
              return (
                <div key={i} style={S.rowCard}>
                  <div style={{ flex: 1 }}>
                    <div style={S.propertyName}>{formatMonthFr(p.mois)}</div>
                    <div style={S.propertyMeta}>{formatFCFA(p.montant)}</div>
                  </div>
                  <span style={{ ...S.statusTag, color: meta.color, background: meta.bg }}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
