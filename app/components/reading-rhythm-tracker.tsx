"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Chapter = { id: string; chapter_number: number; content: string };
type Props = { storyId: string; chapter: Chapter; children: ReactNode };

function countWords(value: string) {
  return value.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

export function ReadingRhythmTracker({ storyId, chapter, children }: Props) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const wordCount = countWords(chapter.content || "");

  useEffect(() => {
    let cancelled = false;
    let userId = "";
    let baseSeconds = 0;
    let accumulatedSeconds = 0;
    let baseWords = 0;
    let lastActivity = 0;
    let lastTick = Date.now();
    let lastSavedAt = 0;
    let currentRatio = 0;
    let restored = false;
    const supabase = getSupabaseBrowserClient() as any;

    async function initialize() {
      const [{ data: auth }, { data: preference }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("user_reading_preferences").select("tracking_enabled").maybeSingle()
      ]);
      if (cancelled || !auth?.user?.id) { setReady(true); return; }
      userId = auth.user.id;
      const isEnabled = preference?.tracking_enabled ?? true;
      setEnabled(isEnabled);
      enabledRef.current = isEnabled;
      if (!isEnabled) { setReady(true); return; }

      const { data: saved } = await supabase.from("user_reading_progress")
        .select("scroll_ratio,words_read,active_seconds")
        .eq("user_id", userId).eq("story_id", storyId).eq("chapter_id", chapter.id).maybeSingle();
      if (cancelled) return;
      baseSeconds = saved?.active_seconds ?? 0;
      baseWords = saved?.words_read ?? 0;
      currentRatio = saved?.scroll_ratio ?? 0;
      setProgress(Math.round(currentRatio * 100));
      setActiveSeconds(baseSeconds);

      if (currentRatio > 0 && !restored) {
        restored = true;
        requestAnimationFrame(() => {
          const node = articleRef.current;
          if (!node) return;
          const top = node.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: top + Math.max(0, node.offsetHeight - window.innerHeight) * currentRatio, behavior: "auto" });
        });
      }
      lastActivity = Date.now();
      setReady(true);
    }

    function measure() {
      const node = articleRef.current;
      if (!node) return;
      const top = node.getBoundingClientRect().top + window.scrollY;
      const available = Math.max(1, node.offsetHeight - window.innerHeight);
      currentRatio = Math.min(1, Math.max(0, (window.scrollY - top) / available));
      setProgress(Math.round(currentRatio * 100));
      lastActivity = Date.now();
    }

    async function save() {
      if (!userId || !enabledRef.current || document.visibilityState !== "visible") return;
      const now = Date.now();
      const seconds = Math.floor(accumulatedSeconds);
      const words = Math.max(baseWords, Math.round(wordCount * currentRatio));
      const { error } = await supabase.from("user_reading_progress").upsert({
        user_id: userId,
        story_id: storyId,
        chapter_id: chapter.id,
        chapter_number: chapter.chapter_number,
        scroll_ratio: Number(currentRatio.toFixed(4)),
        words_read: words,
        active_seconds: baseSeconds + seconds,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,story_id,chapter_id" });
      if (!error) {
        baseSeconds += seconds;
        accumulatedSeconds = 0;
        baseWords = words;
        lastSavedAt = now;
        setActiveSeconds(baseSeconds);
      }
    }

    void initialize();
    const activity = () => { lastActivity = Date.now(); };
    const onScroll = () => { measure(); };
    const onVisibility = () => { lastTick = Date.now(); if (document.visibilityState === "visible") activity(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    window.addEventListener("touchstart", activity, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(15, Math.max(0, (now - lastTick) / 1000));
      lastTick = now;
      if (document.visibilityState === "visible" && now - lastActivity < 60000 && userId && enabledRef.current) {
        accumulatedSeconds += elapsed;
        setActiveSeconds(baseSeconds + Math.floor(accumulatedSeconds));
      }
      if (userId && enabledRef.current && now - lastSavedAt >= 15000) void save();
    }, 5000);
    const onPageHide = () => { void save(); };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("touchstart", activity);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      void save();
    };
  }, [storyId, chapter.id, chapter.chapter_number, chapter.content, wordCount]);

  const minutes = Math.floor(activeSeconds / 60);
  const seconds = activeSeconds % 60;
  const estimatedSpeed = activeSeconds > 0 ? Math.round((wordCount * progress / 100) / (activeSeconds / 60)) : 0;
  const remainingMinutes = estimatedSpeed > 0 ? Math.ceil((wordCount * (1 - progress / 100)) / estimatedSpeed) : null;

  return (
    <div className="reading-rhythm-wrap">
      {ready && enabled && (
        <div className="reading-rhythm-inline" aria-live="polite">
          <div className="reading-rhythm-inline-top"><span>Progression du chapitre</span><strong>{progress}%</strong></div>
          <div className="reading-rhythm-track"><span style={{ width: progress + "%" }} /></div>
          <small>Temps actif : {minutes} min {seconds.toString().padStart(2, "0")} s · Vitesse estimée : {estimatedSpeed || "—"} mots/min · Temps restant : {remainingMinutes === null ? "calcul en cours" : remainingMinutes + " min"}</small>
        </div>
      )}
      <div ref={articleRef}>{children}</div>
    </div>
  );
}
