"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const REPORTS_READY = false;

const LOGIN_HREF = "/login";
const REGISTER_HREF = "/rejestracja";

type NavItem = {
  href: string;
  label: string;
  soon?: boolean;
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/kalkulator", label: "Kalkulator" },
  { href: "/aktywnosci", label: "Aktywności" },
  { href: "/raporty", label: "Raporty" },
  { href: "/baza-szkolen", label: "Baza szkoleń" },
];

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function Header() {
  const pathname = usePathname();

  const [openMobile, setOpenMobile] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setOpenMobile(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) setOpenUser(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const linkCls = (href: string, disabled?: boolean) =>
    cx(
      "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
      disabled
        ? "text-slate-500 cursor-not-allowed opacity-70"
        : isActive(href)
        ? "bg-slate-100 text-slate-900"
        : "text-slate-900 hover:bg-slate-50"
    );

  const emailShort = useMemo(() => {
    const em = user?.email || "";
    if (!em) return "";
    if (em.length <= 28) return em;
    const [name, domain] = em.split("@");
    if (!domain) return em.slice(0, 28) + "…";
    const n = name.length > 10 ? name.slice(0, 10) + "…" : name;
    return `${n}@${domain}`;
  }, [user?.email]);

  async function handleSignOut() {
    await signOut();
    setOpenMobile(false);
    setOpenUser(false);
  }

  const logoHref = user ? "/kalkulator" : "/";

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href={logoHref} className="flex items-center gap-2 shrink-0">
            <Image src="/logo.svg" alt="Logo" width={28} height={28} />
            <span className="font-semibold text-slate-900">CRPE</span>
          </Link>

          {/* NAV DESKTOP (przesunięte w prawo) */}
          <nav className="hidden sm:flex flex-1 items-center justify-end">
            <div className="flex items-center gap-1 rounded-2xl border border-blue-200/60 bg-white px-1 py-1 shadow-sm">
              {NAV.map(({ href, label, soon }) => (
                <Link
                  key={href}
                  href={href}
                  className={linkCls(href, !!soon)}
                  aria-current={isActive(href) ? "page" : undefined}
                  aria-disabled={soon ? true : undefined}
                  tabIndex={soon ? -1 : undefined}
                  onClick={(e) => {
                    if (soon) e.preventDefault();
                  }}
                  title={soon ? "Wkrótce" : undefined}
                >
                  <span>{label}</span>
                  {soon ? (
                    <span className="ml-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      Wkrótce
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </nav>

          {/* RIGHT SIDE (DESKTOP) */}
          <div className="hidden sm:flex items-center gap-2">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                Sprawdzam sesję…
              </div>
            ) : user ? (
              <>
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">{emailShort}</span>
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setOpenUser((v) => !v)}
                    className={cx(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                      openUser
                        ? "border-blue-200 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                    aria-label="Menu użytkownika"
                    title="Menu"
                  >
                    👤
                  </button>

                  {openUser ? (
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white shadow-lg p-2">
                      <div className="px-3 py-2 text-xs text-slate-500">
                        Zalogowany jako
                        <div className="mt-1 text-sm font-medium text-slate-800">
                          {user.email}
                        </div>
                      </div>

                      <div className="my-2 h-px bg-slate-100" />

                      <Link
                        href="/profil"
                        className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setOpenUser(false)}
                      >
                        Profil i ustawienia
                      </Link>

                      <Link
                        href="/kalkulator"
                        className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setOpenUser(false)}
                      >
                        Kalkulator
                      </Link>

                      <Link
                        href="/activities"
                        className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setOpenUser(false)}
                      >
                        Aktywności
                      </Link>

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Wyloguj
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <Link
                  href={REGISTER_HREF}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                >
                  Rejestracja
                </Link>

                <Link
                  href={LOGIN_HREF}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Zaloguj
                </Link>
              </>
            )}
          </div>

          {/* HAMBURGER (MOBILE) */}
          <button
            className="sm:hidden ml-auto inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-slate-700"
            onClick={() => setOpenMobile((v) => !v)}
            aria-label="Menu"
            type="button"
          >
            ☰
          </button>
        </div>

        {/* NAV MOBILE */}
        {openMobile && (
          <nav className="sm:hidden pb-4 pt-2">
            <div className="flex flex-col gap-1">
              {NAV.map(({ href, label, soon }) => (
                <Link
                  key={href}
                  href={href}
                  className={linkCls(href, !!soon)}
                  aria-current={isActive(href) ? "page" : undefined}
                  aria-disabled={soon ? true : undefined}
                  tabIndex={soon ? -1 : undefined}
                  onClick={(e) => {
                    if (soon) {
                      e.preventDefault();
                      return;
                    }
                    setOpenMobile(false);
                  }}
                  title={soon ? "Wkrótce" : undefined}
                >
                  <span>{label}</span>
                  {soon ? (
                    <span className="ml-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                      Wkrótce
                    </span>
                  ) : null}
                </Link>
              ))}

              <div className="mt-3 flex flex-col gap-2">
                {loading ? (
                  <div className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600">
                    Sprawdzam sesję…
                  </div>
                ) : user ? (
                  <>
                    <div className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-medium">{user.email}</span>
                      </span>
                    </div>

                    <Link
                      href="/profil"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold hover:bg-slate-50"
                      onClick={() => setOpenMobile(false)}
                    >
                      Profil
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                      type="button"
                    >
                      Wyloguj
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={REGISTER_HREF}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold hover:bg-slate-50"
                      onClick={() => setOpenMobile(false)}
                    >
                      Rejestracja
                    </Link>

                    <Link
                      href={LOGIN_HREF}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                      onClick={() => setOpenMobile(false)}
                    >
                      Zaloguj
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
