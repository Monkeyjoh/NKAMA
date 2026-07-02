/**
 * NKAMA — Service d'authentification (Supabase Auth, lien magique e-mail).
 *
 * En mode mock (Supabase non configuré), ces fonctions sont neutres :
 * l'application fonctionne avec un profil de démonstration (voir useAuth).
 */
import { getSupabase } from "@/lib/supabase";

/**
 * Envoie un lien magique de connexion par e-mail (signInWithOtp).
 * @param {string} email
 */
export async function sendMagicLink(email) {
  const sb = getSupabase();
  if (!sb) return { ok: true, demo: true };
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return { ok: true };
}

/** Session courante (ou null). */
export async function getCurrentSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

/**
 * S'abonne aux changements de session. Retourne une fonction de désinscription.
 * @param {(session: any) => void} callback
 */
export function onAuthChange(callback) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/**
 * Charge le profil applicatif (rôle, owner_id) depuis app_users.
 * @param {string} authUserId
 */
export async function getAppUser(authUserId) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("app_users")
    .select("id, nom, role, owner_id, telephone, email, statut, langue, photo_url, notifications_actives, derniere_connexion")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Enregistre la date de dernière connexion (best-effort). */
export async function touchLastLogin() {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.rpc("touch_last_login");
  } catch {
    /* non bloquant */
  }
}

/**
 * Relie automatiquement le compte connecté à une ligne app_users invitée
 * (même e-mail, non encore reliée). Appelé au login si aucun profil trouvé.
 */
export async function claimAppUser() {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.rpc("claim_app_user");
  } catch {
    /* non bloquant */
  }
}

/** Déconnexion. */
export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}
