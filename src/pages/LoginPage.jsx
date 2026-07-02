import { useState } from "react";
import { Navigate } from "react-router-dom";
import { S, fontDisplay } from "@/styles/sharedStyles";
import { useAuth } from "@/hooks/useAuth";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

/**
 * NKAMA — Écran de connexion (lien magique e-mail).
 *
 * N'apparaît que lorsque Supabase est configuré et qu'aucune session n'est
 * active. En mode mock, l'utilisateur est déjà « authentifié » (démo).
 */
export default function LoginPage() {
  const { isAuthenticated, signInWithEmail, suspended } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.message || "Échec de l'envoi. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={st.wrap}>
      <div style={st.card}>
        <div style={S.headerMark}>NK</div>
        <h1 style={st.title}>NKAMA</h1>
        <p style={st.subtitle}>Connectez-vous pour accéder à votre gestion locative.</p>

        {suspended && (
          <div style={{ width: "100%", background: "#FBE9E2", color: "var(--rust)", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, marginBottom: 16, lineHeight: 1.5 }}>
            Votre compte est suspendu. Contactez le propriétaire ou un administrateur.
          </div>
        )}

        {sent ? (
          <div style={st.sentBox}>
            <CheckCircle2 size={22} color="var(--olive)" />
            <div>
              <div style={st.sentTitle}>Lien envoyé</div>
              <div style={st.sentText}>
                Vérifiez votre boîte mail ({email}) et cliquez sur le lien de connexion.
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={st.form}>
            <label style={st.label}>Adresse e-mail</label>
            <div style={st.inputRow}>
              <Mail size={16} color="var(--ink-soft)" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                style={st.input}
              />
            </div>
            {error && <div style={st.error}>{error}</div>}
            <button type="submit" disabled={busy} style={{ ...S.advanceBtn, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Envoi…" : "Recevoir le lien de connexion"} <ArrowRight size={15} />
            </button>
          </form>
        )}

        <p style={st.footer}>Un lien magique vous sera envoyé — aucun mot de passe requis.</p>
      </div>
    </div>
  );
}

const st = {
  wrap: { ...S.app, alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 360, background: "white", border: "1px solid var(--line)", borderRadius: 16, padding: "28px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  title: { fontFamily: fontDisplay, fontSize: 24, margin: "14px 0 4px" },
  subtitle: { fontSize: 13, color: "var(--ink-soft)", margin: "0 0 22px", lineHeight: 1.5 },
  form: { width: "100%", display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 12, color: "var(--ink-soft)", textAlign: "left" },
  inputRow: { display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", background: "var(--paper)" },
  input: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "var(--ink)" },
  error: { fontSize: 12, color: "var(--rust)", textAlign: "left" },
  sentBox: { display: "flex", gap: 12, alignItems: "flex-start", background: "#E7EDE0", borderRadius: 10, padding: "14px 16px", textAlign: "left", width: "100%" },
  sentTitle: { fontWeight: 700, fontSize: 14, color: "var(--olive)" },
  sentText: { fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.5 },
  footer: { fontSize: 11, color: "var(--ink-soft)", marginTop: 20, opacity: 0.8 },
};
