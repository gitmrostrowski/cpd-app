// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * Synchroniczny klient serwerowy — NIE używaj await przy wywołaniu.
 * Dzięki temu supabase.auth.* jest dostępne i TS nie zgłasza błędów.
 */
export function supabaseServer() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Next 14/15: nie ustawiamy z serwera — no-op
        set() {},
        remove() {},
      },
    }
  );
}
