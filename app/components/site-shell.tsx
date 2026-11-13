"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Feather, House, UserRound, LogIn } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const items = [
  { href: "/", label: "Accueil", icon: House },
  { href: "/explorer", label: "Explorer", icon: Compass },
  { href: "/ecrire", label: "Écrire", icon: Feather },
  { href: "/profil", label: "Profil", icon: UserRound },
];

type HeaderProfile = { id: string; avatarUrl: string | null; displayName: string | null };

export function SiteHeader({ active = "/" }: { active?: string }) {
  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let alive = true;

    async function syncProfile(userId: string | null) {
      if (!userId) {
        if (alive) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", userId)
        .maybeSingle();
      if (alive) {
        setProfile({
          id: userId,
          avatarUrl: data?.avatar_url ?? null,
          displayName: data?.display_name ?? null,
        });
      }
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      void syncProfile(data.session?.user.id ?? null).finally(() => {
        if (alive) setAuthReady(true);
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncProfile(session?.user.id ?? null).finally(() => {
        if (alive) setAuthReady(true);
      });
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  return <>
    <header className="site-header site-header-app">
      <Link className="brand" href="/" aria-label="Book-A-Boo accueil"><img className="brand-logo" src="/book-a-boo-logo.svg" alt="Book-A-Boo" /></Link>
      <nav className="main-nav" aria-label="Navigation principale">
        {items.map(item => <Link key={item.href} className={active === item.href ? "active" : ""} href={item.href}>{item.label}</Link>)}
      </nav>
      <div className="header-actions">
        {authReady && profile ? (
          <Link className="header-profile-link" href="/profil" aria-label={profile.displayName ? `Ouvrir le profil de ${profile.displayName}` : "Ouvrir mon profil"} title="Mon profil">
            {profile.avatarUrl ? <img className="header-profile-avatar" src={profile.avatarUrl} alt="" /> : <span className="header-profile-fallback"><UserRound size={20}/></span>}
          </Link>
        ) : (
          <>
            <Link className="login-link" href="/connexion"><LogIn size={15}/> Connexion</Link>
            <Link className="signup-button" href="/inscription">Rejoindre <span>→</span></Link>
          </>
        )}
      </div>
    </header>
    <nav className="mobile-nav" aria-label="Navigation mobile">
      {items.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={active === item.href ? "active" : ""}><Icon size={19}/><span>{item.label}</span></Link>; })}
    </nav>
  </>;
}

export function InteriorPage({ active, eyebrow, title, description, children }: { active: string; eyebrow: string; title: React.ReactNode; description: string; children?: React.ReactNode }) {
  return <main className="app-page"><SiteHeader active={active}/><section className="interior-hero"><div className="eyebrow"><span className="eyebrow-line"/>{eyebrow}</div><h1>{title}</h1><p>{description}</p></section><section className="interior-content">{children}</section><footer className="app-footer"><Link href="/">Book-A-Boo</Link><span>Chaque histoire ouvre un monde.</span></footer></main>;
}
