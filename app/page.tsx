"use client";

// Strona główna CRPE — v6.28 „Punkty = kropki”.
// Treści bez zmian względem v6.27.x; zmieniony układ, kolorystyka, typografia, ikony i zdjęcia.
// Wspólne elementy wizualne: components/ui/crpe.tsx.

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Stethoscope,
  UploadCloud,
  UserRound,
} from "lucide-react";
import BottomCTA from "@/components/BottomCTA";
import { pageWrap } from "@/lib/layout";
import {
  DotBullet,
  DottedCurve,
  Eyebrow,
  IconBadge,
  SectionHeading,
  cx,
  pill,
} from "@/components/ui/crpe";

type AudienceKey = "medyk" | "placowka" | "organizator";

type AudienceOption = {
  key: AudienceKey;
  label: string;
  mobileLabel: string;
  shortLabel: string;
  icon: typeof Stethoscope;
  status: string;
  statusTone: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  detailsHref: string;
  detailsLabel: string;
  facts: [string, string, string];
  benefits: [string, string, string];
  image: string;
  imageAlt: string;
  imagePosition: string;
};

type RoleTheme = {
  accentStrong: string;
  accentSoft: string;
  accentText: string;
  accentRing: string;
  accentBorder: string;
};

// Kolor roli jest tylko sygnaturą (plakietka, kropka). CTA zawsze w kolorze marki.
const roleThemes: Record<AudienceKey, RoleTheme> = {
  medyk: {
    accentStrong: "bg-crpe-medyk-text",
    accentSoft: "bg-crpe-medyk-soft",
    accentText: "text-crpe-medyk-text",
    accentRing: "ring-crpe-medyk-border",
    accentBorder: "border-crpe-medyk-border",
  },
  placowka: {
    accentStrong: "bg-crpe-placowka-text",
    accentSoft: "bg-crpe-placowka-soft",
    accentText: "text-crpe-placowka-text",
    accentRing: "ring-crpe-placowka-border",
    accentBorder: "border-crpe-placowka-border",
  },
  organizator: {
    accentStrong: "bg-crpe-organizator-text",
    accentSoft: "bg-crpe-organizator-soft",
    accentText: "text-crpe-organizator-text",
    accentRing: "ring-crpe-organizator-border",
    accentBorder: "border-crpe-organizator-border",
  },
};

const statusPill = "rounded-full px-3 py-1 text-[12px] font-bold ring-1";

const audiences: AudienceOption[] = [
  {
    key: "medyk",
    label: "Medyk",
    mobileLabel: "Medyk",
    shortLabel: "Prowadzę własną ewidencję",
    icon: Stethoscope,
    status: "Dostępne teraz",
    statusTone: "bg-crpe-medyk-soft text-crpe-medyk-text ring-crpe-medyk-border",
    title: "Prowadź własną ewidencję bez arkuszy i osobnych folderów.",
    description:
      "Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj aktualny status w jednym panelu.",
    cta: "Załóż konto medyka",
    href: "/rejestracja",
    detailsHref: "/dla-medyka",
    detailsLabel: "Dowiedz się więcej o profilu medyka",
    facts: ["110/200 pkt", "18 certyfikatów", "2 wpisy do uzupełnienia"],
    benefits: ["Panel CPD i kalkulator celu", "Aktywności z certyfikatami", "Raport użytkownika i baza szkoleń"],
    image: "/home/photo-medyk.webp",
    imageAlt: "Uśmiechnięta lekarka pokazuje panel CPD na tablecie",
    imagePosition: "50% 30%",
  },
  {
    key: "placowka",
    label: "Placówka / jednostka",
    mobileLabel: "Placówka",
    shortLabel: "Wspieram zespół",
    icon: Building2,
    status: "Fundament dostępny",
    statusTone: "bg-crpe-placowka-soft text-crpe-placowka-text ring-crpe-placowka-border",
    title: "Zbuduj strukturę placówki i uporządkuj dostęp zespołu.",
    description:
      "Struktura placówki, zaproszenia i role są dostępne już dziś. Zbiorczy status zespołu, raporty i alerty są rozwijane.",
    cta: "Zobacz zakres",
    href: "/dla-placowki",
    detailsHref: "/dla-placowki",
    detailsLabel: "Dowiedz się więcej o rozwiązaniu dla placówki",
    facts: ["Jednostki", "E-mail", "Role"],
    benefits: ["Struktura placówki i jednostek", "Zaproszenia na konkretny e-mail", "Role i członkostwa zespołu"],
    image: "/home/photo-placowka-v3.webp",
    imageAlt: "Koordynatorka placówki i lekarz przeglądają dokumentację na tablecie",
    imagePosition: "50% 30%",
  },
  {
    key: "organizator",
    label: "Organizator kształcenia",
    mobileLabel: "Organizator",
    shortLabel: "Organizuję szkolenia",
    icon: GraduationCap,
    status: "Zgłoszenia dostępne",
    statusTone: "bg-crpe-organizator-soft text-crpe-organizator-text ring-crpe-organizator-border",
    title: "Opublikuj szkolenie i skieruj użytkowników do zapisów.",
    description:
      "Możesz zgłosić szkolenie do publicznej bazy i zaprezentować dane wydarzenia, logo oraz link do zapisów. Dalszy zakres rozwijamy.",
    cta: "Poznaj zakres modułu",
    href: "/dla-organizatora",
    detailsHref: "/dla-organizatora",
    detailsLabel: "Dowiedz się więcej o rozwiązaniu dla organizatora",
    facts: ["Zgłoszenie", "Logo", "Link"],
    benefits: ["Zgłoszenie do publicznej bazy", "Strona wydarzenia po publikacji", "Dane organizatora i link do zapisów"],
    image: "/home/photo-organizator-v3.webp",
    imageAlt: "Prowadząca warsztat medyczny omawia model anatomiczny z uczestnikami",
    imagePosition: "50% 25%",
  },
];

