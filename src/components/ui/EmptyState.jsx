import { S } from "@/styles/sharedStyles";
import { CheckCircle2 } from "lucide-react";

/**
 * État vide centré.
 * @param {{ title: string, text?: string }} props
 */
export default function EmptyState({ title, text }) {
  return (
    <div style={S.emptyState}>
      <CheckCircle2 size={28} strokeWidth={1.5} color="var(--olive)" />
      <div style={S.emptyTitle}>{title}</div>
      {text && <div style={S.emptyText}>{text}</div>}
    </div>
  );
}
