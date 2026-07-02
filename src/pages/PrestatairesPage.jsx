import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { useContractors } from "@/hooks/useContractors";
import TopHeader from "@/components/layout/TopHeader";
import ContractorForm from "@/components/contractors/ContractorForm";
import { AsyncSection } from "@/components/ui/StateViews";
import { Hammer, Plus, ChevronRight } from "lucide-react";

export default function PrestatairesPage() {
  const navigate = useNavigate();
  const { data: contractors, loading, error, refetch } = useContractors();
  const [form, setForm] = useState(null); // {} = création, objet = édition
  const list = contractors || [];

  return (
    <>
      <TopHeader title="Prestataires" onBack={() => navigate(ROUTES.plus)} />
      <main style={S.main}>
        <div style={S.screen}>
          <div style={S.screenHeaderRow}>
            <span style={S.screenSubtitle}>{list.length} prestataires référencés</span>
            <button style={S.addBtn} onClick={() => setForm({})}><Plus size={15} strokeWidth={2} /> Ajouter</button>
          </div>
          <AsyncSection loading={loading} error={error} isEmpty={!loading && list.length === 0} onRetry={refetch}
            emptyTitle="Aucun prestataire" emptyText="Référencez votre premier prestataire.">
            <div style={S.list}>
              {list.map((c) => (
                <button key={c.id} style={S.rowCard} onClick={() => setForm(c)}>
                  <div style={S.iconWrap32}><Hammer size={16} /></div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={S.propertyName}>{c.nom}</div>
                    <div style={S.propertyMeta}>{c.categorie} · {c.zone}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {c.note != null && <div style={{ ...S.amount, color: "var(--olive)" }}>★ {c.note}</div>}
                  </div>
                  <ChevronRight size={16} color="var(--ink-soft)" />
                </button>
              ))}
            </div>
          </AsyncSection>
        </div>
      </main>

      {form && (
        <ContractorForm
          initial={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={refetch}
        />
      )}
    </>
  );
}
