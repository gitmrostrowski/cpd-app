"use server";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export async function supabaseServer() {
  if (!SUPABASE_URL) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
