"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Client Supabase côté navigateur pour Book-A-Boo.
 * Utilise exclusivement l'URL et la clé publishable publiques.
 * Ne jamais placer une clé secret/service_role dans NEXT_PUBLIC_*.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "La connexion Supabase de Book-A-Boo n'est pas configurée. Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  if (!browserClient) {
    browserClient = createSupabaseClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}


/**
 * Canonical destination for Supabase email confirmation and password recovery.
 * Production auth links should always return to the official BAB domain.
 */
export function getAuthRedirectUrl(path: string) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const baseUrl =
    configuredSiteUrl ||
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!baseUrl) {
    throw new Error("L’adresse de retour de Book-A-Boo n’est pas configurée.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, baseUrl).toString();
}
