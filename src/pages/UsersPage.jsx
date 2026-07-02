import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/permissions";
import { initials } from "@/lib/utils";
import { formatDateFr } from "@/lib/mappers";
import { useUsers } from "@/hooks/useUsers";
import { usePermissions } from "@/hooks/usePermissions";
import TopHeader from "@/components/layout/TopHeader";
import UserForm from "@/components/users/UserForm";
import { AsyncSection } from "@/components/ui/StateViews";
import { Plus, ChevronRight } from "lucide-react";

const STATUT_META = {
  actif: { label: "Actif", color: "var(--olive)", bg: "#E7EDE0" },
  suspendu: { label: "Suspendu", color: "var(--rust)", bg: "#FBE9E2" },
};

export default function UsersPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data: users, loading, error, refetch } = useUsers();
  const [form, setForm] = useState(null); // {} = création, objet = édition
  const list = users || [];

  return (
    <>
      <TopHeader title="Utilisateurs" onBack={() => navigate(ROUTES.plus)} />
      <main style={S.main}>
        <div style={S.screen}>
          <div style={S.screenHeaderRow}>
            <span style={S.screenSubtitle}>{list.length} utilisateur(s)</span>
            {can("users.createAgent") && (
              <button style={S.addBtn} onClick={() => setForm({})}><Plus size={15} strokeWidth={2} /> Ajouter</button>
            )}
          </div>

          <AsyncSection loading={loading} error={error} isEmpty={!loading && list.length === 0} onRetry={refetch}
            emptyTitle="Aucun utilisateur">
            <div style={S.list}>
              {list.map((u) => {
                const sm = STATUT_META[u.statut] || STATUT_META.actif;
                return (
                  <button key={u.id} style={S.rowCard} onClick={() => setForm(u)}>
                    <div style={S.avatar40}>{initials(u.nom)}</div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={S.propertyName}>{u.nom}</div>
                      <div style={S.propertyMeta}>{ROLE_LABELS[u.role]} · {u.email || u.telephone || "—"}</div>
                      <div style={{ ...S.propertyMeta, marginTop: 3 }}>
                        Dernière connexion : {u.derniere_connexion ? formatDateFr(u.derniere_connexion) : "jamais"}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ ...S.statusTag, color: sm.color, background: sm.bg }}>{sm.label}</span>
                      <ChevronRight size={16} color="var(--ink-soft)" />
                    </div>
                  </button>
                );
              })}
            </div>
          </AsyncSection>
        </div>
      </main>

      {form && (
        <UserForm initial={form.id ? form : null} onClose={() => setForm(null)} onSaved={refetch} />
      )}
    </>
  );
}
