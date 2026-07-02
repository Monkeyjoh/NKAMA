import { S } from "@/styles/sharedStyles";
import { CheckCircle2 } from "lucide-react";

/** Pastille de preuve (carte ticket). @param {{ done: boolean, label: string }} props */
export default function ProofDot({ done, label }) {
  return (
    <div style={S.proofDotWrap}>
      <span style={{ ...S.proofDot, ...(done ? S.proofDotDone : {}) }}>
        {done ? <CheckCircle2 size={11} strokeWidth={2.5} color="white" /> : null}
      </span>
      <span style={S.proofLabel}>{label}</span>
    </div>
  );
}
