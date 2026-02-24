// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  // ✅ na razie wyłączamy blokadę /admin,
  // bo sesja jest po stronie klienta (localStorage) i middleware jej nie widzi
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
