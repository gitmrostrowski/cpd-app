"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },           // możesz zostawić "Dashboard" jeśli wolisz
  { href: "/kalkulator", label: "Kalkulator" },
  { href: "/raporty", label: "Raporty" },
  { href: "/profil", label: "Profil" }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // zamknij panel mobilny po wejściu w ≥640px
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
        ? "bg-slate-200/70 dark:bg-white/10 font-semibold"
        : "hover:bg-black/5 dark:hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo + nazwa */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={28} height={28} />
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              CRPE
            </span>
          </Link>

          {/* NAV DESKTOP – zawsze widoczne od ≥640px, przycisk po prawej */}
          <nav className="hidden sm:flex items-center gap-2 ml-auto">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={linkCls(href)}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/login"
              className="ml-3 rounded-xl border px-4 py-2 font-medium hover:bg-black/5 dark:hover:bg-white/10 border-slate-300 dark:border-slate-700"
            >
              Portfolio Dashboard
            </Link>
          </nav>

          {/* HAMBURGER – tylko <640px */}
          <button
            className="sm:hidden ml-auto inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-700 dark:text-slate-100"
            onClick={() => setOpen(v => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>

        {/* NAV MOBILE – tylko <640px */}
        {open && (
          <nav className="sm:hidden pb-3">
            <div className="flex flex-col gap-1">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={linkCls(href)}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}

              <Link
                href="/login"
                className="mt-2 rounded-xl border px-4 py-2 border-slate-300 dark:border-slate-700"
                onClick={() => setOpen(false)}
              >
                Portfolio Dashboard
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
