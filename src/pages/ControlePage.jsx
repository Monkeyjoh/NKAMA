import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { useDashboard } from "@/hooks/useDashboard";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { formatFCFA } from "@/lib/utils";
import TopHeader from "@/components/layout/TopHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import { AsyncSection } from "@/components/ui/StateViews";
import { AlertTriangle, FileText } from "lucide-react";

export default function ControlePage() {
  const navigate = useNavigate();
  const { data: dash, loading: l1, error: e1, refetch } = useDashboard();
  const { data: logs, loading: l2, error: e2, refetch: refetchLogs } = useActivityLogs();
  const alertes = dash?.alertes || [];

  return (
    <>
      <TopHeader title="Contrôle & Transparence" onBack={() => navigate(ROUTES.plus)} />
      <main style={S.main}>
        <div style={S.screen}>
          <SectionLabel icon="ShieldAlert" text="Anomalies détectées" />
          <AsyncSection loading={l1} error={e1} isEmpty={!l1 && alertes.length === 0} onRetry={refetch}
            emptyTitle="Aucune anomalie" emptyText="Aucune alerte en cours.">
            <div style={S.list}>
              {alertes.map((a, i) => (
                <div key={`${a.type}-${a.entity_id}-${i}`} style={{ ...S.alertCard, ...(a.gravite === "haute" ? S.alertCardHigh : S.alertCardMedium) }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={S.alertCardTitle}>{a.titre}</div>
                    <div style={S.alertCardDetail}>{a.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </AsyncSection>

          <SectionLabel icon="ClipboardList" text="Journal d'audit" />
          <AsyncSection loading={l2} error={e2} isEmpty={!l2 && (logs || []).length === 0} onRetry={refetchLogs}
            emptyTitle="Journal vide">
            <div style={S.list}>
              {(logs || []).map((g) => (
                <div key={g.id} style={S.rowCard}>
                  <div style={S.iconWrap32}><FileText size={15} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <div style={S.propertyName}>{g.action}</div>
                      {g.montant != null && <div style={S.amount}>{formatFCFA(g.montant)}</div>}
                    </div>
                    <div style={S.propertyMeta}>{g.entite}</div>
                    {g.commentaire && <div style={{ ...S.propertyMeta, marginTop: 3, fontStyle: "italic" }}>« {g.commentaire} »</div>}
                    <div style={{ ...S.propertyMeta, marginTop: 3 }}>
                      {g.auteur} · {g.date}{g.ip ? ` · ${g.ip}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AsyncSection>

          <p style={S.scoreNote}>
            Le journal d'audit est en mode ajout seul (append-only). Les seuils d'anomalie
            (dépense, SLA ticket, vacance…) sont réglables dans les Paramètres.
          </p>
        </div>
      </main>
    </>
  );
}
