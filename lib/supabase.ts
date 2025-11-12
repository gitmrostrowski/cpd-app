// lib/supabase.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Next 15: cookies() jest asynchroniczne.
 * Zwracamy klienta Supabase skonfigurowanego pod App Router (SSR).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // W server components zwykle nie ustawiamy ciasteczek – no-op:
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  );
}

// umożliwiamy oba style importu:
//   import { createClient } from '@/lib/supabase'
//   import createClient from '@/lib/supabase'
export default createClient;
