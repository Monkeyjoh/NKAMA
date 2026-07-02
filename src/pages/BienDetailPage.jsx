import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { formatFCFA } from "@/lib/utils";
import { useProperty } from "@/hooks/useProperties";
import { usePermissions } from "@/hooks/usePermissions";
import TopHeader from "@/components/layout/TopHeader";
import PhotoGallery from "@/components/properties/PhotoGallery";
import PropertyForm from "@/components/properties/PropertyForm";
import RentOutForm from "@/components/properties/RentOutForm";
import {
  LocataireSection, TravauxSection, DocumentsSection, FinanceSection,
} from "@/components/properties/PropertySections";
import { LoadingState, ErrorState, EmptyData } from "@/components/ui/StateViews";
import { MapPin, MoreHorizontal, KeyRound } from "lucide-react";

const SECTIONS = [
  { key: "info", label: "Locataire" },
  { key: "travaux", label: "Travaux" },
  { key: "documents", label: "Documents" },
  { key: "finance", label: "Finances" },
];

export default function BienDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data: property, loading, error, refetch } = useProperty(id);
  const [section, setSection] = useState("info");
  const [showEdit, setShowEdit] = useState(false);
  const [showRent, setShowRent] = useState(false);

  if (loading || error || !property) {
    return (
      <>
        <TopHeader title="Fiche du bien" onBack={() => navigate(ROUTES.biens)} />
        <main style={S.main}>
          {loading && <LoadingState />}
          {!loading && error && <ErrorState error={error} onRetry={refetch} />}
          {!loading && !error && !property && <EmptyData title="Bien introuvable" />}
        </main>
      </>
    );
  }

  const occ = property.statut === "occupé";
  const rent = { encaisse12m: property.encaisse12m, depenses12m: property.depenses12m, net: property.net };

  return (
    <>
      <TopHeader
        title="Fiche du bien"
        onBack={() => navigate(ROUTES.biens)}
        right={can("property.update")
          ? <button style={S.backBtn} onClick={() => setShowEdit(true)} aria-label="Modifier"><MoreHorizontal size={20} /></button>
          : undefined}
      />
      <main style={S.main}>
        <PhotoGallery count={property.photos} />

        <div style={S.titleBlock}>
          <div style={S.titleRow}>
            <div>
              <h1 style={S.bienTitle}>{property.nom}</h1>
              <div style={S.address}><MapPin size={13} />{property.adresse}</div>
            </div>
            <span style={{ ...S.statusTag, ...(occ ? S.statusOk : S.statusVacant) }}>{property.statut}</span>
          </div>
          <div style={S.factsRow}>
            <span>{property.type}</span><span style={S.factsDot}>·</span>
            <span>{property.chambres} chambres</span><span style={S.factsDot}>·</span>
            <span>{property.surface} m²</span>
          </div>
        </div>

        <div style={S.heroKpiRow}>
          <div style={S.heroKpi}>
            <div style={S.heroKpiLabel}>Loyer mensuel</div>
            <div style={S.heroKpiValue}>{formatFCFA(property.loyer)}</div>
          </div>
          <div style={S.heroKpiDivider} />
          <div style={S.heroKpi}>
            <div style={S.heroKpiLabel}>Rentabilité nette</div>
            <div style={{ ...S.heroKpiValue, color: "var(--olive)" }}>{property.net}%</div>
          </div>
        </div>

        <div style={S.sectionTabs}>
          {SECTIONS.map((s) => (
            <button key={s.key} style={{ ...S.sectionTab, ...(section === s.key ? S.sectionTabActive : {}) }} onClick={() => setSection(s.key)}>
              {s.label}
            </button>
          ))}
        </div>

        {!occ && can("property.rentOut") && (
          <div style={{ padding: "16px 18px 0" }}>
            <button style={S.advanceBtn} onClick={() => setShowRent(true)}>
              <KeyRound size={16} /> Mettre en location
            </button>
          </div>
        )}

        {section === "info" && (
          <LocataireSection
            tenant={property.tenant}
            onVacantClick={can("property.rentOut") ? () => setShowRent(true) : undefined}
          />
        )}
        {section === "travaux" && <TravauxSection travaux={property.travaux} onAddTicket={() => navigate(ROUTES.maintenance)} />}
        {section === "documents" && <DocumentsSection documents={property.documents} />}
        {section === "finance" && <FinanceSection rentabilite={rent} />}
      </main>

      {showEdit && (
        <PropertyForm
          initial={property}
          onClose={() => setShowEdit(false)}
          onSaved={refetch}
          onDeleted={() => navigate(ROUTES.biens)}
        />
      )}
      {showRent && (
        <RentOutForm property={property} onClose={() => setShowRent(false)} onSaved={refetch} />
      )}
    </>
  );
}
