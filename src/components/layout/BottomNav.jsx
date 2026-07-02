import { useLocation, useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import Icon from "@/components/ui/Icon";

/**
 * Détermine l'onglet actif à partir du chemin courant.
 * Les sous-écrans du menu « Plus » gardent « Plus » actif.
 * @param {string} pathname
 */
function activeKeyFromPath(pathname) {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/biens")) return "biens";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/finances")) return "finances";
  return "plus";
}

/** Barre de navigation basse (5 onglets), pilotée par le routeur. */
export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { role } = useAuth();
  const active = activeKeyFromPath(pathname);
  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <nav style={S.bottomNav}>
      {items.map((item) => {
        const on = item.key === active;
        return (
          <button
            key={item.key}
            style={{ ...S.navBtn, ...(on ? S.navBtnActive : {}) }}
            onClick={() => navigate(item.path)}
          >
            <Icon name={item.icon} size={20} strokeWidth={on ? 2 : 1.5} />
            <span style={S.navLabel}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
