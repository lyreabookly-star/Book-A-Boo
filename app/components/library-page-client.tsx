"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpen, CheckCircle2, Clock3, LoaderCircle, Trash2, ArrowUpDown, Plus, ListPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type LibraryRow = { id: string; status: "reading" | "to_read" | "completed"; updated_at: string; story: { id: string; title: string; synopsis: string; genre: string; language: string; author_id: string; cover_url: string | null } | null };
type Author = { id: string; username: string; display_name: string | null };
type ReadingList = { id: string; name: string; items: string[] };

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
  const [readingLists, setReadingLists] = useState<ReadingList[]>([]);
  const [newListName, setNewListName] = useState("");
  const [listError, setListError] = useState("");

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
        const { data: savedLists, error: listsError } = await supabase.from("user_reading_lists").select("id,name").eq("user_id", user.id).order("created_at", { ascending: false });
        if (listsError) throw listsError;
        const { data: listItems, error: itemsError } = await supabase.from("user_reading_list_items").select("list_id,story_id");
        if (itemsError) throw itemsError;
        const mappedLists = (savedLists ?? []).map((item: {id:string;name:string}) => ({...item, items:(listItems ?? []).filter((entry: {list_id:string;story_id:string}) => entry.list_id === item.id).map((entry: {list_id:string;story_id:string}) => entry.story_id)}));
        const ids = [...new Set(list.map(row => row.story?.author_id).filter(Boolean))] as string[];
        let authorMap: Record<string, Author> = {};
        if (ids.length) {
          const { data: people, error: peopleError } = await supabase.from("profiles").select("id,username,display_name").in("id", ids);
          if (peopleError) throw peopleError;
          authorMap = Object.fromEntries((people ?? []).map((person: Author) => [person.id, person]));
        }
        if (activeEffect) { setUserId(user.id); setRows(list); setAuthors(authorMap); setReadingLists(mappedLists); }
      } catch (e) {
        if (activeEffect) setError(e instanceof Error ? e.message : "Impossible de charger votre bibliothèque.");
      } finally { if (activeEffect) setLoading(false); }
    }
    void load();
    return () => { activeEffect = false; };
  }, []);

  const visibleRows = useMemo(() => rows.filter(row => row.status === active && row.story).sort((a, b) => sort === "title" ? a.story!.title.localeCompare(b.story!.title, locale) : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [rows, active, sort, locale]);


  async function createReadingList(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newListName.trim();
    if (!name || !userId) return;
    setListError("");
    const supabase = getSupabaseBrowserClient() as any;
    const { data, error: insertError } = await supabase.from("user_reading_lists").insert({ user_id: userId, name }).select("id,name").single();
    if (insertError) { setListError(insertError.code === "23505" ? "Une liste porte déjà ce nom." : insertError.message); return; }
    setReadingLists(items => [{ ...data, items: [] }, ...items]);
    setNewListName("");
  }

  async function addToReadingList(storyId: string, listId: string) {
    if (!listId) return;
    setListError("");
    const supabase = getSupabaseBrowserClient() as any;
    const { error: insertError } = await supabase.from("user_reading_list_items").insert({ list_id: listId, story_id: storyId });
    if (insertError && insertError.code !== "23505") { setListError(insertError.message); return; }
    setReadingLists(items => items.map(list => list.id === listId && !list.items.includes(storyId) ? { ...list, items: [...list.items, storyId] } : list));
  }

  async function deleteReadingList(listId: string) {
    const supabase = getSupabaseBrowserClient() as any;
    const { error: deleteError } = await supabase.from("user_reading_lists").delete().eq("id", listId).eq("user_id", userId);
    if (deleteError) { setListError(deleteError.message); return; }
    setReadingLists(items => items.filter(list => list.id !== listId));
  }

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
<section className="reading-lists-panel"><div className="reading-lists-heading"><div><span className="catalogue-overline">VOS COLLECTIONS</span><h3>Listes de lecture</h3></div><span>{readingLists.length}</span></div><form className="reading-list-create" onSubmit={createReadingList}><input value={newListName} onChange={e => setNewListName(e.target.value)} maxLength={60} placeholder="Ex. : Mes coups de cœur" aria-label="Nom de la nouvelle liste"/><button type="submit" disabled={!newListName.trim()}><Plus size={15}/>Créer</button></form>{readingLists.length > 0 && <div className="reading-list-chips">{readingLists.map(list => <span key={list.id}>{list.name} ({list.items.length})<button type="button" aria-label={`Supprimer ${list.name}`} onClick={() => void deleteReadingList(list.id)}>×</button></span>)}</div>}</section>
    {(error || listError) && <p className="auth-feedback auth-error" role="alert">{error || listError}</p>}
    {visibleRows.length ? <div className="library-live-grid">
      {visibleRows.map(row => { const story = row.story!; return <article className="library-live-card" key={row.id}>
        <Link href={`/histoire/${story.id}`} className={`library-live-cover${story.cover_url ? " has-custom-cover" : ""}`}>{story.cover_url ? <img src={story.cover_url} alt={locale === "en" ? `Cover of ${story.title}` : locale === "es" ? `Portada de ${story.title}` : locale === "pt" ? `Capa de ${story.title}` : `Couverture de ${story.title}`} /> : <><BookOpen size={28}/><strong>{story.title}</strong><small>{story.genre || "Book-A-Boo"}</small></>}</Link>
        <div className="library-live-card-body"><span className="library-live-genre">{story.genre || "Littérature"} · {story.language.toUpperCase()}</span><h3><Link href={`/histoire/${story.id}`}>{story.title}</Link></h3><p>{story.synopsis || (locale === "en" ? "A story to discover." : locale === "es" ? "Una historia por descubrir." : locale === "pt" ? "Uma história para descobrir." : "Une histoire à découvrir.")}</p><small className="explore-live-author">{locale === "en" ? "By" : locale === "es" ? "Por" : locale === "pt" ? "Por" : "Par"} {authors[story.author_id]?.display_name || authors[story.author_id]?.username || "Book-A-Boo"}</small>
          <label className="library-live-select">{copy.change}<select value={row.status} onChange={e => void changeStatus(row, e.target.value as LibraryRow["status"])}>{tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}</select></label>
          {readingLists.length > 0 && <label className="library-list-add"><ListPlus size={14}/><select defaultValue="" onChange={e => { void addToReadingList(story.id, e.target.value); e.currentTarget.value = ""; }}><option value="" disabled>Ajouter à une liste…</option>{readingLists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>}<button type="button" className="library-remove-button" onClick={() => void remove(row)}><Trash2 size={14}/>{copy.remove}</button>
        </div>
      </article>; })}
    </div> : <div className="personal-library-empty library-live-empty"><span className="personal-library-empty-icon"><Bookmark size={25}/></span><h2>{copy.empty}</h2><p>{copy.emptyText}</p><Link href="/explorer" className="primary-button">{copy.explore}</Link></div>}
    <p className="personal-library-note"><Clock3 size={16}/><span>{locale === "en" ? "You can change a story's shelf whenever you like. Public sharing follows your profile privacy settings." : locale === "es" ? "Puedes cambiar una historia de estantería cuando quieras. La visibilidad pública depende de la privacidad de tu perfil." : locale === "pt" ? "Você pode mudar uma história de estante quando quiser. A visibilidade pública segue as configurações de privacidade do seu perfil." : "Vous pouvez changer une histoire d'étagère à tout moment. Le partage public suit les réglages de confidentialité de votre profil."}</span></p>
  </div>;
}
