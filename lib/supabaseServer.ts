// lib/supabaseServer.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  // Next 15: cookies() jest asynchroniczne i zwraca ReadonlyRequestCookies
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // W App Routerze (bez NextResponse) nie ustawiamy cookies – to no-op.
        set(_name: string, _value: string, _options: CookieOptions) {
          /* no-op on server */
        },
        remove(_name: string, _options: CookieOptions) {
          /* no-op on server */
        },
      },
    }
  );
}
