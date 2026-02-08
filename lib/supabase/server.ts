import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function supabaseServer() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient<Database>(url, anon);
}
