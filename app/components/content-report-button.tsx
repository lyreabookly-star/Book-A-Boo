"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export function ContentReportButton({ targetType, targetId }: { targetType: "story" | "profile"; targetId: string }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function report() {
    const db = getSupabaseBrowserClient() as any;
    const { data: { user } } = await db.auth.getUser();
    if (!user) { setNotice("Connecte-toi pour envoyer un signalement."); return; }
    const reason = window.prompt("Pourquoi souhaites-tu signaler ce contenu ? (3 à 500 caractères)");
    if (!reason?.trim() || reason.trim().length < 3) return;
    setBusy(true); setNotice("");
    const { error } = await db.from("platform_content_reports").insert({
      target_type: targetType, target_id: targetId, reporter_id: user.id, reason: reason.trim()
    });
    setNotice(error ? (error.code === "23505" ? "Tu as déjà signalé ce contenu." : "Le signalement n’a pas pu être envoyé.") : "Merci. Ton signalement a été transmis à l’administration.");
    setBusy(false);
  }
  return <div className="content-report-control">
    <button type="button" className="auth-secondary" onClick={() => void report()} disabled={busy}>
      <Flag size={15}/> {busy ? "Envoi…" : "Signaler"}
    </button>
    {notice && <small role="status">{notice}</small>}
  </div>;
}
