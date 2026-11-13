"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Check, LoaderCircle, Plus, Save } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Story = { id: string; title: string; synopsis: string };
type Chapter = { id: string; title: string; content: string; chapter_number: number; updated_at: string };

export function WriterEditor({ storyId }: { storyId: string }) {
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      router.replace(`/connexion?next=${encodeURIComponent(`/ecrire/${storyId}`)}`);
      return;
    }
    const { data: storyData, error: storyError } = await supabase
      .from("stories").select("id,title,synopsis").eq("id", storyId).eq("author_id", user.id).single();
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
      const supabase = getSupabaseBrowserClient();
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
      const supabase = getSupabaseBrowserClient();
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

  if (loading) return <div className="writer-state"><LoaderCircle className="spin" size={22} /> Ouverture de votre manuscrit…</div>;
  if (!story) return <div className="writer-empty"><strong>Ce manuscrit n'est pas accessible.</strong><p>Il est peut-être privé ou n'existe plus.</p><Link href="/ecrire">Retour à mes manuscrits</Link></div>;

  return (
    <div className="writer-editor">
      <div className="writer-editor-top"><Link href="/ecrire"><ArrowLeft size={15} /> Mes manuscrits</Link><span><BookOpen size={14} /> BROUILLON PRIVÉ</span></div>
      <label className="writer-work-title">Titre de l'œuvre<input value={story.title} onChange={e => setStory({ ...story, title: e.target.value })} onBlur={async () => { const s = getSupabaseBrowserClient(); const { error: e } = await s.from("stories").update({ title: story.title.trim() }).eq("id", story.id); if (e) setError(e.message); }} maxLength={160} /></label>
      <div className="writer-editor-grid">
        <aside className="writer-chapter-list"><div className="writer-chapter-heading"><span className="catalogue-overline">SOMMAIRE</span><button onClick={addChapter} aria-label="Ajouter un chapitre"><Plus size={16} /></button></div>
          {chapters.map(item => <button key={item.id} className={chapter?.id === item.id ? "writer-chapter active" : "writer-chapter"} onClick={() => selectChapter(item)}> <span>{String(item.chapter_number).padStart(2,"0")}</span>{item.title}</button>)}
        </aside>
        <section className="writer-writing-area">
          <input className="writer-chapter-title" value={title} onChange={e => { setTitle(e.target.value); setSaved(false); }} placeholder="Titre du chapitre" maxLength={160} />
          <textarea className="writer-manuscript" value={content} onChange={e => { setContent(e.target.value); setSaved(false); }} placeholder="Votre histoire commence ici…&#10;&#10;Écrivez librement. Pensez à sauvegarder votre travail." />
          <div className="writer-save-row"><span>{saved ? <><Check size={14} /> Enregistré</> : "Pensez à sauvegarder votre texte"}</span><button className="auth-submit" onClick={save} disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}{saving ? "Sauvegarde…" : "Enregistrer"}</button></div>
          {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        </section>
      </div>
    </div>
  );
}
