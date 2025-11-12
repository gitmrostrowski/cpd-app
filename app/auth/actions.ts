// app/auth/actions.ts
"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = supabaseServer(); // bez await
  await supabase.auth.signOut();
  redirect("/");
}
