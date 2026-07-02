import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { ROUTES } from "@/lib/constants";
import { initials } from "@/lib/utils";

/**
 * En-tête du tableau de bord (marque + salutation + notifications + avatar).
 * La cloche affiche le nombre de notifications NON LUES (Phase 5) et ouvre
 * le centre de notifications. L'avatar ouvre « Mon profil ».
 */
export default function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unread } = useNotifications(); // cache TTL partagé avec la page
  const prenom = (user?.nom || "").split(" ")[0] || "bienvenue";
  return (
    <header style={S.dashHeader}>
      <div style={S.headerLeft}>
        <div style={S.headerMark}>NK</div>
        <div>
          <div style={S.headerTitle}>NKAMA</div>
          <div style={S.headerRole}>Bonjour, {prenom}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          style={S.bellBtn}
          onClick={() => navigate(ROUTES.notifications)}
          aria-label={unread > 0 ? `Notifications (${unread} non lues)` : "Notifications"}
        >
          <Bell size={19} strokeWidth={1.75} />
          {unread > 0 && <span style={st.bellBadge}>{unread > 9 ? "9+" : unread}</span>}
        </button>
        <button onClick={() => navigate(ROUTES.profil)} aria-label="Mon profil" style={st.avatarBtn}>
          {user?.photo_url ? (
            <img src={user.photo_url} alt="" style={st.photo} />
          ) : (
            <span style={st.avatar}>{initials(user?.nom)}</span>
          )}
        </button>
      </div>
    </header>
  );
}

const st = {
  avatarBtn: { background: "none", border: "none", padding: 0, borderRadius: "50%" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "var(--terracotta-dim)", color: "var(--terracotta)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 },
  photo: { width: 32, height: 32, borderRadius: "50%", objectFit: "cover", display: "block" },
  bellBadge: {
    position: "absolute", top: 0, right: -2, minWidth: 15, height: 15,
    borderRadius: 999, background: "var(--rust)", color: "white",
    fontSize: 9.5, fontWeight: 700, lineHeight: "15px", padding: "0 4px",
    textAlign: "center", border: "1.5px solid var(--paper)", boxSizing: "content-box",
  },
};
