import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { formatFCFA, rentabiliteColor } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import Header from "@/components/layout/Header";
import AlertActions from "@/components/notifications/AlertActions";
import Toast from "@/components/ui/Toast";
import KpiCard from "@/components/ui/KpiCard";
import SectionLabel from "@/components/ui/SectionLabel";
import { BarComparisonChart, LegendDot, DepensesBarList } from "@/components/ui/Charts";
import { AsyncSection, EmptyData } from "@/components/ui/StateViews";
import { AlertTriangle, ChevronRight, Star } from "lucide-react";

/** Libellés + couleurs des catégories de dépense (pour le graphe). */
const CAT_META = {
  maintenance: { label: "Maintenance", couleur: "var(--terracotta)" },
  taxes: { label: "Taxes", couleur: "var(--ink)" },
  assurance: { label: "Assurance", couleur: "var(--olive)" },
  gestion: { label: "Gestion", couleur: "#8A6A1F" },
  autre: { label: "Autre", couleur: "var(--ink-soft)" },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("vue");
  const { data, loading, error, refetch } = useDashboard();
  const { toast, showToast } = useToast();

  const alertes = data?.alertes || [];

  /** Après une action contextuelle sur une alerte : toast + refetch. */
  const onActionDone = (message) => {
    showToast(message);
    refetch();
  };

  return (
    <>
      <Header />
      <div style={S.dashTabs}>
        <button style={{ ...S.dashTabBtn, ...(tab === "vue" ? S.dashTabBtnActive : {}) }} onClick={() => setTab("vue")}>
          Vue d'ensemble
        </button>
        <button style={{ ...S.dashTabBtn, ...(tab === "alertes" ? S.dashTabBtnActive : {}) }} onClick={() => setTab("alertes")}>
          Alertes {alertes.length > 0 && <span style={S.tabBadge}>{alertes.length}</span>}
        </button>
      </div>

      <main style={S.main}>
        <AsyncSection loading={loading} error={error} isEmpty={!data} onRetry={refetch}
          emptyText="Le tableau de bord se remplira dès que des données seront disponibles dans Supabase.">
          {data && (tab === "vue"
            ? <VueEnsemble data={data} navigate={navigate} />
            : <AlertesTab alertes={alertes} onActionDone={onActionDone} onError={showToast} />)}
        </AsyncSection>
      </main>
      <Toast message={toast} />
    </>
  );
}

