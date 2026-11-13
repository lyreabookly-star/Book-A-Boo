"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpen, CheckCircle2, Clock3, LoaderCircle, Trash2, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type LibraryRow = { id: string; status: "reading" | "to_read" | "completed"; updated_at: string; story: { id: string; title: string; synopsis: string; genre: string; language: string; author_id: string; cover_url: string | null } | null };
type Author = { id: string; username: string; display_name: string | null };

export function LibraryPageClient() {
  const router = useRouter();
  const { locale } = useAppPreferences();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<LibraryRow[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [active, setActive] = useState<"reading" | "to_read" | "completed">("to_read");
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"recent" | "title">("recent");

  const copy = {
    login: locale === "en" ? "Log in to open your library." : locale === "es" ? "Inicia sesión para abrir tu biblioteca." : locale === "pt" ? "Entre para abrir sua biblioteca." : "Connectez-vous pour ouvrir votre bibliothèque.",
    loginButton: locale === "en" ? "Log in" : locale === "es" ? "Iniciar sesión" : locale === "pt" ? "Entrar" : "Me connecter",
    loading: locale === "en" ? "Loading your library…" : locale === "es" ? "Cargando tu biblioteca…" : locale === "pt" ? "Carregando sua biblioteca…" : "Chargement de votre bibliothèque…",
    empty: locale === "en" ? "This shelf is empty" : locale === "es" ? "Esta estantería está vacía" : locale === "pt" ? "Esta estante está vazia" : "Cette étagère est vide",
    emptyText: locale === "en" ? "Save a story from Explorer to find it here." : locale === "es" ? "Guarda una historia desde Explorar para encontrarla aquí." : locale === "pt" ? "Salve uma história em Explorar para encontrá-la aqui." : "Enregistrez une histoire depuis Explorer pour la retrouver ici.",
    explore: locale === "en" ? "Explore stories" : locale === "es" ? "Explorar historias" : locale === "pt" ? "Explorar histórias" : "Explorer les histoires",
    remove: locale === "en" ? "Remove" : locale === "es" ? "Quitar" : locale === "pt" ? "Remover" : "Retirer",
    reading: locale === "en" ? "Currently reading" : locale === "es" ? "Leyendo" : locale === "pt" ? "Lendo" : "En cours",
    to_read: locale === "en" ? "To read" : locale === "es" ? "Por leer" : locale === "pt" ? "Para ler" : "À lire",
    completed: locale === "en" ? "Finished" : locale === "es" ? "Terminados" : locale === "pt" ? "Concluídos" : "Terminés",
    change: locale === "en" ? "Move to…" : locale === "es" ? "Mover a…" : locale === "pt" ? "Mover para…" : "Déplacer vers…",
    sortRecent: locale === "en" ? "Recently updated" : locale === "es" ? "Actualizadas recientemente" : locale === "pt" ? "Atualizadas recentemente" : "Modifiées récemment",
    sortTitle: locale === "en" ? "Title A–Z" : locale === "es" ? "Título A–Z" : locale === "pt" ? "Título A–Z" : "Titre A–Z",
    total: locale === "en" ? "saved stories" : locale === "es" ? "historias guardadas" : locale === "pt" ? "histórias salvas" : "histoires enregistrées"
  };

  useEffect(() => {
    let activeEffect = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) { if (activeEffect) setLoading(false); return; }
        const { data, error: queryError } = await supabase.from("user_library")
          .select("id,status,updated_at,story:stories(id,title,synopsis,genre,language,author_id,cover_url)")
          .eq("user_id", user.id).order("updated_at", { ascending: false });
        if (queryError) throw queryError;
        const list = (data ?? []) as LibraryRow[];
        const ids = [...new Set(list.map(row => row.story?.author_id).filter(Boolean))] as string[];
        let authorMap: Record<string, Author> = {};
        if (ids.length) {
          const { data: people, error: peopleError } = await supabase.from("profiles").select("id,username,display_name").in("id", ids);
          if (peopleError) throw peopleError;
          authorMap = Object.fromEntries((people ?? []).map((person: Author) => [person.id, person]));
        }
        if (activeEffect) { setUserId(user.id); setRows(list); setAuthors(authorMap); }
      } catch (e) {
        if (activeEffect) setError(e instanceof Error ? e.message : "Impossible de charger votre bibliothèque.");
      } finally { if (activeEffect) setLoading(false); }
    }
    void load();
    return () => { activeEffect = false; };
  }, []);

  const visibleRows = useMemo(() => rows.filter(row => row.status === active && row.story).sort((a, b) => sort === "title" ? a.story!.title.localeCompare(b.story!.title, locale) : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [rows, active, sort, locale]);

  async function changeStatus(row: LibraryRow, status: LibraryRow["status"]) {
    setError("");
    const supabase = getSupabaseBrowserClient() as any;
    const { error: updateError } = await supabase.from("user_library").update({ status, updated_at: new Date().toISOString() }).eq("id", row.id).eq("user_id", userId);
    if (updateError) { setError(updateError.message); return; }
    setRows(items => items.map(item => item.id === row.id ? { ...item, status } : item));
  }

  async function remove(row: LibraryRow) {
    const supabase = getSupabaseBrowserClient() as any;
    const { error: deleteError } = await supabase.from("user_library").delete().eq("id", row.id).eq("user_id", userId);
    if (deleteError) { setError(deleteError.message); return; }
    setRows(items => items.filter(item => item.id !== row.id));
  }

  if (loading) return <div className="library-live-state"><LoaderCircle className="spin" size={20}/>{copy.loading}</div>;
  if (!userId) return <div className="personal-library-empty"><span className="personal-library-empty-icon"><Bookmark size={25}/></span><h2>{copy.login}</h2><Link href="/connexion?next=%2Fbibliotheque" className="primary-button">{copy.loginButton}</Link></div>;

  const tabs = [
    { id: "reading" as const, icon: BookOpen, label: copy.reading },
    { id: "to_read" as const, icon: Bookmark, label: copy.to_read },
    { id: "completed" as const, icon: CheckCircle2, label: copy.completed }
  ];

  return <div className="library-live">
    <div className="personal-library-intro">
      <div><span className="catalogue-overline">{locale === "en" ? "YOUR READING SPACE" : locale === "es" ? "TU ESPACIO DE LECTURA" : locale === "pt" ? "SEU ESPAÇO DE LEITURA" : "VOTRE ESPACE DE LECTURE"}</span><h2>{locale === "en" ? <>A library that <em>follows you.</em></> : locale === "es" ? <>Una biblioteca a <em>tu ritmo.</em></> : locale === "pt" ? <>Uma biblioteca no <em>seu ritmo.</em></> : <>Une bibliothèque à <em>votre image.</em></>}</h2><p>{locale === "en" ? "Keep the stories you love close and organize your reading." : locale === "es" ? "Guarda cerca las historias que te gustan y organiza tus lecturas." : locale === "pt" ? "Mantenha por perto as histórias que ama e organize suas leituras." : "Gardez près de vous les histoires que vous aimez et organisez vos lectures."}</p></div>
      <div className="library-privacy"><Clock3 size={16}/><span>{locale === "en" ? "Your reading, your pace" : locale === "es" ? "Tu lectura, tu ritmo" : locale === "pt" ? "Sua leitura, seu ritmo" : "Vos lectures, votre rythme"}</span></div>
    </div>
    <div className="library-summary-line"><span>{rows.length} {copy.total}</span><label><ArrowUpDown size={15}/><select value={sort} onChange={e => setSort(e.target.value as "recent" | "title")} aria-label={locale === "en" ? "Sort library" : locale === "es" ? "Ordenar biblioteca" : locale === "pt" ? "Ordenar biblioteca" : "Trier la bibliothèque"}><option value="recent">{copy.sortRecent}</option><option value="title">{copy.sortTitle}</option></select></label></div>
    <div className="personal-library-tabs library-live-tabs">
      {tabs.map(tab => { const Icon = tab.icon; return <button type="button" key={tab.id} className={active === tab.id ? "personal-library-tab active" : "personal-library-tab"} onClick={() => setActive(tab.id)}><Icon size={17}/><span><strong>{tab.label}</strong><small>{rows.filter(row => row.status === tab.id).length} {locale === "en" ? "stories" : locale === "es" ? "historias" : locale === "pt" ? "histórias" : "histoires"}</small></span></button>; })}
    </div>
    {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
    {visibleRows.length ? <div className="library-live-grid">
      {visibleRows.map(row => { const story = row.story!; return <article className="library-live-card" key={row.id}>
        <Link href={`/histoire/${story.id}`} className={`library-live-cover${story.cover_url ? " has-custom-cover" : ""}`}>{story.cover_url ? <img src={story.cover_url} alt={locale === "en" ? `Cover of ${story.title}` : locale === "es" ? `Portada de ${story.title}` : locale === "pt" ? `Capa de ${story.title}` : `Couverture de ${story.title}`} /> : <><BookOpen size={28}/><strong>{story.title}</strong><small>{story.genre || "Book-A-Boo"}</small></>}</Link>
        <div className="library-live-card-body"><span className="library-live-genre">{story.genre || "Littérature"} · {story.language.toUpperCase()}</span><h3><Link href={`/histoire/${story.id}`}>{story.title}</Link></h3><p>{story.synopsis || (locale === "en" ? "A story to discover." : locale === "es" ? "Una historia por descubrir." : locale === "pt" ? "Uma história para descobrir." : "Une histoire à découvrir.")}</p><small className="explore-live-author">{locale === "en" ? "By" : locale === "es" ? "Por" : locale === "pt" ? "Por" : "Par"} {authors[story.author_id]?.display_name || authors[story.author_id]?.username || "Book-A-Boo"}</small>
          <label className="library-live-select">{copy.change}<select value={row.status} onChange={e => void changeStatus(row, e.target.value as LibraryRow["status"])}>{tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}</select></label>
          <button type="button" className="library-remove-button" onClick={() => void remove(row)}><Trash2 size={14}/>{copy.remove}</button>
        </div>
      </article>; })}
    </div> : <div className="personal-library-empty library-live-empty"><span className="personal-library-empty-icon"><Bookmark size={25}/></span><h2>{copy.empty}</h2><p>{copy.emptyText}</p><Link href="/explorer" className="primary-button">{copy.explore}</Link></div>}
    <p className="personal-library-note"><Clock3 size={16}/><span>{locale === "en" ? "You can change a story's shelf whenever you like. Public sharing follows your profile privacy settings." : locale === "es" ? "Puedes cambiar una historia de estantería cuando quieras. La visibilidad pública depende de la privacidad de tu perfil." : locale === "pt" ? "Você pode mudar uma história de estante quando quiser. A visibilidade pública segue as configurações de privacidade do seu perfil." : "Vous pouvez changer une histoire d'étagère à tout moment. Le partage public suit les réglages de confidentialité de votre profil."}</span></p>
  </div>;
}
