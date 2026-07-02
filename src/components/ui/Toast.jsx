import { S } from "@/styles/sharedStyles";
import { CheckCircle2 } from "lucide-react";

/** Notification éphémère. @param {{ message: string }} props */
export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={S.toast}>
      <CheckCircle2 size={15} strokeWidth={2.5} />
      {message}
    </div>
  );
}
