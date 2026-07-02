import { S } from "@/styles/sharedStyles";
import { X } from "lucide-react";

/**
 * Modale bottom-sheet réutilisable (fiches prospect / ticket / dépense).
 * @param {{ title: string, onClose: () => void, children: React.ReactNode }} props
 */
export default function Modal({ title, onClose, children }) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div style={S.modalTitle}>{title}</div>
          <button style={S.modalBack} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div style={S.modalBody}>{children}</div>
      </div>
    </div>
  );
}
