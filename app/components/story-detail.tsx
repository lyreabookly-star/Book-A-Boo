"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { StorySaveButton } from "./story-save-button";
import { useAppPreferences } from "./app-preferences-provider";

type Story = { id: string; title: string; synopsis: string; genre: string; language: string; author_id: string; published_at: string | null };
type Chapter = { id: string; title: string; chapter_number: number; content: string };
type Author = { username: string; display_name: string | null };

export function StoryDetail({ storyId }: { storyId: string }) {
  const { locale } = useAppPreferences();
  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data, error: storyError } = await supabase.from("stories")
          .select("id,title,synopsis,genre,language,author_id,published_at")
          .eq("id", storyId).eq("status", "published").eq("visibility", "public").single();
        if (storyError) throw storyError;
        const [authorResult, chapterResult] = await Promise.all([
          supabase.from("profiles").select("username,display_name").eq("id", data.author_id).maybeSingle(),
          supabase.from("chapters").select("id,title,chapter_number,content").eq("story_id", storyId).order("chapter_number")
        ]);
        if (authorResult.error) throw authorResult.error;
        if (chapterResult.error) throw chapterResult.error;
        if (active) {
          setStory(data);
          setAuthor(authorResult.data);
          setChapters(chapterResult.data ?? []);
          setActiveChapter((chapterResult.data ?? [])[0] ?? null);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Cette histoire n'est pas accessible.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [storyId]);

  if (loading) return <div className="library-live-state"><LoaderCircle className="spin" size={20}/>{locale === "en" ? "Opening story…" : locale === "es" ? "Abriendo historia…" : locale === "pt" ? "Abrindo história…" : "Ouverture de l'histoire…"}</div>;
  if (!story) return <div className="personal-library-empty"><BookOpen size={25}/><h2>{locale === "en" ? "Story unavailable" : locale === "es" ? "Historia no disponible" : locale === "pt" ? "História indisponível" : "Histoire indisponible"}</h2><p>{error || (locale === "en" ? "This story may be private or no longer published." : locale === "es" ? "Esta historia puede ser privada o ya no estar publicada." : locale === "pt" ? "Esta história pode ser privada ou não estar mais publicada." : "Cette histoire est peut-être privée ou n'est plus publiée.")}</p><Link href="/explorer" className="primary-button">{locale === "en" ? "Back to Explorer" : locale === "es" ? "Volver a Explorar" : locale === "pt" ? "Voltar a Explorar" : "Retourner à Explorer"}</Link></div>;

  return <div className="story-detail-page">
    <Link href="/explorer" className="story-detail-back"><ArrowLeft size={15}/>{locale === "en" ? "Back to Explorer" : locale === "es" ? "Volver a Explorar" : locale === "pt" ? "Voltar a Explorar" : "Retour à Explorer"}</Link>
    <div className="story-detail-hero"><div className="story-detail-cover"><BookOpen size={40}/><span>{story.genre || "BOOK-A-BOO"}</span><strong>{story.title}</strong><small>{locale === "en" ? "A BOOK-A-BOO STORY" : locale === "es" ? "UNA HISTORIA BOOK-A-BOO" : locale === "pt" ? "UMA HISTÓRIA BOOK-A-BOO" : "UNE HISTOIRE BOOK-A-BOO"}</small></div>
      <div className="story-detail-copy"><span className="catalogue-overline">{story.genre || (locale === "en" ? "LITERATURE" : "LITTÉRATURE")} · {story.language.toUpperCase()}</span><h2>{story.title}</h2><p className="story-detail-byline">{locale === "en" ? "By" : locale === "es" ? "Por" : locale === "pt" ? "Por" : "Par"} {author?.display_name || author?.username || "Book-A-Boo"}</p><p>{story.synopsis || (locale === "en" ? "A story waiting to be discovered." : locale === "es" ? "Una historia esperando ser descubierta." : locale === "pt" ? "Uma história esperando para ser descoberta." : "Une histoire qui attend d'être découverte.")}</p><StorySaveButton storyId={story.id}/></div>
    </div>
    <section className="story-detail-reading"><div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> {locale === "en" ? "THE STORY" : locale === "es" ? "LA HISTORIA" : locale === "pt" ? "A HISTÓRIA" : "L'HISTOIRE"}</span><h2>{locale === "en" ? "Turn the page." : locale === "es" ? "Pasa la página." : locale === "pt" ? "Vire a página." : "Tournez la page."}</h2></div><span className="shelf-index">{chapters.length} {locale === "en" ? "CHAPTERS" : locale === "es" ? "CAPÍTULOS" : locale === "pt" ? "CAPÍTULOS" : "CHAPITRES"}</span></div>
      {chapters.length ? <><div className="story-detail-chapter-list">{chapters.map(item => <button key={item.id} type="button" className={activeChapter?.id === item.id ? "active" : ""} onClick={() => setActiveChapter(item)}>{String(item.chapter_number).padStart(2,"0")} · {item.title}</button>)}</div><article className="story-detail-chapter"><span className="catalogue-overline">{activeChapter?.title}</span><div>{activeChapter?.content?.trim() ? activeChapter.content.split(/\n{2,}/).map((paragraph,index)=><p key={index}>{paragraph}</p>) : <p>{locale === "en" ? "This chapter is being prepared by its author." : locale === "es" ? "El autor está preparando este capítulo." : locale === "pt" ? "O autor está preparando este capítulo." : "Ce chapitre est en cours de préparation par son auteur."}</p>}</div></article></> : <p className="explore-live-empty">{locale === "en" ? "Chapters are not available yet." : locale === "es" ? "Los capítulos aún no están disponibles." : locale === "pt" ? "Os capítulos ainda não estão disponíveis." : "Les chapitres ne sont pas encore disponibles."}</p>}
    </section>
  </div>;
}
