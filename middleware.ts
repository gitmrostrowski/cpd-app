// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // tylko /admin/*
  if (!req.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();

  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login"; // dopasuj jeśli masz inną ścieżkę logowania
    return NextResponse.redirect(url);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id) // <- UWAGA: na screenie masz user_id jako klucz
    .maybeSingle();

  if (error || !profile || profile.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/profil"; // albo "/" jak wolisz
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
