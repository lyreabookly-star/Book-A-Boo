"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

type Notice = { id: string; actor_id: string | null; type: "new_follower" | "new_story" | "new_comment" | "new_reaction"; story_id: string | null; created_at: string; read_at: string | null };
type Person = { username: string; display_name: string | null; avatar_url: string | null };
type Story = { title: string; slug: string };

export function NotificationsPanel() {
  const [items, setItems] = useState<Notice[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [stories, setStories] = useState<Record<string, Story>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = getSupabaseBrowserClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) { setError(t("login")); setLoading(false); } return; }
      const { data, error: e } = await supabase.from("notifications").select("id,actor_id,type,story_id,created_at,read_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (e) { if (active) { setError(t("loadError")); setLoading(false); } return; }
      const rows = (data ?? []) as Notice[];
      const actorIds = [...new Set(rows.map(n => n.actor_id).filter((v): v is string => Boolean(v)))];
      const storyIds = [...new Set(rows.map(n => n.story_id).filter((v): v is string => Boolean(v)))];
      const [p, s] = await Promise.all([
        actorIds.length ? supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", actorIds) : Promise.resolve({ data: [] }),
        storyIds.length ? supabase.from("stories").select("id,title,slug").in("id", storyIds) : Promise.resolve({ data: [] })
      ]);
      if (!active) return;
      setItems(rows);
      setPeople(Object.fromEntries((p.data ?? []).map((x: any) => [x.id, x])));
      setStories(Object.fromEntries((s.data ?? []).map((x: any) => [x.id, x])));
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);
  async function markRead(id: string) {
    const supabase = getSupabaseBrowserClient() as any;
    const { error: e } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (!e) setItems(current => current.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  }
  if (loading) return <div className="auth-card"><p>Chargement de vos notifications…</p></div>;
  if (error) return <div className="auth-card"><p>{error}</p><Link href="/connexion">{locale === "en" ? "Log in →" : locale === "es" ? "Iniciar sesión →" : locale === "pt" ? "Entrar →" : "Me connecter →"}</Link></div>;
  return <div className="auth-card">
    <div className="settings-section-heading"><span>{locale === "en" ? "YOUR COMMUNITY" : locale === "es" ? "TU COMUNIDAD" : locale === "pt" ? "SUA COMUNIDADE" : "VOTRE COMMUNAUTÉ"}</span><h2>Notifications</h2><p>{locale === "en" ? "Updates about your followers and publications." : locale === "es" ? "Novedades sobre tus seguidores y publicaciones." : locale === "pt" ? "Novidades sobre seus seguidores e publicações." : "Les nouvelles liées à vos abonnements et à vos publications."}</p></div>
    {items.length === 0 ? <p>{t("empty")}</p> : <div className="notification-list">
      {items.map(n => { const person = n.actor_id ? people[n.actor_id] : null; const label = person?.display_name || (person?.username ? "@"+person.username : "Un membre"); return <article className={n.read_at ? "notification-item" : "notification-item is-unread"} key={n.id}>
        <p>{n.type === "new_follower" ? <><strong>{label}</strong> {t("follower")}</> : n.type === "new_story" ? <><strong>{label}</strong> {t("story")} « {n.story_id ? stories[n.story_id]?.title || t("newStory") : t("newStory")} ».</> : n.type === "new_comment" ? <><strong>{label}</strong> {t("comment")} « {n.story_id ? stories[n.story_id]?.title || t("yourStory") : t("yourStory")} ».</> : <><strong>{label}</strong> {t("reaction")} « {n.story_id ? stories[n.story_id]?.title || t("yourStory") : t("yourStory")} ».</>}</p>
        {n.type !== "new_follower" && n.story_id && stories[n.story_id]?.slug && <Link href={`/histoire/${encodeURIComponent(stories[n.story_id].slug)}`}>{t("readStory")}</Link>}
        <small>{new Date(n.created_at).toLocaleString(dateLocale)}</small>
        {!n.read_at && <button className="auth-secondary" type="button" onClick={() => void markRead(n.id)}>{t("read")}</button>}
        {person?.username && <Link href={`/u/${encodeURIComponent(person.username)}`}>{t("profile")}</Link>}
      </article>; })}
    </div>}
    <p><Link href="/parametres">{t("manage")}</Link></p>
  </div>;
}
