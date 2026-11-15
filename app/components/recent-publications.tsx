"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type Story = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  genre: string;
  language: string;
  author_id: string;
  cover_url: string | null;
  published_at: string | null;
  created_at: string;
};
type Author = { id: string; username: string; display_name: string | null };

export function RecentPublications() {
  const { locale } = useAppPreferences();
  const [stories, setStories] = useState<Array<{ story: Story; author: Author | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data, error } = await supabase.from("stories")
          .select("id,slug,title,synopsis,genre,language,author_id,cover_url,published_at,created_at")
          .eq("status", "published")
          .eq("visibility", "public")
          .order("published_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(6);
        if (error) throw error;
        const rows = (data ?? []) as Story[];
        const authorIds = [...new Set(rows.map(story => story.author_id))];
        let authorMap: Record<string, Author> = {};
        if (authorIds.length) {
          const { data: authors, error: authorsError } = await supabase.from("profiles")
            .select("id,username,display_name").in("id", authorIds);
          if (authorsError) throw authorsError;
          authorMap = Object.fromEntries((authors ?? []).map((author: Author) => [author.id, author]));
        }
        if (active) setStories(rows.map(story => ({ story, author: authorMap[story.author_id] ?? null })));
      } catch {
        if (active) setStories([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (loading || !stories.length) return null;

  const copy = locale === "en"
    ? { eyebrow: "FRESHLY PUBLISHED", title: "Recent publications", intro: "Discover the latest public stories shared by the community.", by: "By", read: "Discover the story", all: "Explore all stories" }
    : locale === "es"
    ? { eyebrow: "RECIÉN PUBLICADAS", title: "Publicaciones recientes", intro: "Descubre las últimas historias públicas compartidas por la comunidad.", by: "Por", read: "Descubrir la historia", all: "Explorar todas las historias" }
    : locale === "pt"
    ? { eyebrow: "RECÉM-PUBLICADAS", title: "Publicações recentes", intro: "Descubra as últimas histórias públicas partilhadas pela comunidade.", by: "Por", read: "Descobrir a história", all: "Explorar todas as histórias" }
    : { eyebrow: "LES DERNIÈRES PARUTIONS", title: "Publications récentes", intro: "Découvrez les dernières histoires publiques partagées par la communauté.", by: "Par", read: "Découvrir l’histoire", all: "Explorer toutes les histoires" };

  return <section className="recent-publications" aria-label={copy.title}>
    <div className="recent-publications-heading">
      <div><div className="eyebrow">{copy.eyebrow}</div><h2>{copy.title}</h2><p>{copy.intro}</p></div>
      <Link href="/explorer" className="recent-publications-all">{copy.all}<ArrowUpRight size={15}/></Link>
    </div>
    <div className="recent-publications-grid">
      {stories.map(({ story, author }, index) => <article className="recent-publication-card" key={story.id}>
        <Link href={"/histoire/" + story.slug} className={"recent-publication-cover recent-publication-cover-" + (index % 3) + (story.cover_url ? " has-cover" : "")} aria-label={story.title}>
          {story.cover_url ? <img src={story.cover_url} alt={"Couverture de " + story.title}/> : <><span>BAB / {String(index + 1).padStart(2, "0")}</span><BookOpen size={25}/><strong>{story.title}</strong><small>{story.genre || "Book-A-Boo"}</small></>}
        </Link>
        <div className="recent-publication-copy"><h3><Link href={"/histoire/" + story.slug}>{story.title}</Link></h3><small>{copy.by} {author?.display_name || author?.username || "Book-A-Boo"}</small><p>{story.synopsis || story.genre || ""}</p><Link className="recent-publication-read" href={"/histoire/" + story.slug}>{copy.read}<ArrowUpRight size={14}/></Link></div>
      </article>)}
    </div>
  </section>;
}
