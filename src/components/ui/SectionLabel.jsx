import { S } from "@/styles/sharedStyles";
import Icon from "@/components/ui/Icon";

/**
 * Libellé de section (majuscules + icône optionnelle).
 * @param {{ icon?: string, text: string }} props
 */
export default function SectionLabel({ icon, text }) {
  return (
    <div style={S.sectionLabelRow}>
      {icon && <Icon name={icon} size={14} />}
      <span style={S.sectionLabel}>{text}</span>
    </div>
  );
}
