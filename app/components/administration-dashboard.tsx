"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Report = { id: string; comment_id: string; reporter_id: string; reason: string; created_at: string; status: "pending" | "reviewed" | "dismissed"; admin_note: string | null };
type Comment = { id: string; content: string; story_id: string; author_id: string };

export function AdministrationDashboard() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<Record<string, Comment>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = getSupabaseBrowserClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAllowed(false); setLoading(false); return; }
    const { data: membership, error: membershipError } = await supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (membershipError || !membership) { setAllowed(false); setLoading(false); return; }
    setAllowed(true);
    const { data: reportRows, error: reportError } = await supabase.from("story_comment_reports").select("id,comment_id,reporter_id,reason,created_at,status,admin_note").order("created_at", { ascending: false });
    if (reportError) { setError("Impossible de charger les signalements."); setLoading(false); return; }
    const rows = (reportRows ?? []) as Report[];
    setReports(rows);
    const commentIds = [...new Set(rows.map(row => row.comment_id))];
    if (commentIds.length) {
      const { data: commentRows } = await supabase.from("story_comments").select("id,content,story_id,author_id").in("id", commentIds);
      const commentMap: Record<string, Comment> = {};
      for (const comment of (commentRows ?? []) as Comment[]) commentMap[comment.id] = comment;
      setComments(commentMap);
      const storyIds = [...new Set(Object.values(commentMap).map(comment => comment.story_id))];
      if (storyIds.length) {
        const { data: storyRows } = await supabase.from("stories").select("id,title").in("id", storyIds);
        const titleMap: Record<string, string> = {};
        for (const story of storyRows ?? []) titleMap[story.id] = story.title;
        setTitles(titleMap);
      }
    } else { setComments({}); setTitles({}); }
    setError("");
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function updateReport(id: string, status: "reviewed" | "dismissed") {
    setBusy(id); setError("");
    const supabase = getSupabaseBrowserClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    const { error: updateError } = await supabase.from("story_comment_reports").update({ status, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (updateError) setError("Cette action n’a pas pu être enregistrée.");
    else await load();
    setBusy(null);
  }

  if (loading) return <div className="admin-panel"><p>Chargement de l’administration…</p></div>;
  if (!allowed) return <div className="admin-panel admin-denied"><ShieldCheck size={30}/><h2>Accès réservé</h2><p>Cette partie est réservée aux administrateurs autorisés de Book-A-Boo.</p><Link href="/connexion">Se connecter</Link></div>;

  const pending = reports.filter(report => report.status === "pending").length;
  return <div className="admin-panel">
    <div className="admin-welcome"><div><span>ESPACE PRIVÉ</span><h2>Administration</h2><p>Gestion de la plateforme et suivi de la communauté.</p></div><ShieldCheck size={30}/></div>
    <div className="admin-stats">
      <article><AlertTriangle size={20}/><strong>{pending}</strong><span>Signalements à examiner</span></article>
      <article><CheckCircle2 size={20}/><strong>{reports.filter(r => r.status === "reviewed").length}</strong><span>Signalements traités</span></article>
      <article><XCircle size={20}/><strong>{reports.filter(r => r.status === "dismissed").length}</strong><span>Signalements écartés</span></article>
    </div>
    <div className="admin-section-heading"><div><span>MODÉRATION</span><h3>Signalements de commentaires</h3></div><span>{reports.length} au total</span></div>
    {error && <p className="admin-error">{error}</p>}
    {!reports.length ? <div className="admin-empty"><Clock3 size={22}/><p>Aucun signalement pour le moment.</p></div> : <div className="admin-report-list">
      {reports.map(report => {
        const comment = comments[report.comment_id];
        return <article className="admin-report" key={report.id}>
          <div className="admin-report-top"><span className={`admin-status admin-status-${report.status}`}>{report.status === "pending" ? "À examiner" : report.status === "reviewed" ? "Traité" : "Écarté"}</span><time>{new Date(report.created_at).toLocaleString("fr-FR")}</time></div>
          <p className="admin-report-reason"><strong>Motif :</strong> {report.reason}</p>
          {comment ? <div className="admin-reported-content"><small>Œuvre : {titles[comment.story_id] ?? "Œuvre"}</small><p>{comment.content}</p></div> : <p className="admin-report-missing">Le commentaire signalé n’est plus disponible.</p>}
          {report.status === "pending" && <div className="admin-report-actions"><button disabled={busy === report.id} onClick={() => void updateReport(report.id,"reviewed")}><CheckCircle2 size={15}/> Marquer comme traité</button><button className="secondary" disabled={busy === report.id} onClick={() => void updateReport(report.id,"dismissed")}><XCircle size={15}/> Écarter</button></div>}
        </article>;
      })}
    </div>}
    <p className="admin-footnote">Les accès à cet espace sont indépendants des droits de la rédaction.</p>
  </div>;
}
