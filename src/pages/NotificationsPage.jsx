import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/useToast";
import TopHeader from "@/components/layout/TopHeader";
import AlertActions from "@/components/notifications/AlertActions";
import Toast from "@/components/ui/Toast";
import { AsyncSection } from "@/components/ui/StateViews";
import { AlertTriangle, BellRing, CheckCheck } from "lucide-react";

/**
 * NKAMA — Centre de notifications (Phases 5-6).
 *
 * Alertes automatiques (loyers, contrats, vacance, tickets, justificatifs,
 * seuils) + rappels programmés, avec état lu / non-lu par utilisateur.
 * Le clic sur l'en-tête de carte marque la notification comme lue et ouvre
 * l'écran concerné ; chaque alerte expose ses actions contextuelles
 * (Phase 6 : appeler, relancer, affecter, valider, rappel, traité…).
 */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, unread, loading, error, refetch, markRead, markAllRead } = useNotifications();
  const { toast, showToast } = useToast();
  const isAdmin = ["owner", "admin"].includes(user?.role);

  /** Après une action contextuelle : toast + rechargement de la liste. */
  const onActionDone = (message) => {
    showToast(message);
    refetch();
  };

  /** Route cible selon l'entité concernée (null → non cliquable). */
  const targetRoute = (n) => {
    switch (n.entity_type) {
      case "property":           return n.entity_id ? ROUTES.bien(n.entity_id) : null;
      case "contract":           return isAdmin && n.entity_id ? ROUTES.contrat(n.entity_id) : null;
      case "maintenance_ticket": return ROUTES.maintenance;
      case "expense":            return isAdmin ? ROUTES.controle : null;
      default:                   return null;
    }
  };

  const onOpen = (n) => {
    if (!n.lu) markRead([n.key]);
    const to = targetRoute(n);
    if (to) navigate(to);
  };

  return (
    <>
      <TopHeader
        title="Notifications"
        onBack={() => navigate(ROUTES.dashboard)}
        right={
          unread > 0 ? (
            <button style={st.readAllBtn} onClick={markAllRead} aria-label="Tout marquer comme lu">
              <CheckCheck size={15} /> Tout lire
            </button>
          ) : null
        }
      />
      <main style={S.main}>
        <div style={S.screen}>
          <AsyncSection
            loading={loading}
            error={error}
            isEmpty={!loading && items.length === 0}
            onRetry={refetch}
            emptyTitle="Aucune notification"
            emptyText="Aucune anomalie détectée pour le moment."
          >
            <p style={S.aValiderIntro}>
              {unread > 0
                ? `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}.`
                : "Tout est lu. Les alertes résolues disparaissent automatiquement."}
            </p>
            <div style={S.list}>
              {items.map((n) => {
                const clickable = targetRoute(n) !== null || !n.lu;
                const Icon = n.type === "rappel" ? BellRing : AlertTriangle;
                return (
                  <div
                    key={n.key}
                    style={{
                      ...S.alertCard,
                      flexDirection: "column",
                      gap: 0,
                      ...(n.gravite === "haute" ? S.alertCardHigh : S.alertCardMedium),
                      ...(n.lu ? st.cardRead : null),
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 10, cursor: clickable ? "pointer" : "default" }}
                      onClick={() => onOpen(n)}
                      role={clickable ? "button" : undefined}
                    >
                      <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1 }}>
                        <div style={S.alertCardTitle}>{n.titre}</div>
                        <div style={S.alertCardDetail}>{n.detail}</div>
                      </div>
                      {!n.lu && <span style={st.unreadDot} aria-label="Non lue" />}
                    </div>
                    <AlertActions alert={n} onDone={onActionDone} onError={showToast} />
                  </div>
                );
              })}
            </div>
          </AsyncSection>
        </div>
      </main>
      <Toast message={toast} />
    </>
  );
}

const st = {
  readAllBtn: {
    display: "flex", alignItems: "center", gap: 5,
    background: "none", border: "none", color: "var(--terracotta)",
    fontSize: 12.5, fontWeight: 600, padding: "4px 2px", cursor: "pointer",
  },
  cardRead: { opacity: 0.55 },
  unreadDot: {
    flexShrink: 0, alignSelf: "center", width: 8, height: 8,
    borderRadius: "50%", background: "var(--rust)",
  },
};
