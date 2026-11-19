"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, FilePlus2, Feather, LoaderCircle, LockKeyhole } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type Story = {
  id: string;
  title: string;
  synopsis: string;
  status: "draft" | "published";
  updated_at: string;
};

export function WriterStudio() {
  const router = useRouter();
  const { locale } = useAppPreferences();

  const copy = {
    fr: { loading:"Chargement de votre atelier…", personal:"VOTRE ESPACE PERSONNEL", loginTitle:"Connectez-vous pour écrire.", loginText:"Vos histoires et vos brouillons seront enregistrés dans votre compte et resteront privés tant que vous ne choisissez pas de les publier.", login:"Me connecter", signup:"Créer un compte", dashboard:"Votre bureau", author:"d’auteur.", saved:"Vos textes sont sauvegardés dans votre compte. Les brouillons restent privés.", manuscripts:"MES MANUSCRITS", project:"projet", projects:"projets", newWork:"Nouvelle œuvre", newManuscript:"NOUVEAU MANUSCRIT", title:"Titre de votre œuvre", summary:"Résumé de l’œuvre", optional:"(facultatif · jusqu’à 5 000 caractères)", genre:"Genre littéraire", create:"Créer mon manuscrit", creating:"Création…", cancel:"Annuler", noSummary:"Aucun résumé pour le moment", draft:"BROUILLON PRIVÉ", published:"PUBLIÉ", waiting:"Votre première histoire vous attend.", empty:"Créez un manuscrit pour commencer à écrire. Il sera sauvegardé en privé dans votre compte.", first:"Créer ma première œuvre", private:"Vos brouillons sont privés.", privateDetail:"Seul votre compte peut les consulter et les modifier.", loadError:"Impossible de charger vos projets.", createError:"La création de votre œuvre a échoué.", genres:["Romance","Fantasy","Drame","Thriller","Psychologie","Fanfiction","Poésie","Science-fiction","Horreur","Historique","Littérature générale"] },
    en: { loading:"Loading your writing studio…", personal:"YOUR PERSONAL SPACE", loginTitle:"Sign in to start writing.", loginText:"Your stories and drafts are saved to your account and remain private until you choose to publish them.", login:"Sign in", signup:"Create an account", dashboard:"Your", author:"author's desk.", saved:"Your texts are saved to your account. Drafts remain private.", manuscripts:"MY MANUSCRIPTS", project:"project", projects:"projects", newWork:"New story", newManuscript:"NEW MANUSCRIPT", title:"Story title", summary:"Story summary", optional:"(optional · up to 5,000 characters)", genre:"Literary genre", create:"Create my manuscript", creating:"Creating…", cancel:"Cancel", noSummary:"No summary yet", draft:"PRIVATE DRAFT", published:"PUBLISHED", waiting:"Your first story is waiting.", empty:"Create a manuscript to start writing. It will be saved privately to your account.", first:"Create my first story", private:"Your drafts are private.", privateDetail:"Only your account can view and edit them.", loadError:"Unable to load your projects.", createError:"Your story could not be created.", genres:["Romance","Fantasy","Drama","Thriller","Psychology","Fanfiction","Poetry","Science fiction","Horror","Historical","General fiction"] },
    es: { loading:"Cargando tu espacio de escritura…", personal:"TU ESPACIO PERSONAL", loginTitle:"Inicia sesión para escribir.", loginText:"Tus historias y borradores se guardarán en tu cuenta y serán privados hasta que decidas publicarlos.", login:"Iniciar sesión", signup:"Crear una cuenta", dashboard:"Tu espacio", author:"de autor.", saved:"Tus textos se guardan en tu cuenta. Los borradores son privados.", manuscripts:"MIS MANUSCRITOS", project:"proyecto", projects:"proyectos", newWork:"Nueva obra", newManuscript:"NUEVO MANUSCRITO", title:"Título de la obra", summary:"Resumen de la obra", optional:"(opcional · hasta 5.000 caracteres)", genre:"Género literario", create:"Crear mi manuscrito", creating:"Creando…", cancel:"Cancelar", noSummary:"Todavía no hay resumen", draft:"BORRADOR PRIVADO", published:"PUBLICADO", waiting:"Tu primera historia te espera.", empty:"Crea un manuscrito para empezar a escribir. Se guardará de forma privada en tu cuenta.", first:"Crear mi primera obra", private:"Tus borradores son privados.", privateDetail:"Solo tu cuenta puede verlos y editarlos.", loadError:"No se pudieron cargar tus proyectos.", createError:"No se pudo crear tu obra.", genres:["Romance","Fantasía","Drama","Thriller","Psicología","Fanfiction","Poesía","Ciencia ficción","Terror","Histórico","Literatura general"] },
    pt: { loading:"Carregando seu espaço de escrita…", personal:"SEU ESPAÇO PESSOAL", loginTitle:"Entre para começar a escrever.", loginText:"Suas histórias e seus rascunhos serão salvos na sua conta e permanecerão privados até você decidir publicá-los.", login:"Entrar", signup:"Criar uma conta", dashboard:"Seu espaço", author:"de autor.", saved:"Seus textos são salvos na sua conta. Os rascunhos permanecem privados.", manuscripts:"MEUS MANUSCRITOS", project:"projeto", projects:"projetos", newWork:"Nova obra", newManuscript:"NOVO MANUSCRITO", title:"Título da obra", summary:"Resumo da obra", optional:"(opcional · até 5.000 caracteres)", genre:"Gênero literário", create:"Criar meu manuscrito", creating:"Criando…", cancel:"Cancelar", noSummary:"Ainda sem resumo", draft:"RASCUNHO PRIVADO", published:"PUBLICADO", waiting:"Sua primeira história está esperando.", empty:"Crie um manuscrito para começar a escrever. Ele será salvo de forma privada na sua conta.", first:"Criar minha primeira obra", private:"Seus rascunhos são privados.", privateDetail:"Somente sua conta pode visualizá-los e editá-los.", loadError:"Não foi possível carregar seus projetos.", createError:"Não foi possível criar sua obra.", genres:["Romance","Fantasia","Drama","Thriller","Psicologia","Fanfiction","Poesia","Ficção científica","Terror","Histórico","Literatura geral"] }
  } as const;
  const t = copy[locale === "en" || locale === "es" || locale === "pt" ? locale : "fr"];
  const genreValues = ["Romance","Fantasy","Drame","Thriller","Psychologie","Fanfiction","Poésie","Science-fiction","Horreur","Historique","Littérature générale"];

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [stories, setStories] = useState<Story[]>([]);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("Littérature générale");
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
          .select("id,title,synopsis,genre,status,updated_at")
          .eq("author_id", user.id)
          .order("updated_at", { ascending: false });
        if (queryError) throw queryError;
        if (alive) {
          setUserId(user.id);
          setStories(data ?? []);
        }
      } catch (caught) {
        if (alive) setError(caught instanceof Error ? caught.message : t.loadError);
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
      const baseSlug = title.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "oeuvre";
      const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
      const { data, error: insertError } = await supabase
        .from("stories")
        .insert({ author_id: userId, title: title.trim(), slug, synopsis: synopsis.trim(), genre, status: "draft", visibility: "private" })
        .select("id")
        .single();
      if (insertError) throw insertError;
      router.push(`/ecrire/${data.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.createError);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="writer-state"><LoaderCircle className="spin" size={22} /> {t.loading}</div>;
  if (!userId) return (
    <section className="writer-login-panel">
      <span className="writer-side-icon"><LockKeyhole size={20} /></span>
      <span className="catalogue-overline">{t.personal}</span>
      <h2>{t.loginTitle}</h2>
      <p>{t.loginText}</p>
      <div className="profile-account-actions">
        <Link className="primary-button" href="/connexion?next=%2Fecrire">{t.login}</Link>
        <Link className="auth-secondary" href="/inscription">{t.signup}</Link>
      </div>
    </section>
  );

  return (
    <>
      <div className="writer-dashboard-head">
        <div>
          <span className="writer-welcome">{t.personal}</span>
          <h2>{t.dashboard} <em>{t.author}</em></h2>
          <p>{t.saved}</p>
        </div>
        <div className="writer-avatar"><Feather size={25} /></div>
      </div>

      <div className="writer-toolbar">
        <div><span className="catalogue-overline">{t.manuscripts}</span><h2>{stories.length} {stories.length > 1 ? t.projects : t.project}</h2></div>
        <button className="primary-button" onClick={() => setShowForm(v => !v)}><FilePlus2 size={16} /> {t.newWork}</button>
      </div>

      {showForm && (
        <form className="writer-create-form" onSubmit={createStory}>
          <span className="catalogue-overline">{t.newManuscript}</span>
          <label>{t.title}<input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder={locale === "en" ? "Your story title" : locale === "es" ? "El título de tu historia" : locale === "pt" ? "O título da sua história" : "Le titre de votre histoire"} required /></label>
          <label>{t.summary} <span>{t.optional}</span><textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} maxLength={5000} rows={5} placeholder={locale === "en" ? "A few words about your world…" : locale === "es" ? "Unas palabras sobre tu universo…" : locale === "pt" ? "Algumas palavras sobre seu universo…" : "Quelques mots sur votre univers…"} /></label>
          <label>{t.genre}<select value={genre} onChange={e => setGenre(e.target.value)}>{t.genres.map((item, index) => <option key={genreValues[index]} value={genreValues[index]}>{item}</option>)}</select></label>
          {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
          <div className="writer-form-actions"><button className="auth-submit" type="submit" disabled={creating}>{creating ? t.creating : t.create}</button><button className="auth-secondary" type="button" onClick={() => setShowForm(false)}>{t.cancel}</button></div>
        </form>
      )}

      {error && !showForm && <p className="auth-feedback auth-error" role="alert">{error}</p>}

      {stories.length ? (
        <div className="writer-project-list">
          {stories.map(story => (
            <Link href={`/ecrire/${story.id}`} className="writer-project-row" key={story.id}>
              <span className="writer-project-icon"><BookOpen size={19} /></span>
              <span className="writer-project-copy"><strong>{story.title}</strong><small>{story.synopsis || t.noSummary}</small></span>
              <span className="writer-project-status">{story.status === "draft" ? t.draft : t.published}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="writer-empty writer-empty-real">
          <span className="writer-empty-icon"><BookOpen size={23} /></span>
          <strong>{t.waiting}</strong>
          <p>{t.empty}</p>
          <button className="auth-secondary" onClick={() => setShowForm(true)}>{t.first}</button>
        </div>
      )}
      <div className="writer-security-note"><LockKeyhole size={16} /><span><strong>{t.private}</strong> {t.privateDetail}</span></div>
    </>
  );
}
