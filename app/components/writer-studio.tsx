"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, FilePlus2, Feather, LoaderCircle, LockKeyhole } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Story = {
  id: string;
  title: string;
  synopsis: string;
  status: "draft" | "published";
  updated_at: string;
};

export function WriterStudio() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [stories, setStories] = useState<Story[]>([]);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) {
          if (alive) setLoading(false);
          return;
        }
        const { data, error: queryError } = await supabase
          .from("stories")
          .select("id,title,synopsis,status,updated_at")
          .eq("author_id", user.id)
          .order("updated_at", { ascending: false });
        if (queryError) throw queryError;
        if (alive) {
          setUserId(user.id);
          setStories(data ?? []);
        }
      } catch (caught) {
        if (alive) setError(caught instanceof Error ? caught.message : "Impossible de charger vos projets.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, []);

  async function createStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient() as any;
      const { data, error: insertError } = await supabase
        .from("stories")
        .insert({ author_id: userId, title: title.trim(), synopsis: synopsis.trim(), status: "draft", visibility: "private" })
        .select("id")
        .single();
      if (insertError) throw insertError;
      router.push(`/ecrire/${data.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La création de votre œuvre a échoué.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="writer-state"><LoaderCircle className="spin" size={22} /> Chargement de votre atelier…</div>;
  if (!userId) return (
    <section className="writer-login-panel">
      <span className="writer-side-icon"><LockKeyhole size={20} /></span>
      <span className="catalogue-overline">VOTRE ESPACE PERSONNEL</span>
      <h2>Connectez-vous pour écrire.</h2>
      <p>Vos histoires et vos brouillons seront enregistrés dans votre compte et resteront privés tant que vous ne choisissez pas de les publier.</p>
      <div className="profile-account-actions">
        <Link className="primary-button" href="/connexion?next=%2Fecrire">Me connecter</Link>
        <Link className="auth-secondary" href="/inscription">Créer un compte</Link>
      </div>
    </section>
  );

  return (
    <>
      <div className="writer-dashboard-head">
        <div>
          <span className="writer-welcome">VOTRE ESPACE PERSONNEL</span>
          <h2>Votre bureau <em>d'auteur.</em></h2>
          <p>Vos textes sont sauvegardés dans votre compte. Les brouillons restent privés.</p>
        </div>
        <div className="writer-avatar"><Feather size={25} /></div>
      </div>

      <div className="writer-toolbar">
        <div><span className="catalogue-overline">MES MANUSCRITS</span><h2>{stories.length} {stories.length > 1 ? "projets" : "projet"}</h2></div>
        <button className="primary-button" onClick={() => setShowForm(v => !v)}><FilePlus2 size={16} /> Nouvelle œuvre</button>
      </div>

      {showForm && (
        <form className="writer-create-form" onSubmit={createStory}>
          <span className="catalogue-overline">NOUVEAU MANUSCRIT</span>
          <label>Titre de votre œuvre<input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder="Le titre de votre histoire" required /></label>
          <label>Résumé <span>(facultatif)</span><textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} maxLength={1200} rows={3} placeholder="Quelques mots sur votre univers…" /></label>
          {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
          <div className="writer-form-actions"><button className="auth-submit" type="submit" disabled={creating}>{creating ? "Création…" : "Créer mon manuscrit"}</button><button className="auth-secondary" type="button" onClick={() => setShowForm(false)}>Annuler</button></div>
        </form>
      )}

      {error && !showForm && <p className="auth-feedback auth-error" role="alert">{error}</p>}

      {stories.length ? (
        <div className="writer-project-list">
          {stories.map(story => (
            <Link href={`/ecrire/${story.id}`} className="writer-project-row" key={story.id}>
              <span className="writer-project-icon"><BookOpen size={19} /></span>
              <span className="writer-project-copy"><strong>{story.title}</strong><small>{story.synopsis || "Aucun résumé pour le moment"}</small></span>
              <span className="writer-project-status">{story.status === "draft" ? "BROUILLON PRIVÉ" : "PUBLIÉ"}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="writer-empty writer-empty-real">
          <span className="writer-empty-icon"><BookOpen size={23} /></span>
          <strong>Votre première histoire vous attend.</strong>
          <p>Créez un manuscrit pour commencer à écrire. Il sera sauvegardé en privé dans votre compte.</p>
          <button className="auth-secondary" onClick={() => setShowForm(true)}>Créer ma première œuvre</button>
        </div>
      )}
      <div className="writer-security-note"><LockKeyhole size={16} /><span><strong>Vos brouillons sont privés.</strong> Seul votre compte peut les consulter et les modifier.</span></div>
    </>
  );
}
