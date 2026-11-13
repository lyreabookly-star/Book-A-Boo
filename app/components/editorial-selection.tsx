"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type PickRow = { id: string; story_id: string; position: number; eyebrow: string; editorial_note: string | null };
type Story = { id: string; title: string; synopsis: string; genre: string; language: string; author_id: string; cover_url: string | null };
type Author = { id: string; username: string; display_name: string | null };

export function EditorialSelection() {
  const { locale } = useAppPreferences();
  const [picks, setPicks] = useState<Array<{ pick: PickRow; story: Story; author: Author | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data: selection, error } = await supabase.from("editorial_selections")
          .select("id,story_id,position,eyebrow,editorial_note")
          .eq("is_active", true).order("position", { ascending: true }).limit(12);
        if (error) throw error;
        const rows = (selection ?? []) as PickRow[];
        const ids = rows.map(row => row.story_id);
        if (!ids.length) { if (active) setPicks([]); return; }
        const { data: stories, error: storiesError } = await supabase.from("stories")
          .select("id,title,synopsis,genre,language,author_id,cover_url")
          .in("id", ids).eq("status", "published").eq("visibility", "public");
        if (storiesError) throw storiesError;
        const list = (stories ?? []) as Story[];
        const authorIds = [...new Set(list.map(story => story.author_id))];
        let authorMap: Record<string, Author> = {};
        if (authorIds.length) {
          const { data: authors, error: authorsError } = await supabase.from("profiles")
            .select("id,username,display_name").in("id", authorIds);
          if (authorsError) throw authorsError;
          authorMap = Object.fromEntries((authors ?? []).map((author: Author) => [author.id, author]));
        }
        const byId = new Map(list.map(story => [story.id, story]));
        const result = rows.flatMap(pick => {
          const story = byId.get(pick.story_id);
          return story ? [{ pick, story, author: authorMap[story.author_id] ?? null }] : [];
        });
        if (active) setPicks(result);
      } catch {
        if (active) setPicks([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const copy = locale === "en"
    ? { eyebrow: "THE EDITOR'S DESK", title: "The editorial selection", intro: "Stories chosen with care by the Book-A-Boo team.", empty: "Our first selection is taking shape.", emptyText: "The editorial team will soon share its favorite stories here.", discover: "Discover the story", by: "By", preparing: "Preparing the selection…" }
    : locale === "es"
    ? { eyebrow: "LA MESA EDITORIAL", title: "Selección de la redacción", intro: "Historias elegidas con cariño por el equipo de Book-A-Boo.", empty: "Nuestra primera selección está tomando forma.", emptyText: "Pronto compartiremos aquí nuestras historias favoritas.", discover: "Descubrir la historia", by: "Por", preparing: "Preparando la selección…" }
    : locale === "pt"
    ? { eyebrow: "DA REDAÇÃO", title: "Seleção editorial", intro: "Histórias escolhidas com carinho pela equipe Book-A-Boo.", empty: "Nossa primeira seleção está tomando forma.", emptyText: "Em breve compartilharemos aqui nossas histórias favoritas.", discover: "Descobrir a história", by: "Por", preparing: "Preparando a seleção…" }
    : { eyebrow: "LE CHOIX DE BAB", title: "Sélection de la rédaction", intro: "Des histoires choisies avec soin par l’équipe de Book-A-Boo.", empty: "Notre première sélection prend forme.", emptyText: "L’équipe éditoriale partagera bientôt ici ses coups de cœur littéraires.", discover: "Découvrir l’histoire", by: "Par", preparing: "Préparation de la sélection…" };

  return <section className="editorial-section" aria-labelledby="editorial-title">
    <div className="editorial-heading">
      <div><span className="eyebrow"><span className="eyebrow-line"/><Sparkles size={13}/>{copy.eyebrow}</span><h2 id="editorial-title">{copy.title}</h2><p>{copy.intro}</p></div>
      <span className="editorial-mark">BAB <i>✳</i></span>
    </div>
    {loading ? <p className="editorial-empty">{copy.preparing}</p> : picks.length ? <div className="editorial-grid">
      {picks.map(({ pick, story, author }, index) => <article className={index === 0 ? "editorial-card editorial-card-featured" : "editorial-card"} key={pick.id}>
        <Link href={`/histoire/${story.id}`} className={`editorial-cover editorial-cover-${index % 3}${story.cover_url ? " has-cover" : ""}`}>
          {story.cover_url ? <img src={story.cover_url} alt={`Couverture de ${story.title}`}/> : <><span>BAB / {String(index + 1).padStart(2, "0")}</span><BookOpen size={29}/><strong>{story.title}</strong><small>{story.genre || "Book-A-Boo"}</small></>}
        </Link>
        <div className="editorial-card-copy"><span className="editorial-kicker">{pick.eyebrow || copy.eyebrow}</span><h3><Link href={`/histoire/${story.id}`}>{story.title}</Link></h3><small>{copy.by} {author?.display_name || author?.username || "Book-A-Boo"}</small><p>{pick.editorial_note || story.synopsis}</p><Link className="editorial-discover" href={`/histoire/${story.id}`}>{copy.discover}<ArrowUpRight size={15}/></Link></div>
      </article>)}
    </div> : <div className="editorial-empty editorial-empty-state"><span className="editorial-empty-icon"><BookOpen size={25}/></span><div><strong>{copy.empty}</strong><p>{copy.emptyText}</p></div><span className="editorial-empty-signature">Book-A-Boo · Édition</span></div>}
  </section>;
}
