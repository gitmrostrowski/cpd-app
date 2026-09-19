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

function PointsGauge({ value, goal }: { value: number; goal: number }) {

  const r = 62;

  const length = 2 * Math.PI * r;

  const ratio = Math.min(value / goal, 1);

  const offset = length * (1 - ratio);

  return (

    <div className="relative h-[112px] w-[112px] shrink-0 sm:h-[180px] sm:w-[180px]">

      <svg viewBox="0 0 150 150" className="absolute inset-0 h-full w-full" aria-hidden="true" fill="none">

        <circle cx="75" cy="75" r={r} stroke="var(--color-crpe-line)" strokeWidth="3" strokeLinecap="round" strokeDasharray="0 7.5" />

        <circle

          cx="75"

          cy="75"

          r={r}

          transform="rotate(-90 75 75)"

          stroke="var(--color-crpe-punkt)"

          strokeWidth="9"

          strokeLinecap="round"

          strokeDasharray={length}

          className="crpe-ring-progress"

          style={{ strokeDashoffset: offset, "--ring-length": `${length}`, "--ring-offset": `${offset}` } as React.CSSProperties}

        />

      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">

        <span className="text-[32px] font-extrabold leading-none tracking-[-0.04em] text-crpe-ink sm:text-[40px]">{value}</span>

        <span className="mt-1 text-[13px] font-bold text-crpe-muted">/ {goal} pkt</span>

      </div>

    </div>

  );

}

