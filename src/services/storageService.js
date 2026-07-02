/**
 * NKAMA — Service Storage (Supabase Storage). Phase 7.
 *
 * Deux buckets (créés par la migration 0010) :
 *   · nkama-docs (privé)     : preuves de tickets — chemins `<owner_id>/…`,
 *     accès via URLs signées ;
 *   · nkama-avatars (public) : photos de profil — chemins `<auth_uid>/…`,
 *     accès via URL publique.
 */
import { requireSupabase } from "@/services/_helpers";

const DOCS_BUCKET = "nkama-docs";
const AVATARS_BUCKET = "nkama-avatars";
const SIGNED_URL_TTL = 3600; // secondes

/** Extension de fichier sûre (déduite du nom, repli sur le type MIME). */
function fileExt(file) {
  const fromName = (file.name || "").split(".").pop();
  if (fromName && /^[a-z0-9]{1,5}$/i.test(fromName)) return fromName.toLowerCase();
  const fromType = (file.type || "").split("/").pop();
  return /^[a-z0-9]{1,5}$/i.test(fromType) ? fromType : "bin";
}

/**
 * Upload d'une preuve de ticket (photo avant/après ou facture), puis
 * enregistrement du document et liaison au ticket via la RPC
 * `attach_ticket_proof` (transactionnelle côté base).
 *
 * @param {string} ownerId  owner_id du compte (user.owner_id)
 * @param {string} ticketId
 * @param {"photo_avant"|"photo_apres"|"facture"} kind
 * @param {File} file
 * @param {number|null} [montant]  montant facturé (factures uniquement)
 * @returns {Promise<string>} id du document créé
 */
export async function uploadTicketProof(ownerId, ticketId, kind, file, montant = null) {
  const sb = requireSupabase();
  const path = `${ownerId}/tickets/${ticketId}/${kind}-${Date.now()}.${fileExt(file)}`;

  const { error: upErr } = await sb.storage
    .from(DOCS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await sb.rpc("attach_ticket_proof", {
    p_ticket_id: ticketId,
    p_kind: kind,
    p_nom: file.name || `${kind}.${fileExt(file)}`,
    p_path: path,
    p_type: file.type || null,
    p_taille: file.size ?? null,
    p_montant: montant,
  });
  if (error) {
    // Nettoyage : ne pas laisser un fichier orphelin si la liaison échoue.
    await sb.storage.from(DOCS_BUCKET).remove([path]).catch(() => {});
    throw error;
  }
  return data;
}

/**
 * URL signée (1 h) d'une preuve de ticket, pour affichage/ouverture.
 * @param {string} ticketId
 * @param {"photo_avant"|"photo_apres"|"facture"} kind
 * @returns {Promise<string|null>}
 */
export async function getTicketProofUrl(ticketId, kind) {
  const sb = requireSupabase();
  const { data: path, error } = await sb.rpc("ticket_proof_path", {
    p_ticket_id: ticketId,
    p_kind: kind,
  });
  if (error) throw error;
  if (!path) return null;
  const { data, error: sErr } = await sb.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (sErr) throw sErr;
  return data?.signedUrl || null;
}

/**
 * Upload de la photo de profil de l'utilisateur connecté.
 * @param {File} file
 * @returns {Promise<string>} URL publique de l'image
 */
export async function uploadAvatar(file) {
  const sb = requireSupabase();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) throw new Error("Session expirée — reconnectez-vous.");

  const path = `${uid}/avatar-${Date.now()}.${fileExt(file)}`;
  const { error } = await sb.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: true });
  if (error) throw error;

  const { data } = sb.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
