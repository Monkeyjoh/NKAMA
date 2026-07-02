import { useNavigate, useParams } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES, PAY_STATUT } from "@/lib/constants";
import { formatFCFA, initials, whatsappLink } from "@/lib/utils";
import { formatMonthFr, formatDateShort } from "@/lib/mappers";
import { useTenant } from "@/hooks/useTenants";
import TopHeader from "@/components/layout/TopHeader";
import ScoreBar from "@/components/ui/ScoreBar";
import SectionLabel from "@/components/ui/SectionLabel";
import { LoadingState, ErrorState, EmptyData } from "@/components/ui/StateViews";
import { MessageCircle, Phone } from "lucide-react";

export default function LocataireDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tenant, loading, error, refetch } = useTenant(id);

  if (loading || error || !tenant) {
    return (
      <>
        <TopHeader title="Fiche locataire" onBack={() => navigate(ROUTES.locataires)} />
        <main style={S.main}>
          {loading && <LoadingState />}
          {!loading && error && <ErrorState error={error} onRetry={refetch} />}
          {!loading && !error && !tenant && <EmptyData title="Locataire introuvable" />}
        </main>
      </>
    );
  }

  const bailActif = (tenant.contrats || []).find((c) => c.actif) || tenant.contrats?.[0];

  return (
    <>
      <TopHeader title="Fiche locataire" onBack={() => navigate(ROUTES.locataires)} />
      <main style={S.main}>
        <div style={S.screen}>
          {/* En-tête locataire */}
          <div style={S.tenantCard}>
            <div style={S.tenantTop}>
              <div style={S.avatar40}>{initials(tenant.nom)}</div>
              <div style={{ flex: 1 }}>
                <div style={S.tenantName}>{tenant.nom}</div>
                <div style={S.tenantSince}>
                  {tenant.bien ? `${tenant.bien} · ` : ""}depuis {tenant.depuis || "—"}
                </div>
              </div>
            </div>
            <ScoreBar score={tenant.score} />
            {tenant.tel && (
              <div style={S.quickActions}>
                <a style={S.quickActionBtn} href={whatsappLink(tenant.tel)} target="_blank" rel="noreferrer">
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a style={S.quickActionBtn} href={`tel:${tenant.tel}`}>
                  <Phone size={14} /> Appeler
                </a>
              </div>
            )}
          </div>

          {/* Bail en cours */}
          <SectionLabel icon="FileText" text="Bail" />
          {bailActif ? (
            <div style={S.bienFinanceCard}>
              <div style={S.bienCardTop}>
                <div>
                  <div style={S.propertyName}>{bailActif.bien}</div>
                  <div style={S.propertyMeta}>{bailActif.quartier}</div>
                </div>
                {bailActif.actif
                  ? <span style={{ ...S.statusTag, ...S.statusOk }}>En cours</span>
                  : <span style={{ ...S.statusTag, color: "var(--ink-soft)", background: "var(--paper-dim)" }}>Terminé</span>}
              </div>
              <div style={S.bienCardGrid}>
                <div>
                  <div style={S.bienCardLabel}>Début → Fin</div>
                  <div style={S.bienCardValue}>
                    {formatDateShort(bailActif.debut)} → {formatDateShort(bailActif.fin) || "—"}
                  </div>
                </div>
                <div>
                  <div style={S.bienCardLabel}>Loyer</div>
                  <div style={S.bienCardValue}>{formatFCFA(bailActif.loyer)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={S.emptyInline}>Aucun bail enregistré.</div>
          )}

          {/* Historique des loyers */}
          <SectionLabel icon="Wallet" text="Historique des loyers" />
          <div style={S.list}>
            {(tenant.paiements || []).length === 0 && (
              <div style={S.emptyInline}>Aucun paiement enregistré.</div>
            )}
            {(tenant.paiements || []).map((p, i) => {
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
