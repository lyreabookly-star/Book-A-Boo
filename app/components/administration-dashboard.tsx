"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, BookOpen, CheckCircle2, Clock3, FileText, Flag, ShieldCheck, Users, XCircle, EyeOff, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Tab = "overview" | "reports" | "members" | "works" | "history";
type CommentReport = { id:string; comment_id:string; reporter_id:string; reason:string; created_at:string; status:"pending"|"reviewed"|"dismissed" };
type ContentReport = { id:string; target_type:"story"|"profile"; target_id:string; reporter_id:string; reason:string; details:string|null; created_at:string; status:"pending"|"reviewed"|"dismissed" };
type Member = { id:string; username:string; display_name:string|null; created_at:string; is_public:boolean };
type Story = { id:string; title:string; status:string; visibility:string; created_at:string };
type Log = { id:string; action_type:string; target_type:string; target_id:string|null; created_at:string };
type CommentInfo = { content:string; story_id:string };
const tabs:{id:Tab;label:string;icon:typeof Activity}[]=[
 {id:"overview",label:"Vue d’ensemble",icon:Activity},{id:"reports",label:"Signalements",icon:AlertTriangle},
 {id:"members",label:"Utilisateurs",icon:Users},{id:"works",label:"Publications",icon:BookOpen},{id:"history",label:"Historique",icon:FileText}
];

