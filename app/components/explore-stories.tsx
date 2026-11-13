"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { StorySaveButton } from "./story-save-button";
import { useAppPreferences } from "./app-preferences-provider";

type Story = { id: string; title: string; synopsis: string; genre: string; language: string; author_id: string; created_at: string; cover_url: string | null };
type Author = { id: string; username: string; display_name: string | null };

export function ExploreStories({ initialGenre = "" }: { initialGenre?: string }) {
  const { locale } = useAppPreferences();
  const [stories, setStories] = useState<Story[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState(initialGenre);

  useEffect(() => setGenre(initialGenre), [initialGenre]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data, error } = await supabase.from("stories")
          .select("id,title,synopsis,genre,language,author_id,created_at,cover_url")
          .eq("status", "published").eq("visibility", "public")
          .order("published_at", { ascending: false });
        if (error) throw error;
        const list = (data ?? []) as Story[];
        const ids = [...new Set(list.map(item => item.author_id))];
        let authorMap: Record<string, Author> = {};
        if (ids.length) {
          const { data: people, error: peopleError } = await supabase.from("profiles")
            .select("id,username,display_name").in("id", ids);
          if (peopleError) throw peopleError;
          authorMap = Object.fromEntries((people ?? []).map((person: Author) => [person.id, person]));
        }
        if (active) { setStories(list); setAuthors(authorMap); }
      } catch {
        if (active) setStories([]);
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => stories.filter(story => {
    const text = `${story.title} ${story.synopsis} ${story.genre}`.toLocaleLowerCase();
    return (!genre || story.genre?.toLocaleLowerCase() === genre.toLocaleLowerCase()) &&
      (!query || text.includes(query.toLocaleLowerCase()));
  }), [stories, genre, query]);

  const labels = {
    title: locale === "en" ? "Stories to discover" : locale === "es" ? "Historias por descubrir" : locale === "pt" ? "Histórias para descobrir" : "Des histoires à découvrir",
    search: locale === "en" ? "Search by title or genre" : locale === "es" ? "Buscar por título o género" : locale === "pt" ? "Buscar por título ou gênero" : "Rechercher un titre ou un genre",
    loading: locale === "en" ? "Loading published stories…" : locale === "es" ? "Cargando historias publicadas…" : locale === "pt" ? "Carregando histórias publicadas…" : "Chargement des histoires publiées…",
    empty: locale === "en" ? "No published stories yet" : locale === "es" ? "Todavía no hay historias publicadas" : locale === "pt" ? "Ainda não há histórias publicadas" : "Aucune histoire publiée pour le moment",
    emptyText: locale === "en" ? "When an author publishes a story, it will appear here and can be saved to your library." : locale === "es" ? "Cuando un autor publique una historia, aparecerá aquí y podrás guardarla en tu biblioteca." : locale === "pt" ? "Quando um autor publicar uma história, ela aparecerá aqui e poderá ser salva na sua biblioteca." : "Lorsqu'un auteur publiera une histoire, elle apparaîtra ici et pourra être enregistrée dans votre bibliothèque.",
    all: locale === "en" ? "All genres" : locale === "es" ? "Todos los géneros" : locale === "pt" ? "Todos os gêneros" : "Tous les genres",
    read: locale === "en" ? "Discover the story" : locale === "es" ? "Descubrir la historia" : locale === "pt" ? "Descobrir a história" : "Découvrir l'histoire"
  };

  return <section className="explore-live-section" id="histoires-publiees">
    <div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> BOOK-A-BOO</span><h2>{labels.title}</h2></div><span className="shelf-index">{stories.length.toString().padStart(2,"0")} {locale === "en" ? "STORIES" : locale === "es" ? "HISTORIAS" : locale === "pt" ? "HISTÓRIAS" : "HISTOIRES"}</span></div>
    <div className="explore-live-filters">
      <label><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={labels.search}/></label>
      <select value={genre} onChange={e => setGenre(e.target.value)} aria-label={labels.all}>
        <option value="">{labels.all}</option>
        {["Romance","Fantasy","Drame","Thriller","Psychologie","Fanfiction","Poésie","Science-fiction","Horreur","Historique","Littérature générale"].map(item => <option key={item} value={item}>{item}</option>)}
      </select>
    </div>
    {loading ? <p className="explore-live-empty">{labels.loading}</p> : filtered.length ? <div className="explore-live-grid">
      {filtered.map((story, index) => <article className="explore-live-card" key={story.id}>
        <Link href={`/histoire/${story.id}`} className={`explore-live-cover explore-live-cover-${index % 4}${story.cover_url ? " has-custom-cover" : ""}`}>
          {story.cover_url ? <img src={story.cover_url} alt={locale === "en" ? `Cover of ${story.title}` : locale === "es" ? `Portada de ${story.title}` : locale === "pt" ? `Capa de ${story.title}` : `Couverture de ${story.title}`} /> : <><span className="explore-live-cover-index">BAB / {String(index + 1).padStart(3,"0")}</span><BookOpen size={31}/><strong>{story.title}</strong><small>{story.genre || "Book-A-Boo"}</small></>}
        </Link>
        <div className="explore-live-meta"><span>{story.genre || (locale === "en" ? "Literature" : "Littérature")}</span><span>{story.language.toUpperCase()}</span></div>
        <h3><Link href={`/histoire/${story.id}`}>{story.title}</Link></h3>
        <p>{story.synopsis || (locale === "en" ? "A new world to discover." : locale === "es" ? "Un nuevo mundo por descubrir." : locale === "pt" ? "Um novo mundo para descobrir." : "Un nouvel univers à découvrir.")}</p>
        <small className="explore-live-author">{locale === "en" ? "By" : locale === "es" ? "Por" : locale === "pt" ? "Por" : "Par"} {authors[story.author_id]?.display_name || authors[story.author_id]?.username || (locale === "en" ? "Book-A-Boo author" : "Un auteur Book-A-Boo")}</small>
        <div className="explore-live-actions"><StorySaveButton storyId={story.id}/><Link href={`/histoire/${story.id}`} aria-label={labels.read}><ArrowUpRight size={17}/></Link></div>
      </article>)}
    </div> : <div className="explore-live-empty"><BookOpen size={25}/><strong>{labels.empty}</strong><p>{genre ? (locale === "en" ? "Try another genre or clear the filter." : locale === "es" ? "Prueba otro género o elimina el filtro." : locale === "pt" ? "Experimente outro gênero ou limpe o filtro." : "Essayez un autre genre ou retirez le filtre.") : labels.emptyText}</p></div>}
  </section>;
}
