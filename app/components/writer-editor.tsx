"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Check, LoaderCircle, Plus, Save } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type Story = { id: string; title: string; synopsis: string; status: "draft" | "published"; visibility: "private" | "public"; published_at: string | null };
type Chapter = { id: string; title: string; content: string; chapter_number: number; updated_at: string };

export function WriterEditor({ storyId }: { storyId: string }) {
  const router = useRouter();
  const { locale } = useAppPreferences();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient() as any;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      router.replace(`/connexion?next=${encodeURIComponent(`/ecrire/${storyId}`)}`);
      return;
    }
    const { data: storyData, error: storyError } = await supabase
      .from("stories").select("id,title,synopsis,status,visibility,published_at").eq("id", storyId).eq("author_id", user.id).single();
    if (storyError) throw storyError;
    const { data: chapterData, error: chapterError } = await supabase
      .from("chapters").select("id,title,content,chapter_number,updated_at").eq("story_id", storyId).order("chapter_number");
    if (chapterError) throw chapterError;
    let list = chapterData ?? [];
    if (list.length === 0) {
      const { data: created, error: createError } = await supabase
        .from("chapters").insert({ story_id: storyId, author_id: user.id, title: "Chapitre 1", chapter_number: 1, content: "" })
        .select("id,title,content,chapter_number,updated_at").single();
      if (createError) throw createError;
      list = [created];
    }
    setStory(storyData);
    setChapters(list);
    setChapter(list[0]);
    setTitle(list[0].title);
    setContent(list[0].content);
  }, [router, storyId]);

  useEffect(() => {
    let alive = true;
    void load().catch(e => { if (alive) setError(e instanceof Error ? e.message : "Impossible d'ouvrir ce manuscrit."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [load]);

  async function save(): Promise<boolean> {
    if (!chapter || !story) return false;
    setSaving(true); setSaved(false); setError("");
    try {
      const supabase = getSupabaseBrowserClient() as any;
      const { error: chapterError } = await supabase.from("chapters")
        .update({ title: title.trim() || "Chapitre", content, updated_at: new Date().toISOString() })
        .eq("id", chapter.id);
      if (chapterError) throw chapterError;
      const { error: storyError } = await supabase.from("stories")
        .update({ updated_at: new Date().toISOString() }).eq("id", story.id);
      if (storyError) throw storyError;
      setSaved(true);
      setChapters(items => items.map(item => item.id === chapter.id ? { ...item, title: title.trim() || "Chapitre", content } : item));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "La sauvegarde a échoué.");
      return false;
    } finally { setSaving(false); }
  }

  async function addChapter() {
    if (!story) return;
    setError("");
    try {
      const savedCurrent = await save();
      if (!savedCurrent) return;
      const supabase = getSupabaseBrowserClient() as any;
      const nextNumber = Math.max(0, ...chapters.map(c => c.chapter_number)) + 1;
      const { data, error: insertError } = await supabase.from("chapters")
        .insert({ story_id: story.id, author_id: (await supabase.auth.getUser()).data.user?.id, title: `Chapitre ${nextNumber}`, chapter_number: nextNumber, content: "" })
        .select("id,title,content,chapter_number,updated_at").single();
      if (insertError) throw insertError;
      setChapters(items => [...items, data]);
      setChapter(data); setTitle(data.title); setContent("");
      setSaved(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Impossible d'ajouter ce chapitre."); }
  }

  async function selectChapter(item: Chapter) {
    if (chapter?.id !== item.id) {
      const savedCurrent = await save();
      if (!savedCurrent) return;
    }
    setChapter(item); setTitle(item.title); setContent(item.content); setSaved(false);
  }

  async function togglePublication() {
    if (!story) return;
    setPublishing(true); setError("");
    try {
      if (story.status !== "published") {
        if (!content.trim() && !chapters.some(item => item.content.trim())) {
          throw new Error(locale === "en" ? "Add some text to at least one chapter before publishing." : locale === "es" ? "Añade texto a un capítulo antes de publicar." : locale === "pt" ? "Adicione texto a pelo menos um capítulo antes de publicar." : "Ajoutez du texte dans au moins un chapitre avant de publier.");
        }
        const currentSaved = await save();
        if (!currentSaved) return;
        const publishedAt = new Date().toISOString();
        const supabase = getSupabaseBrowserClient() as any;
        const { error: updateError } = await supabase.from("stories").update({ status: "published", visibility: "public", published_at: publishedAt, updated_at: publishedAt }).eq("id", story.id);
        if (updateError) throw updateError;
        setStory(current => current ? { ...current, status: "published", visibility: "public", published_at: publishedAt } : current);
      } else {
        const supabase = getSupabaseBrowserClient() as any;
        const { error: updateError } = await supabase.from("stories").update({ status: "draft", visibility: "private", published_at: null, updated_at: new Date().toISOString() }).eq("id", story.id);
        if (updateError) throw updateError;
        setStory(current => current ? { ...current, status: "draft", visibility: "private", published_at: null } : current);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : (locale === "en" ? "Publication failed." : locale === "es" ? "No se pudo publicar." : locale === "pt" ? "A publicação falhou." : "La publication a échoué."));
    } finally { setPublishing(false); }
  }

  if (loading) return <div className="writer-state"><LoaderCircle className="spin" size={22} /> Ouverture de votre manuscrit…</div>;
  if (!story) return <div className="writer-empty"><strong>Ce manuscrit n'est pas accessible.</strong><p>Il est peut-être privé ou n'existe plus.</p><Link href="/ecrire">Retour à mes manuscrits</Link></div>;

  return (
    <div className="writer-editor">
      <div className="writer-editor-top"><Link href="/ecrire"><ArrowLeft size={15} /> Mes manuscrits</Link><span><BookOpen size={14} /> {story.status === "published" ? (locale === "en" ? "PUBLISHED" : locale === "es" ? "PUBLICADO" : locale === "pt" ? "PUBLICADO" : "PUBLIÉ") : (locale === "en" ? "PRIVATE DRAFT" : locale === "es" ? "BORRADOR PRIVADO" : locale === "pt" ? "RASCUNHO PRIVADO" : "BROUILLON PRIVÉ")}</span></div>
      <label className="writer-work-title">Titre de l'œuvre<input value={story.title} onChange={e => setStory({ ...story, title: e.target.value })} onBlur={async () => { const s = getSupabaseBrowserClient() as any; const { error: e } = await s.from("stories").update({ title: story.title.trim() }).eq("id", story.id); if (e) setError(e.message); }} maxLength={160} /></label>
      <div className="writer-publication-row">
        <div><strong>{story.status === "published" ? (locale === "en" ? "Your story is public." : locale === "es" ? "Tu historia es pública." : locale === "pt" ? "Sua história está pública." : "Votre histoire est publique.") : (locale === "en" ? "Ready to share your story?" : locale === "es" ? "¿Lista para compartir tu historia?" : locale === "pt" ? "Pronto para compartilhar sua história?" : "Prêt à partager votre histoire ?")}</strong><small>{story.status === "published" ? (locale === "en" ? "It appears in Explorer and can be saved by readers." : locale === "es" ? "Aparece en Explorar y los lectores pueden guardarla." : locale === "pt" ? "Aparece em Explorar e os leitores podem salvá-la." : "Elle apparaît dans Explorer et les lecteurs peuvent l'enregistrer.") : (locale === "en" ? "Publishing makes it visible to everyone." : locale === "es" ? "Al publicar, será visible para todos." : locale === "pt" ? "Ao publicar, ela ficará visível para todos." : "La publication la rend visible par tout le monde.")}</small></div>
        <button type="button" className="writer-publish-button" onClick={togglePublication} disabled={publishing || saving}>{publishing ? (locale === "en" ? "Please wait…" : locale === "es" ? "Un momento…" : locale === "pt" ? "Aguarde…" : "Patientez…") : story.status === "published" ? (locale === "en" ? "Unpublish" : locale === "es" ? "Retirar" : locale === "pt" ? "Retirar" : "Dépublier") : (locale === "en" ? "Publish my story" : locale === "es" ? "Publicar mi historia" : locale === "pt" ? "Publicar minha história" : "Publier mon histoire")}</button>
      </div>
      <div className="writer-editor-grid">
        <aside className="writer-chapter-list"><div className="writer-chapter-heading"><span className="catalogue-overline">SOMMAIRE</span><button onClick={addChapter} aria-label="Ajouter un chapitre"><Plus size={16} /></button></div>
          {chapters.map(item => <button key={item.id} className={chapter?.id === item.id ? "writer-chapter active" : "writer-chapter"} onClick={() => selectChapter(item)}> <span>{String(item.chapter_number).padStart(2,"0")}</span>{/^Chapitre \d+$/.test(item.title) ? `${locale === "en" ? "Chapter" : locale === "es" ? "Capítulo" : locale === "pt" ? "Capítulo" : "Chapitre"} ${item.chapter_number}` : item.title}</button>)}
        </aside>
        <section className="writer-writing-area">
          <input className="writer-chapter-title" value={/^Chapitre \d+$/.test(title) ? `${locale === "en" ? "Chapter" : locale === "es" ? "Capítulo" : locale === "pt" ? "Capítulo" : "Chapitre"} ${chapter?.chapter_number ?? 1}` : title} onChange={e => { setTitle(e.target.value); setSaved(false); }} placeholder={locale === "en" ? "Chapter title" : locale === "es" ? "Título del capítulo" : locale === "pt" ? "Título do capítulo" : "Titre du chapitre"} maxLength={160} />
          <textarea className="writer-manuscript" value={content} onChange={e => { setContent(e.target.value); setSaved(false); }} placeholder={locale === "en" ? "Your story begins here…\n\nWrite freely. Remember to save your work." : locale === "es" ? "Tu historia comienza aquí…\n\nEscribe libremente. Recuerda guardar tu trabajo." : locale === "pt" ? "Sua história começa aqui…\n\nEscreva livremente. Lembre-se de salvar seu trabalho." : "Votre histoire commence ici…\n\nÉcrivez librement. Pensez à sauvegarder votre travail."} />
          <div className="writer-save-row"><span>{saved ? <><Check size={14} /> {locale === "en" ? "Saved" : locale === "es" ? "Guardado" : locale === "pt" ? "Salvo" : "Enregistré"}</> : (locale === "en" ? "Remember to save your text" : locale === "es" ? "Recuerda guardar tu texto" : locale === "pt" ? "Lembre-se de salvar seu texto" : "Pensez à sauvegarder votre texte")}</span><button className="auth-submit" onClick={save} disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}{saving ? (locale === "en" ? "Saving…" : locale === "es" ? "Guardando…" : locale === "pt" ? "Salvando…" : "Sauvegarde…") : (locale === "en" ? "Save" : locale === "es" ? "Guardar" : locale === "pt" ? "Salvar" : "Enregistrer")}</button></div>
          {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        </section>
      </div>
    </div>
  );
}
