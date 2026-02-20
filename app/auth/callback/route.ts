import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function safeNextPath(value: string | null, fallback: string) {
  if (!value) return fallback;
  // pozwalamy tylko na ścieżki względne w obrębie serwisu
  if (!value.startsWith("/")) return fallback;
  // blokujemy próby typu //evil.com
  if (value.startsWith("//")) return fallback;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const next = safeNextPath(url.searchParams.get("next"), "/kalkulator");

  if (!code) {
    return NextResponse.redirect(new URL(`/login?e=missing_code`, url.origin));
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?e=exchange_failed`, url.origin)
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
