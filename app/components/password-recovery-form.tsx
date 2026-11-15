"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export function PasswordRecoveryForm({ mode }: { mode: "request" | "reset" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(mode === "request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "reset") return;
    const supabase = getSupabaseBrowserClient();
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error") || hash.get("error_code")) setError("Ce lien de récupération est invalide ou a expiré. Demandez un nouveau lien.");
    return () => { active = false; subscription.unsubscribe(); };
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (mode === "request") {
        const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + "/reinitialiser-mot-de-passe",
        });
        if (requestError) throw requestError;
        setMessage("Si un compte correspond à cette adresse, un e-mail de récupération vient d’être envoyé. Pensez à vérifier vos courriers indésirables.");
      } else {
        if (!ready) throw new Error("Ouvrez d’abord le lien reçu par e-mail pour autoriser le changement de mot de passe.");
        if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
        if (password !== confirmation) throw new Error("Les deux mots de passe ne correspondent pas.");
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setPassword(""); setConfirmation("");
        setMessage("Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.");
        window.setTimeout(() => { router.replace("/connexion"); router.refresh(); }, 1400);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue. Réessayez.");
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-heading">
        <span className="auth-form-kicker">{mode === "request" ? "MOT DE PASSE OUBLIÉ" : "NOUVEAU MOT DE PASSE"}</span>
        <h2>{mode === "request" ? "Retrouvons votre compte." : "Un mot de passe rien qu’à vous."}</h2>
        <p>{mode === "request" ? "Nous vous enverrons un lien sécurisé pour le réinitialiser." : "Choisissez au moins 8 caractères et confirmez votre choix."}</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {mode === "request" ? (
          <label>Adresse e-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="vous@exemple.com" required /></label>
        ) : (
          <>
            {!ready && <p className="auth-feedback auth-error" role="alert">Aucun lien de récupération valide n’a été détecté. Demandez un nouveau lien ci-dessous.</p>}
            <label>Nouveau mot de passe<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={8} placeholder="8 caractères minimum" required /></label>
            <label>Confirmer le mot de passe<input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} placeholder="Saisissez-le à nouveau" required /></label>
          </>
        )}
        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        {message && <p className="auth-feedback auth-success" role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={busy || (mode === "reset" && !ready)}>{busy ? "Un instant…" : mode === "request" ? "Recevoir le lien" : "Enregistrer le nouveau mot de passe"} <span>→</span></button>
      </form>
      <p className="auth-switch"><Link href="/connexion">← Retour à la connexion</Link></p>
      <p className="auth-privacy">Ne partagez jamais ce lien de récupération avec quelqu’un d’autre.</p>
    </div>
  );
}
