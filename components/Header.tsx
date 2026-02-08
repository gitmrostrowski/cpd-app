"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/kalkulator", label: "Kalkulator" },
  { href: "/raporty", label: "Raporty" },
  { href: "/profil", label: "Profil" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const linkCls = (href: string) =>
    `px-4 py-2 rounded-xl text-sm transition-colors ${
      pathname === href
        ? "bg-blue-50 text-blue-700 font-semibold"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  const isActive = (href: string) => pathname === href;

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    // opcjonalnie: możesz przekierować po wylogowaniu, ale nie jest to konieczne
    // router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white backdrop-blur shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={28} height={28} />
            <span className="font-semibold text-slate-900">CRPE</span>
          </Link>

          {/* NAV DESKTOP */}
          <nav className="hidden sm:flex items-center gap-2 ml-auto">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={linkCls(href)}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}

            {/* AUTH AREA (DESKTOP) */}
            <div className="ml-3 flex items-center gap-2">
              {loading ? (
                <div className="rounded-xl border px-3 py-2 text-sm text-slate-600">
                  Sprawdzam sesję…
                </div>
              ) : user ? (
                <>
                  <div className="hidden md:block rounded-xl border px-3 py-2 text-sm">
                    ✅ Zalogowany: <span className="font-medium">{user.email}</span>
                  </div>

                  {/* “Ludzik” */}
                  <Link
                    href="/profil"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border hover:bg-slate-50"
                    aria-label="Profil"
                    title="Profil"
                  >
                    👤
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                    type="button"
                  >
                    Wyloguj
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                  Zaloguj / Portfolio
                </Link>
              )}
            </div>
          </nav>

          {/* HAMBURGER */}
          <button
            className="sm:hidden ml-auto inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-slate-700"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>

        {/* NAV MOBILE */}
        {open && (
          <nav className="sm:hidden pb-4 pt-2">
            <div className="flex flex-col gap-1">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={linkCls(href)}
                  aria-current={isActive(href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}

              {/* AUTH AREA (MOBILE) */}
              <div className="mt-3 flex flex-col gap-2">
                {loading ? (
                  <div className="rounded-xl border px-4 py-2 text-sm text-slate-600">
                    Sprawdzam sesję…
                  </div>
                ) : user ? (
                  <>
                    <div className="rounded-xl border px-4 py-2 text-sm">
                      ✅ Zalogowany: <span className="font-medium">{user.email}</span>
                    </div>

                    <Link
                      href="/profil"
                      className="rounded-xl border px-4 py-2 text-center text-sm font-medium hover:bg-slate-50"
                      onClick={() => setOpen(false)}
                    >
                      👤 Profil i ustawienia
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      type="button"
                    >
                      Wyloguj
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                    onClick={() => setOpen(false)}
                  >
                    Zaloguj / Portfolio
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
