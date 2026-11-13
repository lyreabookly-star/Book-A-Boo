"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Profile = {
  username: string;
  display_name: string | null;
  bio: string;
  avatar_url: string | null;
  is_public: boolean;
  show_library_on_profile: boolean;
};

export function ProfileAccount() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          if (active) {
            setEmail("");
            setProfile(null);
          }
          return;
        }
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("username, display_name, bio, avatar_url, is_public, show_library_on_profile")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (active) {
          setEmail(user.email ?? "");
          setProfile(data);
        }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Impossible de charger votre profil.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setEmail("");
        setProfile(null);
        return;
      }
      setLoading(true);
      void supabase
        .from("profiles")
        .select("username, display_name, bio, avatar_url, is_public, show_library_on_profile")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data, error: profileError }) => {
          if (!active) return;
          if (profileError) {
            setError(profileError.message);
            setProfile(null);
          } else {
            setError("");
            setProfile(data);
            setEmail(session.user.email ?? "");
          }
          setLoading(false);
        });
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (loading) return <div className="auth-card"><p>Chargement de votre espace…</p></div>;

  if (!email) return (
    <div className="auth-card profile-logged-out">
      <span className="profile-account-mark">b.</span>
      <h2>Votre univers vous attend.</h2>
      <p>Connectez-vous ou créez un compte pour accéder à votre profil et à votre bibliothèque personnelle.</p>
      <div className="profile-account-actions"><Link className="auth-submit" href="/connexion">Me connecter →</Link><Link className="auth-secondary" href="/inscription">Créer un compte</Link></div>
    </div>
  );

  return (
    <div className="auth-card profile-account-card">
      <div className="profile-account-top"><span className="profile-account-mark">b.</span><span className="profile-account-status">SESSION ACTIVE</span></div>
      <span className="auth-form-kicker">VOTRE COMPTE BOOK-A-BOO</span>
      <h2>{profile?.display_name || profile?.username || "Votre profil"}</h2>
      {profile?.avatar_url && <img className="profile-account-avatar" src={profile.avatar_url} alt="Photo de profil" />}
      {profile?.username && <p className="profile-account-handle">@{profile.username}</p>}
      <p className="profile-account-email">{email}</p>
      {profile?.bio && <p>{profile.bio}</p>}
      {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
      <div className="profile-account-actions">
        <Link className="auth-submit" href="/bibliotheque">Ma bibliothèque →</Link>{profile?.is_public && profile.username && <Link className="auth-secondary" href={`/u/${encodeURIComponent(profile.username)}`}>Voir mon profil public ↗</Link>}<Link className="auth-secondary" href="/parametres">Paramètres du compte ⚙</Link>
        <button className="auth-secondary" type="button" onClick={signOut}>Me déconnecter</button>
      </div>
      <p className="auth-privacy">Votre prénom, votre nom et votre adresse e-mail restent privés.</p>
    </div>
  );
}
