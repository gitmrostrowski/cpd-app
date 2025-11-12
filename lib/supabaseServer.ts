// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient, type SupabaseClient } from "@supabase/ssr";

export function createServerSupabase(): SupabaseClient {
  const cookieStore = cookies(); // <— bez await!

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Jeśli lint marudzi o "any", możesz dodać @ts-expect-error lub typ własny
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: "", ...options }); } catch {}
        },
      },
    }
  );
}
