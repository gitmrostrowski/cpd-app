"use client";

// Zachowujemy starsze nazwy importów, ale wszystkie widoki korzystają z tej
// samej instancji i tego samego magazynu sesji.
export {
  supabaseClient as supabaseBrowser,
  supabaseClient as createBrowserSupabase,
} from "@/lib/supabase/client";
