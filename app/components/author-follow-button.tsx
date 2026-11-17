"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellPlus, BellMinus, LoaderCircle, UserRoundPlus } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export function AuthorFollowButton({ authorId, label = "Suivre", onFollowChange }: { authorId: string; label?: string; onFollowChange?: (delta: number) => void }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = getSupabaseBrowserClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);
      if (!user || user.id === authorId) { setLoading(false); return; }
      const [outgoing, incoming] = await Promise.all([
        supabase.from("author_follows").select("author_id").eq("follower_id", user.id).eq("author_id", authorId).maybeSingle(),
        supabase.from("author_follows").select("follower_id").eq("follower_id", authorId).eq("author_id", user.id).maybeSingle(),
      ]);
      if (active) {
        setFollowing(Boolean(outgoing.data));
        setFollowsMe(Boolean(incoming.data));
        setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [authorId]);

  async function toggle() {
    if (!userId || saving) return;
    setSaving(true); setError("");
    const supabase = getSupabaseBrowserClient() as any;
    const result = following
      ? await supabase.from("author_follows").delete().eq("follower_id", userId).eq("author_id", authorId)
      : await supabase.from("author_follows").insert({ follower_id: userId, author_id: authorId });
    if (result.error) setError("Impossible de modifier cet abonnement pour le moment.");
    else { setFollowing(!following); onFollowChange?.(following ? -1 : 1); }
    setSaving(false);
  }

  if (loading) return <button className="author-follow-button" type="button" disabled><LoaderCircle className="spin" size={15}/> Chargement…</button>;
  if (userId === authorId) return null;
  if (!userId) return <Link className="author-follow-button" href="/connexion"><BellPlus size={15}/> Se connecter pour suivre</Link>;
  const buttonLabel = following ? "Ne plus suivre" : followsMe ? "Suivre en retour" : label;
  return <span className="author-follow-wrap"><button className={`author-follow-button${following ? " is-following" : followsMe ? " is-follow-back" : ""}`} type="button" onClick={toggle} disabled={saving}>{saving ? <LoaderCircle className="spin" size={15}/> : following ? <BellMinus size={15}/> : followsMe ? <UserRoundPlus size={15}/> : <BellPlus size={15}/>} {buttonLabel}</button>{error && <small role="alert">{error}</small>}</span>;
}