export function AdministrationDashboard(){
 const [loading,setLoading]=useState(true),[allowed,setAllowed]=useState(false),[tab,setTab]=useState<Tab>("overview");
 const [adminId,setAdminId]=useState(""),[commentReports,setCommentReports]=useState<CommentReport[]>([]),[contentReports,setContentReports]=useState<ContentReport[]>([]);
 const [members,setMembers]=useState<Member[]>([]),[stories,setStories]=useState<Story[]>([]),[logs,setLogs]=useState<Log[]>([]),[adminUserIds,setAdminUserIds]=useState<string[]>([]);
 const [comments,setComments]=useState<Record<string,CommentInfo>>({}),[titles,setTitles]=useState<Record<string,string>>({}),[memberNames,setMemberNames]=useState<Record<string,string>>({});
 const [warningFor,setWarningFor]=useState<Member|null>(null),[warningReason,setWarningReason]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState<string|null>(null);

 async function load(){
  setLoading(true); const db=getSupabaseBrowserClient() as any;
  const {data:{user}}=await db.auth.getUser();
  if(!user){setAllowed(false);setLoading(false);return;}
  const {data:membership,error:memberError}=await db.from("platform_admins").select("user_id").eq("user_id",user.id).maybeSingle();
  if(memberError||!membership){setAllowed(false);setLoading(false);return;}
  setAdminId(user.id);setAllowed(true);
  const [cr,pr,m,s,l,admins]=await Promise.all([
   db.from("story_comment_reports").select("id,comment_id,reporter_id,reason,created_at,status").order("created_at",{ascending:false}).limit(200),
   db.from("platform_content_reports").select("id,target_type,target_id,reporter_id,reason,details,created_at,status").order("created_at",{ascending:false}).limit(200),
   db.from("profiles").select("id,username,display_name,created_at,is_public").order("created_at",{ascending:false}).limit(100),
   db.from("stories").select("id,title,status,visibility,created_at").order("created_at",{ascending:false}).limit(100),
   db.from("admin_action_logs").select("id,action_type,target_type,target_id,created_at").order("created_at",{ascending:false}).limit(100),
   db.from("platform_admins").select("user_id")
  ]);
  const errors=[cr.error,pr.error,m.error,s.error,l.error].filter(Boolean);
  if(errors.length)setError("Certaines données n’ont pas pu être chargées. Vérifie les accès de la base.");
  else setError("");
  const crows=(cr.data??[]) as CommentReport[], prows=(pr.data??[]) as ContentReport[], ms=(m.data??[]) as Member[], ss=(s.data??[]) as Story[];
  setCommentReports(crows);setContentReports(prows);setMembers(ms);setStories(ss);setLogs((l.data??[]) as Log[]);setAdminUserIds((admins.data??[]).map((x:{user_id:string})=>x.user_id));
  const commentIds=[...new Set(crows.map(x=>x.comment_id))];
  if(commentIds.length){
   const {data:cs}=await db.from("story_comments").select("id,content,story_id").in("id",commentIds);
   const cm:Record<string,CommentInfo>={};for(const c of cs??[])cm[c.id]={content:c.content,story_id:c.story_id};setComments(cm);
   const ids=[...new Set(Object.values(cm).map(x=>x.story_id))];
   if(ids.length){const {data:ss2}=await db.from("stories").select("id,title").in("id",ids);const tm:Record<string,string>={};for(const x of ss2??[])tm[x.id]=x.title;setTitles(tm);}
  }else{setComments({});setTitles({});}
  const allIds=[...new Set([...crows.map(x=>x.reporter_id),...prows.map(x=>x.reporter_id),...ms.map(x=>x.id)])];
  if(allIds.length){const {data:people}=await db.from("profiles").select("id,username,display_name").in("id",allIds);const nm:Record<string,string>={};for(const p of people??[])nm[p.id]=p.display_name||p.username;setMemberNames(nm);}
  setLoading(false);
 }
 useEffect(()=>{void load();},[]);

 async function logAction(action:string,type:string,id:string,details:Record<string,unknown>={}){
  const db=getSupabaseBrowserClient() as any;
  const {error:e}=await db.from("admin_action_logs").insert({admin_id:adminId,action_type:action,target_type:type,target_id:id,details});
  if(e)setError("L’action a été faite, mais son inscription dans l’historique a échoué.");
 }
 async function updateCommentReport(report:CommentReport,status:"reviewed"|"dismissed"){
  setBusy(report.id);const db=getSupabaseBrowserClient() as any;
  const {error:e}=await db.from("story_comment_reports").update({status,reviewed_by:adminId,reviewed_at:new Date().toISOString()}).eq("id",report.id);
  if(e)setError("Impossible de mettre à jour ce signalement.");
  else{await logAction(status==="reviewed"?"report_reviewed":"report_dismissed","comment_report",report.id,{status});await load();}
  setBusy(null);
 }
 async function updateContentReport(report:ContentReport,status:"reviewed"|"dismissed"){
  setBusy(report.id);const db=getSupabaseBrowserClient() as any;
  const {error:e}=await db.from("platform_content_reports").update({status,reviewed_by:adminId,reviewed_at:new Date().toISOString()}).eq("id",report.id);
  if(e)setError("Impossible de mettre à jour ce signalement.");
  else{await logAction(status==="reviewed"?"content_report_reviewed":"content_report_dismissed",report.target_type,report.target_id,{report_id:report.id,status});await load();}
  setBusy(null);
 }
 async function moderateContent(report:ContentReport){
  const label=report.target_type==="story"?"cette œuvre":"ce profil";
  if(!window.confirm("Masquer "+label+" ? "+(report.target_type==="story"?"L’œuvre repassera en brouillon.":"Le profil deviendra privé.")+" Cette action est réversible par une intervention ultérieure."))return;
  setBusy(report.id);const db=getSupabaseBrowserClient() as any;
  const result=report.target_type==="story"
   ? await db.from("stories").update({status:"draft"}).eq("id",report.target_id)
   : await db.from("profiles").update({is_public:false}).eq("id",report.target_id);
  if(result.error)setError("Le contenu n’a pas pu être masqué.");
  else{await logAction(report.target_type==="story"?"story_unpublished":"profile_made_private",report.target_type,report.target_id,{report_id:report.id});await updateContentReport(report,"reviewed");}
  setBusy(null);
 }
 async function removeReportedComment(report:CommentReport){
  if(!window.confirm("Supprimer définitivement ce commentaire ? Cette action est irréversible."))return;
  setBusy(report.id);const db=getSupabaseBrowserClient() as any;
  const {error:e}=await db.from("story_comments").delete().eq("id",report.comment_id);
  if(e)setError("Le commentaire n’a pas pu être supprimé.");
  else{await logAction("comment_deleted","comment",report.comment_id,{report_id:report.id});await updateCommentReport(report,"reviewed");}
  setBusy(null);
 }
 async function issueWarning(){
  if(!warningFor||!warningReason.trim())return;
  setBusy(warningFor.id);const db=getSupabaseBrowserClient() as any;
  const {error:e}=await db.from("user_moderation_actions").insert({user_id:warningFor.id,admin_id:adminId,action_type:"warning",reason:warningReason.trim()});
  if(e)setError("L’avertissement n’a pas pu être enregistré.");
  else{await logAction("user_warning","user",warningFor.id,{reason:warningReason.trim()});setWarningFor(null);setWarningReason("");await load();}
  setBusy(null);
 }
 async function suspendMember(member:Member){
  if(adminUserIds.includes(member.id))return;
  const durationChoice=window.prompt("Choisis la durée de suspension : 1 = 24 heures, 2 = 7 jours, 3 = 100 ans.");
  const duration=durationChoice==="1"?"24h":durationChoice==="2"?"168h":durationChoice==="3"?"876000h":null;
  if(!duration)return;
  const reason=window.prompt("Motif de la suspension (au moins 3 caractères) ?");
  if(!reason?.trim()||reason.trim().length<3)return;
  if(!window.confirm("Confirmer la suspension de @"+member.username+" ?"))return;
  setBusy(member.id);const db=getSupabaseBrowserClient() as any;
  const {error:e}=await db.functions.invoke("admin-user-moderation",{body:{action:"ban",targetId:member.id,duration,reason:reason.trim()}});
  if(e)setError("La suspension n’a pas pu être appliquée. Vérifie ta connexion puis réessaie.");
  else{await load();}
  setBusy(null);
 }
 async function liftMemberSuspension(member:Member){
  if(adminUserIds.includes(member.id))return;
  if(!window.confirm("Lever la suspension de @"+member.username+" ?"))return;
  setBusy(member.id);const db=getSupabaseBrowserClient() as any;
  const {error:e}=await db.functions.invoke("admin-user-moderation",{body:{action:"unban",targetId:member.id}});
  if(e)setError("La suspension n’a pas pu être levée.");
  else{await load();}
  setBusy(null);
 }
 async function unpublishStory(story:Story){
  if(!window.confirm("Repasser « "+story.title+" » en brouillon ? Elle ne sera plus visible publiquement."))return;
  setBusy(story.id);const db=getSupabaseBrowserClient() as any;
  const {error:e}=await db.from("stories").update({status:"draft"}).eq("id",story.id);
  if(e)setError("Impossible de retirer cette œuvre du catalogue.");
  else{await logAction("story_unpublished","story",story.id,{});await load();}
  setBusy(null);
 }
 if(loading)return <div className="admin-panel"><p>Chargement de l’administration…</p></div>;
 if(!allowed)return <div className="admin-panel admin-denied"><ShieldCheck size={30}/><h2>Accès réservé</h2><p>Cette partie est réservée aux administrateurs autorisés de Book-A-Boo.</p><Link href="/connexion">Se connecter</Link></div>;
 const pending=[...commentReports.filter(x=>x.status==="pending"),...contentReports.filter(x=>x.status==="pending")].length;
 const done=commentReports.filter(x=>x.status==="reviewed").length+contentReports.filter(x=>x.status==="reviewed").length;
 const dismissed=commentReports.filter(x=>x.status==="dismissed").length+contentReports.filter(x=>x.status==="dismissed").length;
 return <div className="admin-panel">
  <div className="admin-welcome"><div><span>ESPACE PRIVÉ · ADMINISTRATEURS</span><h2>Administration</h2><p>Le centre de gestion et de modération de Book-A-Boo.</p></div><ShieldCheck size={30}/></div>
  <nav className="admin-tabs" aria-label="Rubriques d’administration">{tabs.map(t=>{const Icon=t.icon;return <button key={t.id} className={tab===t.id?"active":""} onClick={()=>setTab(t.id)}><Icon size={16}/>{t.label}</button>;})}</nav>
  {error&&<p className="admin-error" role="alert">{error}</p>}
  {tab==="overview"&&<>
   <div className="admin-stats"><article><AlertTriangle/><strong>{pending}</strong><span>Signalements à examiner</span></article><article><Users/><strong>{members.length}</strong><span>Profils membres chargés</span></article><article><BookOpen/><strong>{stories.length}</strong><span>Œuvres chargées</span></article><article><CheckCircle2/><strong>{done}</strong><span>Signalements traités</span></article><article><XCircle/><strong>{dismissed}</strong><span>Signalements écartés</span></article><article><FileText/><strong>{logs.length}</strong><span>Actions consignées</span></article></div>
   <div className="admin-overview-grid">{tabs.slice(1).map(t=>{const Icon=t.icon;return <button key={t.id} onClick={()=>setTab(t.id)}><Icon/><strong>{t.label}</strong><span>{t.id==="reports"?"Examiner œuvres, profils et commentaires":t.id==="members"?"Consulter les comptes et avertir":t.id==="works"?"Gérer les publications":"Consulter les décisions enregistrées"}</span></button>;})}</div>
   <p className="admin-footnote">Les listes affichent les 100 profils et œuvres les plus récents, et jusqu’à 200 signalements de chaque catégorie.</p>
  </>}
  {tab==="reports"&&<>
   <div className="admin-section-heading"><div><span>MODÉRATION</span><h3>Signalements de commentaires</h3></div><span>{commentReports.length} · {commentReports.filter(x=>x.status==="pending").length} en attente</span></div>
   {!commentReports.length?<div className="admin-empty"><Clock3/><p>Aucun signalement de commentaire.</p></div>:<div className="admin-report-list">{commentReports.map(r=>{const c=comments[r.comment_id];return <article className="admin-report" key={r.id}><div className="admin-report-top"><span className={"admin-status admin-status-"+r.status}>{r.status==="pending"?"À examiner":r.status==="reviewed"?"Traité":"Écarté"}</span><time>{new Date(r.created_at).toLocaleString("fr-FR")}</time></div><p><strong>Signalé par :</strong> {memberNames[r.reporter_id]||"Membre"}</p><p className="admin-report-reason"><strong>Motif :</strong> {r.reason}</p>{c?<div className="admin-reported-content"><small>Œuvre : {titles[c.story_id]||"Œuvre"}</small><p>{c.content}</p></div>:<p>Le commentaire signalé n’est plus disponible.</p>}{r.status==="pending"&&<div className="admin-report-actions"><button disabled={busy===r.id} onClick={()=>void removeReportedComment(r)}><Trash2 size={15}/> Supprimer le commentaire</button><button className="secondary" disabled={busy===r.id} onClick={()=>void updateCommentReport(r,"reviewed")}><CheckCircle2 size={15}/> Traiter sans supprimer</button><button className="secondary" disabled={busy===r.id} onClick={()=>void updateCommentReport(r,"dismissed")}><XCircle size={15}/> Écarter</button></div>}</article>;})}</div>}
   <div className="admin-section-heading"><div><span>ŒUVRES & PROFILS</span><h3>Autres signalements</h3></div><span>{contentReports.length} · {contentReports.filter(x=>x.status==="pending").length} en attente</span></div>
   {!contentReports.length?<div className="admin-empty"><Flag/><p>Aucun signalement d’œuvre ou de profil.</p></div>:<div className="admin-report-list">{contentReports.map(r=><article className="admin-report" key={r.id}><div className="admin-report-top"><span className={"admin-status admin-status-"+r.status}>{r.status==="pending"?"À examiner":r.status==="reviewed"?"Traité":"Écarté"}</span><time>{new Date(r.created_at).toLocaleString("fr-FR")}</time></div><p><strong>Cible :</strong> {r.target_type==="story"?"Œuvre":"Profil"} · {r.target_id.slice(0,8)}</p><p><strong>Signalé par :</strong> {memberNames[r.reporter_id]||"Membre"}</p><p className="admin-report-reason"><strong>Motif :</strong> {r.reason}</p>{r.details&&<p>{r.details}</p>}{r.status==="pending"&&<div className="admin-report-actions"><button disabled={busy===r.id} onClick={()=>void moderateContent(r)}><EyeOff size={15}/> Masquer le contenu et traiter</button><button className="secondary" disabled={busy===r.id} onClick={()=>void updateContentReport(r,"reviewed")}><CheckCircle2 size={15}/> Traiter sans masquer</button><button className="secondary" disabled={busy===r.id} onClick={()=>void updateContentReport(r,"dismissed")}><XCircle size={15}/> Écarter</button></div>}</article>)}</div>}
  </>}
  {tab==="members"&&<>
   <div className="admin-section-heading"><div><span>COMMUNAUTÉ</span><h3>Utilisateurs</h3></div><span>{members.length} profils récents</span></div>
   <div className="admin-member-list">{members.map(m=><article className="admin-member" key={m.id}><div><strong>{m.display_name||m.username}</strong><span>@{m.username} · {m.is_public?"Profil public":"Profil privé"}</span><small>Inscrit le {new Date(m.created_at).toLocaleDateString("fr-FR")}</small></div><div className="admin-member-actions"><button onClick={()=>{setWarningFor(m);setWarningReason("");}}>Avertir</button><button disabled={busy===m.id||adminUserIds.includes(m.id)} onClick={()=>void suspendMember(m)}>Suspendre</button><button className="secondary" disabled={busy===m.id||adminUserIds.includes(m.id)} onClick={()=>void liftMemberSuspension(m)}>Lever suspension</button></div></article>)}</div>
   {warningFor&&<div className="admin-warning-form"><h4>Avertissement · {warningFor.display_name||warningFor.username}</h4><label htmlFor="admin-warning-reason">Motif</label><textarea id="admin-warning-reason" rows={3} value={warningReason} onChange={e=>setWarningReason(e.target.value)} placeholder="Explique la raison de cet avertissement…"/><div className="admin-report-actions"><button disabled={!warningReason.trim()||busy===warningFor.id} onClick={()=>void issueWarning()}>Enregistrer</button><button className="secondary" onClick={()=>setWarningFor(null)}>Annuler</button></div></div>}
   <p className="admin-footnote">Les avertissements sont enregistrés et consultables dans l’historique. Les suspensions passent par une fonction serveur qui vérifie les droits administrateur et exclut les comptes administrateurs.</p>
  </>}
  {tab==="works"&&<>
   <div className="admin-section-heading"><div><span>CATALOGUE</span><h3>Contenus et publications</h3></div><span>{stories.length} œuvres récentes</span></div>
   <div className="admin-work-list">{stories.map(s=><article className="admin-work" key={s.id}><div><strong>{s.title}</strong><span>{s.status} · {s.visibility} · {new Date(s.created_at).toLocaleDateString("fr-FR")}</span></div>{s.status==="published"&&<button className="secondary" disabled={busy===s.id} onClick={()=>void unpublishStory(s)}><EyeOff size={14}/> Retirer du catalogue</button>}</article>)}</div>
  </>}
  {tab==="history"&&<><div className="admin-section-heading"><div><span>TRAÇABILITÉ</span><h3>Historique des actions</h3></div><span>{logs.length} actions récentes</span></div>{!logs.length?<div className="admin-empty"><Clock3/><p>Aucune action administrative enregistrée.</p></div>:<div className="admin-log-list">{logs.map(l=><article key={l.id}><div><strong>{l.action_type.replaceAll("_"," ")}</strong><span>{l.target_type}{l.target_id?" · "+l.target_id.slice(0,8):""}</span></div><time>{new Date(l.created_at).toLocaleString("fr-FR")}</time></article>)}</div>}</>}
  <p className="admin-footnote">Administration et Rédaction sont deux espaces indépendants : les droits de l’un ne donnent pas automatiquement accès à l’autre.</p>
 </div>;
}
