import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES, PAY_STATUT, PAYMENT_MODE_LABEL } from "@/lib/constants";
import { formatFCFA, initials, whatsappLink } from "@/lib/utils";
import { formatMonthFr, formatDateShort } from "@/lib/mappers";
import { generateRentReceipt } from "@/lib/receipts";
import { useTenant } from "@/hooks/useTenants";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getOwnerName } from "@/services/ownersService";
import TopHeader from "@/components/layout/TopHeader";
import ScoreBar from "@/components/ui/ScoreBar";
import SectionLabel from "@/components/ui/SectionLabel";
import PaymentForm from "@/components/finances/PaymentForm";
import Toast from "@/components/ui/Toast";
import { LoadingState, ErrorState, EmptyData } from "@/components/ui/StateViews";
import { MessageCircle, Phone, Plus, FileDown } from "lucide-react";

export default function LocataireDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tenant, loading, error, refetch } = useTenant(id);
  const { can } = usePermissions();
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const [payForm, setPayForm] = useState(false);

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

  /** Phase 7 : quittance (mois soldé) ou reçu (paiement partiel) en PDF. */
  async function downloadReceipt(p) {
    try {
      const contrat = (tenant.contrats || []).find((c) => c.id === p.contract_id) || bailActif;
      const bailleur = (await getOwnerName().catch(() => null)) || user?.nom || "Le bailleur";
      await generateRentReceipt({
        bailleur,
        locataire: tenant.nom,
        bien: contrat?.bien || tenant.bien,
        quartier: contrat?.quartier,
        mois: p.mois,
        loyer: p.montant,
        montantPaye: p.statut === "paye" ? p.montant : (p.montant_paye || 0),
        mode: p.mode_paiement,
        datePaiement: p.date_paiement,
      });
    } catch (e) {
      showToast(e?.message || "Échec de la génération du PDF");
    }
  }

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
          <div style={st.historyHeader}>
            <SectionLabel icon="Wallet" text="Historique des loyers" />
            {can("payment.record") && bailActif && (
              <button style={S.addBtn} onClick={() => setPayForm(true)}>
                <Plus size={15} strokeWidth={2} /> Encaisser
              </button>
            )}
          </div>
          <div style={S.list}>
            {(tenant.paiements || []).length === 0 && (
              <div style={S.emptyInline}>Aucun paiement enregistré.</div>
            )}
            {(tenant.paiements || []).map((p, i) => {
              const partiel = p.statut !== "paye" && (p.montant_paye || 0) > 0;
              const statutKey = partiel ? "partiel" : p.statut;
              const meta = PAY_STATUT[statutKey] || { label: p.statut, color: "var(--ink-soft)", bg: "var(--paper-dim)" };
              const encaisse = p.statut === "paye" || partiel;
              return (
                <div key={i} style={S.rowCard}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...S.propertyName, textTransform: "capitalize" }}>{formatMonthFr(p.mois)}</div>
                    <div style={S.propertyMeta}>
                      {partiel
                        ? `${formatFCFA(p.montant_paye)} / ${formatFCFA(p.montant)}`
                        : formatFCFA(p.montant)}
                      {encaisse && p.mode_paiement ? ` · ${PAYMENT_MODE_LABEL[p.mode_paiement] || p.mode_paiement}` : ""}
                      {encaisse && p.date_paiement ? ` · ${formatDateShort(p.date_paiement)}` : ""}
                    </div>
                  </div>
                  <span style={{ ...S.statusTag, color: meta.color, background: meta.bg }}>{meta.label}</span>
                  {encaisse && (
                    <button style={st.receiptBtn} onClick={() => downloadReceipt(p)}
                      aria-label={p.statut === "paye" ? "Télécharger la quittance" : "Télécharger le reçu"}
                      title={p.statut === "paye" ? "Quittance PDF" : "Reçu PDF"}>
                      <FileDown size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {payForm && (
        <PaymentForm
          tenant={tenant}
          onClose={() => setPayForm(false)}
          onSaved={() => { refetch(); showToast("Paiement enregistré"); }}
        />
      )}
      <Toast message={toast} />
    </>
  );
}

const st = {
  historyHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  receiptBtn: {
    marginLeft: 8, background: "none", border: "1px solid var(--line)",
    borderRadius: 8, padding: "6px 8px", color: "var(--terracotta)",
    display: "flex", alignItems: "center",
  },
};
