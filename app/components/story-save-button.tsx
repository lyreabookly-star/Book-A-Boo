"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";

export function StorySaveButton({ storyId }: { storyId: string }) {
  const router = useRouter();
  const { locale } = useAppPreferences();
  const [userId, setUserId] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (!active || !user) return;
        setUserId(user.id);
        const { data, error: queryError } = await supabase.from("user_library")
          .select("id").eq("user_id", user.id).eq("story_id", storyId).maybeSingle();
        if (queryError) throw queryError;
        if (active) setSaved(Boolean(data));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Impossible de vérifier votre bibliothèque.");
      }
    }
    void load();
    return () => { active = false; };
  }, [storyId]);

  async function save() {
    if (!userId) {
      router.push(`/connexion?next=${encodeURIComponent(`/histoire/${storyId}`)}`);
      return;
    }
    setSaving(true); setError("");
    try {
      const supabase = getSupabaseBrowserClient() as any;
      const { error: saveError } = await supabase.from("user_library")
        .upsert({ user_id: userId, story_id: storyId, status: "to_read", updated_at: new Date().toISOString() }, { onConflict: "user_id,story_id" });
      if (saveError) throw saveError;
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'enregistrement a échoué.");
    } finally { setSaving(false); }
  }

  if (saved) return <span className="story-saved-state"><Check size={15}/>{locale === "en" ? "In your library" : locale === "es" ? "En tu biblioteca" : locale === "pt" ? "Na sua biblioteca" : "Dans ma bibliothèque"} <Link href="/bibliotheque">{locale === "en" ? "View" : locale === "es" ? "Ver" : locale === "pt" ? "Ver" : "Voir"}</Link></span>;

  return <div className="story-save-wrap">
    <button type="button" className="story-save-button" onClick={save} disabled={saving}>
      {saving ? <LoaderCircle className="spin" size={15}/> : <Bookmark size={15}/>}
      {saving ? (locale === "en" ? "Saving…" : locale === "es" ? "Guardando…" : locale === "pt" ? "Salvando…" : "Enregistrement…") : (locale === "en" ? "Save to library" : locale === "es" ? "Guardar en biblioteca" : locale === "pt" ? "Salvar na biblioteca" : "Enregistrer dans ma bibliothèque")}
    </button>
    {error && <small className="story-save-error">{error}</small>}
  </div>;
}
