import { S } from "@/styles/sharedStyles";
import { CheckCircle2 } from "lucide-react";
import Icon from "@/components/ui/Icon";

/**
 * Case de preuve requise (détail ticket).
 * @param {{ icon: string, label: string, done: boolean, required?: boolean }} props
 */
export default function ProofBox({ icon, label, done, required }) {
  return (
    <div style={{ ...S.proofBox, ...(done ? S.proofBoxDone : required ? S.proofBoxMissing : {}) }}>
      {done ? (
        <CheckCircle2 size={20} color="var(--olive)" />
      ) : (
        <Icon name={icon} size={20} strokeWidth={1.5} color={required ? "var(--rust)" : "var(--ink-soft)"} />
      )}
      <span style={S.proofBoxLabel}>{label}</span>
      {!done && required && <span style={S.proofBoxMissingLabel}>Manquant</span>}
    </div>
  );
}
