// lib/supabase/index.ts
export { supabaseServer as createClient } from "./server";
// jeśli gdzieś miałeś kiedyś createServerSupabase — też podajemy alias:
export { supabaseServer as createServerSupabase } from "./server";
export { supabaseClient as createBrowserClient } from "./client";
