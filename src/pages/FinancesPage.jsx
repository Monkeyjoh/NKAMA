import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { formatFCFA, rentabiliteColor } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { useExpenses } from "@/hooks/useExpenses";
import { useProperties } from "@/hooks/useProperties";
import { useToast } from "@/hooks/useToast";
import { decideExpense } from "@/services/expensesService";
import { invalidateDashboard } from "@/services/dashboardService";
import { logAction, LOG } from "@/services/logService";
import TopHeader from "@/components/layout/TopHeader";
import KpiCard from "@/components/ui/KpiCard";
import SectionLabel from "@/components/ui/SectionLabel";
import { BarComparisonChart, LegendDot, DepensesBarList } from "@/components/ui/Charts";
import ExpenseCard from "@/components/finances/ExpenseCard";
import ExpenseDetail from "@/components/finances/ExpenseDetail";
import ExpenseForm from "@/components/finances/ExpenseForm";
import { AsyncSection } from "@/components/ui/StateViews";
import Toast from "@/components/ui/Toast";
import { Plus, ChevronRight } from "lucide-react";

const CAT_META = {
  maintenance: { label: "Maintenance", couleur: "var(--terracotta)" },
  taxes: { label: "Taxes", couleur: "var(--ink)" },
  assurance: { label: "Assurance", couleur: "var(--olive)" },
  gestion: { label: "Gestion", couleur: "#8A6A1F" },
  autre: { label: "Autre", couleur: "var(--ink-soft)" },
};

export default function FinancesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("vue");

  return (
    <>
      <TopHeader title="Finances" />
      <div style={S.dashTabsFlat}>
        {[
          { key: "vue", label: "Vue d'ensemble" },
          { key: "depenses", label: "Dépenses" },
          { key: "biens", label: "Par bien" },
        ].map((t) => (
          <button key={t.key} style={{ ...S.flatTabBtn, ...(tab === t.key ? S.flatTabBtnActive : {}) }} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <main style={S.main}>
        {tab === "vue" && <VueTab navigate={navigate} />}
        {tab === "depenses" && <DepensesTab />}
        {tab === "biens" && <ParBienTab />}
      </main>
    </>
  );
}

/* ── Vue d'ensemble (depuis get_dashboard) ─────────────────── */
function VueTab({ navigate }) {
  const { data, loading, error, refetch } = useDashboard();
  return (
    <AsyncSection loading={loading} error={error} isEmpty={!data} onRetry={refetch}>
      {data && <VueContent data={data} navigate={navigate} />}
    </AsyncSection>
  );
}
function VueContent({ data, navigate }) {
  const loyers = data.loyers || {};
  const rg = data.rentabilite_globale || {};
  const dep = data.depenses_mois || {};
  const cashflow = data.cashflow || [];
  const depCat = (data.depenses_categorie || []).map((d) => ({
    categorie: CAT_META[d.categorie]?.label || d.categorie,
    montant: d.montant,
    couleur: CAT_META[d.categorie]?.couleur || "var(--ink-soft)",
  }));
  const rentBiens = data.rentabilite_bien || [];

  return (
    <div style={S.screen}>
      <div style={S.kpiGrid}>
        <KpiCard label="Loyers attendus" value={formatFCFA(loyers.attendu)} sub="Ce mois" accent="ink" />
        <KpiCard label="Loyers encaissés" value={formatFCFA(loyers.encaisse)} sub={`${loyers.taux_recouvrement ?? 0}% recouvré`} accent="olive" />
        <KpiCard label="Dépenses du mois" value={formatFCFA(dep.total_validee)} sub="Validées" accent="rust" />
        <KpiCard label="Rentabilité globale" value={`${rg.net ?? 0}%`} sub="12 derniers mois" accent="terracotta" trend={(rg.net ?? 0) >= 70 ? "hausse" : "baisse"} />
      </div>

      <SectionLabel text="Cash-flow — 6 derniers mois" />
      {cashflow.length > 0 ? (
        <div style={S.chartCard}>
          <BarComparisonChart data={cashflow.map((c) => ({ mois: c.mois_label, attendu: c.attendu, encaisse: c.encaisse }))} />
          <div style={S.legendRow}>
            <LegendDot label="Attendu" outline />
            <LegendDot color="var(--terracotta)" label="Encaissé" />
          </div>
        </div>
      ) : <div style={S.emptyInline}>Aucune donnée disponible.</div>}

      <SectionLabel text="Dépenses par catégorie — ce mois" />
      {depCat.length > 0 ? (
        <div style={S.chartCard}><DepensesBarList data={depCat} /></div>
      ) : <div style={S.emptyInline}>Aucune dépense validée ce mois.</div>}

      <SectionLabel text="Rentabilité par bien" />
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
      ) : <div style={S.emptyInline}>Aucune donnée disponible.</div>}
    </div>
  );
}

