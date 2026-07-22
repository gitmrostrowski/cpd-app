"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

const LOGIN_HREF = "/login";
const REGISTER_HREF = "/rejestracja";

type NavItem = {
  href: string;
  label: string;
};

const PUBLIC_NAV: NavItem[] = [
  { href: "/#narzedzia", label: "Narzędzia" },
  { href: "/#jak-to-dziala", label: "Jak to działa" },
  { href: "/#dla-kogo", label: "Dla kogo" },
  { href: "/#bezpieczenstwo", label: "Bezpieczeństwo" },
  { href: "/#faq", label: "FAQ" },
];

const APP_NAV: NavItem[] = [
  { href: "/kalkulator", label: "Panel CPD" },
  { href: "/aktywnosci", label: "Aktywności" },
  { href: "/raporty", label: "Raporty" },
  { href: "/baza-szkolen", label: "Baza szkoleń" },
];

type ProfileRoleRow = { role: string | null };

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function Header() {
  const pathname = usePathname();

  const [openMobile, setOpenMobile] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const { user, loading, signOut } = useAuth();

  const [role, setRole] = useState<string | null>(null);
  const isAdmin = role === "admin";

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpenMobile(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) setOpenUser(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user) {
        setRole(null);
        return;
      }

      const sb = supabaseClient();

      const { data, error } = await sb
        .from("profiles" as any)
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const profile = (data as ProfileRoleRow | null) ?? null;
      setRole(!error && profile ? (profile.role ?? null) : null);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const linkCls = (href: string) =>
    cx(
      "inline-flex items-center gap-2 px-3 py-2 text-[13px] font-bold transition-colors",
      isActive(href)
        ? "text-blue-700"
        : "text-slate-700 hover:text-blue-700"
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
    setRole(null);
  }

  const logoHref = user ? "/kalkulator" : "/";
  const navItems = user ? APP_NAV : PUBLIC_NAV;

  return (
    <header
      className={cx(
        "sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-[box-shadow,border-color,background-color] duration-300",
        scrolled
          ? "border-slate-200 shadow-[0_10px_30px_rgba(15,45,75,0.08)]"
          : "border-slate-200/80",
      )}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-4 sm:h-16 sm:gap-5">
          <Link href={logoHref} className="flex shrink-0 items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={30} height={30} />
            <span className="text-base font-black tracking-tight text-slate-900">CRPE</span>
          </Link>

          <nav className="hidden flex-1 items-center justify-end lg:flex">
            <div className="flex items-center gap-2">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={linkCls(href)}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                Sprawdzam sesję…
              </div>
            ) : user ? (
              <>
                <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 xl:flex">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">{emailShort}</span>
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setOpenUser((v) => !v)}
                    className={cx(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                      openUser ? "border-blue-200 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                    )}
                    aria-label="Menu użytkownika"
                    title="Menu"
                  >
                    👤
                  </button>

                  {openUser ? (
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                      <div className="px-3 py-2 text-xs text-slate-500">
                        Zalogowany jako
                        <div className="mt-1 text-sm font-medium text-slate-800">{user.email}</div>
                      </div>

                      <div className="my-2 h-px bg-slate-100" />

                      <Link
                        href="/profil"
                        className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setOpenUser(false)}
                      >
                        Profil i ustawienia
                      </Link>

                      {isAdmin ? (
                        <Link
                          href="/admin/szkolenia"
                          className="flex items-center rounded-xl px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                          onClick={() => setOpenUser(false)}
                        >
                          Szkolenia (admin)
                        </Link>
                      ) : null}

                      <div className="my-2 h-px bg-slate-100" />

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
                  href={LOGIN_HREF}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-blue-700"
                >
                  Zaloguj się
                </Link>
                <Link
                  href={REGISTER_HREF}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.20)] transition hover:bg-blue-700"
                >
                  Załóż konto
                </Link>
              </>
            )}
          </div>

          <button
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-700 lg:hidden"
            onClick={() => setOpenMobile((v) => !v)}
            aria-label={openMobile ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={openMobile}
            type="button"
          >
            ☰
          </button>
        </div>

        {openMobile && (
          <nav className="pb-4 pt-2 lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={linkCls(href)}
                  aria-current={isActive(href) ? "page" : undefined}
                  onClick={() => setOpenMobile(false)}
                >
                  <span>{label}</span>
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

                    {isAdmin ? (
                      <Link
                        href="/admin/szkolenia"
                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-center text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        onClick={() => setOpenMobile(false)}
                      >
                        Szkolenia (admin)
                      </Link>
                    ) : null}

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
                      href={LOGIN_HREF}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setOpenMobile(false)}
                    >
                      Zaloguj się
                    </Link>
                    <Link
                      href={REGISTER_HREF}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                      onClick={() => setOpenMobile(false)}
                    >
                      Załóż darmowe konto
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
