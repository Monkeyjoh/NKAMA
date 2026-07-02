import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { usePermissions } from "@/hooks/usePermissions";
import TopHeader from "@/components/layout/TopHeader";
import Icon from "@/components/ui/Icon";
import { ChevronRight, LogOut } from "lucide-react";

/**
 * Construit les groupes du menu avec compteurs dynamiques (Supabase).
 * `requires` : action de permission requise (absent → visible par tous).
 */
function buildGroups(d) {
  const n = (v) => (v == null ? "—" : v);
  return [
    {
      section: "Gestion locative",
      items: [
        { key: "locataires", label: "Locataires", icon: "Users", count: n(d?.locataires?.actifs), sub: "actifs", route: ROUTES.locataires, requires: "tenant.manage" },
        { key: "prestataires", label: "Prestataires", icon: "Hammer", count: n(d?.prestataires?.total), sub: "référencés", route: ROUTES.prestataires, requires: "contractor.manage" },
        { key: "contrats", label: "Contrats", icon: "FileSignature", count: n(d?.locataires?.echeances), sub: "à échéance bientôt", route: ROUTES.contrats, requires: "contract.manage" },
        { key: "maintenance", label: "Maintenance", icon: "Wrench", count: n(d?.maintenance?.ouverts), sub: "tickets actifs", route: ROUTES.maintenance },
      ],
    },
    {
      section: "Pilotage",
      items: [
        { key: "controle", label: "Contrôle & Transparence", icon: "ShieldAlert", count: n(d?.alertes?.length), sub: "alertes en cours", highlight: true, route: ROUTES.controle, requires: "control.view" },
      ],
    },
    {
      section: "Compte",
      items: [
        { key: "utilisateurs", label: "Utilisateurs", icon: "Users", count: null, sub: "rôles & accès", route: ROUTES.utilisateurs, requires: "users.view" },
        { key: "parametres", label: "Paramètres", icon: "Settings", count: null, sub: null, route: ROUTES.parametres, requires: "control.view" },
        { key: "profil", label: "Mon profil", icon: "User", count: null, sub: null, route: ROUTES.profil },
      ],
    },
  ];
}

export default function PlusPage() {
  const navigate = useNavigate();
  const { configured, signOut } = useAuth();
  const { data } = useDashboard();
  const { can } = usePermissions();
  const GROUPS = buildGroups(data)
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.requires || can(it.requires)) }))
    .filter((g) => g.items.length > 0);

  async function handleSignOut() {
    await signOut();
    // En mode Supabase, la garde de route renverra vers /login.
    if (configured) navigate("/login");
  }

  return (
    <>
      <TopHeader title="Plus" />
      <main style={S.main}>
        <div style={S.screen}>
          {GROUPS.map((g) => (
            <div key={g.section} style={S.group}>
              <div style={S.groupLabel}>{g.section}</div>
              <div style={S.list}>
                {g.items.map((item) => (
                  <button key={item.key} style={{ ...S.menuRow, ...(item.highlight ? S.menuRowHighlight : {}) }} onClick={() => navigate(item.route)}>
                    <div style={{ ...S.iconWrap36, ...(item.highlight ? S.iconWrapHighlight : {}) }}>
                      <Icon name={item.icon} size={18} />
                    </div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={S.menuLabel}>{item.label}</div>
                      {item.sub && (
                        <div style={S.menuSub}>
                          <span style={{ ...S.menuCount, ...(item.highlight ? { color: "var(--rust)" } : {}) }}>{item.count}</span> {item.sub}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={17} color="var(--ink-soft)" />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button style={S.logoutRow} onClick={handleSignOut}><LogOut size={16} /> Changer de profil</button>
          <div style={S.footerNote}>NKAMA · v1.0</div>
        </div>
      </main>
    </>
  );
}
