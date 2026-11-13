"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, Plus, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type Story = { id: string; title: string; synopsis: string | null; genre: string | null; cover_url: string | null };
type Pick = { id: string; story_id: string; position: number; eyebrow: string; editorial_note: string | null; story?: Story };

export function EditorialManager() {
  const { locale } = useAppPreferences();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [storyId, setStoryId] = useState("");
  const [note, setNote] = useState("");
  const [position, setPosition] = useState("1");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const supabase = getSupabaseBrowserClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Connectez-vous avec votre compte de rédaction pour continuer."); setLoading(false); return; }
    const { data: membership, error: memberError } = await supabase.from("editorial_members").select("can_manage").eq("user_id", user.id).maybeSingle();
    if (memberError || !membership?.can_manage) { setAllowed(false); setLoading(false); return; }
    setAllowed(true);
    const [storyResult, pickResult] = await Promise.all([
      supabase.from("stories").select("id,title,synopsis,genre,cover_url").eq("status", "published").eq("visibility", "public").order("published_at", { ascending: false }),
      supabase.from("editorial_selections").select("id,story_id,position,eyebrow,editorial_note").order("position", { ascending: true })
    ]);
    if (storyResult.error) setError("Impossible de charger les histoires publiées.");
    if (pickResult.error) setError("Impossible de charger la sélection éditoriale.");
    const available = (storyResult.data ?? []) as Story[];
    const current = (pickResult.data ?? []) as Pick[];
    const byId = new Map(available.map(story => [story.id, story]));
    setStories(available);
    setPicks(current.map(pick => ({ ...pick, story: byId.get(pick.story_id) })));
    setStoryId(current.length < 12 ? (available.find(story => !current.some(pick => pick.story_id === story.id))?.id ?? "") : "");
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function addPick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storyId) return;
    setSaving(true); setError(""); setMessage("");
    const supabase = getSupabaseBrowserClient() as any;
    const { error: saveError } = await supabase.from("editorial_selections").insert({
      story_id: storyId, position: Number(position), eyebrow: "Sélection de la rédaction",
      editorial_note: note.trim() || null, is_active: true
    });
    if (saveError) setError(saveError.code === "23505" ? "Cette histoire figure déjà dans la sélection." : saveError.message);
    else { setMessage("L’histoire a rejoint la sélection de la rédaction."); setNote(""); await load(); }
    setSaving(false);
  }

  async function removePick(id: string) {
    setError(""); setMessage("");
    const supabase = getSupabaseBrowserClient() as any;
    const { error: deleteError } = await supabase.from("editorial_selections").delete().eq("id", id);
    if (deleteError) setError("Impossible de retirer cette histoire.");
    else { setMessage("Histoire retirée de la sélection."); await load(); }
  }

  if (loading) return <div className="editorial-manager"><p>Chargement de l’espace rédaction…</p></div>;
  if (!allowed) return <div className="editorial-manager editorial-manager-denied"><BookOpen size={28}/><h2>Accès réservé à la rédaction</h2><p>Connectez-vous avec le compte autorisé à gérer la sélection éditoriale.</p><Link href="/connexion">Aller à la connexion</Link></div>;

  return <div className="editorial-manager">
    <Link href="/" className="editorial-manager-back"><ArrowLeft size={15}/> Retour à l’accueil</Link>
    <div className="editorial-manager-heading"><span>BOOK-A-BOO · ESPACE ÉDITORIAL</span><h2>Composer la sélection.</h2><p>Choisissez les histoires publiques à mettre en lumière sur la page d’accueil. Jusqu’à 12 œuvres peuvent être présentées.</p></div>
    {error && <p className="editorial-manager-alert">{error}</p>}
    {message && <p className="editorial-manager-success"><Check size={15}/>{message}</p>}
    <form className="editorial-manager-form" onSubmit={addPick}>
      <label>Histoire publiée
        <select value={storyId} onChange={event => setStoryId(event.target.value)} required>
          <option value="">{locale === "en" ? "Choose a story…" : locale === "es" ? "Elegir una historia…" : locale === "pt" ? "Escolher uma história…" : "Choisir une histoire…"}</option>
          {stories.filter(story => !picks.some(pick => pick.story_id === story.id)).map(story => <option key={story.id} value={story.id}>{story.title}</option>)}
        </select>
      </label>
      <label>Position
        <select value={position} onChange={event => setPosition(event.target.value)}>
          {Array.from({length:12},(_,i)=><option key={i+1} value={String(i+1)}>{i+1}</option>)}
        </select>
      </label>
      <label className="editorial-manager-note">Mot de la rédaction (facultatif)
        <textarea value={note} onChange={event => setNote(event.target.value)} rows={3} maxLength={320} placeholder={locale === "en" ? "Why does this story deserve to be discovered?" : locale === "es" ? "¿Por qué merece la pena descubrir esta historia?" : locale === "pt" ? "Por que esta história merece ser descoberta?" : "Pourquoi cette histoire mérite-t-elle d’être découverte ?"}/>
      </label>
      <button type="submit" disabled={saving || !storyId || picks.length >= 12}><Plus size={16}/>{saving ? "Ajout…" : "Ajouter à la sélection"}</button>
    </form>
    <div className="editorial-manager-list-heading"><h3>La sélection actuelle</h3><span>{picks.length} / 12</span></div>
    {!picks.length ? <div className="editorial-manager-empty"><BookOpen size={23}/><p>Aucune histoire sélectionnée pour le moment.</p><small>Les œuvres ajoutées ici apparaîtront automatiquement sur l’accueil.</small></div> : <div className="editorial-manager-list">
      {picks.map(pick => <article key={pick.id} className="editorial-manager-item">
        {pick.story?.cover_url ? <img src={pick.story.cover_url} alt=""/> : <div className="editorial-manager-cover"><BookOpen size={20}/></div>}
        <div><span>POSITION {pick.position}</span><strong>{pick.story?.title ?? "Histoire indisponible"}</strong>{pick.editorial_note && <p>{pick.editorial_note}</p>}</div>
        <button type="button" className="editorial-manager-remove" onClick={() => void removePick(pick.id)} aria-label={locale === "en" ? "Remove from selection" : locale === "es" ? "Quitar de la selección" : locale === "pt" ? "Remover da seleção" : "Retirer de la sélection"}><Trash2 size={17}/></button>
      </article>)}
    </div>}
    {!stories.length && <p className="editorial-manager-hint">Aucune histoire publique publiée n’est disponible pour le moment. Les brouillons et histoires privées ne sont pas proposés.</p>}
  </div>;
}
