"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Comment = { id: string; author_id: string; content: string; created_at: string; parent_id: string | null };
type Profile = { id: string; username: string; display_name: string | null };
const reactions = [
  { key: "heart", emoji: "❤️", label: "J’aime" },
  { key: "laugh", emoji: "😂", label: "Drôle" },
  { key: "wow", emoji: "😮", label: "Surprenant" },
  { key: "sad", emoji: "😢", label: "Émouvant" },
  { key: "fire", emoji: "🔥", label: "Captivant" },
];

export function StoryInteractions({ storyId }: { storyId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [myReactions, setMyReactions] = useState<string[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [ratingAverage, setRatingAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient() as any;
    const [{ data: authData }, commentsResult, reactionsResult, votesResult, ratingsResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("story_comments").select("id,author_id,content,created_at,parent_id").eq("story_id", storyId).order("created_at", { ascending: false }),
      supabase.from("story_reactions").select("user_id,reaction").eq("story_id", storyId),
      supabase.from("story_votes").select("user_id").eq("story_id", storyId),
      supabase.from("story_ratings").select("user_id,rating").eq("story_id", storyId),
    ]);
    const uid = authData?.user?.id ?? null;
    setUserId(uid);
    if (commentsResult.error) throw commentsResult.error;
    if (reactionsResult.error) throw reactionsResult.error;
    if (votesResult.error) throw votesResult.error;
    if (ratingsResult.error) throw ratingsResult.error;
    const nextComments = (commentsResult.data ?? []) as Comment[];
    setComments(nextComments);
    const ids = [...new Set(nextComments.map((c) => c.author_id))];
    if (ids.length) {
      const { data: people, error } = await supabase.from("profiles").select("id,username,display_name").in("id", ids);
      if (error) throw error;
      const map: Record<string, Profile> = {};
      (people ?? []).forEach((p: Profile) => { map[p.id] = p; });
      setProfiles(map);
    } else setProfiles({});
    const rs = reactionsResult.data ?? [];
    const counts: Record<string, number> = {};
    rs.forEach((r: { reaction: string }) => { counts[r.reaction] = (counts[r.reaction] ?? 0) + 1; });
    setReactionCounts(counts);
    setMyReactions(uid ? rs.filter((r: { user_id: string }) => r.user_id === uid).map((r: { reaction: string }) => r.reaction) : []);
    const vs = votesResult.data ?? [];
    setVoteCount(vs.length);
    setHasVoted(uid ? vs.some((v: { user_id: string }) => v.user_id === uid) : false);
    const ratings = ratingsResult.data ?? [];
    setRatingCount(ratings.length);
    setRatingAverage(ratings.length ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length : 0);
    setMyRating(uid ? ratings.find((r: { user_id: string }) => r.user_id === uid)?.rating ?? 0 : 0);
  }, [storyId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load().catch(() => { if (alive) setNotice("Impossible de charger les interactions pour le moment."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [load]);

  async function requireLogin() {
    setNotice("Connecte-toi pour participer à la vie de cette œuvre.");
  }

  async function toggleReaction(key: string) {
    if (!userId) return requireLogin();
    setBusy(key); setNotice("");
    const supabase = getSupabaseBrowserClient() as any;
    const exists = myReactions.includes(key);
    const result = exists
      ? await supabase.from("story_reactions").delete().eq("story_id", storyId).eq("user_id", userId).eq("reaction", key)
      : await supabase.from("story_reactions").insert({ story_id: storyId, user_id: userId, reaction: key });
    if (result.error) setNotice("Cette réaction n’a pas pu être enregistrée.");
    else await load();
    setBusy("");
  }

  async function toggleVote() {
    if (!userId) return requireLogin();
    setBusy("vote"); setNotice("");
    const supabase = getSupabaseBrowserClient() as any;
    const result = hasVoted
      ? await supabase.from("story_votes").delete().eq("story_id", storyId).eq("user_id", userId)
      : await supabase.from("story_votes").insert({ story_id: storyId, user_id: userId });
    if (result.error) setNotice("Ton vote n’a pas pu être enregistré.");
    else await load();
    setBusy("");
  }

  async function rate(value: number) {
    if (!userId) return requireLogin();
    setBusy("rating"); setNotice("");
    const supabase = getSupabaseBrowserClient() as any;
    const result = myRating === value
      ? await supabase.from("story_ratings").delete().eq("story_id", storyId).eq("user_id", userId)
      : await supabase.from("story_ratings").upsert({ story_id: storyId, user_id: userId, rating: value }, { onConflict: "story_id,user_id" });
    if (result.error) setNotice("Ta note n’a pas pu être enregistrée.");
    else await load();
    setBusy("");
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return requireLogin();
    const content = draft.trim();
    if (!content) return;
    setBusy("comment"); setNotice("");
    const supabase = getSupabaseBrowserClient() as any;
    const { error } = await supabase.from("story_comments").insert({ story_id: storyId, author_id: userId, content });
    if (error) setNotice("Ton commentaire n’a pas pu être publié.");
    else { setDraft(""); await load(); }
    setBusy("");
  }

  async function deleteComment(id: string) {
    if (!userId || !window.confirm("Supprimer ce commentaire ?")) return;
    const supabase = getSupabaseBrowserClient() as any;
    const { error } = await supabase.from("story_comments").delete().eq("id", id).eq("author_id", userId);
    if (error) setNotice("Impossible de supprimer ce commentaire.");
    else await load();
  }

  async function reportComment(id: string) {
    if (!userId) return requireLogin();
    const reason = window.prompt("Pourquoi souhaites-tu signaler ce commentaire ?");
    if (!reason?.trim()) return;
    const supabase = getSupabaseBrowserClient() as any;
    const { error } = await supabase.from("story_comment_reports").insert({ comment_id: id, reporter_id: userId, reason: reason.trim() });
    setNotice(error ? "Le signalement n’a pas pu être envoyé." : "Merci, ton signalement a été transmis.");
  }

  const dateLabel = (value: string) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return (
    <section className="story-interactions" aria-label="Interactions de l’œuvre">
      <div className="story-interactions-heading">
        <span className="eyebrow"><span className="eyebrow-line" /> LA COMMUNAUTÉ</span>
        <h2>Et toi, qu’en penses-tu ?</h2>
        <p>Partage ton ressenti et encourage l’auteur.</p>
      </div>

      <div className="story-feedback-grid">
        <div className="story-feedback-card">
          <strong>Un vote de soutien</strong>
          <p>{voteCount} {voteCount > 1 ? "votes" : "vote"}</p>
          <button type="button" className={hasVoted ? "story-vote-button selected" : "story-vote-button"} onClick={toggleVote} disabled={busy === "vote"}>
            {hasVoted ? "✓ Tu soutiens cette œuvre" : "♡ Soutenir cette œuvre"}
          </button>
        </div>
        <div className="story-feedback-card">
          <strong>Donner une note</strong>
          <div className="story-rating-stars" role="group" aria-label="Noter de 1 à 5 étoiles">
            {[1,2,3,4,5].map((n) => <button key={n} type="button" aria-label={`${n} étoile${n > 1 ? "s" : ""}`} aria-pressed={myRating === n} className={n <= myRating ? "active" : ""} onClick={() => rate(n)} disabled={busy === "rating"}>★</button>)}
          </div>
          <p>{ratingAverage ? `${ratingAverage.toFixed(1)} / 5 · ${ratingCount} avis` : "Pas encore de note"}{myRating ? " · Ta note est enregistrée" : ""}</p>
        </div>
      </div>

      <div className="story-reactions">
        <strong>Réagir à cette œuvre</strong>
        <div className="story-reaction-list">
          {reactions.map((reaction) => <button key={reaction.key} type="button" className={myReactions.includes(reaction.key) ? "story-reaction selected" : "story-reaction"} onClick={() => toggleReaction(reaction.key)} disabled={busy === reaction.key} aria-pressed={myReactions.includes(reaction.key)}>
            <span>{reaction.emoji}</span><small>{reactionCounts[reaction.key] ?? 0}</small>
          </button>)}
        </div>
      </div>

      <div className="story-comments">
        <div className="story-comments-title"><h3>Commentaires</h3><span>{comments.length}</span></div>
        <form className="story-comment-form" onSubmit={submitComment}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} placeholder={userId ? "Écris un commentaire respectueux…" : "Connecte-toi pour laisser un commentaire…"} rows={3} />
          <div className="story-comment-form-footer"><small>{draft.length}/2000</small><button type="submit" className="primary-button" disabled={!draft.trim() || busy === "comment"}>{busy === "comment" ? "Publication…" : "Publier le commentaire"}</button></div>
        </form>
        {notice ? <p className="story-interaction-notice" role="status">{notice}</p> : null}
        {loading ? <p className="explore-live-empty">Chargement des commentaires…</p> : comments.length ? <div className="story-comment-list">
          {comments.map((comment) => {
            const person = profiles[comment.author_id];
            return <article className="story-comment" key={comment.id}>
              <div className="story-comment-avatar">{(person?.display_name || person?.username || "?").slice(0,1).toUpperCase()}</div>
              <div className="story-comment-body">
                <div className="story-comment-meta"><strong>{person?.display_name || person?.username || "Lecteur Book-A-Boo"}</strong><time>{dateLabel(comment.created_at)}</time></div>
                <p>{comment.content}</p>
                <div className="story-comment-actions">
                  {userId === comment.author_id ? <button type="button" onClick={() => deleteComment(comment.id)}>Supprimer</button> : null}
                  {userId && userId !== comment.author_id ? <button type="button" onClick={() => reportComment(comment.id)}>Signaler</button> : null}
                </div>
              </div>
            </article>;
          })}
        </div> : <p className="explore-live-empty">Aucun commentaire pour le moment. Lance la conversation !</p>}
      </div>
      {!userId ? <p className="story-interaction-login"><Link href="/connexion">Connecte-toi</Link> pour commenter, réagir, voter ou noter cette œuvre.</p> : null}
    </section>
  );
}
