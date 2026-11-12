"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type AuthFormProps = { mode: "signup" | "login" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();

      if (isSignup) {
        const cleanUsername = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
          throw new Error("Le pseudo doit contenir 3 à 24 caractères : lettres sans accent, chiffres ou _.");
        }
        if (password.length < 8) {
          throw new Error("Choisissez un mot de passe d'au moins 8 caractères.");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + "/connexion",
            data: {
              username: cleanUsername,
              display_name: displayName.trim() || cleanUsername,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          router.push("/profil");
          router.refresh();
        } else {
          setMessage("Votre demande d’inscription est enregistrée. Consultez votre boîte mail pour confirmer votre adresse avant de vous connecter.");
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) throw loginError;
        router.push("/profil");
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-heading">
        <span className="auth-form-kicker">{isSignup ? "CRÉER VOTRE ESPACE" : "ACCÉDER À VOTRE ESPACE"}</span>
        <h2>{isSignup ? "Commençons votre histoire." : "Ravi de vous retrouver."}</h2>
        <p>{isSignup ? "Un compte pour retrouver vos lectures et partager vos propres histoires." : "Connectez-vous pour retrouver votre univers littéraire."}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup && <>
          <label>Votre pseudo
            <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]{3,24}" placeholder="ex. plume_doree" required />
            <small>3 à 24 caractères, sans espace ni accent.</small>
          </label>
          <label>Nom affiché <span>(facultatif)</span>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={80} placeholder="Le nom que les lecteurs verront" />
          </label>
          <div className="auth-name-fields">
            <label>Prénom <span>(facultatif)</span><input value={firstName} onChange={e => setFirstName(e.target.value)} maxLength={80} autoComplete="given-name" /></label>
            <label>Nom <span>(facultatif)</span><input value={lastName} onChange={e => setLastName(e.target.value)} maxLength={80} autoComplete="family-name" /></label>
          </div>
        </>}
        <label>Adresse e-mail
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="vous@exemple.com" required />
        </label>
        <label>Mot de passe
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} placeholder={isSignup ? "8 caractères minimum" : "Votre mot de passe"} required />
        </label>
        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        {message && <p className="auth-feedback auth-success" role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Un instant…" : isSignup ? "Créer mon compte" : "Me connecter"} <span>→</span></button>
      </form>

      <p className="auth-switch">{isSignup ? "Vous avez déjà un compte ?" : "Vous découvrez Book-A-Boo ?"} <Link href={isSignup ? "/connexion" : "/inscription"}>{isSignup ? "Se connecter" : "Créer un compte"}</Link></p>
      <p className="auth-privacy">Vos informations personnelles ne seront pas affichées sur votre profil public.</p>
    </div>
  );
}