/* ─────────────────────────────── Hero ─────────────────────────────────── */

function Metric({
  icon,
  label,
  value,
}: {
  icon: typeof FileCheck2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-crpe-surface p-3">
      <IconBadge icon={icon} size="sm" tone="white" dot={false} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-crpe-muted">{label}</p>
        <p className="text-[13px] font-bold text-crpe-ink">{value}</p>
      </div>
    </div>
  );
}

function MedykDashboard() {
  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-crpe-muted">Twój postęp</p>
          <p className="font-display mt-0.5 text-[40px] font-bold leading-none tracking-[-0.03em] text-crpe-ink">
            110 <span className="font-sans text-[14px] font-bold tracking-normal text-crpe-muted">/ 200 pkt</span>
          </p>
        </div>
        <div className="rounded-2xl bg-crpe-punkt-soft px-3 py-2 text-right">
          <p className="text-[10px] font-semibold text-crpe-punkt-text">Brakuje</p>
          <p className="text-[14px] font-extrabold text-crpe-punkt-text">90 pkt</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-crpe-ice">
        <div className="crpe-progress-fill h-full w-[55%] rounded-full bg-crpe-punkt" />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-crpe-muted">
        <span>55% celu</span>
        <span>2025–2028</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric icon={FileCheck2} label="Certyfikaty" value="18 dokumentów" />
        <Metric icon={ClipboardCheck} label="Do uzupełnienia" value="2 aktywności" />
      </div>
    </>
  );
}

