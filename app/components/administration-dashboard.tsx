"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, BookOpen, CheckCircle2, Clock3, FileText, ShieldCheck, Users, XCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Tab = "overview" | "reports" | "members" | "works" | "history";
type Report = { id: string; comment_id: string; reporter_id: string; reason: string; created_at: string; status: "pending" | "reviewed" | "dismissed" };
type Member = { id: string; username: string; display_name: string | null; created_at: string; is_public: boolean };
type Story = { id: string; title: string; status: string; visibility: string; created_at: string };
type Log = { id: string; action_type: string; target_type: string; target_id: string | null; created_at: string };
const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Vue d’ensemble", icon: Activity }, { id: "reports", label: "Signalements", icon: AlertTriangle },
  { id: "members", label: "Utilisateurs", icon: Users }, { id: "works", label: "Publications", icon: BookOpen }, { id: "history", label: "Historique", icon: FileText },
];

export function AdministrationDashboard() {
  const [loading,setLoading] = useState(true), [allowed,setAllowed] = useState(false), [tab,setTab] = useState<Tab>("overview");
  const [adminId,setAdminId] = useState(""), [reports,setReports] = useState<Report[]>([]), [members,setMembers] = useState<Member[]>([]);
  const [stories,setStories] = useState<Story[]>([]), [logs,setLogs] = useState<Log[]>([]), [comments,setComments] = useState<Record<string,{content:string;story_id:string}>>({});
  const [titles,setTitles] = useState<Record<string,string>>({}), [warningFor,setWarningFor] = useState<Member|null>(null), [warningReason,setWarningReason] = useState("");
  const [error,setError] = useState(""), [busy,setBusy] = useState<string|null>(null);

  async function load() {
    setLoading(true); const db = getSupabaseBrowserClient() as any;
    const {data:{user}} = await db.auth.getUser();
    if (!user) { setAllowed(false); setLoading(false); return; }
    const {data:membership,error:memberError} = await db.from("platform_admins").select("user_id").eq("user_id",user.id).maybeSingle();
    if (memberError || !membership) { setAllowed(false); setLoading(false); return; }
    setAdminId(user.id); setAllowed(true);
    const [r,m,s,l] = await Promise.all([
      db.from("story_comment_reports").select("id,comment_id,reporter_id,reason,created_at,status").order("created_at",{ascending:false}),
      db.from("profiles").select("id,username,display_name,created_at,is_public").order("created_at",{ascending:false}).limit(100),
      db.from("stories").select("id,title,status,visibility,created_at").order("created_at",{ascending:false}).limit(100),
      db.from("admin_action_logs").select("id,action_type,target_type,target_id,created_at").order("created_at",{ascending:false}).limit(100)
    ]);
    if (r.error || m.error || s.error || l.error) setError("Certaines données n’ont pas pu être chargées.");
    const reportRows = (r.data ?? []) as Report[]; setReports(reportRows); setMembers((m.data ?? []) as Member[]); setStories((s.data ?? []) as Story[]); setLogs((l.data ?? []) as Log[]);
    const ids = [...new Set(reportRows.map(x=>x.comment_id))];
    if (ids.length) {
      const {data:cs} = await db.from("story_comments").select("id,content,story_id").in("id",ids);
      const cm: Record<string,{content:string;story_id:string}> = {}; for (const c of cs ?? []) cm[c.id]=c; setComments(cm);
      const sids = [...new Set(Object.values(cm).map(c=>c.story_id))];
      if (sids.length) { const {data:ss} = await db.from("stories").select("id,title").in("id",sids); const tm:Record<string,string>={}; for(const x of ss??[]) tm[x.id]=x.title; setTitles(tm); }
    } else { setComments({}); setTitles({}); }
    setError(""); setLoading(false);
  }
  useEffect(()=>{void load();},[]);

  async function logAction(action:string,type:string,id:string,details:Record<string,unknown>={}) {
    const db=getSupabaseBrowserClient() as any;
    await db.from("admin_action_logs").insert({admin_id:adminId,action_type:action,target_type:type,target_id:id,details});
  }
  async function updateReport(report:Report,status:"reviewed"|"dismissed") {
    setBusy(report.id); const db=getSupabaseBrowserClient() as any;
    const {error:e}=await db.from("story_comment_reports").update({status,reviewed_by:adminId,reviewed_at:new Date().toISOString()}).eq("id",report.id);
    if(e) setError("Cette action n’a pas pu être enregistrée.");
    else { await logAction(status==="reviewed"?"report_reviewed":"report_dismissed","comment_report",report.id,{status}); await load(); }
    setBusy(null);
  }
  async function issueWarning() {
    if(!warningFor || !warningReason.trim()) return;
    setBusy(warningFor.id); const db=getSupabaseBrowserClient() as any;
    const {error:e}=await db.from("user_moderation_actions").insert({user_id:warningFor.id,admin_id:adminId,action_type:"warning",reason:warningReason.trim()});
    if(e) setError("L’avertissement n’a pas pu être enregistré.");
    else { await logAction("user_warning","user",warningFor.id,{reason:warningReason.trim()}); setWarningFor(null); setWarningReason(""); await load(); }
    setBusy(null);
  }

  if(loading) return <div className="admin-panel"><p>Chargement de l’administration…</p></div>;
  if(!allowed) return <div className="admin-panel admin-denied"><ShieldCheck size={30}/><h2>Accès réservé</h2><p>Cette partie est réservée aux administrateurs autorisés de Book-A-Boo.</p><Link href="/connexion">Se connecter</Link></div>;
  const pending=reports.filter(r=>r.status==="pending").length, done=reports.filter(r=>r.status==="reviewed").length, dismissed=reports.filter(r=>r.status==="dismissed").length;
  return <div className="admin-panel">
    <div className="admin-welcome"><div><span>ESPACE PRIVÉ · ADMINISTRATEURS</span><h2>Administration</h2><p>Le centre de gestion et de modération de Book-A-Boo.</p></div><ShieldCheck size={30}/></div>
    <nav className="admin-tabs" aria-label="Rubriques d’administration">{tabs.map(t=>{const Icon=t.icon;return <button key={t.id} className={tab===t.id?"active":""} onClick={()=>setTab(t.id)}><Icon size={16}/>{t.label}</button>;})}</nav>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {tab==="overview" && <>
      <div className="admin-stats">
        <article><AlertTriangle/><strong>{pending}</strong><span>Signalements à examiner</span></article>
        <article><Users/><strong>{members.length}</strong><span>Profils membres chargés</span></article>
        <article><BookOpen/><strong>{stories.length}</strong><span>Œuvres chargées</span></article>
        <article><CheckCircle2/><strong>{done}</strong><span>Signalements traités</span></article>
        <article><XCircle/><strong>{dismissed}</strong><span>Signalements écartés</span></article>
        <article><FileText/><strong>{logs.length}</strong><span>Actions récentes consignées</span></article>
      </div>
      <div className="admin-overview-grid">{tabs.slice(1).map(t=>{const Icon=t.icon;return <button key={t.id} onClick={()=>setTab(t.id)}><Icon/><strong>{t.label}</strong><span>{t.id==="reports"?"Examiner les signalements":t.id==="members"?"Consulter les comptes et avertir":t.id==="works"?"Consulter les publications":"Consulter les décisions enregistrées"}</span></button>;})}</div>
      <p className="admin-footnote">Les listes de membres et d’œuvres affichent les 100 entrées les plus récentes.</p>
    </>}
    {tab==="reports" && <>
      <div className="admin-section-heading"><div><span>MODÉRATION</span><h3>Signalements de commentaires</h3></div><span>{reports.length} au total · {pending} en attente</span></div>
      {!reports.length?<div className="admin-empty"><Clock3/><p>Aucun signalement pour le moment.</p></div>:<div className="admin-report-list">{reports.map(r=>{const c=comments[r.comment_id];return <article className="admin-report" key={r.id}>
        <div className="admin-report-top"><span className={`admin-status admin-status-${r.status}`}>{r.status==="pending"?"À examiner":r.status==="reviewed"?"Traité":"Écarté"}</span><time>{new Date(r.created_at).toLocaleString("fr-FR")}</time></div>
        <p className="admin-report-reason"><strong>Motif :</strong> {r.reason}</p>
        {c?<div className="admin-reported-content"><small>Œuvre : {titles[c.story_id]??"Œuvre"}</small><p>{c.content}</p></div>:<p>Le commentaire signalé n’est plus disponible.</p>}
        {r.status==="pending"&&<div className="admin-report-actions"><button disabled={busy===r.id} onClick={()=>void updateReport(r,"reviewed")}><CheckCircle2 size={15}/> Marquer comme traité</button><button className="secondary" disabled={busy===r.id} onClick={()=>void updateReport(r,"dismissed")}><XCircle size={15}/> Écarter</button></div>}
      </article>;})}</div>}
      <p className="admin-footnote">Les tables pour recevoir les signalements d’œuvres et de profils sont créées. Leurs formulaires de signalement publics restent à raccorder.</p>
    </>}
    {tab==="members" && <>
      <div className="admin-section-heading"><div><span>COMMUNAUTÉ</span><h3>Utilisateurs</h3></div><span>{members.length} profils récents</span></div>
      <div className="admin-member-list">{members.map(m=><article className="admin-member" key={m.id}><div><strong>{m.display_name||m.username}</strong><span>@{m.username} · {m.is_public?"Profil public":"Profil privé"}</span><small>Inscrit le {new Date(m.created_at).toLocaleDateString("fr-FR")}</small></div><button onClick={()=>{setWarningFor(m);setWarningReason("");}}>Enregistrer un avertissement</button></article>)}</div>
      {warningFor&&<div className="admin-warning-form"><h4>Avertissement · {warningFor.display_name||warningFor.username}</h4><label htmlFor="admin-warning-reason">Motif</label><textarea id="admin-warning-reason" rows={3} value={warningReason} onChange={e=>setWarningReason(e.target.value)} placeholder="Explique la raison de cet avertissement…"/><div className="admin-report-actions"><button disabled={!warningReason.trim()||busy===warningFor.id} onClick={()=>void issueWarning()}>Enregistrer</button><button className="secondary" onClick={()=>setWarningFor(null)}>Annuler</button></div></div>}
      <p className="admin-footnote">La suspension effective d’un compte nécessite une action serveur sécurisée sur l’authentification. Elle n’est pas activée depuis cet écran.</p>
    </>}
    {tab==="works"&&<>
      <div className="admin-section-heading"><div><span>CATALOGUE</span><h3>Contenus et publications</h3></div><span>{stories.length} œuvres récentes</span></div>
      <div className="admin-work-list">{stories.map(s=><article className="admin-work" key={s.id}><div><strong>{s.title}</strong><span>{s.status} · {s.visibility} · {new Date(s.created_at).toLocaleDateString("fr-FR")}</span></div><span>{s.id.slice(0,8)}</span></article>)}</div>
    </>}
    {tab==="history"&&<>
      <div className="admin-section-heading"><div><span>TRAÇABILITÉ</span><h3>Historique des actions</h3></div><span>{logs.length} actions récentes</span></div>
      {!logs.length?<div className="admin-empty"><Clock3/><p>Aucune action administrative enregistrée.</p></div>:<div className="admin-log-list">{logs.map(l=><article key={l.id}><div><strong>{l.action_type.replaceAll("_"," ")}</strong><span>{l.target_type}{l.target_id?" · "+l.target_id.slice(0,8):""}</span></div><time>{new Date(l.created_at).toLocaleString("fr-FR")}</time></article>)}</div>}
    </>}
    <p className="admin-footnote">Administration et Rédaction sont deux espaces indépendants : les droits de l’un ne donnent pas automatiquement accès à l’autre.</p>
  </div>;
}
