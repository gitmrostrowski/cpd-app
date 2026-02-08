"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// ✅ Next inlinuje tylko statyczne odwołania
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

let _client: SupabaseClient<Database> | null = null;

export function supabaseBrowser(): SupabaseClient<Database> {
  if (!SUPABASE_URL) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (_client) return _client;
  _client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}
