// lib/supabase.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  // ⬅️ W Next 15 cookies() jest asynchroniczne
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Te dwie metody nie są potrzebne w większości SSR scenariuszy — zostawiamy jako no-op,
        // ale zachowujemy podpis typów, żeby @supabase/ssr był zadowolony.
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

