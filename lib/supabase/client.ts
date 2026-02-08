"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// ⚠️ MUSI być statycznie (Next inlinuje tylko takie odwołania)
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

let _client: SupabaseClient<Database> | null = null;

export function supabaseBrowser(): SupabaseClient<Database> {
  if (!SUPABASE_URL) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (_client) return _client;
  _client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON);
  return _client;
}
