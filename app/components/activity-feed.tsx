"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, LoaderCircle, Users } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { StorySaveButton } from "./story-save-button";

type Story = { id: string; title: string; synopsis: string; genre: string; language: string; author_id: string; published_at: string | null; cover_url: string | null };
type Author = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export function ActivityFeed() {
  const [stories, setStories] = useState<Story[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (active) { setSignedIn(false); setLoading(false); } return; }
        if (active) setSignedIn(true);
        const { data: follows, error: followError } = await supabase.from("author_follows")
          .select("author_id").eq("follower_id", user.id);
        if (followError) throw followError;
        const authorIds = (follows ?? []).map((row: { author_id: string }) => row.author_id);
        if (!authorIds.length) { if (active) setStories([]); return; }
        const { data, error: storyError } = await supabase.from("stories")
          .select("id,title,synopsis,genre,language,author_id,published_at,cover_url")
          .in("author_id", authorIds).eq("status", "published").eq("visibility", "public")
          .order("published_at", { ascending: false }).limit(40);
        if (storyError) throw storyError;
        const list = (data ?? []) as Story[];
        const { data: people, error: peopleError } = await supabase.from("profiles")
          .select("id,username,display_name,avatar_url").in("id", authorIds);
        if (peopleError) throw peopleError;
        if (active) {
          setStories(list);
          setAuthors(Object.fromEntries((people ?? []).map((person: Author) => [person.id, person])));
        }
      } catch {
        if (active) setError("Le fil d'actualités n'a pas pu être chargé. Réessayez dans un instant.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (loading) return <div className="library-live-state"><LoaderCircle className="spin" size={20}/> Chargement de vos actualités…</div>;
  if (!signedIn) return <div className="personal-library-empty"><Users size={27}/><h2>Votre communauté vous attend.</h2><p>Connectez-vous pour suivre vos auteurs préférés et retrouver leurs nouvelles publications ici.</p><Link className="primary-button" href="/connexion">Me connecter →</Link></div>;
  if (error) return <div className="explore-live-empty" role="alert">{error}</div>;
  if (!stories.length) return <div className="personal-library-empty"><Users size={27}/><h2>Votre fil commence ici.</h2><p>Découvrez des histoires dans Explorer, ouvrez le profil ou une histoire d'un auteur, puis choisissez « Suivre l'auteur ». Ses nouvelles publications apparaîtront ici.</p><Link className="primary-button" href="/explorer">Découvrir des auteurs →</Link></div>;

  return <div className="activity-feed-list">{stories.map((story, index) => {
    const author = authors[story.author_id];
    return <article className="activity-feed-card" key={story.id}>
      <div className="activity-feed-author">{author?.avatar_url ? <img src={author.avatar_url} alt=""/> : <span className="activity-feed-avatar">{(author?.display_name || author?.username || "B").slice(0,1).toUpperCase()}</span>}<div><strong>{author?.display_name || author?.username || "Auteur Book-A-Boo"}</strong><small> a publié une histoire</small></div></div>
      <div className="activity-feed-story">
        <Link href={`/histoire/${story.id}`} className={`activity-feed-cover${story.cover_url ? " has-cover" : ""}`}>{story.cover_url ? <img src={story.cover_url} alt={`Couverture de ${story.title}`}/> : <><BookOpen size={25}/><strong>{story.title}</strong></>}</Link>
        <div className="activity-feed-copy"><span className="catalogue-overline">{story.genre || "LITTÉRATURE"} · {story.language.toUpperCase()}</span><h2><Link href={`/histoire/${story.id}`}>{story.title}</Link></h2><p>{story.synopsis || "Une nouvelle histoire à découvrir."}</p><div className="activity-feed-actions"><StorySaveButton storyId={story.id}/><Link href={`/histoire/${story.id}`}>Lire l'histoire <ArrowUpRight size={15}/></Link></div></div>
      </div>
    </article>;
  })}</div>;
}
