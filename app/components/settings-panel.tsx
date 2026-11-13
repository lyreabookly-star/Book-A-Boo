"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type Settings = { theme: "light" | "dark"; preferred_language: "fr" | "en" | "es" | "pt"; email_notifications: boolean; product_updates: boolean };
const defaults: Settings = { theme: "light", preferred_language: "fr", email_notifications: true, product_updates: false };

export function SettingsPanel() {
  const router = useRouter();
  const { setLocale, setTheme } = useAppPreferences();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showLibrary, setShowLibrary] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarPositionX, setAvatarPositionX] = useState(50);
  const [avatarPositionY, setAvatarPositionY] = useState(50);
  const [avatarSaving, setAvatarSaving] = useState(false);

  useEffect(() => {
    if (!avatarPreviewUrl) return;
    return () => URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  function selectAvatar(file: File | null) {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarFile(file);
    setAvatarPreviewUrl(file ? URL.createObjectURL(file) : null);
    setAvatarZoom(1);
    setAvatarPositionX(50);
    setAvatarPositionY(50);
    setError("");
    setMessage("");
  }

  async function makeCroppedAvatar(file: File): Promise<File> {
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = sourceUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Cette image n'a pas pu être ouverte."));
      });
      const size = 512;
      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * avatarZoom;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const x = (size - width) * (avatarPositionX / 100);
      const y = (size - height) * (avatarPositionY / 100);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Le recadrage de l'image est indisponible.");
      context.drawImage(image, x, y, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error("Impossible de préparer cette photo.")), "image/jpeg", 0.9);
      });
      return new File([blob], "avatar.jpg", { type: "image/jpeg" });
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  }
  const [settings, setSettings] = useState<Settings>(defaults);

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = getSupabaseBrowserClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/connexion?next=%2Fparametres"); return; }
      const [profile, privateProfile, prefs] = await Promise.all([
        supabase.from("profiles").select("username,display_name,bio,avatar_url,is_public,show_library_on_profile,preferred_language").eq("id", user.id).maybeSingle(),
        supabase.from("profile_private").select("first_name,last_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_settings").select("theme,preferred_language,email_notifications,product_updates").eq("user_id", user.id).maybeSingle()
      ]);
      if (!active) return;
      if (profile.error || privateProfile.error || prefs.error) setError("Certains réglages n'ont pas pu être chargés.");
      setUserId(user.id); setEmail(user.email ?? ""); setNewEmail(user.email ?? "");
      setUsername(profile.data?.username ?? "");
      setDisplayName(profile.data?.display_name ?? "");
      setBio(profile.data?.bio ?? "");
      setAvatarUrl(profile.data?.avatar_url ?? null);
      setIsPublic(profile.data?.is_public ?? true);
      setShowLibrary(profile.data?.show_library_on_profile ?? true);
      setFirstName(privateProfile.data?.first_name ?? "");
      setLastName(privateProfile.data?.last_name ?? "");
      const loadedSettings = { ...defaults, ...(prefs.data ?? {}), preferred_language: prefs.data?.preferred_language ?? profile.data?.preferred_language ?? "fr" } as Settings;
      setSettings(loadedSettings);
      setLocale(loadedSettings.preferred_language);
      setTheme(loadedSettings.theme);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(current => ({ ...current, [key]: value }));
    if (key === "theme") setTheme(value as Settings["theme"]);
    if (key === "preferred_language") setLocale(value as Settings["preferred_language"]);
  }

  async function uploadAvatar() {
    if (!avatarFile || !userId) return;
    setAvatarSaving(true); setError(""); setMessage("");
    try {
      if (!["image/jpeg","image/png","image/webp"].includes(avatarFile.type)) throw new Error("Choisissez une image JPG, PNG ou WebP.");
      if (avatarFile.size > 5 * 1024 * 1024) throw new Error("La photo ne doit pas dépasser 5 Mo.");
      const croppedFile = await makeCroppedAvatar(avatarFile);
      const supabase = getSupabaseBrowserClient() as any;
      const path = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, croppedFile, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      const { error: profileError } = await supabase.from("profiles").update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", userId);
      if (profileError) throw profileError;
      setAvatarUrl(publicUrl); selectAvatar(null); setMessage("Votre photo de profil a été recadrée et mise à jour.");
    } catch (e) { setError(e instanceof Error ? e.message : "Envoi de la photo impossible."); }
    finally { setAvatarSaving(false); }
  }

  async function saveProfile() {
    setSaving(true); setError(""); setMessage("");
    try {
      const supabase = getSupabaseBrowserClient() as any;
      const cleanUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) throw new Error("Le pseudo doit contenir 3 à 24 caractères : lettres sans accent, chiffres ou _.");
      const [p, pp] = await Promise.all([
        supabase.from("profiles").update({ username: cleanUsername, display_name: displayName.trim() || null, bio: bio.trim(), is_public: isPublic, show_library_on_profile: showLibrary, preferred_language: settings.preferred_language, updated_at: new Date().toISOString() }).eq("id", userId),
        supabase.from("profile_private").upsert({ user_id: userId, first_name: firstName.trim(), last_name: lastName.trim(), updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      ]);
      if (p.error) throw p.error; if (pp.error) throw pp.error;
      setMessage("Votre profil et vos préférences sont enregistrés.");
    } catch (e) { setError(e instanceof Error ? e.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }

  async function savePreferences() {
    setSaving(true); setError(""); setMessage("");
    try {
      const supabase = getSupabaseBrowserClient() as any;
      const { error: prefError } = await supabase.from("user_settings").upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (prefError) throw prefError;
      const { error: profileError } = await supabase.from("profiles").update({ preferred_language: settings.preferred_language, updated_at: new Date().toISOString() }).eq("id", userId);
      if (profileError) throw profileError;
      setMessage("Vos préférences sont enregistrées.");
    } catch (e) { setError(e instanceof Error ? e.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }

  async function updateEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const { error: e } = await getSupabaseBrowserClient().auth.updateUser({ email: newEmail.trim() });
      if (e) throw e;
      setMessage("Une confirmation a été envoyée à votre nouvelle adresse e-mail. Votre adresse ne changera qu'après validation.");
    } catch (e) { setError(e instanceof Error ? e.message : "Modification de l'e-mail impossible."); }
    finally { setSaving(false); }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      if (newPassword.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
      const { error: e } = await getSupabaseBrowserClient().auth.updateUser({ password: newPassword });
      if (e) throw e;
      setNewPassword(""); setMessage("Votre mot de passe a été modifié.");
    } catch (e) { setError(e instanceof Error ? e.message : "Modification du mot de passe impossible."); }
    finally { setSaving(false); }
  }

  async function signOutEverywhere() {
    setSaving(true); setError(""); setMessage("");
    const { error: e } = await getSupabaseBrowserClient().auth.signOut({ scope: "global" });
    if (e) { setError(e.message); setSaving(false); return; }
    router.replace("/connexion"); router.refresh();
  }

  if (loading) return <div className="settings-panel"><p>Chargement de vos réglages…</p></div>;

  return <div className="settings-panel">
    <div className="settings-back"><Link href="/profil">← Retour au profil</Link><span>VOS PRÉFÉRENCES PERSONNELLES</span></div>
    {(error || message) && <p className={error ? "settings-feedback settings-error" : "settings-feedback settings-success"} role="status">{error || message}</p>}
    <section className="settings-section">
      <div className="settings-section-heading"><span>01 / IDENTITÉ</span><h2>Votre compte</h2><p>Les informations qui définissent votre présence sur Book-A-Boo.</p></div>
      <form className="settings-form" onSubmit={event => { event.preventDefault(); void saveProfile(); }}>
        <div className="settings-avatar-upload settings-full">
          <div className="settings-avatar-preview">{(avatarPreviewUrl || avatarUrl) ? <img src={avatarPreviewUrl || avatarUrl || ""} alt="Aperçu de la photo de profil" style={{ objectPosition: `${avatarPositionX}% ${avatarPositionY}%`, transform: `scale(${avatarZoom})` }} /> : <span>{displayName.trim().charAt(0).toUpperCase() || username.charAt(0).toUpperCase() || "b."}</span>}</div>
          <div className="settings-avatar-copy"><strong>Photo de profil</strong><small>Choisissez une image JPG, PNG ou WebP · 5 Mo maximum. Vous pourrez ensuite ajuster le cadrage.</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => selectAvatar(e.target.files?.[0] ?? null)} /></div>
          {avatarPreviewUrl && <div className="avatar-crop-controls settings-full">
            <div className="avatar-crop-stage"><img src={avatarPreviewUrl} alt="Aperçu du cadrage" style={{ objectPosition: `${avatarPositionX}% ${avatarPositionY}%`, transform: `scale(${avatarZoom})` }} /></div>
            <div className="avatar-crop-sliders">
              <label>Zoom <strong>{avatarZoom.toFixed(1)}×</strong><input type="range" min="1" max="3" step="0.05" value={avatarZoom} onChange={e => setAvatarZoom(Number(e.target.value))} /></label>
              <label>Cadrage horizontal <strong>{avatarPositionX}%</strong><input type="range" min="0" max="100" value={avatarPositionX} onChange={e => setAvatarPositionX(Number(e.target.value))} /></label>
              <label>Cadrage vertical <strong>{avatarPositionY}%</strong><input type="range" min="0" max="100" value={avatarPositionY} onChange={e => setAvatarPositionY(Number(e.target.value))} /></label>
              <button type="button" className="settings-choice-buttons" onClick={() => { setAvatarZoom(1); setAvatarPositionX(50); setAvatarPositionY(50); }}>Réinitialiser le cadrage</button>
              <button type="button" className="settings-save" onClick={uploadAvatar} disabled={!avatarFile || avatarSaving}>{avatarSaving ? "Envoi…" : "Valider et enregistrer la photo"}</button>
              <button type="button" className="settings-danger" onClick={() => selectAvatar(null)} disabled={avatarSaving}>Annuler</button>
            </div>
          </div>}
        </div>
        <label>Prénom<input value={firstName} onChange={e=>setFirstName(e.target.value)} maxLength={80}/></label>
        <label>Nom<input value={lastName} onChange={e=>setLastName(e.target.value)} maxLength={80}/></label>
        <label>Pseudo<input value={username} onChange={e=>setUsername(e.target.value)} minLength={3} maxLength={24}/><small>3 à 24 caractères : lettres, chiffres et _.</small></label>
        <label>Nom affiché<input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={80}/></label>
        <label className="settings-full">Biographie<textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={300} rows={3}/><small>{bio.length}/300 caractères</small></label>
        <div className="settings-full"><button type="submit" className="settings-save" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer mon profil"}</button></div>
      </form>
    </section>
    <section className="settings-section">
      <div className="settings-section-heading"><span>02 / CONNEXION</span><h2>Adresse e-mail</h2><p>Adresse actuelle : <strong>{email}</strong>. Une confirmation sera demandée pour tout changement.</p></div>
      <form className="settings-inline-form" onSubmit={updateEmail}><label>Nouvelle adresse e-mail<input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} required/></label><button className="settings-save" disabled={saving || newEmail.trim()===email}>Modifier l'adresse</button></form>
      <form className="settings-inline-form" onSubmit={updatePassword}><label>Nouveau mot de passe<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} minLength={8} placeholder="8 caractères minimum" required/></label><button className="settings-save" disabled={saving || newPassword.length<8}>Changer le mot de passe</button></form>
    </section>
    <section className="settings-section">
      <div className="settings-section-heading"><span>03 / EXPÉRIENCE</span><h2>Apparence et langue</h2><p>Choisissez vos préférences de lecture et de navigation.</p></div>
      <div className="settings-choice-row"><div><strong>Thème de l'interface</strong><small>Clair ou sombre</small></div><div className="settings-choice-buttons"><button type="button" className={settings.theme==="light"?"chosen":""} onClick={()=>update("theme","light")}>Clair</button><button type="button" className={settings.theme==="dark"?"chosen":""} onClick={()=>update("theme","dark")}>Sombre</button></div></div>
      <div className="settings-choice-row"><div><strong>Langue préférée</strong><small>Votre choix est enregistré dans votre compte</small></div><select value={settings.preferred_language} onChange={e=>update("preferred_language",e.target.value as Settings["preferred_language"])}><option value="fr">Français</option><option value="en">English</option><option value="es">Español</option><option value="pt">Português</option></select></div>
      <button className="settings-save" onClick={savePreferences} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer mes préférences"}</button>
    </section>
    <section className="settings-section">
      <div className="settings-section-heading"><span>04 / CONFIDENTIALITÉ</span><h2>Ce que les autres voient</h2><p>Gardez le contrôle sur les informations visibles par les autres lecteurs.</p></div>
      <label className="settings-toggle"><span><strong>Profil public</strong><small>Autoriser les autres lecteurs à consulter votre profil.</small></span><input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)}/></label>
      <label className="settings-toggle"><span><strong>Afficher ma bibliothèque sur mon profil</strong><small>Permettre aux visiteurs de voir les livres de votre bibliothèque.</small></span><input type="checkbox" checked={showLibrary} onChange={e=>setShowLibrary(e.target.checked)}/></label>
      <button type="button" className="settings-save" onClick={saveProfile} disabled={saving}>Enregistrer la confidentialité</button>
    </section>
    <section className="settings-section">
      <div className="settings-section-heading"><span>05 / MESSAGES</span><h2>Notifications</h2><p>Définissez vos préférences pour les futurs messages par e-mail.</p></div>
      <label className="settings-toggle"><span><strong>Notifications par e-mail</strong><small>Recevoir les notifications importantes liées à votre compte.</small></span><input type="checkbox" checked={settings.email_notifications} onChange={e=>update("email_notifications",e.target.checked)}/></label>
      <label className="settings-toggle"><span><strong>Nouveautés Book-A-Boo</strong><small>Recevoir les actualités et annonces de la plateforme.</small></span><input type="checkbox" checked={settings.product_updates} onChange={e=>update("product_updates",e.target.checked)}/></label>
      <button className="settings-save" onClick={savePreferences} disabled={saving}>Enregistrer les notifications</button>
    </section>
    <section className="settings-section settings-security">
      <div className="settings-section-heading"><span>06 / SÉCURITÉ</span><h2>Vos sessions</h2><p>Vous pouvez fermer votre compte sur tous les appareils connectés. Vous devrez vous reconnecter ensuite.</p></div>
      <button className="settings-danger" onClick={signOutEverywhere} disabled={saving}>Me déconnecter de tous les appareils</button>
      <p className="settings-footnote">La suppression définitive du compte nécessite une procédure sécurisée distincte ; elle n'est pas proposée ici pour éviter toute suppression accidentelle.</p>
    </section>
  </div>;
}
