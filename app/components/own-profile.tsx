"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { PublicProfile } from "./public-profile";

export function OwnProfile() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) { setSignedOut(true); setLoading(false); }
        return;
      }
      const { data } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
      if (active) { setUsername(data?.username ?? null); setLoading(false); }
    }
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  if (loading) return <div className="library-live-state">Chargement de votre profil…</div>;
  if (signedOut) return <div className="auth-card profile-logged-out"><h2>Votre univers vous attend.</h2><p>Connectez-vous pour retrouver votre profil.</p><Link className="auth-submit" href="/connexion">Me connecter →</Link></div>;
  if (!username) return <div className="personal-library-empty"><h2>Profil introuvable</h2><p>Complétez d’abord votre profil dans les paramètres.</p><Link className="primary-button" href="/parametres">Configurer mon profil</Link></div>;

  return <div className="own-profile-page">
    <div className="own-profile-tools"><Link href="/parametres">Modifier mon profil ⚙</Link><Link href="/bibliotheque">Ma bibliothèque</Link><Link href="/notifications">Notifications</Link></div>
    <PublicProfile username={username} allowPrivate />
  </div>;
}
