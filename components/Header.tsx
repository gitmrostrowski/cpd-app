"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  House,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

const LOGIN_HREF = "/login";
const REGISTER_HREF = "/rejestracja";

type NavItem = {
  href: string;
  label: string;
  mobileDescription?: string;
  icon?: LucideIcon;
};

const PUBLIC_NAV: NavItem[] = [
  { href: "/#dla-kogo", label: "Dla kogo" },
  { href: "/narzedzia", label: "Narzędzia" },
  { href: "/bezpieczenstwo", label: "Bezpieczeństwo" },
  { href: "/pomoc", label: "Pomoc" },
];

const APP_NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    mobileDescription: "Strona główna CRPE",
    icon: House,
  },
  {
    href: "/kalkulator",
    label: "Panel CPD",
    mobileDescription: "Cel, postęp i limity",
    icon: BarChart3,
  },
  {
    href: "/aktywnosci",
    label: "Aktywności",
    mobileDescription: "Wpisy i certyfikaty",
    icon: ClipboardList,
  },
  {
    href: "/baza-szkolen",
    label: "Baza szkoleń",
    mobileDescription: "Znajdź kolejną aktywność",
    icon: GraduationCap,
  },
  {
    href: "/raporty",
    label: "Raporty",
    mobileDescription: "Podsumowania i eksport",
    icon: FileBarChart,
  },
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

  useEffect(() => {
    setOpenMobile(false);
    setOpenUser(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

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

  const logoHref = "/";
  const navItems = loading ? [] : user ? APP_NAV : PUBLIC_NAV;

  return (
    <header
      className={cx(
        "sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-[box-shadow,border-color,background-color] duration-300",
        scrolled
          ? "border-slate-200 shadow-[0_10px_30px_rgba(15,45,75,0.08)]"
          : "border-slate-200/80",
      )}
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-3 sm:h-16 sm:gap-4">
          <Link
            href={logoHref}
            className="flex shrink-0 items-center gap-2.5"
            aria-label="CRPE — strona główna"
            title="Wróć na stronę główną"
          >
            <Image src="/logo.svg" alt="Logo CRPE" width={30} height={30} />
            <span className="text-base font-black tracking-tight text-slate-950">CRPE</span>
          </Link>

          <nav className="hidden min-w-0 items-center justify-center lg:flex" aria-label="Główna nawigacja">
            {loading ? (
              <div className="flex items-center gap-2" aria-hidden="true">
                {[84, 96, 108, 82].map((width) => (
                  <span
                    key={width}
                    className="h-9 animate-pulse rounded-xl bg-slate-100"
                    style={{ width }}
                  />
                ))}
              </div>
            ) : (
              <div className={cx("flex items-center", user ? "gap-1" : "gap-2")}>
                {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cx(
                      "inline-flex items-center gap-2 text-[13px] font-bold transition",
                      user
                        ? "rounded-xl px-3 py-2.5"
                        : "px-3 py-2 text-slate-700 hover:text-blue-700",
                      user && active
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                        : user
                          ? "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          : "",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {Icon ? <Icon className="h-4 w-4" strokeWidth={2.2} /> : null}
                    <span>{label}</span>
                  </Link>
                );
                })}
              </div>
            )}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {loading ? (
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
                <span className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : user ? (
              <>
                <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 2xl:flex">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">{emailShort}</span>
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setOpenUser((v) => !v)}
                    className={cx(
                      "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition",
                      openUser
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    )}
                    aria-label="Menu użytkownika"
                    title="Profil i ustawienia"
                  >
                    <UserRound className="h-5 w-5" />
                  </button>

                  {openUser ? (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_55px_rgba(15,45,75,0.16)]">
                      <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                        Zalogowany jako
                        <div className="mt-1 break-all text-sm font-semibold text-slate-900">
                          {user.email}
                        </div>
                      </div>

                      <div className="my-2 h-px bg-slate-100" />

                      <Link
                        href="/profil"
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => setOpenUser(false)}
                      >
                        <Settings className="h-4 w-4" /> Profil i ustawienia
                      </Link>

                      {isAdmin ? (
                        <Link
                          href="/admin/szkolenia"
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                          onClick={() => setOpenUser(false)}
                        >
                          <GraduationCap className="h-4 w-4" /> Szkolenia (admin)
                        </Link>
                      ) : null}

                      <div className="my-2 h-px bg-slate-100" />

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <LogOut className="h-4 w-4" /> Wyloguj
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

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            {!loading && !user ? (
              <Link
                href={LOGIN_HREF}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-3 text-[12px] font-extrabold text-blue-700"
              >
                Zaloguj
              </Link>
            ) : null}
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              onClick={() => setOpenMobile((v) => !v)}
              aria-label={openMobile ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={openMobile}
              type="button"
            >
              {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {openMobile ? (
          <nav className="border-t border-slate-100 pb-4 pt-3 lg:hidden">
            {loading ? (
              <div className="grid grid-cols-2 gap-2" aria-hidden="true">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : user ? (
              <div className="grid grid-cols-2 gap-2">
                {navItems.map(({ href, label, mobileDescription, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cx(
                        "rounded-2xl border p-3 transition",
                        href === "/" && "col-span-2",
                        active
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <div className="flex items-center gap-2 text-sm font-extrabold">
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                        {label}
                      </div>
                      <p className="mt-1 text-[11px] leading-4 text-slate-500">
                        {mobileDescription}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {navItems.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
              {loading ? (
                <div className="h-11 animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />
              ) : user ? (
                <>
                  <div className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="truncate font-medium">{user.email}</span>
                    </span>
                  </div>

                  <Link
                    href="/profil"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4" /> Profil i ustawienia
                  </Link>

                  {isAdmin ? (
                    <Link
                      href="/admin/szkolenia"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <GraduationCap className="h-4 w-4" /> Szkolenia (admin)
                    </Link>
                  ) : null}

                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                    type="button"
                  >
                    <LogOut className="h-4 w-4" /> Wyloguj
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={LOGIN_HREF}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Zaloguj się
                  </Link>
                  <Link
                    href={REGISTER_HREF}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Załóż darmowe konto
                  </Link>
                </>
              )}
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
