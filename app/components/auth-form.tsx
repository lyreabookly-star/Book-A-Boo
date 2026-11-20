"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthRedirectUrl, getSupabaseBrowserClient } from "../../lib/supabase/client";

type AuthFormProps = { mode: "signup" | "login" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            emailRedirectTo: getAuthRedirectUrl("/connexion"),
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
        const requestedNext = new URLSearchParams(window.location.search).get("next");
        const destination = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/profil";
        router.push(destination);
        router.refresh();
      }
    } catch (caught) {
      const authError = caught as { message?: string; code?: string; errorCode?: string };
      const code = authError?.code || authError?.errorCode || "";
      const rawMessage = authError?.message || "";
      if (code === "over_email_send_rate_limit" || rawMessage.toLowerCase().includes("email rate limit exceeded")) {
        setError("Book-A-Boo a atteint la limite temporaire d’envoi d’e-mails. Attendez avant de redemander un e-mail de confirmation. Nous devons configurer un service d’envoi dédié pour permettre les inscriptions de tous les lecteurs.");
      } else if (code === "email_not_confirmed") {
        setError("Votre adresse e-mail n’est pas encore confirmée. Consultez le message de confirmation reçu, puis réessayez.");
      } else if (code === "invalid_credentials") {
        setError("Adresse e-mail ou mot de passe incorrect. Vérifiez vos informations puis réessayez.");
      } else if (code === "over_request_rate_limit") {
        setError("Trop de tentatives en peu de temps. Patientez quelques minutes avant de réessayer.");
      } else {
        setError(rawMessage || "Une erreur est survenue. Réessayez.");
      }
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
          <span className="auth-password-wrap">
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} placeholder={isSignup ? "8 caractères minimum" : "Votre mot de passe"} required />
            <button className="auth-password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={showPassword}>
              {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
            </button>
          </span>
        </label>
        {!isSignup && <p className="auth-forgot-link"><Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link></p>}
        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        {message && <p className="auth-feedback auth-success" role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Un instant…" : isSignup ? "Créer mon compte" : "Me connecter"} <span>→</span></button>
      </form>

      <p className="auth-switch">{isSignup ? "Vous avez déjà un compte ?" : "Vous découvrez Book-A-Boo ?"} <Link href={isSignup ? "/connexion" : "/inscription"}>{isSignup ? "Se connecter" : "Créer un compte"}</Link></p>
      <p className="auth-privacy">Vos informations personnelles ne seront pas affichées sur votre profil public.</p>
    </div>
  );
}
