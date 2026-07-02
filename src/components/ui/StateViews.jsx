/**
 * NKAMA — États transverses : Loading / Error / Empty.
 *
 * <AsyncSection> factorise la logique d'affichage selon l'état d'un appel
 * de données (loading → error → empty → contenu). Utilisé sur toutes les pages
 * pour garantir des états cohérents (exigence : aucune donnée fictive).
 */
import { fontDisplay } from "@/styles/sharedStyles";
import { Loader2, AlertCircle, Inbox, RefreshCw } from "lucide-react";

const wrap = {
  display: "flex", flexDirection: "column", alignItems: "center",
  textAlign: "center", padding: "48px 24px", gap: 10, color: "var(--ink-soft)",
};

/** Indicateur de chargement. */
export function LoadingState({ label = "Chargement…" }) {
  return (
    <div style={wrap}>
      <Loader2 size={26} className="nk-spin" color="var(--terracotta)" />
      <div style={{ fontSize: 13 }}>{label}</div>
      <style>{"@keyframes nk-spin{to{transform:rotate(360deg)}}.nk-spin{animation:nk-spin 1s linear infinite}"}</style>
    </div>
  );
}

/** État d'erreur, avec bouton de relance optionnel. */
export function ErrorState({ error, onRetry }) {
  const msg = error?.message || "Une erreur est survenue lors du chargement.";
  return (
    <div style={wrap}>
      <AlertCircle size={26} color="var(--rust)" />
      <div style={{ ...fontDisplayStyle, color: "var(--ink)" }}>Erreur de chargement</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, maxWidth: 320 }}>{msg}</div>
      {onRetry && (
        <button style={retryBtn} onClick={onRetry}>
          <RefreshCw size={14} /> Réessayer
        </button>
      )}
    </div>
  );
}

/** État vide : « Aucune donnée disponible ». */
export function EmptyData({ title = "Aucune donnée disponible", text }) {
  return (
    <div style={wrap}>
      <Inbox size={26} color="var(--ink-soft)" />
      <div style={{ ...fontDisplayStyle, color: "var(--ink)" }}>{title}</div>
      {text && <div style={{ fontSize: 12.5, lineHeight: 1.5, maxWidth: 320 }}>{text}</div>}
    </div>
  );
}

/**
 * Enveloppe d'affichage selon l'état d'un appel de données.
 * @param {{
 *   loading: boolean, error: any, isEmpty?: boolean,
 *   emptyTitle?: string, emptyText?: string, onRetry?: () => void,
 *   children: React.ReactNode
 * }} props
 */
export function AsyncSection({ loading, error, isEmpty, emptyTitle, emptyText, onRetry, children }) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyData title={emptyTitle} text={emptyText} />;
  return children;
}

const fontDisplayStyle = { fontFamily: fontDisplay, fontSize: 16, marginTop: 2 };
const retryBtn = {
  display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6,
  background: "var(--ink)", color: "var(--paper)", border: "none",
  borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600,
};
