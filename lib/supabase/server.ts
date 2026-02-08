import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export async function supabaseServer() {
  const cookieStore = await cookies();

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // w części kontekstów (np. RSC) set może nie zadziałać — to OK
        }
      },
    },
  });
}
