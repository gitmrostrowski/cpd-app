import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
  // Na razie nie blokujemy /admin na poziomie middleware, ponieważ właściwa
  // autoryzacja administratora jest wykonywana przez Supabase w aplikacji.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
