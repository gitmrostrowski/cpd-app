"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

let _client: SupabaseClient<Database> | null = null;

export function supabaseClient(): SupabaseClient<Database> {
  if (!SUPABASE_URL) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (_client) return _client;
  // Jeden klient oparty na ciasteczkach dla całej aplikacji. Dzięki temu sesja
  // utworzona przez /auth/callback jest widoczna również w komponentach klienta.
  _client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

export const supabaseBrowser = supabaseClient;
