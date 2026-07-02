import { S } from "@/styles/sharedStyles";
import { usePermissions } from "@/hooks/usePermissions";
import { Lock, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";

/**
 * Actions disponibles selon le statut du ticket, avec blocages par preuves.
 * @param {{ ticket: any, onAdvance: (id:string, action:string, payload?:object)=>void }} props
 */
export default function ActionsForStatut({ ticket, onAdvance }) {
  const { can } = usePermissions();
  const blockedAffecter = !ticket.photoAvant;
  const blockedValidation = !ticket.photoApres || !ticket.facture;

  if (ticket.statut === "signale") {
    return (
      <div style={S.actionsBlock}>
        {blockedAffecter && (
          <div style={S.lockNote}><Lock size={13} />Ajoutez la photo avant pour pouvoir affecter un prestataire.</div>
        )}
        <button
          style={{ ...S.primaryBtn, ...(blockedAffecter ? S.primaryBtnDisabled : {}) }}
          disabled={blockedAffecter}
          onClick={() => onAdvance(ticket.id, "affecter", { prestataire: "À choisir" })}
        >
          Affecter un prestataire <ArrowRight size={15} />
        </button>
      </div>
    );
  }
  if (ticket.statut === "affecte") {
    return (
      <div style={S.actionsBlock}>
        <button style={S.primaryBtn} onClick={() => onAdvance(ticket.id, "demarrer")}>
          Démarrer l'intervention <ArrowRight size={15} />
        </button>
      </div>
    );
  }
  if (ticket.statut === "en_cours") {
    return (
      <div style={S.actionsBlock}>
        {blockedValidation && (
          <div style={S.lockNote}><Lock size={13} />Photo après et facture requises avant d'envoyer en validation.</div>
        )}
        <button
          style={{ ...S.primaryBtn, ...(blockedValidation ? S.primaryBtnDisabled : {}) }}
          disabled={blockedValidation}
          onClick={() => onAdvance(ticket.id, "envoyer_validation")}
        >
          Envoyer en validation <ArrowRight size={15} />
        </button>
      </div>
    );
  }
  if (ticket.statut === "validation") {
    return (
      <div style={S.actionsBlock}>
        <div style={S.validationNote}>
          Seul le propriétaire ou un administrateur peut valider et clôturer ce ticket.
        </div>
        {can("ticket.close") && (
          <button style={S.validateBtn} onClick={() => onAdvance(ticket.id, "valider", { imputable: false })}>
            <CheckCircle2 size={15} /> Valider et clôturer
          </button>
        )}
      </div>
    );
  }
  if (ticket.statut === "cloture") {
    if (!can("ticket.close")) return null;
    return (
      <div style={S.actionsBlock}>
        <button style={S.reopenBtn} onClick={() => onAdvance(ticket.id, "reouvrir")}>
          <RotateCcw size={14} /> Rouvrir (litige)
        </button>
      </div>
    );
  }
  return null;
}
