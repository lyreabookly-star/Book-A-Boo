"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, Copy, LoaderCircle, UserRound, Users } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { StorySaveButton } from "./story-save-button";
import { useAppPreferences } from "./app-preferences-provider";
import { AuthorFollowButton } from "./author-follow-button";
import { RichChapterContent } from "./rich-chapter-content";
import { StoryInteractions } from "./story-interactions";
import { ContentReportButton } from "./content-report-button";

type Story = { id: string; slug: string; title: string; synopsis: string; genre: string; language: string; author_id: string; published_at: string | null; cover_url: string | null };
type Chapter = { id: string; title: string; chapter_number: number; content: string };
type Author = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export function StoryDetail({ storyId }: { storyId: string }) {
  const { locale } = useAppPreferences();
  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [authorFollowerCount, setAuthorFollowerCount] = useState(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data, error: storyError } = await supabase.from("stories")
          .select("id,slug,title,synopsis,genre,language,author_id,published_at,cover_url")
          .or(`id.eq.${storyId},slug.eq.${storyId}`).eq("status", "published").eq("visibility", "public").single();
        if (storyError) throw storyError;
        const [authorResult, chapterResult, followerResult] = await Promise.all([
          supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", data.author_id).eq("is_public", true).maybeSingle(),
          supabase.from("chapters").select("id,title,chapter_number,content").eq("story_id", data.id).order("chapter_number"),
          supabase.from("author_follows").select("follower_id", { count: "exact", head: true }).eq("author_id", data.author_id)
        ]);
        if (authorResult.error) throw authorResult.error;
        if (chapterResult.error) throw chapterResult.error;
        if (followerResult.error) throw followerResult.error;
        if (active) {
          setStory(data);
          setAuthor(authorResult.data);
          setAuthorFollowerCount(followerResult.count ?? 0);
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

  async function copyStoryLink() {
    if (!story) return;
    const url = `${window.location.origin}/histoire/${story.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  if (loading) return <div className="library-live-state"><LoaderCircle className="spin" size={20}/>{locale === "en" ? "Opening story…" : locale === "es" ? "Abriendo historia…" : locale === "pt" ? "Abrindo história…" : "Ouverture de l'histoire…"}</div>;
  if (!story) return <div className="personal-library-empty"><BookOpen size={25}/><h2>{locale === "en" ? "Story unavailable" : locale === "es" ? "Historia no disponible" : locale === "pt" ? "História indisponível" : "Histoire indisponible"}</h2><p>{error || (locale === "en" ? "This story may be private or no longer published." : locale === "es" ? "Esta historia puede ser privada o ya no estar publicada." : locale === "pt" ? "Esta história pode ser privada ou não estar mais publicada." : "Cette histoire est peut-être privée ou n'est plus publiée.")}</p><Link href="/explorer" className="primary-button">{locale === "en" ? "Back to Explorer" : locale === "es" ? "Volver a Explorar" : locale === "pt" ? "Voltar a Explorar" : "Retourner à Explorer"}</Link></div>;

  return <div className="story-detail-page">
    <Link href="/explorer" className="story-detail-back"><ArrowLeft size={15}/>{locale === "en" ? "Back to Explorer" : locale === "es" ? "Volver a Explorar" : locale === "pt" ? "Voltar a Explorar" : "Retour à Explorer"}</Link>
    <div className="story-detail-hero"><div className={`story-detail-cover${story.cover_url ? " has-custom-cover" : ""}`}>{story.cover_url ? <img src={story.cover_url} alt={locale === "en" ? `Cover of ${story.title}` : locale === "es" ? `Portada de ${story.title}` : locale === "pt" ? `Capa de ${story.title}` : `Couverture de ${story.title}`} /> : <><BookOpen size={40}/><span>{story.genre || "BOOK-A-BOO"}</span><strong>{story.title}</strong><small>{locale === "en" ? "A BOOK-A-BOO STORY" : locale === "es" ? "UNA HISTORIA BOOK-A-BOO" : locale === "pt" ? "UMA HISTÓRIA BOOK-A-BOO" : "UNE HISTOIRE BOOK-A-BOO"}</small></>}</div>
      <div className="story-detail-copy"><span className="catalogue-overline">{story.genre || (locale === "en" ? "LITERATURE" : "LITTÉRATURE")} · {story.language.toUpperCase()}</span><h2>{story.title}</h2><div className="story-detail-author-card"><span className="story-detail-author-label">{locale === "en" ? "PUBLISHED BY" : locale === "es" ? "PUBLICADO POR" : locale === "pt" ? "PUBLICADO POR" : "PUBLIÉ PAR"}</span>{author ? <Link href={`/u/${encodeURIComponent(author.username)}`} className="story-detail-author-profile-link">{author.avatar_url ? <img src={author.avatar_url} alt="" /> : <span className="story-detail-author-avatar"><UserRound size={19}/></span>}<span className="story-detail-author-info"><strong>{author.display_name || author.username}</strong><small>@{author.username}</small><small className="story-detail-author-followers"><Users size={12}/>{authorFollowerCount} {locale === "en" ? "followers" : locale === "es" ? "seguidores" : locale === "pt" ? "seguidores" : "abonnés"}</small></span><span className="story-detail-author-view">{locale === "en" ? "View profile" : locale === "es" ? "Ver perfil" : locale === "pt" ? "Ver perfil" : "Voir le profil"} →</span></Link> : <div className="story-detail-author-private"><UserRound size={19}/><strong>{locale === "en" ? "Book-A-Boo author" : locale === "es" ? "Autor de Book-A-Boo" : locale === "pt" ? "Autor Book-A-Boo" : "Auteur Book-A-Boo"}</strong></div>}</div><p>{story.synopsis || (locale === "en" ? "A story waiting to be discovered." : locale === "es" ? "Una historia esperando ser descubierta." : locale === "pt" ? "Uma história esperando para ser descoberta." : "Une histoire qui attend d'être découverte.")}</p><div className="story-detail-social-actions"><StorySaveButton storyId={story.id}/><AuthorFollowButton authorId={story.author_id}/><button type="button" className="auth-secondary" onClick={copyStoryLink}><>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? (locale === "en" ? "Link copied" : locale === "es" ? "Enlace copiado" : locale === "pt" ? "Link copiado" : "Lien copié") : (locale === "en" ? "Share story" : locale === "es" ? "Compartir historia" : locale === "pt" ? "Compartilhar história" : "Partager l’œuvre")}</></button><ContentReportButton targetType="story" targetId={story.id}/></div></div>
    </div>
    <section className="story-detail-reading"><div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> {locale === "en" ? "THE STORY" : locale === "es" ? "LA HISTORIA" : locale === "pt" ? "A HISTÓRIA" : "L'HISTOIRE"}</span><h2>{locale === "en" ? "Turn the page." : locale === "es" ? "Pasa la página." : locale === "pt" ? "Vire a página." : "Tournez la page."}</h2></div><span className="shelf-index">{chapters.length} {locale === "en" ? "CHAPTERS" : locale === "es" ? "CAPÍTULOS" : locale === "pt" ? "CAPÍTULOS" : "CHAPITRES"}</span></div>
      {chapters.length ? <><div className="story-detail-chapter-list">{chapters.map(item => <button key={item.id} type="button" className={activeChapter?.id === item.id ? "active" : ""} onClick={() => setActiveChapter(item)}>{String(item.chapter_number).padStart(2,"0")} · {item.title}</button>)}</div><article className="story-detail-chapter"><span className="catalogue-overline">{activeChapter?.title}</span><div>{activeChapter?.content?.trim() ? <RichChapterContent content={activeChapter.content}/> : <p>{locale === "en" ? "This chapter is being prepared by its author." : locale === "es" ? "El autor está preparando este capítulo." : locale === "pt" ? "O autor está preparando este capítulo." : "Ce chapitre est en cours de préparation par son auteur."}</p>}</div></article></> : <p className="explore-live-empty">{locale === "en" ? "Chapters are not available yet." : locale === "es" ? "Los capítulos aún no están disponibles." : locale === "pt" ? "Os capítulos ainda não estão disponíveis." : "Les chapitres ne sont pas encore disponibles."}</p>}
    </section>
    <StoryInteractions storyId={story.id} />
  </div>;
}
