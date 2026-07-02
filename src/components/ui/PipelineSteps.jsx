import { S } from "@/styles/sharedStyles";
import { Check, CheckCircle2 } from "lucide-react";

/**
 * Stepper horizontal réutilisé (CRM + Maintenance).
 * @param {{ steps: {key:string,label:string}[], currentIndex: number, withLabels?: boolean, checkIcon?: "check"|"circle" }} props
 */
export default function PipelineSteps({ steps, currentIndex, withLabels = false, checkIcon = "check" }) {
  const CheckCmp = checkIcon === "circle" ? CheckCircle2 : Check;
  return (
    <>
      <div style={S.pipelineSteps}>
        {steps.map((s, i) => (
          <div key={s.key} style={S.pipelineStepWrap}>
            <div style={{ ...S.pipelineStep, ...(i <= currentIndex ? S.pipelineStepActive : {}) }}>
              {i < currentIndex ? <CheckCmp size={12} strokeWidth={2.5} /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{ ...S.pipelineLine, ...(i < currentIndex ? S.pipelineLineActive : {}) }} />
            )}
          </div>
        ))}
      </div>
      {withLabels && (
        <div style={S.pipelineLabels}>
          {steps.map((s) => (
            <span key={s.key} style={S.pipelineLabel}>{s.label}</span>
          ))}
        </div>
      )}
    </>
  );
}
