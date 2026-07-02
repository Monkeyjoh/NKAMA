import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { useProperties } from "@/hooks/useProperties";
import { usePermissions } from "@/hooks/usePermissions";
import TopHeader from "@/components/layout/TopHeader";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyForm from "@/components/properties/PropertyForm";
import { AsyncSection } from "@/components/ui/StateViews";
import { Plus } from "lucide-react";

export default function BiensPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data, loading, error, refetch } = useProperties();
  const [showForm, setShowForm] = useState(false);
  const list = data || [];
  const occupes = list.filter((p) => p.statut === "occupé").length;

  return (
    <>
      <TopHeader title="Mes biens" />
      <main style={S.main}>
        <div style={S.screen}>
          <div style={S.screenHeaderRow}>
            <span style={S.screenSubtitle}>{list.length} biens · {occupes} occupés</span>
            {can("property.create") && (
              <button style={S.addBtn} onClick={() => setShowForm(true)}><Plus size={15} strokeWidth={2} /> Ajouter</button>
            )}
          </div>
          <AsyncSection loading={loading} error={error} isEmpty={!loading && list.length === 0} onRetry={refetch}
            emptyTitle="Aucun bien" emptyText="Ajoutez votre premier bien immobilier.">
            <div style={S.list}>
              {list.map((p) => (
                <PropertyCard key={p.id} property={p} onClick={() => navigate(ROUTES.bien(p.id))} />
              ))}
            </div>
          </AsyncSection>
        </div>
      </main>

      {showForm && <PropertyForm onClose={() => setShowForm(false)} onSaved={refetch} />}
    </>
  );
}
