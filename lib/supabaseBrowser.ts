"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export function supabaseBrowser() {
  if (!SUPABASE_URL) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ✅ alias pod Twoje istniejące importy w app/page.tsx
export const createBrowserSupabase = supabaseBrowser;