function MedykDashboard() {

  return (

    <>

      <div className="flex items-center gap-5 sm:gap-7">

        <PointsGauge value={110} goal={200} />

        <div className="min-w-0 flex-1">

          <p className="text-[13px] font-semibold text-crpe-muted">Postęp punktowy</p>

          <p className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-crpe-ink">55% celu</p>

          <p className="mt-0.5 text-[13px] font-semibold text-crpe-muted">2025–2028</p>

          <div className="mt-4 inline-flex items-baseline gap-2 rounded-2xl bg-crpe-punkt-soft px-3.5 py-2">

            <span className="text-[12px] font-semibold text-crpe-punkt-text">Brakuje</span>

            <span className="text-[17px] font-extrabold text-crpe-punkt-text">90 pkt</span>

          </div>

        </div>

      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">

        <Metric icon={FileCheck2} label="Certyfikaty" value="18 dokumentów" />

        <Metric icon={ClipboardCheck} label="Do uzupełnienia" value="2 aktywności" />

      </div>

      <div className="mt-5"><p className="mb-2 text-[12px] font-semibold text-crpe-muted">Ostatnie aktywności — przykład</p><ul className="space-y-2">
        {[["Kurs specjalistyczny", "25 pkt", "Certyfikat"], ["Webinar", "8 pkt", "Brak pliku"]].map(([title,points,status]) => <li key={title} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-crpe-surface p-3 text-[12px]"><span className="font-bold text-crpe-ink">{title}</span><span className="text-crpe-muted">{points} · {status}</span></li>)}
      </ul></div>
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

      className="crpe-dashboard-shell overflow-hidden bg-white"

      aria-live="polite"

    >

      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3.5">

        <div className="flex min-w-0 items-center gap-2.5">

          <RoleRing selected={selected} />

          <div className="min-w-0">

          <p className="text-[12px] font-semibold text-crpe-muted">Dane przykładowe</p>

          <p className="flex min-w-0 items-center gap-1.5 text-[14px] font-bold leading-5 text-crpe-ink">

            <span>{active.mobileLabel}</span>

          </p>

          </div>

        </div>

        <span className={cx(statusPill, "shrink-0 text-[11px]", active.statusTone)}>{active.status}</span>

      </div>

      <div key={selected} className="crpe-role-swap px-4 pb-4 pt-3 sm:px-5 lg:min-h-[296px]">

        {selected === "medyk" ? <MedykDashboard /> : null}

        {selected === "placowka" ? <PlacowkaDashboard /> : null}

        {selected === "organizator" ? <OrganizatorDashboard /> : null}

      </div>

      <div className="border-t border-crpe-line bg-crpe-surface/70 px-4 py-3">

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">

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

function Hero({ selected, onSelect }: { selected: AudienceKey; onSelect: (key: AudienceKey) => void }) {
  const active = audiences.find((item) => item.key === selected) ?? audiences[0];
  return (
    <section className="crpe-home-hero relative overflow-hidden py-10 sm:py-16 lg:py-20">
      <div className={`${pageWrap} grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12`}>
        <div>
          <Eyebrow>{selected === "medyk" ? "Dla medyków rozliczających punkty edukacyjne" : active.label}</Eyebrow>
          <h1 className="mt-5 text-[36px] font-bold leading-[1.08] tracking-[-0.035em] text-crpe-ink sm:text-[48px] xl:text-[56px]">
            {selected === "medyk" ? <>Sprawdź, ile punktów <span className="text-crpe-punkt-text">Ci brakuje.</span></> : active.title}
          </h1>
          <p className="mt-6 max-w-[540px] text-[17px] leading-7 text-crpe-muted sm:text-[19px] sm:leading-8">
            {selected === "medyk" ? "Dodaj aktywność, wpisz punkty i dołącz certyfikat. CRPE pokaże postęp oraz braki w dokumentach. Bez szukania plików przed rozliczeniem." : active.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={active.href} className={cx(pill.primary, "min-h-14 w-full sm:w-auto")}>{selected === "medyk" ? "Załóż konto medyka" : active.cta}<ArrowRight className="h-4 w-4" /></Link>
            <Link href="#jak-to-dziala" className={cx(pill.secondary, "min-h-14 w-full sm:w-auto")}>Zobacz, jak to działa</Link>
          </div>
          {selected === "medyk" ? <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-crpe-muted">
            {["Bez karty płatniczej", "Dostęp z telefonu", "Certyfikat jako PDF lub zdjęcie"].map(t => <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-crpe-punkt-text" aria-hidden="true" />{t}</li>)}
          </ul> : null}
          <div className="mt-8 border-t border-crpe-line pt-5 text-[14px] leading-6 text-crpe-muted">
            <p>Reprezentujesz placówkę lub organizujesz szkolenia?</p>
            <div role="group" aria-label="Wybierz swoją rolę" className="mt-1 flex flex-wrap gap-x-4">
              {audiences.filter(a => a.key !== "medyk" || selected !== "medyk").map(a => <button key={a.key} type="button" aria-pressed={selected === a.key} onClick={() => onSelect(a.key)} className="min-h-11 font-semibold text-crpe-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-crpe-brand">{a.mobileLabel}</button>)}
            </div>
          </div>
        </div>
        <div data-hero-workspace className="relative min-w-0 pb-5">
          <div className="overflow-hidden rounded-[24px] bg-white shadow-crpe-soft ring-1 ring-crpe-line">
            <div className="flex items-center justify-between border-b border-crpe-line bg-crpe-surface px-4 py-3 text-[12px] font-semibold text-crpe-muted"><span>CRPE / {active.mobileLabel}</span><span>Podgląd aplikacji</span></div>
            <div data-hero-preview><HeroDashboard selected={selected} /></div>
          </div>
          {selected === "medyk" ? <div className="relative mx-3 mt-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-crpe-soft ring-1 ring-crpe-line sm:mx-6">
            <UploadCloud className="h-8 w-8 shrink-0 text-crpe-punkt-text" aria-hidden="true" /><div><p className="text-[14px] font-bold text-crpe-ink">Zdjęcie certyfikatu przy aktywności</p><p className="text-[12px] text-crpe-muted">Przykład: plik dołączony do szkolenia</p></div>
          </div> : null}
        </div>
      </div>
    </section>
  );
}

function OrganizationBand({ onSelect }: { onSelect: (key: AudienceKey) => void }) {
  return <section id="dla-kogo" className="scroll-mt-24 bg-crpe-surface py-12 sm:py-16"><div className={pageWrap}>
    <SectionHeading eyebrow="Dla organizacji" title="Placówka lub firma szkoleniowa?" text="Poznaj dostępne funkcje i aktualny zakres rozwoju." />
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{audiences.filter(a => a.key !== "medyk").map(a => <article key={a.key} className="rounded-2xl bg-white p-6 ring-1 ring-crpe-line">
      <h3 className="text-xl font-bold text-crpe-ink">{a.label}</h3><p className="mt-2 text-sm leading-6 text-crpe-muted">{a.description}</p>
      <div className="mt-4 flex flex-wrap gap-4"><Link href={a.detailsHref} className="font-semibold text-crpe-brand">Poznaj zakres →</Link><button type="button" onClick={() => { onSelect(a.key); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }} className="font-semibold text-crpe-muted underline underline-offset-4">Pokaż podgląd</button></div>
    </article>)}</div>
  </div></section>;
}

function RegistrationPrompt() {
  return <div className="bg-white px-4 py-7 text-center"><Link href="/rejestracja" className={cx(pill.primary, "min-h-12")}>Załóż konto i dodaj pierwszą aktywność <ArrowRight className="h-4 w-4" /></Link></div>;
}

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

          title="Punkty, dokumenty i raport w jednym koncie."

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

    <section className="relative overflow-hidden bg-crpe-surface py-16 text-crpe-ink sm:py-24">


      <div

        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-crpe-punkt/15 blur-3xl"

        aria-hidden="true"

      />


      <div className={`${pageWrap} relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16`}>

        <div>

          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[12px] font-bold text-crpe-muted ring-1 ring-crpe-line">

            Przykład: profil medyka

          </span>

          <div className="mt-5">

            <SectionHeading

              tone="light"

              eyebrow="CRPE w praktyce"

              title="Certyfikat zawsze przy właściwej aktywności."

              text="Panel CPD pokazuje postęp, Aktywności przechowują wpisy i certyfikaty, a Raport zbiera wszystko w jedno zestawienie."

            />

          </div>

          <ul className="mt-6 grid gap-3">

            {["Stały dostęp do Aktywności i Raportów", "Braki oznaczone przed rozliczeniem"].map((item) => (

              <li key={item} className="flex gap-3 text-[15px] leading-6 text-crpe-muted">

                <DotBullet />

                {item}

              </li>

            ))}

          </ul>

        </div>

        <div className="crpe-dashboard-shell rounded-[28px] bg-white p-5 text-crpe-ink shadow-crpe-soft ring-1 ring-crpe-line sm:p-7">

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

    <div className="crpe-home-neutral min-h-screen bg-white">

      <Hero selected={selectedAudience} onSelect={setSelectedAudience} />


      <HowItWorks selected={selectedAudience} />
      {selectedAudience === "medyk" ? <RegistrationPrompt /> : null}

      {selectedAudience === "medyk" ? (

        <>

          <PracticeSection />

          <ProductToolsSection />
          <RegistrationPrompt />

        </>

      ) : (

        <RoleStateSection selected={selectedAudience} />

      )}

      <TrustSection />

      <OrganizationBand onSelect={setSelectedAudience} />
      <FaqSection />

      <BottomCTA selected={selectedAudience} />

    </div>

  );

}

