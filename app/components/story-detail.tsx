"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, Copy, LoaderCircle, UserRound, Users, SlidersHorizontal, RotateCcw } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { StorySaveButton } from "./story-save-button";
import { useAppPreferences } from "./app-preferences-provider";
import { AuthorFollowButton } from "./author-follow-button";
import { RichChapterContent } from "./rich-chapter-content";
import { StoryInteractions } from "./story-interactions";
import { ContentReportButton } from "./content-report-button";

type Story = { id: string; slug: string; title: string; synopsis: string; genre: string; language: string; author_id: string; published_at: string | null; cover_url: string | null; author_note: string; content_warnings: string[]; audience_rating: string };
type Chapter = { id: string; title: string; chapter_number: number; content: string; author_note: string };
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
  const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);
  const [readerBrightness, setReaderBrightness] = useState(100);
  const [readerContrast, setReaderContrast] = useState(100);
  const [readerFontSize, setReaderFontSize] = useState(16);
  const [readerTone, setReaderTone] = useState("default");
  const [readerSettingsLoaded, setReaderSettingsLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("bab-reader-comfort");
      if (saved) {
        const settings = JSON.parse(saved);
        if (typeof settings.brightness === "number") setReaderBrightness(Math.min(130, Math.max(70, settings.brightness)));
        if (typeof settings.contrast === "number") setReaderContrast(Math.min(130, Math.max(70, settings.contrast)));
        if (typeof settings.fontSize === "number") setReaderFontSize(Math.min(24, Math.max(14, settings.fontSize)));
        if (["default", "cream", "sepia", "night"].includes(settings.tone)) setReaderTone(settings.tone);
      }
    } catch {
      // Ignore corrupted local preferences and keep accessible defaults.
    } finally {
      setReaderSettingsLoaded(true);
    }
  }, []);
  useEffect(() => {
    if (!readerSettingsLoaded) return;
    try {
      window.localStorage.setItem("bab-reader-comfort", JSON.stringify({brightness:readerBrightness,contrast:readerContrast,fontSize:readerFontSize,tone:readerTone}));
    } catch {
      // Reading remains available when local storage is disabled or full.
    }
  }, [readerSettingsLoaded,readerBrightness,readerContrast,readerFontSize,readerTone]);
  function resetReaderSettings() {
    setReaderBrightness(100); setReaderContrast(100); setReaderFontSize(16); setReaderTone("default");
  }
  const readerToneColors: Record<string,{background:string;color:string}> = {
    default:{background:"var(--paper)",color:"var(--ink)"},
    cream:{background:"#f4ecd9",color:"#382f24"},
    sepia:{background:"#e8d6b5",color:"#493723"},
    night:{background:"#171a20",color:"#e7e3da"}
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data, error: storyError } = await supabase.from("stories")
          .select("id,slug,title,synopsis,genre,language,author_id,published_at,cover_url,author_note,content_warnings,audience_rating")
          .or(`id.eq.${storyId},slug.eq.${storyId}`).eq("status", "published").eq("visibility", "public").single();
        if (storyError) throw storyError;
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          void supabase.from("story_reads").upsert(
            { story_id: data.id, user_id: authData.user.id },
            { onConflict: "story_id,user_id", ignoreDuplicates: true }
          );
        }
        const [authorResult, chapterResult, followerResult] = await Promise.all([
          supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", data.author_id).eq("is_public", true).maybeSingle(),
          supabase.from("chapters").select("id,title,chapter_number,content,author_note").eq("story_id", data.id).order("chapter_number"),
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
      <div className="story-detail-copy"><span className="catalogue-overline">{story.genre || (locale === "en" ? "LITERATURE" : "LITTÉRATURE")} · {story.language.toUpperCase()}</span><h2>{story.title}</h2><div className="story-detail-author-card"><span className="story-detail-author-label">{locale === "en" ? "PUBLISHED BY" : locale === "es" ? "PUBLICADO POR" : locale === "pt" ? "PUBLICADO POR" : "PUBLIÉ PAR"}</span>{author ? <Link href={`/u/${encodeURIComponent(author.username)}`} className="story-detail-author-profile-link">{author.avatar_url ? <img src={author.avatar_url} alt="" /> : <span className="story-detail-author-avatar"><UserRound size={19}/></span>}<span className="story-detail-author-info"><strong>{author.display_name || author.username}</strong><small>@{author.username}</small><small className="story-detail-author-followers"><Users size={12}/>{authorFollowerCount} {locale === "en" ? "followers" : locale === "es" ? "seguidores" : locale === "pt" ? "seguidores" : "abonnés"}</small></span><span className="story-detail-author-view">{locale === "en" ? "View profile" : locale === "es" ? "Ver perfil" : locale === "pt" ? "Ver perfil" : "Voir le profil"} →</span></Link> : <div className="story-detail-author-private"><UserRound size={19}/><strong>{locale === "en" ? "Book-A-Boo author" : locale === "es" ? "Autor de Book-A-Boo" : locale === "pt" ? "Autor Book-A-Boo" : "Auteur Book-A-Boo"}</strong></div>}</div><p>{story.synopsis || (locale === "en" ? "A story waiting to be discovered." : locale === "es" ? "Una historia esperando ser descubierta." : locale === "pt" ? "Uma história esperando para ser descoberta." : "Une histoire qui attend d'être découverte.")}</p>{story.audience_rating && <span className="story-audience-rating">{story.audience_rating}</span>}{story.content_warnings?.length > 0 && <div className="story-content-warnings"><strong>Avertissements au public</strong><ul>{story.content_warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}{story.author_note?.trim() && <aside className="story-author-note"><strong>Note de l’auteur</strong><p>{story.author_note}</p></aside>}<div className="story-detail-social-actions"><StorySaveButton storyId={story.id}/><AuthorFollowButton authorId={story.author_id}/><button type="button" className="auth-secondary" onClick={copyStoryLink}><>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? (locale === "en" ? "Link copied" : locale === "es" ? "Enlace copiado" : locale === "pt" ? "Link copiado" : "Lien copié") : (locale === "en" ? "Share story" : locale === "es" ? "Compartir historia" : locale === "pt" ? "Compartilhar história" : "Partager l’œuvre")}</></button><ContentReportButton targetType="story" targetId={story.id}/></div></div>
    </div>
    <section className="story-detail-reading"><div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> {locale === "en" ? "THE STORY" : locale === "es" ? "LA HISTORIA" : locale === "pt" ? "A HISTÓRIA" : "L'HISTOIRE"}</span><h2>{locale === "en" ? "Turn the page." : locale === "es" ? "Pasa la página." : locale === "pt" ? "Vire a página." : "Tournez la page."}</h2></div><div className="reader-heading-actions"><span className="shelf-index">{chapters.length} {locale === "en" ? "CHAPTERS" : locale === "es" ? "CAPÍTULOS" : locale === "pt" ? "CAPÍTULOS" : "CHAPITRES"}</span><button type="button" className="reader-settings-toggle" aria-expanded={readerSettingsOpen} onClick={() => setReaderSettingsOpen(value => !value)}><SlidersHorizontal size={16}/> Confort de lecture</button></div></div>
      {readerSettingsOpen && <div className="reader-settings-panel">
        <div className="reader-settings-title"><strong>Personnaliser ma lecture</strong><button type="button" onClick={resetReaderSettings}><RotateCcw size={13}/> Réinitialiser</button></div>
        <label>Luminosité <strong>{readerBrightness}%</strong><input type="range" min="70" max="130" value={readerBrightness} onChange={event => setReaderBrightness(Number(event.target.value))}/></label>
        <label>Contraste <strong>{readerContrast}%</strong><input type="range" min="70" max="130" value={readerContrast} onChange={event => setReaderContrast(Number(event.target.value))}/></label>
        <label>Taille du texte <strong>{readerFontSize}px</strong><input type="range" min="14" max="24" value={readerFontSize} onChange={event => setReaderFontSize(Number(event.target.value))}/></label>
        <div className="reader-tone-options"><span>Fond de lecture</span>{[["default","Normal"],["cream","Crème"],["sepia","Sépia"],["night","Nuit"]].map(([value,label])=><button key={value} type="button" className={readerTone===value?"active":""} onClick={()=>setReaderTone(value)}>{label}</button>)}</div>
        <small>Ces réglages sont personnels et enregistrés sur cet appareil.</small>
      </div>}
      {chapters.length ? <><div className="story-detail-chapter-list">{chapters.map(item => <button key={item.id} type="button" className={activeChapter?.id === item.id ? "active" : ""} onClick={() => setActiveChapter(item)}>{String(item.chapter_number).padStart(2,"0")} · {item.title}</button>)}</div><article className="story-detail-chapter" style={{backgroundColor:readerToneColors[readerTone].background,color:readerToneColors[readerTone].color,filter:`brightness(${readerBrightness}%)`}}><span className="catalogue-overline">{activeChapter?.title}</span><div style={{fontSize:`${readerFontSize}px`,filter:`contrast(${readerContrast}%)`,color:readerToneColors[readerTone].color}}>{activeChapter?.content?.trim() ? <RichChapterContent content={activeChapter.content}/> : <p>{locale === "en" ? "This chapter is being prepared by its author." : locale === "es" ? "El autor está preparando este capítulo." : locale === "pt" ? "O autor está preparando este capítulo." : "Ce chapitre est en cours de préparation par son auteur."}</p>}</div>{activeChapter?.author_note?.trim() && <aside className="story-chapter-author-note"><strong>Note de l’auteur</strong><p>{activeChapter.author_note}</p></aside>}</article></> : <p className="explore-live-empty">{locale === "en" ? "Chapters are not available yet." : locale === "es" ? "Los capítulos aún no están disponibles." : locale === "pt" ? "Os capítulos ainda não estão disponíveis." : "Les chapitres ne sont pas encore disponibles."}</p>}
    </section>
    <StoryInteractions storyId={story.id} />
  </div>;
}
