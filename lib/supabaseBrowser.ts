// lib/supabaseBrowser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

function mustGetEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

function normalizeSupabaseUrl(raw: string) {
  let url = raw.trim();

  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  url = url.replace(/\/+$/, "");

  const host = new URL(url).host;
  if (!/\.supabase\.co$/i.test(host)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${url}". Expected "https://<project>.supabase.co".`
    );
  }

  return url;
}

export function createBrowserSupabase() {
  const url = normalizeSupabaseUrl(mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const anon = mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createBrowserClient(url, anon);
}
