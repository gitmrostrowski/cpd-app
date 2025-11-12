// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export function createSupabaseServerClient(): SupabaseClient<Database> {
  const cookieStore = cookies();

  // Typy opcji pobrane z przeciążeń metod cookies()
  type SetOpts = Parameters<typeof cookieStore.set>[2];
  type DelOpts = Parameters<typeof cookieStore.delete>[1];

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Next 14/15 wspiera zarówno set(name, value, options), jak i set({ name, value, ... })
        set(name: string, value: string, options?: SetOpts) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options?: DelOpts) {
          cookieStore.delete(name, options);
        },
      },
    }
  );
}
