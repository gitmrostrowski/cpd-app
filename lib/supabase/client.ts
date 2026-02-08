"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../types/supabase";

function mustGetEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return v.trim();
}

function normalizeSupabaseUrl(raw: string) {
  let url = raw.trim();

  // jeśli ktoś wkleił bez https
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  // usuń trailing slash (czasem robi problemy w niektórych setupach)
  url = url.replace(/\/+$/, "");

  // twarda walidacja: musi być *.supabase.co
  if (!/\.supabase\.co$/i.test(new URL(url).host)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${url}". Expected something like "https://<project>.supabase.co".`
    );
  }

  return url;
}

export function supabaseClient() {
  const url = normalizeSupabaseUrl(mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const anon = mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createBrowserClient<Database>(url, anon);
}
