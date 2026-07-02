import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { initials, scoreColor } from "@/lib/utils";
import { useTenants } from "@/hooks/useTenants";
import TopHeader from "@/components/layout/TopHeader";
import { AsyncSection } from "@/components/ui/StateViews";

export default function LocatairesPage() {
  const navigate = useNavigate();
  const { data: tenants, loading, error, refetch } = useTenants();
  const list = tenants || [];
  return (
    <>
      <TopHeader title="Locataires" onBack={() => navigate(ROUTES.plus)} />
      <main style={S.main}>
        <div style={S.screen}>
          <AsyncSection loading={loading} error={error} isEmpty={!loading && list.length === 0} onRetry={refetch}
            emptyTitle="Aucun locataire">
            <div style={S.list}>
              {list.map((t) => {
                const color = scoreColor(t.score);
                return (
                  <button key={t.id} style={{ ...S.rowCard, textAlign: "left", cursor: "pointer" }}
                    onClick={() => navigate(ROUTES.locataire(t.id))}>
                    <div style={S.avatar40}>{initials(t.nom)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={S.propertyName}>{t.nom}</div>
                      <div style={S.propertyMeta}>{t.bien} · depuis {t.depuis}</div>
                      <div style={{ ...S.scoreTrack, marginTop: 8 }}>
                        <div style={{ ...S.scoreFill, width: `${t.score}%`, background: color }} />
                      </div>
                    </div>
                    <div style={{ ...S.scoreValue, color, marginLeft: 6 }}>{t.score}</div>
                  </button>
                );
              })}
            </div>
          </AsyncSection>
        </div>
      </main>
    </>
  );
}