/* ── Vue d'ensemble ─────────────────────────────────────────── */
function VueEnsemble({ data, navigate }) {
  const { can } = usePermissions();
  const showFinance = can("finance.view");
  const loyers = data.loyers;
  const parc = data.parc;
  const rg = data.rentabilite_globale;
  const loc = data.locataires;
  const maint = data.maintenance;
  const dep = data.depenses_mois;
  const ctrl = data.controle;
  const prest = data.prestataires;
  const cashflow = data.cashflow || [];
  const depCat = (data.depenses_categorie || []).map((d) => ({
    categorie: CAT_META[d.categorie]?.label || d.categorie,
    montant: d.montant,
    couleur: CAT_META[d.categorie]?.couleur || "var(--ink-soft)",
  }));
  const rentBiens = data.rentabilite_bien || [];
  const retards = data.retards || [];
  const top = data.prestataires_top || [];

  return (
    <div style={S.screen}>
      {/* Loyers (finances → owner/admin) */}
      {showFinance && (loyers ? (
        <div style={S.kpiGrid}>
          <KpiCard label="Loyers attendus" value={formatFCFA(loyers.attendu)} sub="Ce mois" accent="ink" />
          <KpiCard label="Loyers encaissés" value={formatFCFA(loyers.encaisse)} sub={`${loyers.taux_recouvrement}% recouvré`} accent="olive" />
          <KpiCard label="Retards" value={formatFCFA(loyers.retard)} sub={`${loyers.retard_count} locataire(s)`} accent="rust" />
          <KpiCard label="Rentabilité globale" value={`${rg?.net ?? 0}%`} sub="12 derniers mois" accent="terracotta"
            trend={(rg?.net ?? 0) >= 70 ? "hausse" : "baisse"} />
        </div>
      ) : <EmptyData />)}

      {/* Occupation / Parc */}
      {parc && (
        <div style={S.occupationCard}>
          <div>
            <div style={S.occupationLabel}>Taux d'occupation</div>
            <div style={S.occupationValue}>{parc.occupes} / {parc.total} biens occupés</div>
            <div style={{ ...S.propertyMeta, marginTop: 4 }}>{parc.vacants} vacant(s)</div>
          </div>
          <div style={S.occupationRing}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="var(--paper-dim)" strokeWidth="6" />
              <circle cx="26" cy="26" r="22" fill="none" stroke="var(--terracotta)" strokeWidth="6"
                strokeDasharray={`${(parc.taux_occupation / 100) * 138} 138`} strokeLinecap="round" transform="rotate(-90 26 26)" />
            </svg>
            <span style={S.occupationRingText}>{parc.taux_occupation}%</span>
          </div>
        </div>
      )}

      {/* Locataires */}
      <SectionLabel icon="Users" text="Locataires" />
      {loc ? (
        <div style={S.kpiGrid}>
          <KpiCard label="Locataires actifs" value={`${loc.actifs}`} sub="Baux en cours" accent="olive" />
          <KpiCard label="Départs prévus" value={`${loc.departs_prevus}`} sub="≤ 30 jours" accent="rust" />
          <KpiCard label="Baux à échéance" value={`${loc.echeances}`} sub="Bientôt" accent="terracotta" />
          <KpiCard label="Biens vacants" value={`${parc?.vacants ?? 0}`} sub="À relouer" accent="ink" />
        </div>
      ) : <EmptyData />}

      {/* Maintenance */}
      <SectionLabel icon="Wrench" text="Maintenance" />
      {maint ? (
        <div style={S.kpiGrid}>
          <KpiCard label="Tickets ouverts" value={`${maint.ouverts}`} sub="Non clôturés" accent="terracotta" />
          <KpiCard label="En retard" value={`${maint.en_retard}`} sub="> SLA" accent="rust" />
          <KpiCard label="Délai moyen" value={`${maint.temps_moyen_jours} j`} sub="Résolution" accent="ink" />
          <KpiCard label="Coût total" value={formatFCFA(maint.cout_total)} sub="Interventions" accent="olive" />
        </div>
      ) : <EmptyData />}

      {/* Finances : cash-flow + dépenses (owner/admin) */}
      {showFinance && (
        <>
          <SectionLabel icon="Wallet" text="Cash-flow — 6 derniers mois" />
          {cashflow.length > 0 ? (
            <div style={S.chartCard}>
              <BarComparisonChart data={cashflow.map((c) => ({ mois: c.mois_label, attendu: c.attendu, encaisse: c.encaisse }))} />
              <div style={S.legendRow}>
                <LegendDot label="Attendu" outline />
                <LegendDot color="var(--terracotta)" label="Encaissé" />
              </div>
            </div>
          ) : <EmptyData />}

          <SectionLabel icon="Wallet" text="Dépenses par catégorie — ce mois" />
          {depCat.length > 0 ? (
            <div style={S.chartCard}><DepensesBarList data={depCat} /></div>
          ) : <EmptyData text={dep ? "Aucune dépense validée ce mois." : undefined} />}

          <SectionLabel icon="TrendingUp" text="Rentabilité par bien" />
          {rentBiens.length > 0 ? (
            <div style={S.list}>
              {rentBiens.map((p, i) => (
                <button key={p.id} style={S.rankRow} onClick={() => navigate(ROUTES.bien(p.id))}>
                  <span style={S.rankNumber}>{i + 1}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={S.propertyName}>{p.nom}</div>
                    <div style={S.propertyMeta}>{p.quartier}</div>
                  </div>
                  <span style={{ ...S.rentabiliteTag, color: rentabiliteColor(p.net) }}>{p.net}%</span>
                  <ChevronRight size={16} color="var(--ink-soft)" />
                </button>
              ))}
            </div>
          ) : <EmptyData />}
        </>
      )}

      {/* Contrôle (owner/admin) */}
      {can("control.view") && (
        <>
          <SectionLabel icon="ShieldAlert" text="Contrôle" />
          {ctrl ? (
            <div style={S.kpiGrid}>
              <KpiCard label="Dépenses à valider" value={`${ctrl.depenses_a_valider}`} sub="En attente" accent="terracotta" />
              <KpiCard label="Sans justificatif" value={`${ctrl.depenses_sans_justificatif}`} sub="Dépenses" accent="rust" />
              <KpiCard label="Factures en attente" value={`${ctrl.factures_en_attente}`} sub="Tickets" accent="ink" />
              <KpiCard label="Paiements en retard" value={`${ctrl.paiements_en_retard}`} sub="Loyers" accent="rust" />
            </div>
          ) : <EmptyData />}
        </>
      )}

      {/* Prestataires (owner/admin) */}
      {can("contractor.manage") && (
      <>
      <SectionLabel icon="Hammer" text="Prestataires" />
      {prest && top.length > 0 ? (
        <>
          <div style={{ ...S.kpiGrid, marginBottom: 10 }}>
            <KpiCard label="Interventions" value={`${prest.interventions}`} sub="Total" accent="ink" />
            <KpiCard label="Score moyen" value={`${prest.score_moyen}/5`} sub="Confiance" accent="olive" />
          </div>
          <div style={S.list}>
            {top.map((c) => (
              <div key={c.id} style={S.rowCard}>
                <div style={S.iconWrap32}><Star size={15} color="var(--olive)" /></div>
                <div style={{ flex: 1 }}>
                  <div style={S.propertyName}>{c.nom}</div>
                  <div style={S.propertyMeta}>{c.interventions} intervention(s)</div>
                </div>
                {c.note != null && <div style={{ ...S.amount, color: "var(--olive)" }}>★ {c.note}</div>}
              </div>
            ))}
          </div>
        </>
      ) : <EmptyData />}
      </>
      )}

      {/* Retards par locataire (owner/admin) */}
      {showFinance && (
        <>
          <SectionLabel icon="Clock" text="Retards par locataire" />
          {retards.length > 0 ? (
            <div style={S.list}>
              {retards.map((r) => (
                <div key={r.tenant_id} style={S.rowCard}>
                  <div style={{ flex: 1 }}>
                    <div style={S.propertyName}>{r.nom}</div>
                    <div style={S.propertyMeta}>{r.bien} · {r.mois_retard} mois</div>
                  </div>
                  <div style={{ ...S.amount, color: "var(--rust)" }}>{formatFCFA(r.montant)}</div>
                </div>
              ))}
            </div>
          ) : <EmptyData title="Aucun retard" text="Tous les loyers du mois sont à jour." />}
        </>
      )}
    </div>
  );
}

/* ── Onglet Alertes ─────────────────────────────────────────── */
function AlertesTab({ alertes, onActionDone, onError }) {
  if (alertes.length === 0) {
    return (
      <div style={S.screen}>
        <EmptyData title="Aucune alerte" text="Aucune anomalie détectée pour le moment." />
      </div>
    );
  }
  return (
    <div style={S.screen}>
      <p style={S.aValiderIntro}>
        Remontées automatiques (loyers, contrats, vacance, tickets, justificatifs, seuils de dépense).
        Chaque alerte propose des actions selon son type.
      </p>
      <div style={S.list}>
        {alertes.map((a, i) => (
          <div
            key={a.alert_key || `${a.type}-${a.entity_id}-${i}`}
            style={{ ...S.alertCard, flexDirection: "column", gap: 0, ...(a.gravite === "haute" ? S.alertCardHigh : S.alertCardMedium) }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={S.alertCardTitle}>{a.titre}</div>
                <div style={S.alertCardDetail}>{a.detail}</div>
              </div>
            </div>
            <AlertActions
              alert={{ ...a, key: a.alert_key || `${a.type}:${a.entity_id ?? ""}` }}
              onDone={onActionDone}
              onError={onError}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
