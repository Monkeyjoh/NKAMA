import { S } from "@/styles/sharedStyles";
import { ChevronLeft } from "lucide-react";

/**
 * En-tête secondaire avec bouton retour optionnel et action à droite.
 * @param {{ title: string, onBack?: () => void, right?: React.ReactNode }} props
 */
export default function TopHeader({ title, onBack, right }) {
  return (
    <header style={S.subHeader}>
      {onBack ? (
        <button style={S.backBtn} onClick={onBack} aria-label="Retour">
          <ChevronLeft size={20} />
        </button>
      ) : (
        <div style={{ width: 32 }} />
      )}
      <div style={S.subHeaderTitle}>{title}</div>
      {right || <div style={{ width: 32 }} />}
    </header>
  );
}
