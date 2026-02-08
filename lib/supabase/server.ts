import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

function mustGetEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing env: ${name}`);
  }
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

/**
 * Server-side Supabase client (Next 16 / App Router)
 */
export async function supabaseServer(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  const url = normalizeSupabaseUrl(mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const anon = mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient<Database>(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // App Router: cookies mutujemy tylko w Route Handlers / Middleware
      set() {},
      remove() {},
    },
  });
}
