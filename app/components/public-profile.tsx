"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Bookmark, LoaderCircle, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type Profile = { id: string; username: string; display_name: string | null; bio: string; avatar_url: string | null; is_public: boolean; show_library_on_profile: boolean };
type LibraryStory = { id: string; status: string; story: { id: string; title: string; synopsis: string; genre: string; language: string } | null };

export function PublicProfile({ username }: { username: string }) {
  const { locale } = useAppPreferences();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<LibraryStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data, error: profileError } = await supabase.from("profiles")
          .select("id,username,display_name,bio,avatar_url,is_public,show_library_on_profile")
          .eq("username", username).maybeSingle();
        if (profileError) throw profileError;
        if (!data || !data.is_public) throw new Error("PROFILE_NOT_AVAILABLE");
        let library: LibraryStory[] = [];
        if (data.show_library_on_profile) {
          const { data: items, error: libraryError } = await supabase.from("user_library")
            .select("id,status,story:stories(id,title,synopsis,genre,language)")
            .eq("user_id", data.id).order("updated_at", { ascending: false });
          if (libraryError) throw libraryError;
          library = items ?? [];
        }
        if (active) { setProfile(data); setBooks(library); }
      } catch (e) {
        if (active) setError(e instanceof Error && e.message !== "PROFILE_NOT_AVAILABLE" ? e.message : "");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [username]);

  if (loading) return <div className="library-live-state"><LoaderCircle className="spin" size={20}/>{locale === "en" ? "Loading profile…" : locale === "es" ? "Cargando perfil…" : locale === "pt" ? "Carregando perfil…" : "Chargement du profil…"}</div>;
  if (!profile) return <div className="personal-library-empty"><UserRound size={25}/><h2>{locale === "en" ? "Profile unavailable" : locale === "es" ? "Perfil no disponible" : locale === "pt" ? "Perfil indisponível" : "Profil indisponible"}</h2><p>{locale === "en" ? "This profile is private or does not exist." : locale === "es" ? "Este perfil es privado o no existe." : locale === "pt" ? "Este perfil é privado ou não existe." : "Ce profil est privé ou n'existe pas."}</p><Link href="/explorer" className="primary-button">{locale === "en" ? "Explore stories" : locale === "es" ? "Explorar historias" : locale === "pt" ? "Explorar histórias" : "Explorer les histoires"}</Link></div>;

  return <div className="public-profile-page">
    <section className="public-profile-heading">
      {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span className="public-profile-avatar"><UserRound size={28}/></span>}
      <div><span className="catalogue-overline">{locale === "en" ? "BOOK-A-BOO READER" : locale === "es" ? "LECTOR BOOK-A-BOO" : locale === "pt" ? "LEITOR BOOK-A-BOO" : "LECTEUR BOOK-A-BOO"}</span><h2>{profile.display_name || profile.username}</h2><p>@{profile.username}</p>{profile.bio && <div className="public-profile-bio">{profile.bio}</div>}</div>
    </section>
    {profile.show_library_on_profile && <section className="public-profile-library"><div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> {locale === "en" ? "READING SHELF" : locale === "es" ? "ESTANTERÍA DE LECTURA" : locale === "pt" ? "ESTANTE DE LEITURA" : "BIBLIOTHÈQUE"}</span><h2>{locale === "en" ? "Stories in this library." : locale === "es" ? "Historias en esta biblioteca." : locale === "pt" ? "Histórias nesta biblioteca." : "Les histoires de cette bibliothèque."}</h2></div></div>
      {books.length ? <div className="public-profile-books">{books.map(item => item.story && <Link href={`/histoire/${item.story.id}`} className="public-profile-book" key={item.id}><BookOpen size={20}/><span><strong>{item.story.title}</strong><small>{item.story.genre || "Book-A-Boo"} · {item.story.language.toUpperCase()}</small></span><Bookmark size={15}/></Link>)}</div> : <p className="explore-live-empty">{locale === "en" ? "This library is waiting for its first story." : locale === "es" ? "Esta biblioteca espera su primera historia." : locale === "pt" ? "Esta biblioteca está esperando sua primeira história." : "Cette bibliothèque attend sa première histoire."}</p>}
    </section>}
    {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
  </div>;
}
