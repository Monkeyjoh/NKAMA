import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { formatFCFA } from "@/lib/utils";
import { useContracts } from "@/hooks/useContracts";
import TopHeader from "@/components/layout/TopHeader";
import { AsyncSection } from "@/components/ui/StateViews";

export default function ContratsPage() {
  const navigate = useNavigate();
  const { data: contracts, loading, error, refetch } = useContracts();
  const list = contracts || [];
  return (
    <>
      <TopHeader title="Contrats" onBack={() => navigate(ROUTES.plus)} />
      <main style={S.main}>
        <div style={S.screen}>
          <AsyncSection loading={loading} error={error} isEmpty={!loading && list.length === 0} onRetry={refetch}
            emptyTitle="Aucun contrat">
          <div style={S.list}>
            {list.map((c) => (
              <button key={c.id} style={{ ...S.bienFinanceCard, textAlign: "left", cursor: "pointer", width: "100%" }}
                onClick={() => navigate(ROUTES.contrat(c.id))}>
                <div style={S.bienCardTop}>
                  <div>
                    <div style={S.propertyName}>{c.bien}</div>
                    <div style={S.propertyMeta}>{c.locataire}</div>
                  </div>
                  {c.echeance
                    ? <span style={{ ...S.statusTag, color: "#8A6A1F", background: "#FBF1DE" }}>Échéance proche</span>
                    : <span style={{ ...S.statusTag, ...S.statusOk }}>En cours</span>}
                </div>
                <div style={S.bienCardGrid}>
                  <div>
                    <div style={S.bienCardLabel}>Début → Fin</div>
                    <div style={S.bienCardValue}>{c.debut} → {c.fin || "—"}</div>
                  </div>
                  <div>
                    <div style={S.bienCardLabel}>Loyer</div>
                    <div style={S.bienCardValue}>{formatFCFA(c.loyer)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          </AsyncSection>
        </div>
      </main>
    </>
  );
}