/* ── Dépenses (live) ───────────────────────────────────────── */
function DepensesTab() {
  const { data, loading, error, refetch } = useExpenses();
  const { toast, showToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null); // {} = création, objet = édition

  useEffect(() => { if (data) setExpenses(data); }, [data]);

  async function decide(id, statut) {
    const exp = expenses.find((d) => d.id === id) || selected;
    await decideExpense(id, statut);
    await logAction(
      statut === "validee" ? LOG.validation : LOG.rejet,
      "expense", id,
      { label: `Dépense ${exp?.categorie || ""} — ${exp?.bien || ""}`.trim(), montant: exp?.montant },
    );
    invalidateDashboard();
    setExpenses((prev) => prev.map((d) => (d.id === id ? { ...d, statut } : d)));
    setSelected(null);
    showToast(statut === "validee" ? "Dépense validée" : "Dépense rejetée");
  }

  return (
    <div style={S.screen}>
      <div style={S.screenHeaderRow}>
        <span style={S.screenSubtitle}>{expenses.length} dépense(s)</span>
        <button style={S.addBtn} onClick={() => setForm({})}><Plus size={15} strokeWidth={2} /> Ajouter</button>
      </div>
      <AsyncSection loading={loading} error={error} isEmpty={!loading && expenses.length === 0} onRetry={refetch}
        emptyTitle="Aucune dépense" emptyText="Les dépenses enregistrées apparaîtront ici.">
        <div style={S.list}>
          {expenses.map((d) => <ExpenseCard key={d.id} expense={d} onClick={() => setSelected(d)} />)}
        </div>
      </AsyncSection>
      {selected && (
        <ExpenseDetail
          expense={selected}
          onClose={() => setSelected(null)}
          onDecide={decide}
          onEdit={(e) => { setSelected(null); setForm(e); }}
        />
      )}
      {form && (
        <ExpenseForm
          initial={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={refetch}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

/* ── Par bien (live) ───────────────────────────────────────── */
function ParBienTab() {
  const { data, loading, error, refetch } = useProperties();
  const biens = [...(data || [])].sort((a, b) => b.net - a.net);
  return (
    <div style={S.screen}>
      <AsyncSection loading={loading} error={error} isEmpty={!loading && biens.length === 0} onRetry={refetch}
        emptyTitle="Aucun bien">
        <div style={S.list}>
          {biens.map((p) => (
            <div key={p.id} style={S.bienFinanceCard}>
              <div style={S.bienCardTop}>
                <div>
                  <div style={S.propertyName}>{p.nom}</div>
                  <div style={S.propertyMeta}>{p.quartier}</div>
                </div>
                <span style={{ ...S.rentabiliteTag, color: rentabiliteColor(p.net) }}>{p.net}% net</span>
              </div>
              <div style={S.bienCardGrid}>
                <div>
                  <div style={S.bienCardLabel}>Encaissé (12 mois)</div>
                  <div style={S.bienCardValue}>{formatFCFA(p.encaisse12m)}</div>
                </div>
                <div>
                  <div style={S.bienCardLabel}>Dépenses (12 mois)</div>
                  <div style={S.bienCardValue}>{formatFCFA(p.depenses12m)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AsyncSection>
    </div>
  );
}
