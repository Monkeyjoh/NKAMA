import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { ROUTES } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/permissions";
import { initials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { updateUser, changePassword } from "@/services/usersService";
import { uploadAvatar } from "@/services/storageService";
import TopHeader from "@/components/layout/TopHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import {
  TextField, SelectField, CheckboxField, FormError,
} from "@/components/ui/FormControls";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

const LANGUE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast, showToast } = useToast();
  const { values, setField, submitting, setSubmitting, error, setError } = useForm({
    nom: user?.nom || "",
    telephone: user?.telephone || "",
    email: user?.email || "",
    photo_url: user?.photo_url || "",
    langue: user?.langue || "fr",
    notifications_actives: user?.notifications_actives ?? true,
  });
  const [pwd, setPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInputRef = useRef(null);

  /** Phase 7 : upload réel de la photo de profil (Supabase Storage). */
  async function pickPhoto(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(new Error("Choisissez une image (JPG, PNG…)."));
      return;
    }
    setPhotoBusy(true);
    setError(null);
    try {
      const url = await uploadAvatar(file);
      setField("photo_url", url);
      await updateUser(user.id, { photo_url: url });
      await refreshUser();
      showToast("Photo mise à jour");
    } catch (e) {
      setError(e);
    } finally {
      setPhotoBusy(false);
    }
  }

  async function saveProfile() {
    if (!values.nom) {
      setError(new Error("Le nom est obligatoire."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateUser(user.id, {
        nom: values.nom.trim(),
        telephone: values.telephone || null,
        email: values.email || null,
        photo_url: values.photo_url || null,
        langue: values.langue,
        notifications_actives: values.notifications_actives,
      });
      await refreshUser();
      showToast("Profil mis à jour");
    } catch (e) {
      setError(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function savePassword() {
    if (pwd.length < 6) {
      setError(new Error("Le mot de passe doit faire au moins 6 caractères."));
      return;
    }
    setPwdBusy(true);
    setError(null);
    try {
      await changePassword(pwd);
      setPwd("");
      showToast("Mot de passe défini");
    } catch (e) {
      setError(e);
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <>
      <TopHeader title="Mon profil" onBack={() => navigate(ROUTES.plus)} />
      <main style={S.main}>
        <div style={S.screen}>
          {/* Avatar + rôle */}
          <div style={st.head}>
            <button type="button" onClick={() => photoInputRef.current?.click()}
              aria-label="Changer la photo de profil" disabled={photoBusy}
              style={{ background: "none", border: "none", padding: 0, opacity: photoBusy ? 0.5 : 1 }}>
              {values.photo_url ? (
                <img src={values.photo_url} alt="" style={st.photo} />
              ) : (
                <div style={st.avatar}>{initials(values.nom || user?.nom)}</div>
              )}
            </button>
            <div>
              <div style={st.name}>{values.nom || user?.nom}</div>
              <span style={st.roleChip}>{ROLE_LABELS[user?.role] || "—"}</span>
              <button type="button" style={st.photoBtn} disabled={photoBusy}
                onClick={() => photoInputRef.current?.click()}>
                {photoBusy ? "Envoi…" : values.photo_url ? "Changer la photo" : "Ajouter une photo"}
              </button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; pickPhoto(f); }} />
          </div>

          <FormError error={error} />

          <SectionLabel icon="Users" text="Informations personnelles" />
          <TextField label="Nom" value={values.nom} onChange={(v) => setField("nom", v)} required />
          <TextField label="Téléphone" value={values.telephone} onChange={(v) => setField("telephone", v)} />
          <TextField label="Email" value={values.email} onChange={(v) => setField("email", v)} type="email" />
          <SelectField label="Langue" value={values.langue} onChange={(v) => setField("langue", v)} options={LANGUE_OPTIONS} />
          <CheckboxField label="Recevoir les notifications" checked={values.notifications_actives} onChange={(v) => setField("notifications_actives", v)} />

          <button style={{ ...S.advanceBtn, opacity: submitting ? 0.6 : 1 }} onClick={saveProfile} disabled={submitting}>
            {submitting ? "Enregistrement…" : "Enregistrer le profil"}
          </button>

          <SectionLabel icon="Lock" text="Mot de passe" />
          <p style={st.note}>
            La connexion se fait par lien magique. Définir un mot de passe est optionnel.
          </p>
          <TextField label="Nouveau mot de passe" value={pwd} onChange={setPwd} type="password" placeholder="••••••" />
          <button style={st.pwdBtn} onClick={savePassword} disabled={pwdBusy}>
            {pwdBusy ? "Enregistrement…" : "Définir le mot de passe"}
          </button>

          <div style={S.footerNote}>NKAMA · v1.0</div>
        </div>
      </main>
      <Toast message={toast} />
    </>
  );
}

const st = {
  head: { display: "flex", alignItems: "center", gap: 14, marginBottom: 18 },
  avatar: { width: 56, height: 56, borderRadius: "50%", background: "var(--terracotta-dim)", color: "var(--terracotta)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 },
  photo: { width: 56, height: 56, borderRadius: "50%", objectFit: "cover" },
  name: { fontFamily: "Georgia, serif", fontSize: 19 },
  roleChip: { display: "inline-block", marginTop: 4, fontSize: 11.5, color: "var(--ink-soft)", background: "var(--paper-dim)", borderRadius: 999, padding: "2px 10px" },
  note: { fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 8 },
  pwdBtn: { width: "100%", marginTop: 6, background: "none", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 9, padding: "11px 16px", fontSize: 13, fontWeight: 600 },
  photoBtn: { display: "block", marginTop: 6, background: "none", border: "none", padding: 0, fontSize: 11.5, fontWeight: 600, color: "var(--terracotta)", textDecoration: "underline" },
};
