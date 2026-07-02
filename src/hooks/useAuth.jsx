import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getCurrentSession, onAuthChange, getAppUser, sendMagicLink,
  signOut as svcSignOut, touchLastLogin, claimAppUser,
} from "@/services/authService";

/**
 * NKAMA — Contexte d'authentification.
 *
 * Deux modes :
 *  • Supabase configuré → vraie session (lien magique e-mail) + rôle app_users.
 *  • Mode mock (repli)  → profil de démonstration, aucune connexion requise.
 */

/** Profil de démonstration utilisé en mode mock. */
const DEMO_USER = { nom: "Yannick", role: "owner", owner_id: "demo", demo: true };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [appUser, setAppUser] = useState(isSupabaseConfigured ? null : DEMO_USER);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [suspended, setSuspended] = useState(false);

  // Suivi de session (uniquement si Supabase est configuré)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let unsub = () => {};
    getCurrentSession().then((s) => setSession(s));
    unsub = onAuthChange((s) => setSession(s));
    return () => unsub();
  }, []);

  // Chargement du profil applicatif (rôle) à chaque changement de session
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!session) {
      setAppUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setSuspended(false);
    getAppUser(session.user.id)
      .then(async (u) => {
        if (cancelled) return;
        // Invitation : aucune ligne reliée → tentative d'auto-liaison par e-mail
        if (!u) {
          await claimAppUser();
          u = await getAppUser(session.user.id);
        }
        if (cancelled) return;
        // Compte suspendu → déconnexion immédiate
        if (u && u.statut === "suspendu") {
          await svcSignOut();
          if (!cancelled) {
            setSuspended(true);
            setSession(null);
            setAppUser(null);
          }
          return;
        }
        setAppUser(u || { nom: session.user.email, role: null, owner_id: null });
        if (u) touchLastLogin();
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [session]);

  const signInWithEmail = useCallback((email) => sendMagicLink(email), []);
  const signOut = useCallback(async () => {
    await svcSignOut();
    setSession(null);
    setAppUser(null);
  }, []);

  /** Recharge le profil applicatif (après édition du profil). */
  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured || !session) return;
    const u = await getAppUser(session.user.id);
    if (u) setAppUser(u);
  }, [session]);

  const value = {
    configured: isSupabaseConfigured,
    loading,
    suspended,
    user: appUser,
    role: appUser?.role || null,
    statut: appUser?.statut || (isSupabaseConfigured ? null : "actif"),
    isAuthenticated: isSupabaseConfigured ? Boolean(session) : true,
    signInWithEmail,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook d'accès au contexte d'authentification. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
