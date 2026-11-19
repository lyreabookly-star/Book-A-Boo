"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Check, Copy, LoaderCircle, Plus, Save } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";
import { RichTextEditor } from "./rich-text-editor";

type Story = { id: string; slug: string; title: string; synopsis: string; genre: string; author_note: string; content_warnings: string[]; audience_rating: string; status: "draft" | "published"; visibility: "private" | "public"; published_at: string | null; cover_url: string | null };
type Chapter = { id: string; title: string; content: string; author_note: string; chapter_number: number; updated_at: string };

export function WriterEditor({ storyId }: { storyId: string }) {
  const router = useRouter();
  const { locale } = useAppPreferences();
  const tx = (fr: string, en: string, es: string, pt: string) => locale === "en" ? en : locale === "es" ? es : locale === "pt" ? pt : fr;
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [chapterAuthorNote, setChapterAuthorNote] = useState("");
  const [warningsText, setWarningsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const latestSnapshot = useRef("");
  const saveInFlight = useRef(false);
  const snapshot = JSON.stringify({ chapterId: chapter?.id, title, content, chapterAuthorNote, story, warningsText });
  latestSnapshot.current = snapshot;
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [authorId, setAuthorId] = useState("");
  const [recoveryNotice, setRecoveryNotice] = useState(false);
  const draftKey = (chapterId: string) => `bab-local-draft:${authorId}:${storyId}:${chapterId}`;

  function restoreLocalDraft(target: Chapter, fallbackStory: Story | null, ownerId = authorId): boolean {
    if (!ownerId) return false;
    try {
      const rawDraft = window.localStorage.getItem(`bab-local-draft:${ownerId}:${storyId}:${target.id}`);
      if (!rawDraft) return false;
      const draft = JSON.parse(rawDraft) as {
        title?: string; content?: string; authorNote?: string; savedAt?: number;
        story?: Story; warningsText?: string;
      };
      const serverTime = Date.parse(target.updated_at || "") || 0;
      if (typeof draft.savedAt !== "number" || draft.savedAt <= serverTime ||
          typeof draft.title !== "string" || typeof draft.content !== "string" ||
          typeof draft.authorNote !== "string") return false;
      setTitle(draft.title);
      setContent(draft.content);
      setChapterAuthorNote(draft.authorNote);
      if (draft.story && fallbackStory && draft.story.id === fallbackStory.id) setStory(draft.story);
      if (typeof draft.warningsText === "string") setWarningsText(draft.warningsText);
      setRecoveryNotice(true);
      return true;
    } catch {
      return false;
    }
  }

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient() as any;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      router.replace(`/connexion?next=${encodeURIComponent(`/ecrire/${storyId}`)}`);
      return;
    }
    setAuthorId(user.id);
    const { data: storyData, error: storyError } = await supabase
      .from("stories").select("id,slug,title,synopsis,genre,author_note,content_warnings,audience_rating,status,visibility,published_at,cover_url").eq("id", storyId).eq("author_id", user.id).single();
    if (storyError) throw storyError;
    const { data: chapterData, error: chapterError } = await supabase
      .from("chapters").select("id,title,content,author_note,chapter_number,updated_at").eq("story_id", storyId).order("chapter_number");
    if (chapterError) throw chapterError;
    let list = chapterData ?? [];
    if (list.length === 0) {
      const { data: created, error: createError } = await supabase
        .from("chapters").insert({ story_id: storyId, author_id: user.id, title: "Chapitre 1", chapter_number: 1, content: "", author_note: "" })
        .select("id,title,content,author_note,chapter_number,updated_at").single();
      if (createError) throw createError;
      list = [created];
    }
    setStory(storyData);
    setChapters(list);
    setChapter(list[0]);
    setTitle(list[0].title);
    setContent(list[0].content);
    setChapterAuthorNote(list[0].author_note || "");
    setWarningsText((storyData.content_warnings || []).join(", "));
    setRecoveryNotice(false);
    setDirty(false);
    const recovered = restoreLocalDraft(list[0], storyData, user.id);
    setDirty(recovered);
  }, [router, storyId]);

  useEffect(() => {
    let alive = true;
    void load().catch(e => { if (alive) setError(e instanceof Error ? e.message : tx("Impossible d'ouvrir ce manuscrit.", "Could not open this manuscript.", "No se pudo abrir este manuscrito.", "Não foi possível abrir este manuscrito.")); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [load]);

  async function save(): Promise<boolean> {
    if (!chapter || !story || saveInFlight.current) return false;
    saveInFlight.current = true;
    const savedSnapshot = snapshot;
    setSaving(true); setSaved(false); setError("");
    try {
      const supabase = getSupabaseBrowserClient() as any;
      const { error: chapterError } = await supabase.from("chapters")
        .update({ title: title.trim() || "Chapitre", content, author_note: chapterAuthorNote, updated_at: new Date().toISOString() })
        .eq("id", chapter.id);
      if (chapterError) throw chapterError;
      const { error: storyError } = await supabase.from("stories")
        .update({ title: story.title.trim(), synopsis: story.synopsis, genre: story.genre, author_note: story.author_note, content_warnings: warningsText.split(",").map(value => value.trim()).filter(Boolean), audience_rating: story.audience_rating, updated_at: new Date().toISOString() }).eq("id", story.id);
      if (storyError) throw storyError;
      setSaved(true);
      if (latestSnapshot.current === savedSnapshot) {
        setDirty(false);
        try { window.localStorage.removeItem(draftKey(chapter.id)); } catch { /* Local storage may be unavailable. */ }
        setRecoveryNotice(false);
      }
      setChapters(items => items.map(item => item.id === chapter.id ? { ...item, title: title.trim() || "Chapitre", content, author_note: chapterAuthorNote } : item));
      // If the author kept typing while this request was in flight, keep the editor dirty.
      // The autosave effect will run again after saving becomes false.
      return latestSnapshot.current === savedSnapshot;
    } catch (e) {
      setError(e instanceof Error ? e.message : tx("La sauvegarde a échoué.", "Saving failed.", "Error al guardar.", "Falha ao salvar."));
      return false;
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!dirty || loading || !chapter || !authorId) return;
    try {
      window.localStorage.setItem(draftKey(chapter.id), JSON.stringify({
        title, content, authorNote: chapterAuthorNote, story, warningsText, savedAt: Date.now(),
      }));
    } catch {
      // Storage can be full or disabled; cloud autosave remains available.
    }
  }, [dirty, loading, chapter, authorId, title, content, chapterAuthorNote, story, warningsText]);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  useEffect(() => {
    if (!dirty || loading || saving || !chapter || !story) return;
    const timer = window.setTimeout(() => { void save(); }, 1800);
    return () => window.clearTimeout(timer);
  }, [dirty, loading, saving, chapter, story, title, content, chapterAuthorNote, warningsText]);

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !story) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(locale === "en" ? "Choose a JPG, PNG or WebP image." : locale === "es" ? "Elige una imagen JPG, PNG o WebP." : locale === "pt" ? "Escolha uma imagem JPG, PNG ou WebP." : "Choisissez une image JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(locale === "en" ? "The image must be 5 MB or smaller." : locale === "es" ? "La imagen debe pesar 5 MB o menos." : locale === "pt" ? "A imagem deve ter no máximo 5 MB." : "L'image doit peser 5 Mo maximum.");
      return;
    }
    setUploadingCover(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient() as any;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError || new Error(tx("Connexion requise.", "Sign-in required.", "Debes iniciar sesión.", "É necessário iniciar sessão."));
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/${story.id}/cover-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("book-covers").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("book-covers").getPublicUrl(path);
      const { error: updateError } = await supabase.from("stories").update({ cover_url: urlData.publicUrl, updated_at: new Date().toISOString() }).eq("id", story.id);
      if (updateError) {
        await supabase.storage.from("book-covers").remove([path]);
        throw updateError;
      }
      if (story.cover_url) {
        const marker = "/book-covers/";
        const previousPath = story.cover_url.includes(marker) ? story.cover_url.split(marker)[1]?.split("?")[0] : "";
        if (previousPath) {
          // Best-effort cleanup: a storage cleanup failure must not undo a successful cover update.
          try { await supabase.storage.from("book-covers").remove([decodeURIComponent(previousPath)]); } catch { /* Keep the newly saved cover active. */ }
        }
      }
      setStory(current => current ? { ...current, cover_url: urlData.publicUrl } : current);
    } catch (e) {
      setError(e instanceof Error ? e.message : (locale === "en" ? "Cover upload failed." : locale === "es" ? "No se pudo subir la portada." : locale === "pt" ? "Falha ao enviar a capa." : "L'envoi de la couverture a échoué."));
    } finally {
      setUploadingCover(false);
    }
  }

  async function removeCover() {
    if (!story) return;
    setUploadingCover(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient() as any;
      const { error: updateError } = await supabase.from("stories").update({ cover_url: null, updated_at: new Date().toISOString() }).eq("id", story.id);
      if (updateError) throw updateError;
      if (story.cover_url) {
        const marker = "/book-covers/";
        const path = story.cover_url.includes(marker) ? story.cover_url.split(marker)[1]?.split("?")[0] : "";
        if (path) await supabase.storage.from("book-covers").remove([decodeURIComponent(path)]);
      }
      setStory(current => current ? { ...current, cover_url: null } : current);
    } catch (e) {
      setError(e instanceof Error ? e.message : (locale === "en" ? "Could not remove the cover." : locale === "es" ? "No se pudo quitar la portada." : locale === "pt" ? "Não foi possível remover a capa." : "Impossible de retirer la couverture."));
    } finally {
      setUploadingCover(false);
    }
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
        .insert({ story_id: story.id, author_id: (await supabase.auth.getUser()).data.user?.id, title: `Chapitre ${nextNumber}`, chapter_number: nextNumber, content: "", author_note: "" })
        .select("id,title,content,author_note,chapter_number,updated_at").single();
      if (insertError) throw insertError;
      setChapters(items => [...items, data]);
      setChapter(data); setTitle(data.title); setContent(""); setChapterAuthorNote("");
      setSaved(false);
    } catch (e) { setError(e instanceof Error ? e.message : tx("Impossible d'ajouter ce chapitre.", "Could not add this chapter.", "No se pudo añadir este capítulo.", "Não foi possível adicionar este capítulo.")); }
  }

  async function selectChapter(item: Chapter) {
    if (chapter?.id !== item.id) {
      const savedCurrent = await save();
      if (!savedCurrent) return;
    }
    setChapter(item);
    setTitle(item.title); setContent(item.content); setChapterAuthorNote(item.author_note || "");
    setRecoveryNotice(false);
    setDirty(restoreLocalDraft(item, story));
    setSaved(false);
  }

  async function copyPublishedLink() {
    if (!story) return;
    await navigator.clipboard.writeText(`${window.location.origin}/histoire/${story.slug}`);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2200);
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

  if (loading) return <div className="writer-state"><LoaderCircle className="spin" size={22} /> {tx("Ouverture de votre manuscrit…", "Opening your manuscript…", "Abriendo tu manuscrito…", "Abrindo seu manuscrito…")}</div>;
  if (!story) return <div className="writer-empty"><strong>{tx("Ce manuscrit n'est pas accessible.", "This manuscript is unavailable.", "Este manuscrito no está disponible.", "Este manuscrito não está disponível.")}</strong><p>{tx("Il est peut-être privé ou n'existe plus.", "It may be private or no longer exist.", "Puede ser privado o ya no existir.", "Pode ser privado ou não existir mais.")}</p><Link href="/ecrire">{tx("Retour à mes manuscrits", "Back to my manuscripts", "Volver a mis manuscritos", "Voltar aos meus manuscritos")}</Link></div>;

  return (
    <div className="writer-editor">
      <div className="writer-editor-top"><Link href="/ecrire"><ArrowLeft size={15} /> {tx("Mes manuscrits", "My manuscripts", "Mis manuscritos", "Meus manuscritos")}</Link><span><BookOpen size={14} /> {story.status === "published" ? (locale === "en" ? "PUBLISHED" : locale === "es" ? "PUBLICADO" : locale === "pt" ? "PUBLICADO" : "PUBLIÉ") : (locale === "en" ? "PRIVATE DRAFT" : locale === "es" ? "BORRADOR PRIVADO" : locale === "pt" ? "RASCUNHO PRIVADO" : "BROUILLON PRIVÉ")}</span></div>
      {recoveryNotice && <p className="auth-feedback" role="status">{locale === "en" ? "A local backup newer than the online copy was recovered. Save it to keep it." : locale === "es" ? "Se recuperó una copia local más reciente que la versión en línea. Guárdala para conservarla." : locale === "pt" ? "Uma cópia local mais recente que a versão online foi recuperada. Salve-a para mantê-la." : "Une sauvegarde locale plus récente que la version en ligne a été récupérée. Enregistrez-la pour la conserver."}</p>}
      <section className="writer-work-metadata">
        <label className="writer-work-title">{tx("Titre de l'œuvre", "Work title", "Título de la obra", "Título da obra")}<input value={story.title} onChange={e => { setStory({ ...story, title: e.target.value }); setDirty(true); setSaved(false); }} maxLength={160} /></label>
        <div className="writer-metadata-grid">
          <label>{tx("Genre littéraire", "Genre", "Género literario", "Gênero literário")}<select value={story.genre || "Littérature générale"} onChange={e => { setStory({ ...story, genre: e.target.value }); setDirty(true); setSaved(false); }}><option value="Romance">{tx("Romance", "Romance", "Romance", "Romance")}</option><option value="Fantasy">{tx("Fantasy", "Fantasy", "Fantasía", "Fantasia")}</option><option value="Drame">{tx("Drame", "Drama", "Drama", "Drama")}</option><option value="Thriller">Thriller</option><option value="Psychologie">{tx("Psychologie", "Psychology", "Psicología", "Psicologia")}</option><option value="Fanfiction">Fanfiction</option><option value="Poésie">{tx("Poésie", "Poetry", "Poesía", "Poesia")}</option><option value="Science-fiction">{tx("Science-fiction", "Science fiction", "Ciencia ficción", "Ficção científica")}</option><option value="Horreur">{tx("Horreur", "Horror", "Terror", "Terror")}</option><option value="Historique">{tx("Historique", "Historical", "Histórico", "Histórico")}</option><option value="Littérature générale">{tx("Littérature générale", "General literature", "Literatura general", "Literatura geral")}</option></select></label>
          <label>{tx("Public conseillé", "Recommended audience", "Público recomendado", "Público recomendado")}<select value={story.audience_rating || "Tout public"} onChange={e => { setStory({ ...story, audience_rating: e.target.value }); setDirty(true); setSaved(false); }}><option value="Tout public">{tx("Tout public", "All audiences", "Todos los públicos", "Todos os públicos")}</option><option value="13 ans et +">13 {tx("ans et +", "and up", "años o más", "anos ou mais")}</option><option value="16 ans et +">16 {tx("ans et +", "and up", "años o más", "anos ou mais")}</option><option value="18 ans et +">18 {tx("ans et +", "and up", "años o más", "anos ou mais")}</option></select></label>
          <label className="writer-metadata-wide">{tx("Résumé de l'œuvre", "Work summary", "Resumen de la obra", "Resumo da obra")} <span>{tx("Jusqu'à 5 000 caractères", "Up to 5,000 characters", "Hasta 5.000 caracteres", "Até 5.000 caracteres")}</span><textarea value={story.synopsis || ""} onChange={e => { setStory({ ...story, synopsis: e.target.value }); setDirty(true); setSaved(false); }} maxLength={5000} rows={5} placeholder={tx("Présentez votre histoire sans tout dévoiler…", "Introduce your story without giving everything away…", "Presenta tu historia sin revelarlo todo…", "Apresente sua história sem revelar tudo…")} /></label>
          <label className="writer-metadata-wide">{tx("Avertissements au public", "Content warnings", "Advertencias de contenido", "Avisos de conteúdo")} <span>{tx("Séparez les avertissements par des virgules", "Separate warnings with commas", "Separa las advertencias con comas", "Separe os avisos com vírgulas")}</span><input value={warningsText} onChange={e => { setWarningsText(e.target.value); setDirty(true); setSaved(false); }} placeholder={tx("Violence, langage explicite, thèmes sensibles…", "Violence, explicit language, sensitive themes…", "Violencia, lenguaje explícito, temas sensibles…", "Violência, linguagem explícita, temas sensíveis…")} /></label>
          <label className="writer-metadata-wide">{tx("Note de l'auteur sur l'œuvre", "Author's note about the work", "Nota del autor sobre la obra", "Nota do autor sobre a obra")} <span>{tx("Facultatif", "Optional", "Opcional", "Opcional")}</span><textarea value={story.author_note || ""} onChange={e => { setStory({ ...story, author_note: e.target.value }); setDirty(true); setSaved(false); }} maxLength={3000} rows={3} placeholder={tx("Un mot pour accompagner votre histoire…", "A few words to accompany your story…", "Unas palabras para acompañar tu historia…", "Algumas palavras para acompanhar sua história…")} /></label>
        </div>
        <p className="writer-metadata-hint">{tx("Les informations publiques seront visibles sur la fiche de votre œuvre après publication.", "Public information will appear on your work page after publication.", "La información pública aparecerá en la página de tu obra después de publicarla.", "As informações públicas aparecerão na página da sua obra após a publicação.")}</p>
      </section>
      <section className="writer-cover-settings">
        <div className="writer-cover-preview">
          {story.cover_url ? <img src={story.cover_url} alt={locale === "en" ? "Book cover preview" : locale === "es" ? "Vista previa de la portada" : locale === "pt" ? "Pré-visualização da capa" : "Aperçu de la couverture"} /> : <div className="writer-cover-placeholder"><BookOpen size={28}/><span>{locale === "en" ? "Automatic cover" : locale === "es" ? "Portada automática" : locale === "pt" ? "Capa automática" : "Couverture automatique"}</span></div>}
        </div>
        <div className="writer-cover-copy">
          <strong>{locale === "en" ? "Your book cover" : locale === "es" ? "La portada de tu obra" : locale === "pt" ? "A capa da sua obra" : "La couverture de votre œuvre"}</strong>
          <p>{locale === "en" ? "Optional · JPG, PNG or WebP · 5 MB maximum. Without an image, Book-A-Boo creates a typographic cover." : locale === "es" ? "Opcional · JPG, PNG o WebP · máximo 5 MB. Sin imagen, Book-A-Boo crea una portada tipográfica." : locale === "pt" ? "Opcional · JPG, PNG ou WebP · máximo 5 MB. Sem imagem, Book-A-Boo cria uma capa tipográfica." : "Facultative · JPG, PNG ou WebP · 5 Mo maximum. Sans image, Book-A-Boo crée une couverture typographique."}</p>
          <label className="writer-cover-upload">{uploadingCover ? (locale === "en" ? "Uploading…" : locale === "es" ? "Subiendo…" : locale === "pt" ? "Enviando…" : "Envoi…") : story.cover_url ? (locale === "en" ? "Replace image" : locale === "es" ? "Cambiar imagen" : locale === "pt" ? "Trocar imagem" : "Remplacer l'image") : (locale === "en" ? "Choose a cover" : locale === "es" ? "Elegir portada" : locale === "pt" ? "Escolher capa" : "Choisir une couverture")}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadCover} disabled={uploadingCover} />
          </label>
          {story.cover_url && <button type="button" className="writer-cover-remove" onClick={removeCover} disabled={uploadingCover}>{locale === "en" ? "Remove cover" : locale === "es" ? "Quitar portada" : locale === "pt" ? "Remover capa" : "Retirer la couverture"}</button>}
        </div>
      </section>
      {story.status === "published" && <div className="writer-publication-row"><div><strong>{locale === "en" ? "Your public link" : locale === "es" ? "Tu enlace público" : locale === "pt" ? "Seu link público" : "Le lien de votre œuvre"}</strong><small>/histoire/{story.slug}</small></div><button type="button" className="auth-secondary" onClick={copyPublishedLink}>{shareCopied ? <Check size={15}/> : <Copy size={15}/>} {shareCopied ? (locale === "en" ? "Copied" : locale === "es" ? "Copiado" : locale === "pt" ? "Copiado" : "Copié") : (locale === "en" ? "Copy link" : locale === "es" ? "Copiar enlace" : locale === "pt" ? "Copiar link" : "Copier le lien")}</button></div>}
      <div className="writer-publication-row">
        <div><strong>{story.status === "published" ? (locale === "en" ? "Your story is public." : locale === "es" ? "Tu historia es pública." : locale === "pt" ? "Sua história está pública." : "Votre histoire est publique.") : (locale === "en" ? "Ready to share your story?" : locale === "es" ? "¿Lista para compartir tu historia?" : locale === "pt" ? "Pronto para compartilhar sua história?" : "Prêt à partager votre histoire ?")}</strong><small>{story.status === "published" ? (locale === "en" ? "It appears in Explorer and can be saved by readers." : locale === "es" ? "Aparece en Explorar y los lectores pueden guardarla." : locale === "pt" ? "Aparece em Explorar e os leitores podem salvá-la." : "Elle apparaît dans Explorer et les lecteurs peuvent l'enregistrer.") : (locale === "en" ? "Publishing makes it visible to everyone." : locale === "es" ? "Al publicar, será visible para todos." : locale === "pt" ? "Ao publicar, ela ficará visível para todos." : "La publication la rend visible par tout le monde.")}</small></div>
        <button type="button" className="writer-publish-button" onClick={togglePublication} disabled={publishing || saving}>{publishing ? (locale === "en" ? "Please wait…" : locale === "es" ? "Un momento…" : locale === "pt" ? "Aguarde…" : "Patientez…") : story.status === "published" ? (locale === "en" ? "Unpublish" : locale === "es" ? "Retirar" : locale === "pt" ? "Retirar" : "Dépublier") : (locale === "en" ? "Publish my story" : locale === "es" ? "Publicar mi historia" : locale === "pt" ? "Publicar minha história" : "Publier mon histoire")}</button>
      </div>
      <div className="writer-editor-grid">
        <aside className="writer-chapter-list"><div className="writer-chapter-heading"><span className="catalogue-overline">{tx("SOMMAIRE", "CONTENTS", "ÍNDICE", "SUMÁRIO")}</span><button onClick={addChapter} aria-label={tx("Ajouter un chapitre", "Add a chapter", "Añadir un capítulo", "Adicionar capítulo")}><Plus size={16} /></button></div>
          {chapters.map(item => <button key={item.id} className={chapter?.id === item.id ? "writer-chapter active" : "writer-chapter"} onClick={() => selectChapter(item)}> <span>{String(item.chapter_number).padStart(2,"0")}</span>{/^Chapitre \d+$/.test(item.title) ? `${locale === "en" ? "Chapter" : locale === "es" ? "Capítulo" : locale === "pt" ? "Capítulo" : "Chapitre"} ${item.chapter_number}` : item.title}</button>)}
        </aside>
        <section className="writer-writing-area">
          <input className="writer-chapter-title" value={/^Chapitre \d+$/.test(title) ? `${locale === "en" ? "Chapter" : locale === "es" ? "Capítulo" : locale === "pt" ? "Capítulo" : "Chapitre"} ${chapter?.chapter_number ?? 1}` : title} onChange={e => { setTitle(e.target.value); setDirty(true); setSaved(false); }} placeholder={locale === "en" ? "Chapter title" : locale === "es" ? "Título del capítulo" : locale === "pt" ? "Título do capítulo" : "Titre du chapitre"} maxLength={160} />
          <RichTextEditor key={chapter?.id || "new"} chapterId={chapter?.id || "new"} locale={locale} content={content} onChange={value=>{setContent(value);setDirty(true);setSaved(false);}} />
          <label className="writer-chapter-note">{tx("Note de l’auteur pour ce chapitre", "Author’s note for this chapter", "Nota del autor para este capítulo", "Nota do autor para este capítulo")} <span>({tx("facultatif", "optional", "opcional", "opcional")})</span><textarea value={chapterAuthorNote} onChange={e => { setChapterAuthorNote(e.target.value); setDirty(true); setSaved(false); }} maxLength={2000} rows={3} placeholder={tx("Un mot avant ou après la lecture de ce chapitre…", "A note before or after reading this chapter…", "Unas palabras antes o después de leer este capítulo…", "Uma mensagem antes ou depois da leitura deste capítulo…")} /></label>
          <div className="writer-save-row"><span>{saving ? (locale === "en" ? "Saving automatically…" : locale === "es" ? "Guardando automáticamente…" : locale === "pt" ? "Salvando automaticamente…" : "Sauvegarde automatique…") : saved ? <><Check size={14} /> {locale === "en" ? "Saved" : locale === "es" ? "Guardado" : locale === "pt" ? "Salvo" : "Enregistré"}</> : dirty ? (locale === "en" ? "Unsaved changes" : locale === "es" ? "Cambios sin guardar" : locale === "pt" ? "Alterações não salvas" : "Modifications en attente") : (locale === "en" ? "Your text is saved" : locale === "es" ? "Tu texto está guardado" : locale === "pt" ? "Seu texto está salvo" : "Votre texte est enregistré")}</span><button className="auth-submit" onClick={save} disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}{saving ? (locale === "en" ? "Saving…" : locale === "es" ? "Guardando…" : locale === "pt" ? "Salvando…" : "Sauvegarde…") : (locale === "en" ? "Save" : locale === "es" ? "Guardar" : locale === "pt" ? "Salvar" : "Enregistrer")}</button></div>
          {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        </section>
      </div>
    </div>
  );
}
