import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/supabase";

/**
 * Synchronizujemy API: cookies() bywa typowane u Ciebie jako Promise.
 * Rzutujemy je na zwykłą funkcję zwracającą store, żeby TS przestał krzyczeć.
 */
export function supabaseServer(): SupabaseClient<Database> {
  const getCookieStore = cookies as unknown as () => {
    get: (name: string) => { name: string; value: string } | undefined;
  };
  const cookieStore = getCookieStore(); // <- TERAZ SYNC dla TS

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Next 14/15: z serwera nie ustawiamy ciastek – no-op
        set() {},
        remove() {},
      },
    }
  );
}