function ChecklistDashboard({
  eyebrow,
  title,
  rows,
  note,
}: {
  eyebrow: string;
  title: string;
  rows: string[][];
  note: string;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-crpe-muted">{eyebrow}</p>
          <p className="font-display mt-0.5 text-[18px] font-bold leading-tight text-crpe-ink">{title}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {rows.map(([name, description]) => (
          <li key={name} className="crpe-row-in flex items-center gap-2 rounded-xl bg-crpe-surface px-3 py-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-crpe-punkt-text text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-crpe-ink">{name}</p>
              <p className="sr-only">{description}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-2.5 rounded-xl bg-crpe-warning-soft px-3 py-2 text-[11px] font-semibold text-crpe-warning">
        {note}
      </p>
    </>
  );
}

function PlacowkaDashboard() {
  return (
    <ChecklistDashboard
      eyebrow="Panel placówki"
      title="Struktura i dostęp zespołu"
      rows={[
        ["Jednostki organizacyjne", "Tworzenie struktury placówki"],
        ["Zaproszenia e-mail", "Dostęp dla wskazanej osoby"],
        ["Role i członkostwa", "Uprawnienia w zespole"],
      ]}
      note="Zbiorczy status, raporty i alerty — rozwijamy"
    />
  );
}

function OrganizatorDashboard() {
  return (
    <ChecklistDashboard
      eyebrow="Publiczna baza szkoleń"
      title="Zgłoś wydarzenie do publikacji"
      rows={[
        ["Dane wydarzenia", "Termin, format, miejsce i punkty"],
        ["Organizator", "Nazwa i logo po publikacji"],
        ["Zapisy", "Bezpośredni link do organizatora"],
      ]}
      note="Panel uczestników i obsługa certyfikatów — rozwijamy"
    />
  );
}

/** Decorative role indicator; the adjacent label supplies the accessible name. */
function RoleRing({ selected }: { selected: AudienceKey }) {
  const active = audiences.find((item) => item.key === selected) ?? audiences[0];
  const Icon = active.icon;
  return (
    <span data-role-ring={selected} className="relative flex h-11 w-11 shrink-0 items-center justify-center text-crpe-navy" aria-hidden="true">
      <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full fill-none" style={{ transform: "rotate(-90deg)" }}>
        {audiences.map((role, index) => (
          <circle key={role.key} cx="22" cy="22" r="19" pathLength="360"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="108 252" strokeDashoffset={-index * 120}
            className={cx("transition-colors duration-200 motion-reduce:transition-none", role.key === selected ? "text-crpe-punkt" : "text-crpe-line")} />
        ))}
      </svg>
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
    </span>
  );
}

function HeroDashboard({ selected }: { selected: AudienceKey }) {
  const active = audiences.find((item) => item.key === selected) ?? audiences[0];

  return (
    <div
      className="crpe-dashboard-shell overflow-hidden rounded-[24px] bg-white/97 shadow-crpe-lift ring-1 ring-crpe-line backdrop-blur"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <RoleRing selected={selected} />
          <div className="min-w-0">
          <p className="text-[12px] font-semibold text-crpe-muted">Podgląd CRPE</p>
          <p className="flex min-w-0 items-center gap-1.5 text-[14px] font-bold leading-5 text-crpe-ink">
            <span>{active.mobileLabel}</span>
          </p>
          </div>
        </div>
        <span className={cx(statusPill, "shrink-0 text-[11px]", active.statusTone)}>{active.status}</span>
      </div>

      <div key={selected} className="crpe-role-swap px-4 pb-4 pt-1">
        {selected === "medyk" ? <MedykDashboard /> : null}
        {selected === "placowka" ? <PlacowkaDashboard /> : null}
        {selected === "organizator" ? <OrganizatorDashboard /> : null}
      </div>

      <div className="border-t border-crpe-line bg-crpe-surface/70 px-4 py-3">
        {selected === "medyk" ? <p className="text-[12px] leading-5 text-crpe-muted">
          Zobacz dokładnie, czym różni się zakres CRPE dla wybranej roli.
        </p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href={active.detailsHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-crpe-brand hover:text-crpe-brand-hover"
          >
            Dowiedz się więcej <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {selected !== "medyk" ? (
            <Link
              href="/bezpieczenstwo"
              className="text-[13px] font-semibold text-crpe-muted underline decoration-crpe-line underline-offset-4 hover:text-crpe-ink"
            >
              Bezpieczeństwo danych
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HeroPortrait({ selected, compact = false }: { selected: AudienceKey; compact?: boolean }) {
  const active = audiences.find((item) => item.key === selected) ?? audiences[0];
  return (
    <div data-hero-portrait className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-[24px] bg-crpe-ice shadow-crpe-soft ring-1 ring-crpe-line">
      <Image key={active.image} src={active.image} alt={active.imageAlt} fill priority
        sizes={compact ? "(max-width: 640px) 90vw, 600px" : "420px"}
        className="crpe-photo-swap object-cover"
        style={{ objectPosition: active.imagePosition }} />
    </div>
  );
}

function RolePicker({
  selected,
  onSelect,
}: {
  selected: AudienceKey;
  onSelect: (key: AudienceKey) => void;
}) {
  const roleDescriptions: Record<AudienceKey, string> = {
    medyk: "Własna ewidencja",
    placowka: "Zespół i dostęp",
    organizator: "Publikacja szkoleń",
  };

  return (
    <div
      className="crpe-role-picker w-full rounded-[22px] bg-white p-1.5 shadow-crpe-soft ring-1 ring-crpe-line sm:rounded-full"
      role="group"
      aria-label="Wybierz swoją rolę"
    >
      <div className="grid grid-cols-3 gap-1">
        {audiences.map(({ key, mobileLabel, icon: Icon }) => {
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(key)}
              className={cx(
                "crpe-role-button group flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-[16px] px-2 py-2 text-left outline-none sm:min-h-[56px] sm:justify-start sm:rounded-full sm:pl-2 sm:pr-4",
                "focus-visible:ring-2 focus-visible:ring-crpe-brand focus-visible:ring-offset-2",
                isSelected ? "bg-crpe-navy text-white shadow-crpe-soft" : "text-crpe-ink hover:bg-crpe-surface",
              )}
            >
              <span
                className={cx(
                  "hidden h-10 w-10 shrink-0 items-center justify-center rounded-full transition sm:flex",
                  isSelected ? "bg-white/12 text-white" : "bg-crpe-ice text-crpe-navy",
                )}
                aria-hidden="true"
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold leading-4 sm:text-[14px]">{mobileLabel}</span>
                <span
                  className={cx(
                    "mt-0.5 hidden truncate text-[11px] font-medium leading-4 sm:block",
                    isSelected ? "text-white/65" : "text-crpe-muted",
                  )}
                >
                  {roleDescriptions[key]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileRolePreview({ active }: { active: AudienceOption }) {
  const labels: Record<AudienceKey, [string, string, string]> = {
    medyk: ["Postęp", "Certyfikaty", "Do uzupełnienia"],
    placowka: ["Struktura", "Zaproszenia", "Dostęp"],
    organizator: ["Publikacja", "Organizator", "Zapisy"],
  };
  return (
    <div
      className="mt-5 rounded-[24px] bg-white p-4 shadow-crpe-soft ring-1 ring-crpe-line lg:hidden"
      aria-label="Przykładowy podgląd dla wybranej roli"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <RoleRing selected={active.key} />
          <div>
          <p className="text-[12px] font-semibold text-crpe-muted">Podgląd profilu</p>
          <p className="text-[15px] font-bold text-crpe-ink">{active.mobileLabel}</p>
          </div>
        </div>
        <span className={cx(statusPill, "text-[11px]", active.statusTone)}>{active.status}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {active.facts.map((fact, index) => (
          <div
            key={fact}
            className={cx("rounded-2xl px-2.5 py-2.5", index === 0 ? "bg-crpe-punkt-soft" : "bg-crpe-surface")}
          >
            <p className="text-[12px] font-semibold leading-4 text-crpe-muted">{labels[active.key][index]}</p>
            <p
              className={cx(
                "mt-0.5 text-[12px] font-extrabold leading-4",
                index === 0 ? "text-crpe-punkt-text" : "text-crpe-ink",
              )}
            >
              {fact}
            </p>
          </div>
        ))}
      </div>

      {active.key === "medyk" ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-crpe-ice">
          <div className="crpe-progress-fill h-full w-[55%] rounded-full bg-crpe-punkt" />
        </div>
      ) : null}

      <Link href={active.detailsHref} className={cx(pill.secondary, "mt-3 min-h-11 w-full text-[14px]")}>
        Dowiedz się więcej <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Hero({
  selected,
  onSelect,
}: {
  selected: AudienceKey;
  onSelect: (key: AudienceKey) => void;
}) {
  const active = audiences.find((item) => item.key === selected) ?? audiences[0];
  return (
    <section className="crpe-home-hero relative overflow-hidden pb-10 pt-8 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-14">
      <div
        className="crpe-dot-grid pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] text-crpe-navy opacity-[0.07] lg:block"
        style={{ maskImage: "radial-gradient(70% 60% at 70% 45%, #000 20%, transparent 75%)" }}
        aria-hidden="true"
      />

      <div className={`${pageWrap} relative`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.04fr)] lg:items-center lg:gap-10">
          <div>
            <div className="crpe-hero-in [--hero-delay:40ms]">
              <Eyebrow>CRPE dla medyka, placówki i organizatora</Eyebrow>
            </div>

            <h1 className="crpe-hero-in mt-4 max-w-[600px] text-[36px] font-bold leading-[1.08] tracking-[-0.035em] text-crpe-ink sm:text-[48px] lg:text-[48px] xl:text-[56px] [--hero-delay:110ms]">
              <span className="block">Punkty edukacyjne</span>
              <span className="block">i certyfikaty</span>
              <span className="block">
                w jednym miejscu<span className="crpe-dot">.</span>
              </span>
            </h1>

            <p className="crpe-hero-in mt-5 max-w-[540px] text-[17px] leading-7 text-crpe-muted sm:text-[19px] sm:leading-8 [--hero-delay:180ms]">
              Zbieraj aktywności, certyfikaty i dane potrzebne do rozliczeń w jednym uporządkowanym miejscu — dopasowanym do Twojej roli.
            </p>

            <div className="crpe-hero-in mt-7 max-w-[600px] [--hero-delay:250ms]">
              <RolePicker selected={selected} onSelect={onSelect} />
            </div>

            <div key={selected} className="crpe-role-swap mt-7 max-w-[600px]" aria-live="polite">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-crpe-ink">{active.label}</span>
                <span className={cx(statusPill, active.statusTone)}>{active.status}</span>
              </div>

              <h2 className="mt-3 text-[24px] font-bold leading-[1.15] tracking-[-0.02em] text-crpe-ink sm:text-[28px]">
                {active.title}
              </h2>
              <p className="mt-2.5 text-[16px] leading-7 text-crpe-muted">{active.description}</p>

              <ul className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                {active.benefits.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[15px] leading-6 text-crpe-ink">
                    <DotBullet />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <Link href={active.href} className={cx(pill.primary, "w-full sm:w-auto")}>
                  {active.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 lg:hidden">
                <HeroPortrait selected={selected} compact />
              </div>
              <MobileRolePreview active={active} />
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="crpe-hero-panel mx-auto grid w-full max-w-[420px] gap-5">
              <HeroPortrait selected={selected} />
              <div data-hero-preview className="mx-auto w-full max-w-[420px]">
                <HeroDashboard selected={selected} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Dla kogo ────────────────────────────────── */

function AudienceSection({ selected }: { selected: AudienceKey }) {
  const cards = [
    {
      key: "medyk" as AudienceKey,
      id: "dla-medyka",
      icon: Stethoscope,
      title: "Medyk",
      status: "Dostępne teraz",
      statusClass: "bg-crpe-medyk-soft text-crpe-medyk-text ring-crpe-medyk-border",
      text: "Prowadź własną ewidencję punktów, aktywności i certyfikatów w jednym panelu.",
      benefits: ["Postęp i brakujące punkty", "Dokumenty przy aktywnościach", "Raport użytkownika"],
      cta: "Załóż konto",
      href: "/rejestracja",
    },
    {
      key: "placowka" as AudienceKey,
      id: "dla-placowki",
      icon: Building2,
      title: "Placówka / jednostka",
      status: "Struktura, zaproszenia i role dostępne",
      statusClass: "bg-crpe-placowka-soft text-crpe-placowka-text ring-crpe-placowka-border",
      text: "Zbuduj strukturę jednostki, zapraszaj pracowników i nadawaj role. Zbiorczy status oraz raporty pozostają w rozwoju.",
      benefits: ["Jednostki organizacyjne", "Zaproszenia e-mail", "Role i członkostwa"],
      cta: "Zobacz zakres",
      href: "/dla-placowki",
    },
    {
      key: "organizator" as AudienceKey,
      id: "dla-organizatora",
      icon: GraduationCap,
      title: "Organizator kształcenia",
      status: "Zgłoszenie do bazy dostępne",
      statusClass: "bg-crpe-organizator-soft text-crpe-organizator-text ring-crpe-organizator-border",
      text: "Zgłoś szkolenie do publicznej bazy. Po publikacji użytkownicy zobaczą stronę wydarzenia, dane organizatora i link do zapisów.",
      benefits: ["Formularz zgłoszenia", "Publiczna strona szkolenia", "Logo i link do zapisów"],
      cta: "Zobacz zakres",
      href: "/dla-organizatora",
    },
  ];

  return (
    <section id="dla-kogo" className="relative scroll-mt-24 bg-white py-16 sm:py-24">
      <div className={pageWrap}>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <SectionHeading eyebrow="Dla kogo jest CRPE" title="Trzy role, jeden spokojniejszy sposób pracy." />
          <p className="max-w-[56ch] text-[16px] leading-7 text-crpe-muted sm:text-[17px] lg:pb-1">
            CRPE porządkuje różne potrzeby w jednym produkcie. Profil medyka działa już teraz, a moduły organizacyjne rozwijamy etapami i jasno oznaczamy ich aktualny zakres.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-3">
          {cards.map(({ key, id, icon, title, status, statusClass, text, benefits, cta, href }) => {
            const active = selected === key;
            const photo = audiences.find((item) => item.key === key)!;
            return (
              <article
                key={id}
                id={id}
                className={cx(
                  "crpe-interactive-card group flex h-full scroll-mt-24 flex-col rounded-[28px] bg-white p-2.5 shadow-crpe-soft ring-1",
                  active ? "ring-2 ring-crpe-punkt" : "ring-crpe-line",
                )}
                aria-current={active ? "true" : undefined}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] bg-crpe-ice">
                  <Image
                    src={photo.image}
                    alt={photo.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 80vw, 100vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                    style={{ objectPosition: photo.imagePosition }}
                  />
                  <span
                    className={cx(
                      "absolute right-3 top-3 rounded-full px-3 py-1 text-[12px] font-bold backdrop-blur",
                      active ? "bg-crpe-navy/90 text-white" : "bg-white/90 text-crpe-ink",
                    )}
                  >
                    {active ? "Wybrana rola" : "Zobacz zakres"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col px-3.5 pb-3.5 sm:px-4 sm:pb-4">
                  <IconBadge icon={icon} size="lg" tone="white" className="-mt-9 ring-4 ring-white" />

                  <h3 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-crpe-ink">{title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-crpe-muted">{text}</p>
                  <p className={cx(statusPill, "mt-4 inline-flex w-fit", statusClass)}>{status}</p>

                  <ul className="mt-4 grid gap-2">
                    {benefits.map((item) => (
                      <li key={item} className="flex gap-2.5 text-[15px] leading-6 text-crpe-ink">
                        <DotBullet />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    <Link href={href} className={cx(active ? pill.primary : pill.secondary, "w-full")}>
                      {cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Narzędzia ──────────────────────────────── */

function ProductToolsSection() {
  const tools = [
    {
      icon: BarChart3,
      title: "Panel CPD i kalkulator",
      text: "Ustaw okres i wymagany cel, sprawdzaj postęp, limity oraz podpowiedź kolejnego kroku.",
      bullets: ["Cel i okres rozliczeniowy", "Postęp, limity i braki"],
    },
    {
      icon: CalendarCheck2,
      title: "Aktywności i certyfikaty",
      text: "Dodawaj i edytuj aktywności, wpisuj punkty oraz dołączaj PDF lub zdjęcie certyfikatu.",
      bullets: ["Dokument przy właściwym wpisie", "Edycja i kontrola kompletności"],
    },
    {
      icon: FileText,
      title: "Raport użytkownika",
      text: "Przygotuj zestawienie aktywności, punktów i kompletności załączników.",
      bullets: ["Podsumowanie wybranego okresu", "Wydruk PDF i eksport CSV"],
    },
    {
      icon: FolderOpen,
      title: "Baza szkoleń",
      text: "Wyszukuj kursy, webinary i wydarzenia, filtruj je i dodawaj wybrane pozycje do planu CPD.",
      bullets: ["Filtry zawodu, miejsca i terminu", "Plan CPD bez automatycznego zapisu"],
    },
  ];

  return (
    <section id="narzedzia" className="scroll-mt-24 bg-crpe-surface py-16 sm:py-24">
      <div className={pageWrap}>
        <SectionHeading
          eyebrow="Dostępne narzędzia"
          title="Po zalogowaniu widzisz cały warsztat CRPE, nie tylko kalkulator."
          text="Panel, aktywności, dokumenty, raport i baza szkoleń działają w jednym koncie i prowadzą użytkownika przez kolejne etapy ewidencji."
          centered
        />

        <div className="mt-10 overflow-hidden rounded-[28px] bg-white shadow-crpe-soft ring-1 ring-crpe-line sm:mt-14">
          <div className="relative overflow-hidden bg-crpe-navy px-5 py-6 text-white sm:px-8">
            <div className="crpe-dot-grid pointer-events-none absolute inset-0 text-white opacity-[0.06]" aria-hidden="true" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-semibold text-white/60">Stałe menu aplikacji</p>
                <p className="font-display mt-1 text-[19px] font-bold sm:text-[21px]">
                  Najważniejsze funkcje są widoczne od razu po zalogowaniu.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white ring-1 ring-white/15">
                <span className="h-2 w-2 rounded-full bg-crpe-punkt" aria-hidden="true" />
                Profil medyka dostępny teraz
              </span>
            </div>

            <div className="relative mt-5 flex flex-wrap gap-2">
              {tools.map(({ icon: Icon, title }, index) => (
                <div
                  key={title}
                  className={cx(
                    "flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold",
                    index === 0 ? "bg-white text-crpe-navy" : "bg-white/8 text-white/85 ring-1 ring-white/12",
                  )}
                >
                  <Icon className={cx("h-4 w-4 shrink-0", index === 0 ? "text-crpe-punkt-text" : "text-white/60")} />
                  <span>{title.replace(" i kalkulator", "")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {tools.map(({ icon, title, text, bullets }, index) => (
              <article
                key={title}
                className={cx(
                  "flex h-full flex-col p-6 sm:p-7",
                  index > 0 && "border-t border-crpe-line sm:border-t-0",
                  index % 2 === 1 && "sm:border-l",
                  index >= 2 && "sm:border-t lg:border-t-0",
                  index === 2 && "lg:border-l",
                  "border-crpe-line",
                )}
              >
                <IconBadge icon={icon} size="md" tone="punkt" dot={false} />
                <h3 className="mt-5 text-[20px] font-bold leading-[1.2] tracking-[-0.015em] text-crpe-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-crpe-muted">{text}</p>
                <ul className="mt-auto grid gap-2 pt-5">
                  {bullets.map((item) => (
                    <li key={item} className="flex gap-2 text-[14px] leading-5 text-crpe-ink">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-crpe-punkt" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── W praktyce ─────────────────────────────── */

function PracticeSection() {
  const rows = [
    ["Kurs specjalistyczny", "25 pkt", "Certyfikat dodany"],
    ["Webinar", "8 pkt", "Uzupełnij dokument"],
  ];

  return (
    <section className="relative overflow-hidden bg-crpe-navy py-16 text-white sm:py-24">
      <div className="crpe-dot-grid pointer-events-none absolute inset-0 text-white opacity-[0.05]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-crpe-punkt/15 blur-3xl"
        aria-hidden="true"
      />
      <DottedCurve className="pointer-events-none absolute -bottom-2 right-8 hidden w-[380px] text-white/25 lg:block" />

      <div className={`${pageWrap} relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16`}>
        <div>
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold text-white/85 ring-1 ring-white/15">
            Przykład: profil medyka
          </span>
          <div className="mt-5">
            <SectionHeading
              tone="dark"
              eyebrow="CRPE w praktyce"
              title="Panel CPD łączy kalkulator, aktywności i dokumenty."
              text="Panel CPD pokazuje postęp, Aktywności przechowują wpisy i certyfikaty, a Raport zbiera wszystko w jedno zestawienie."
            />
          </div>

          <ul className="mt-6 grid gap-3">
            {["Stały dostęp do Aktywności i Raportów", "Braki oznaczone przed rozliczeniem"].map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-6 text-white/90">
                <DotBullet tone="dark" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="crpe-dashboard-shell rounded-[28px] bg-white p-5 text-crpe-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.55)] sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={BarChart3} size="sm" tone="punkt" dot={false} />
              <div>
                <p className="text-[12px] font-semibold text-crpe-punkt-text">Panel CPD</p>
                <p className="text-[14px] font-bold text-crpe-ink">Podgląd statusu dokumentacji</p>
              </div>
            </div>
            <span className="rounded-full bg-crpe-surface px-3 py-1 text-[11px] font-semibold text-crpe-muted ring-1 ring-crpe-line">
              Dane przykładowe
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[0.64fr_0.36fr]">
            <div className="rounded-[22px] bg-crpe-surface p-4 sm:p-5">
              <p className="text-[12px] font-semibold text-crpe-muted">Status dokumentacji</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="font-display text-[44px] font-bold leading-none tracking-[-0.03em] text-crpe-ink">110/200</span>
                <span className="pb-1 text-[13px] font-bold text-crpe-muted">pkt</span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
                <div className="crpe-progress-fill h-full w-[55%] rounded-full bg-crpe-punkt" />
              </div>
              <div className="mt-4 space-y-2">
                {rows.map(([name, points, status], index) => (
                  <div key={name} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cx(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          index === 1 ? "bg-crpe-warning" : "bg-crpe-punkt",
                        )}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-[14px] font-bold text-crpe-ink">{name}</p>
                        <p className="text-[12px] text-crpe-muted">{points}</p>
                      </div>
                    </div>
                    <span
                      className={cx(
                        statusPill,
                        "text-[11px]",
                        index === 1
                          ? "bg-crpe-warning-soft text-crpe-warning ring-crpe-warning-border"
                          : "bg-crpe-punkt-soft text-crpe-punkt-text ring-crpe-punkt-border",
                      )}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <div className="flex flex-col justify-between rounded-[22px] bg-crpe-navy p-4 text-white">
                <p className="text-[12px] font-semibold text-white/60">Najbliższy krok</p>
                <p className="font-display mt-3 text-[20px] font-bold leading-tight">Uzupełnij 1 dokument</p>
              </div>
              <div className="flex flex-col justify-between rounded-[22px] border-2 border-dashed border-crpe-line p-4">
                <IconBadge icon={UploadCloud} size="sm" tone="brand" dot={false} />
                <p className="mt-3 text-[14px] font-bold leading-5 text-crpe-ink">Dodaj PDF lub zdjęcie</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Jak to działa ───────────────────────────── */

function HowItWorks({ selected }: { selected: AudienceKey }) {
  const variants: Record<AudienceKey, {
    title: string;
    text: string;
    steps: Array<{ icon: typeof UserRound; title: string; text: string }>;
  }> = {
    medyk: {
      title: "Zacznij prowadzić własną ewidencję w czterech krokach.",
      text: "Profil medyka jest dostępny od razu — bez wdrożenia i bez przenoszenia wszystkiego jednego dnia.",
      steps: [
        { icon: UserRound, title: "Załóż konto", text: "Ustaw okres i wymagany cel." },
        { icon: CalendarCheck2, title: "Dodaj aktywność", text: "Wpisz wydarzenie i punkty." },
        { icon: UploadCloud, title: "Dołącz dokument", text: "Dodaj PDF lub zdjęcie." },
        { icon: ClipboardCheck, title: "Sprawdź status", text: "Zobacz postęp i braki." },
      ],
    },
    placowka: {
      title: "Uporządkuj sposób pracy zespołu w czterech krokach.",
      text: "Fundament organizacyjny jest dostępny teraz. Zbiorczy status zespołu i raporty pozostają kolejnym etapem rozwoju.",
      steps: [
        { icon: Building2, title: "Utwórz placówkę", text: "Rozpocznij pracę w panelu organizacji." },
        { icon: ClipboardCheck, title: "Dodaj strukturę", text: "Przygotuj jednostki i role dostępu." },
        { icon: UserRound, title: "Zaproś pracowników", text: "Wyślij zaproszenia na konkretne adresy e-mail." },
        { icon: BarChart3, title: "Ustal kolejny zakres", text: "Zaplanuj pilotaż statusów i raportów zespołu." },
      ],
    },
    organizator: {
      title: "Opublikuj szkolenie w bazie w czterech krokach.",
      text: "Zgłoszenie wydarzenia działa już dziś. Rozbudowany panel uczestników i dokumentacji pozostaje osobnym etapem.",
      steps: [
        { icon: CalendarCheck2, title: "Przygotuj dane", text: "Uzupełnij termin, format, miejsce i punkty." },
        { icon: ClipboardCheck, title: "Zgłoś szkolenie", text: "Prześlij formularz do publicznej bazy." },
        { icon: CheckCircle2, title: "Poczekaj na weryfikację", text: "Zgłoszenie jest sprawdzane przed publikacją." },
        { icon: ArrowRight, title: "Kieruj do zapisów", text: "Opublikowana strona prowadzi do organizatora." },
      ],
    },
  };
  const active = variants[selected];

  return (
    <section
      id="jak-to-dziala"
      className="scroll-mt-24 bg-[linear-gradient(180deg,#fff_0%,var(--color-crpe-surface)_100%)] py-16 sm:py-24"
    >
      <div className={pageWrap}>
        <SectionHeading eyebrow="Jak to działa" title={active.title} text={active.text} centered />

        <ol key={selected} className="crpe-role-swap relative mx-auto mt-12 grid max-w-[1080px] gap-10 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <li aria-hidden="true" className="crpe-step-path pointer-events-none absolute left-[12.5%] right-[12.5%] top-[46px] hidden h-1 lg:block" />
          {active.steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="relative text-center">
              <div className="relative mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-full bg-white text-crpe-navy shadow-crpe-soft ring-1 ring-crpe-line">
                <Icon className="h-8 w-8" strokeWidth={1.7} />
                <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-crpe-punkt-text text-[13px] font-extrabold text-white ring-4 ring-white">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-5 text-[20px] font-bold leading-6 text-crpe-ink">
                <span className="sr-only">Krok {index + 1}: </span>
                {title}
              </h3>
              <p className="mx-auto mt-2 max-w-[24ch] text-[15px] leading-6 text-crpe-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────── Zakres placówki / organizatora ─────────────────── */

function RoleStateSection({ selected }: { selected: Exclude<AudienceKey, "medyk"> }) {
  const variants = {
    placowka: {
      eyebrow: "Aktualny zakres placówki",
      title: "Fundament organizacji działa. Zbiorcze zarządzanie jest kolejnym etapem.",
      text: "Oddzielamy funkcje dostępne w panelu od planowanego widoku statusów, aby placówka wiedziała dokładnie, z czego może skorzystać już teraz.",
      available: [
        "Struktura placówki i jednostek organizacyjnych",
        "Zaproszenia wysyłane na konkretny adres e-mail",
        "Role, członkostwa i kontrolowany dostęp",
        "Indywidualna ewidencja na kontach pracowników",
      ],
      developing: [
        "Zbiorczy status i kompletność zespołu",
        "Kolejka weryfikacji aktywności i dokumentów",
        "Raporty jednostki, alerty i terminy",
      ],
    },
    organizator: {
      eyebrow: "Aktualny zakres organizatora",
      title: "Publikacja szkolenia działa. Panel operacyjny rozwijamy osobno.",
      text: "Organizator może już przekazać wydarzenie do publicznej bazy. Rozszerzona obsługa uczestników i dokumentacji nie jest przedstawiana jako gotowa funkcja.",
      available: [
        "Formularz zgłoszenia szkolenia do publicznej bazy",
        "Publiczna, linkowalna strona wydarzenia po publikacji",
        "Prezentacja danych oraz logo organizatora",
        "Bezpośredni link do zapisów u organizatora",
      ],
      developing: [
        "Samoobsługowy panel organizatora",
        "Listy uczestników i statusy wydarzenia",
        "Obsługa certyfikatów i dokumentacji uczestników",
      ],
    },
  } satisfies Record<Exclude<AudienceKey, "medyk">, {
    eyebrow: string;
    title: string;
    text: string;
    available: string[];
    developing: string[];
  }>;
  const active = variants[selected];

  return (
    <section className="bg-crpe-surface py-16 sm:py-24">
      <div className={pageWrap}>
        <SectionHeading eyebrow={active.eyebrow} title={active.title} text={active.text} centered />
        <div key={selected} className="crpe-role-swap mx-auto mt-10 grid max-w-[1000px] gap-5 sm:mt-14 md:grid-cols-2">
          <article className="rounded-[28px] bg-white p-6 shadow-crpe-soft ring-1 ring-crpe-line sm:p-8">
            <div className="flex items-center gap-4">
              <IconBadge icon={CheckCircle2} size="md" tone="punkt" />
              <div>
                <p className="text-[13px] font-semibold text-crpe-punkt-text">Dostępne</p>
                <h3 className="text-[24px] font-bold leading-tight text-crpe-ink">Działa dziś</h3>
              </div>
            </div>
            <ul className="mt-6 grid gap-3">
              {active.available.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-6 text-crpe-ink">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-crpe-punkt" strokeWidth={2.6} />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[28px] border-2 border-dashed border-crpe-warning-border bg-white/60 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-crpe-warning-soft text-crpe-warning" aria-hidden="true">
                <BarChart3 className="h-[22px] w-[22px]" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-crpe-warning">Kolejny etap</p>
                <h3 className="text-[24px] font-bold leading-tight text-crpe-ink">Rozwijamy</h3>
              </div>
            </div>
            <ul className="mt-6 grid gap-3">
              {active.developing.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-6 text-crpe-muted">
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-crpe-warning" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Bezpieczeństwo ──────────────────────────── */

function TrustSection() {
  const items = [
    {
      icon: LockKeyhole,
      title: "Dane na Twoim koncie",
      text: "Dostęp do aktywności i dokumentów wymaga zalogowania.",
    },
    {
      icon: FileText,
      title: "Dokument przy aktywności",
      text: "Certyfikat pozostaje przypisany do właściwego wpisu.",
    },
    {
      icon: ShieldCheck,
      title: "Jasna rola systemu",
      text: "CRPE nie jest państwowym rejestrem ani automatycznym rozliczeniem obowiązku.",
    },
  ];

  return (
    <section id="bezpieczenstwo" className="relative scroll-mt-24 overflow-hidden bg-white py-16 sm:py-24">
      <div className={`${pageWrap} grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20`}>
        <div className="relative mx-auto w-full max-w-[460px] lg:mx-0">
          <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-crpe-punkt-soft" aria-hidden="true" />
          <div className="crpe-dot-grid absolute -bottom-8 -right-8 h-40 w-40 text-crpe-navy opacity-20" aria-hidden="true" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] shadow-crpe-lift">
            <Image
              src="/home/photo-dokument.webp"
              alt="Dłonie trzymające tablet z certyfikatem w CRPE"
              fill
              sizes="(min-width: 1024px) 460px, 90vw"
              className="object-cover"
              style={{ objectPosition: "55% 40%" }}
            />
          </div>
          <IconBadge icon={ShieldCheck} size="lg" tone="white" className="absolute -bottom-6 left-6 ring-4 ring-white" />
        </div>

        <div>
          <SectionHeading
            eyebrow="Zakres i bezpieczeństwo"
            title="CRPE pomaga prowadzić własną ewidencję."
            text="System porządkuje aktywności, punkty i dokumenty, ale nie zastępuje oficjalnych rejestrów ani wymaganej procedury rozliczenia."
          />

          <ul className="mt-8 grid gap-5">
            {items.map(({ icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <IconBadge icon={icon} size="md" tone="soft" />
                <div>
                  <h3 className="text-[19px] font-bold text-crpe-ink">{title}</h3>
                  <p className="mt-1 text-[15px] leading-6 text-crpe-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/polityka-prywatnosci" className={pill.secondary}>
              Polityka prywatności
            </Link>
            <Link href="/regulamin" className={pill.secondary}>
              Regulamin
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── FAQ ─────────────────────────────────── */

function FaqSection() {
  const items = [
    [
      "Czy CRPE jest połączone z systemem państwowym?",
      "Nie. CRPE służy do prowadzenia własnej ewidencji aktywności, punktów i dokumentów. Nie zastępuje oficjalnych rejestrów ani wymaganej procedury rozliczenia.",
    ],
    [
      "Co CRPE oferuje medykowi już teraz?",
      "Medyk może prowadzić ewidencję aktywności, punktów i dokumentów, kontrolować postęp oraz przygotować raport użytkownika.",
    ],
    [
      "Czy kalkulator, aktywności i raport działają w jednym koncie?",
      "Tak. Panel CPD pokazuje postęp, Aktywności przechowują wpisy i certyfikaty, Raport przygotowuje zestawienie, a Baza szkoleń pomaga planować kolejne działania.",
    ],
    [
      "Co CRPE daje placówce lub jednostce?",
      "Panel pozwala tworzyć strukturę jednostki, wysyłać zaproszenia i nadawać role. Zbiorczy status zespołu, raporty i alerty są rozwijane.",
    ],
    [
      "Czy CRPE jest dla organizatorów kształcenia?",
      "Tak. Organizator może zgłosić szkolenie do publicznej bazy wraz z danymi, logo i linkiem do zapisów. Panel uczestników i obsługa certyfikatów są rozwijane.",
    ],
    [
      "Czy mogę dodać certyfikat z telefonu?",
      "Tak. Dokument możesz dodać jako plik PDF lub zdjęcie i przypisać do konkretnej aktywności.",
    ],
  ];

  return (
    <section id="faq" className="scroll-mt-24 bg-crpe-surface py-16 sm:py-24">
      <div className={pageWrap}>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <IconBadge icon={HelpCircle} size="lg" tone="white" />
            <div className="mt-6">
              <SectionHeading
                eyebrow="FAQ"
                title="Najczęstsze pytania przed wyborem swojej ścieżki."
                text="Najważniejsze informacje dla medyka, placówki i organizatora kształcenia."
              />
            </div>
            <Link href="/kontakt#formularz" className={cx(pill.secondary, "mt-7")}>
              Masz inne pytanie? Napisz do nas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {items.map(([question, answer]) => (
              <details
                key={question}
                className="group rounded-[22px] bg-white px-5 py-2 shadow-crpe-soft ring-1 ring-crpe-line transition open:ring-crpe-punkt-border sm:px-6"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-2 text-[16px] font-bold leading-6 text-crpe-ink sm:text-[17px]">
                  {question}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crpe-ice text-crpe-navy transition duration-200 group-open:rotate-45 group-open:bg-crpe-punkt group-open:text-white">
                    <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-4 pr-10 pt-1 text-[15px] leading-7 text-crpe-muted">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  const [selectedAudience, setSelectedAudience] = useState<AudienceKey>("medyk");

  return (
    <div className="min-h-screen bg-white">
      <Hero selected={selectedAudience} onSelect={setSelectedAudience} />
      <AudienceSection selected={selectedAudience} />
      <HowItWorks selected={selectedAudience} />
      {selectedAudience === "medyk" ? (
        <>
          <PracticeSection />
          <ProductToolsSection />
        </>
      ) : (
        <RoleStateSection selected={selectedAudience} />
      )}
      <TrustSection />
      <FaqSection />
      <BottomCTA selected={selectedAudience} />
    </div>
  );
}
