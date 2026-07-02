import { useRef, useState } from "react";
import ProofBox from "@/components/ui/ProofBox";
import { getTicketProofUrl } from "@/services/storageService";

/**
 * Case de preuve interactive (phase 7) :
 *   · preuve absente + droit d'ajout → ouvre le sélecteur de fichier ;
 *   · preuve présente → ouvre le fichier (URL signée) dans un nouvel onglet.
 * @param {{
 *   ticketId: string,
 *   kind: "photo_avant"|"photo_apres"|"facture",
 *   icon: string, label: string, done: boolean, required?: boolean,
 *   canUpload: boolean, accept: string,
 *   onPick: (file: File) => void,
 *   onError?: (e: Error) => void,
 * }} props
 */
export default function ProofUploadBox({
  ticketId, kind, icon, label, done, required, canUpload, accept, onPick, onError,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function openProof() {
    setBusy(true);
    try {
      const url = await getTicketProofUrl(ticketId, kind);
      if (url) window.open(url, "_blank", "noopener");
    } catch (e) {
      onError?.(e);
    } finally {
      setBusy(false);
    }
  }

  function handleClick() {
    if (busy) return;
    if (done) openProof();
    else if (canUpload) inputRef.current?.click();
  }

  const clickable = done || canUpload;
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!clickable}
        aria-label={done ? `Voir : ${label}` : `Ajouter : ${label}`}
        style={{
          background: "none", border: "none", padding: 0, width: "100%",
          textAlign: "inherit", cursor: clickable ? "pointer" : "default",
          opacity: busy ? 0.55 : 1,
        }}
      >
        <ProofBox icon={icon} label={busy ? "Ouverture…" : label} done={done} required={required} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPick(f);
        }}
      />
    </>
  );
}
