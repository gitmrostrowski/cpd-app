"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChevronDown,
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
import {
  primaryRoleLabel,
  type OrganizationContext,
} from "@/lib/organization";
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
  { href: "/baza-szkolen", label: "Baza szkoleń" },
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
    href: "/panel-cpd",
    label: "Panel CPD",
    mobileDescription: "Cel, ewidencja i dokumenty",
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

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function accountInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
) {
  const first = firstName?.trim().charAt(0) ?? "";
  const last = lastName?.trim().charAt(0) ?? "";
  const fromName = `${first}${last}`.toLocaleUpperCase("pl-PL");
  if (fromName) return fromName;

  const localPart = email?.split("@")[0]?.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, "") ?? "";
  return (localPart.slice(0, 2) || "CR").toLocaleUpperCase("pl-PL");
}

export default function Header() {
  const pathname = usePathname();
  const [openMobile, setOpenMobile] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openContext, setOpenContext] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, loading, signOut } = useAuth();
  const userId = user?.id ?? null;
  const [role, setRole] = useState<string | null>(null);
  const [organizationContexts, setOrganizationContexts] = useState<
    OrganizationContext[]
  >([]);
  const [profileIdentity, setProfileIdentity] = useState<{
    first_name: string | null;
    last_name: string | null;
  }>({ first_name: null, last_name: null });
  const organizationCount = organizationContexts.length;
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
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setOpenUser(false);
      }
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setOpenContext(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userId) {
        setRole(null);
        setOrganizationContexts([]);
        setProfileIdentity({ first_name: null, last_name: null });
        return;
      }

      const sb = supabaseClient();
      const [
        { data, error },
        { data: organizations, error: organizationsError },
        { data: profile },
      ] = await Promise.all([
          sb
            .from("platform_staff_roles")
            .select("role_code")
            .eq("user_id", userId)
            .eq("role_code", "platform_admin")
            .is("revoked_at", null)
            .limit(1)
            .maybeSingle(),
          sb.rpc("get_my_organization_contexts"),
          sb
            .from("profiles")
            .select("first_name,last_name")
            .eq("id", userId)
            .maybeSingle(),
        ]);

      if (cancelled) return;
      setRole(!error && data ? "admin" : null);
      setOrganizationContexts(
        organizationsError
          ? []
          : ((organizations ?? []) as OrganizationContext[]),
      );
      setProfileIdentity({
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    setOpenMobile(false);
    setOpenUser(false);
    setOpenContext(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const currentOrganizationId = useMemo(() => {
    const match = pathname?.match(/^\/placowka\/([^/]+)/);
    const candidate = match?.[1] ?? "";
    return organizationContexts.some(
      (context) => context.organization_id === candidate,
    )
      ? candidate
      : null;
  }, [organizationContexts, pathname]);

  const currentOrganization = useMemo(
    () =>
      organizationContexts.find(
        (context) => context.organization_id === currentOrganizationId,
      ) ?? null,
    [currentOrganizationId, organizationContexts],
  );

  const fullName = useMemo(
    () =>
      `${profileIdentity.first_name ?? ""} ${profileIdentity.last_name ?? ""}`.trim(),
    [profileIdentity],
  );
  const initials = useMemo(
    () =>
      accountInitials(
        profileIdentity.first_name,
        profileIdentity.last_name,
        user?.email,
      ),
    [profileIdentity, user?.email],
  );

  async function handleSignOut() {
    await signOut();
    setOpenMobile(false);
    setOpenUser(false);
    setOpenContext(false);
    setRole(null);
    setOrganizationContexts([]);
    setProfileIdentity({ first_name: null, last_name: null });
  }

  const logoHref = "/";
  const publicRoutePrefixes = [
    "/dla-",
    "/narzedzia",
    "/bezpieczenstwo",
    "/pomoc",
    "/kontakt",
    "/regulamin",
    "/polityka-prywatnosci",
    "/login",
    "/rejestracja",
    "/reset-hasla",
  ];
  const isPublicRoute = pathname === "/" || publicRoutePrefixes.some((prefix) => pathname?.startsWith(prefix));
  const showPublicNav = isPublicRoute || !user;
  const navItems = loading ? [] : showPublicNav ? PUBLIC_NAV : APP_NAV;

  return (
    <header
      data-crpe-chrome="true"
      className={cx(
        "sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-[box-shadow,border-color,background-color] duration-300",
        scrolled
          ? "border-slate-200 shadow-[0_10px_30px_rgba(15,45,75,0.08)]"
          : "border-slate-200/80",
      )}
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-3 sm:h-16 sm:gap-4">
          <Link
            href={logoHref}
            className="flex shrink-0 items-center gap-2.5"
            aria-label="CRPE — strona główna"
            title="Wróć na stronę główną"
          >
            <Image src="/logo.svg" alt="Logo CRPE" width={30} height={30} />
            <span className="text-base font-black tracking-tight text-slate-950">CRPE</span>
          </Link>

          <nav className="ml-auto hidden min-w-0 items-center justify-end lg:flex" aria-label="Główna nawigacja">
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
              <div className={cx("flex items-center", showPublicNav ? "gap-2" : "gap-1")}>
                {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cx(
                      "inline-flex items-center gap-2 text-[13px] font-bold transition",
                      showPublicNav
                        ? "px-3 py-2 text-slate-700 hover:text-blue-700"
                        : "rounded-xl px-3 py-2.5",
                      !showPublicNav && active
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                        : !showPublicNav
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
                <div className="hidden items-center rounded-xl border border-slate-200 bg-white p-1 xl:flex">
                  <Link
                    href="/panel-cpd"
                    className={cx(
                      "inline-flex min-h-8 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-extrabold transition",
                      !pathname?.startsWith("/placowka")
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    )}
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    Moje CRPE
                  </Link>

                  {organizationCount > 0 ? (
                    <div className="relative" ref={contextMenuRef}>
                      <button
                        type="button"
                        onClick={() => setOpenContext((value) => !value)}
                        className={cx(
                          "inline-flex min-h-8 max-w-56 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-extrabold transition",
                          pathname?.startsWith("/placowka")
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                        )}
                        aria-expanded={openContext}
                        aria-haspopup="menu"
                        title={
                          currentOrganization?.display_name ??
                          (organizationCount === 1
                            ? organizationContexts[0].display_name
                            : "Wybierz placówkę")
                        }
                      >
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {currentOrganization?.display_name ??
                            (organizationCount === 1
                              ? organizationContexts[0].display_name
                              : `Placówki (${organizationCount})`)}
                        </span>
                        <ChevronDown
                          className={cx(
                            "h-3.5 w-3.5 shrink-0 transition",
                            openContext && "rotate-180",
                          )}
                        />
                      </button>

                      {openContext ? (
                        <div
                          className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_55px_rgba(15,45,75,0.16)]"
                          role="menu"
                        >
                          <div className="px-3 pb-2 pt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                            Placówki i role
                          </div>
                          {organizationContexts.map((context) => (
                            <Link
                              key={context.organization_id}
                              href={`/placowka/${context.organization_id}`}
                              className={cx(
                                "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                                currentOrganizationId === context.organization_id
                                  ? "bg-blue-50 text-blue-800"
                                  : "text-slate-700 hover:bg-slate-50",
                              )}
                              onClick={() => setOpenContext(false)}
                              role="menuitem"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-bold">
                                  {context.display_name}
                                </span>
                                <span className="mt-0.5 block text-xs text-slate-500">
                                  {primaryRoleLabel(context.role_codes)}
                                </span>
                              </span>
                              {currentOrganizationId ===
                              context.organization_id ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                              ) : null}
                            </Link>
                          ))}
                          {organizationCount > 1 ? (
                            <Link
                              href="/placowka"
                              className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                              onClick={() => setOpenContext(false)}
                            >
                              Pokaż wszystkie placówki
                            </Link>
                          ) : null}
                          <div className="my-2 h-px bg-slate-100" />
                          <Link
                            href="/profil#placowki-i-role"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                            onClick={() => setOpenContext(false)}
                          >
                            Zarządzaj widokiem placówek
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setOpenUser((v) => !v)}
                    className={cx(
                      "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition",
                      openUser
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-blue-800 hover:bg-blue-50",
                    )}
                    aria-label="Menu użytkownika"
                    title="Profil i ustawienia"
                  >
                    <span className="text-xs font-black tracking-wide">
                      {initials}
                    </span>
                    <span
                      className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
                      aria-label="Aktywna sesja"
                    />
                  </button>

                  {openUser ? (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_55px_rgba(15,45,75,0.16)]">
                      <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                        {fullName ? (
                          <div className="text-sm font-bold text-slate-950">
                            {fullName}
                          </div>
                        ) : (
                          <div className="font-semibold text-slate-700">
                            Konto CRPE
                          </div>
                        )}
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

                      {organizationCount > 0 ? (
                        <Link
                          href={
                            organizationCount === 1
                              ? `/placowka/${organizationContexts[0].organization_id}`
                              : "/placowka"
                          }
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                          onClick={() => setOpenUser(false)}
                        >
                          <Building2 className="h-4 w-4" /> Panel placówki
                        </Link>
                      ) : null}

                      {organizationCount > 0 ? (
                        <Link
                          href="/profil#placowki-i-role"
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => setOpenUser(false)}
                        >
                          <Building2 className="h-4 w-4" /> Placówki i role
                        </Link>
                      ) : null}

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
            ) : !loading && user ? (
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[11px] font-black text-blue-800">
                {initials}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </span>
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
            ) : !showPublicNav ? (
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
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-800">
                      {initials}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-slate-950">
                        {fullName || "Konto CRPE"}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {user.email}
                      </span>
                    </span>
                  </div>

                  <Link
                    href="/panel-cpd"
                    className={cx(
                      "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold",
                      !pathname?.startsWith("/placowka")
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <UserRound className="h-4 w-4" /> Moje CRPE
                  </Link>

                  <Link
                    href="/profil"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4" /> Profil i ustawienia
                  </Link>

                  {organizationCount > 0 ? (
                    <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-2">
                      <div className="px-2 pt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-600">
                        Placówki i role
                      </div>
                      {organizationContexts.map((context) => (
                        <Link
                          key={context.organization_id}
                          href={`/placowka/${context.organization_id}`}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-left text-sm text-slate-700 shadow-sm"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-bold">
                              {context.display_name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {primaryRoleLabel(context.role_codes)}
                            </span>
                          </span>
                          <Building2 className="h-4 w-4 shrink-0 text-blue-600" />
                        </Link>
                      ))}
                    </div>
                  ) : null}

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
