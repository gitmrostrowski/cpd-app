"use client";

import React, { useState } from "react";
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
  HelpCircle,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
  UploadCloud,
  UserRound,
} from "lucide-react";
import BottomCTA from "@/components/BottomCTA";

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
};

const pageWrap = "mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8";
const panel =
  "rounded-[20px] border border-slate-200/90 bg-white shadow-[0_16px_45px_rgba(15,45,75,0.065)]";

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={`crpe-scroll-reveal is-visible ${className}`}>{children}</div>;
}

const audiences: AudienceOption[] = [
  {
    key: "medyk",
    label: "Medyk",
    mobileLabel: "Medyk",
    shortLabel: "Prowadzę własną ewidencję",
    icon: Stethoscope,
    status: "Dostępne teraz",
    statusTone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    title: "Prowadź własną ewidencję bez arkuszy i osobnych folderów.",
    description:
      "Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj aktualny status w jednym panelu.",
    cta: "Załóż konto medyka",
    href: "/rejestracja",
    detailsHref: "/dla-medyka",
    detailsLabel: "Dowiedz się więcej o profilu medyka",
    facts: ["110/200 pkt", "18 certyfikatów", "2 wpisy do uzupełnienia"],
    benefits: ["Panel CPD i kalkulator celu", "Aktywności z certyfikatami", "Raport użytkownika i baza szkoleń"],
  },
  {
    key: "placowka",
    label: "Placówka / jednostka",
    mobileLabel: "Placówka",
    shortLabel: "Wspieram zespół",
    icon: Building2,
    status: "Moduł w rozwoju",
    statusTone: "bg-amber-50 text-amber-800 ring-amber-100",
    title: "Uporządkuj ewidencję zespołu i szybciej wychwytuj braki.",
    description:
      "Indywidualna ewidencja pracowników działa już dziś. Zbiorczy widok jednostki i kompletności dokumentów jest rozwijany.",
    cta: "Zobacz zakres",
    href: "/dla-placowki",
    detailsHref: "/dla-placowki",
    detailsLabel: "Dowiedz się więcej o rozwiązaniu dla placówki",
    facts: ["24 osoby", "19 kompletnych", "5 do sprawdzenia"],
    benefits: ["Indywidualne konta pracowników", "Kontrola kompletności dokumentów", "Przygotowanie danych do weryfikacji"],
  },
  {
    key: "organizator",
    label: "Organizator kształcenia",
    mobileLabel: "Organizator",
    shortLabel: "Organizuję szkolenia",
    icon: UserRound,
    status: "Zakres ustalany indywidualnie",
    statusTone: "bg-blue-50 text-blue-700 ring-blue-100",
    title: "Porządkuj szkolenia, uczestników i dokumentację edukacyjną.",
    description:
      "CRPE rozwija obsługę wydarzeń, uczestników i certyfikatów. Zakres modułu ustalamy indywidualnie.",
    cta: "Poznaj zakres modułu",
    href: "/dla-organizatora",
    detailsHref: "/dla-organizatora",
    detailsLabel: "Dowiedz się więcej o rozwiązaniu dla organizatora",
    facts: ["3 wydarzenia", "86 uczestników", "72 certyfikaty"],
    benefits: ["Dane wydarzeń edukacyjnych", "Uczestnicy i dokumentacja", "Planowana obsługa certyfikatów"],
  },
];

function SectionHeading({
  eyebrow,
  title,
  text,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[27px] font-black leading-[1.1] tracking-[-0.035em] text-slate-950 sm:mt-3 sm:text-[37px]">
        {title}
      </h2>
      {text ? (
        <p className="mt-3 text-[15px] leading-6 text-slate-600 sm:mt-4 sm:text-[16px] sm:leading-7">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function DashboardHeader({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
          Przykładowy widok CRPE
        </p>
        <p className="mt-1 text-sm font-extrabold text-slate-900">{title}</p>
      </div>
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-blue-100">
        {note}
      </span>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FileCheck2;
  label: string;
  value: string;
  tone: "cyan" | "amber";
}) {
  const toneClass =
    tone === "cyan" ? "bg-cyan-50 text-cyan-700" : "bg-amber-50 text-amber-700";
  return (
    <div className="rounded-2xl border border-slate-200 p-3.5">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-bold text-slate-400">{label}</p>
          <p className="text-sm font-extrabold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BigMetric({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string;
  accent?: "blue" | "emerald" | "amber";
}) {
  const valueClass =
    accent === "emerald"
      ? "text-emerald-700"
      : accent === "amber"
        ? "text-amber-700"
        : "text-blue-700";
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
      <p className="text-[10px] font-bold leading-4 text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function MedykDashboard() {
  return (
    <>
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-slate-500">Twój postęp</p>
            <p className="mt-1 text-[28px] font-black tracking-tight text-slate-950">
              110 <span className="text-sm font-bold text-slate-500">/ 200 pkt</span>
            </p>
          </div>
          <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-blue-100">
            <p className="text-[10px] font-bold text-slate-400">Brakuje</p>
            <p className="text-sm font-black text-blue-700">90 pkt</p>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-blue-100">
          <div className="crpe-progress-fill h-full w-[55%] rounded-full bg-blue-600" />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-500">
          <span>55% celu</span>
          <span>2025–2028</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Metric icon={FileCheck2} label="Certyfikaty" value="18 dokumentów" tone="cyan" />
        <Metric icon={ClipboardCheck} label="Braki" value="2 aktywności" tone="amber" />
      </div>
    </>
  );
}

function PlacowkaDashboard() {
  const alerts = [
    ["Anna Kowalska", "Brak certyfikatu", "Dokumentacja: 7/8"],
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <BigMetric label="Pracownicy" value="24" />
        <BigMetric label="Kompletne" value="19" accent="emerald" />
        <BigMetric label="Wymaga uwagi" value="5" accent="amber" />
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-slate-950">Kompletność dokumentacji</p>
            <p className="mt-1 text-[11px] text-slate-500">Zbiorczy status zespołu</p>
          </div>
          <span className="text-lg font-black text-blue-700">79%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="crpe-progress-fill h-full w-[79%] rounded-full bg-blue-600" />
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">Wymaga uwagi</p>
            <p className="mt-1 text-[11px] text-slate-500">Najważniejsze braki do sprawdzenia</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-800 ring-1 ring-amber-100">5 osób</span>
        </div>

        <div className="mt-3 space-y-2">
          {alerts.map(([name, issue, progress]) => (
            <div key={name} className="crpe-row-in flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-extrabold text-slate-900">{name}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-amber-700">{issue}</p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-slate-500">{progress}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function OrganizatorDashboard() {
  return (
    <>
      <div className="rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_100%)] p-4">
        <p className="text-[11px] font-bold text-slate-500">Aktywne wydarzenia</p>
        <div className="mt-1 flex items-end justify-between gap-4">
          <p className="text-[32px] font-black tracking-tight text-slate-950">3</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-blue-700 ring-1 ring-blue-100">
            86 uczestników
          </span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Metric icon={FileCheck2} label="Wydane" value="72 certyfikaty" tone="cyan" />
        <Metric icon={ClipboardCheck} label="Do przygotowania" value="14 dokumentów" tone="amber" />
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["Diagnostyka obrazowa", "12.09.2026", "32 osoby"],
        ].map(([name, date, people]) => (
          <div key={name} className="crpe-row-in rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-slate-900">{name}</p>
                <p className="mt-1 text-[11px] text-slate-500">{date}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-slate-600 ring-1 ring-slate-200">
                {people}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function HeroDashboard({ selected }: { selected: AudienceKey }) {
  const active = audiences.find((item) => item.key === selected) ?? audiences[0];

  return (
    <div
      className="crpe-hero-panel relative mx-auto hidden w-full max-w-[570px] lg:block"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -right-10 -top-8 h-40 w-40 rounded-full bg-blue-200/55 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-44 w-44 rounded-full bg-cyan-200/45 blur-3xl" />

      <div className="crpe-dashboard-shell relative overflow-hidden rounded-[24px] border border-blue-100/80 bg-white shadow-[0_28px_75px_rgba(15,45,75,0.14)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]">
              {selected === "medyk" ? (
                <Stethoscope className="h-5 w-5" />
              ) : selected === "placowka" ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <UserRound className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
                Podgląd CRPE
              </p>
              <p className="mt-0.5 truncate text-[15px] font-black text-slate-950">
                {active.label}
              </p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ${active.statusTone}`}>
            {active.status}
          </span>
        </div>

        <div key={selected} className="crpe-role-swap p-4">
          {selected === "medyk" ? <MedykDashboard /> : null}
          {selected === "placowka" ? <PlacowkaDashboard /> : null}
          {selected === "organizator" ? <OrganizatorDashboard /> : null}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
          <p className="max-w-[310px] text-[12px] font-semibold leading-5 text-slate-600">
            Zobacz dokładnie, czym różni się zakres CRPE dla wybranej roli.
          </p>
          <Link
            href={active.detailsHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-[12px] font-extrabold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            Dowiedz się więcej <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
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
  return (
    <div className="crpe-role-picker grid w-full grid-cols-3 gap-1 rounded-[16px] border border-slate-200/90 bg-white p-1 shadow-[0_10px_28px_rgba(15,45,75,0.045)] sm:gap-1.5">
      {audiences.map(({ key, mobileLabel, icon: Icon }) => {
        const isSelected = selected === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(key)}
            className={`crpe-role-button group relative flex min-w-0 w-full items-center justify-center gap-2 rounded-[12px] px-2 py-2.5 text-[11px] font-extrabold outline-none sm:px-4 sm:py-3 sm:text-[14px] ${
              isSelected
                ? "bg-blue-600 text-white shadow-[0_7px_18px_rgba(37,99,235,0.16)]"
                : "bg-slate-50/65 text-slate-700 hover:bg-blue-50 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 transition-colors duration-200 ${isSelected ? "text-white" : "text-slate-500 group-hover:text-blue-700"}`} />
            <span className="truncate">{mobileLabel}</span>
            {isSelected ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/14" aria-hidden="true">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function SelectedRoleSummary({ selected }: { selected: AudienceKey }) {
  const active = audiences.find((item) => item.key === selected) ?? audiences[0];
  const Icon = active.icon;
  const selectedIndex = audiences.findIndex((item) => item.key === selected);

  return (
    <div
      key={selected}
      className="crpe-role-swap relative overflow-hidden rounded-[20px] border border-slate-200/90 bg-white shadow-[0_16px_46px_rgba(15,45,75,0.065)]"
      aria-live="polite"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-slate-100" aria-hidden="true" />
      <div
        className="absolute top-0 h-[2px] w-1/3 bg-[linear-gradient(90deg,#2563eb_0%,#38bdf8_100%)] transition-transform duration-500 ease-out"
        style={{ transform: `translateX(${selectedIndex * 100}%)` }}
        aria-hidden="true"
      />

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-9 lg:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_7px_18px_rgba(37,99,235,0.14)]">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-blue-600 sm:text-[10px]">
                Treść dopasowana do wyboru
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2.5">
                <p className="text-[17px] font-black text-slate-950 sm:text-[18px]">{active.label}</p>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ring-1 sm:text-[10px] ${active.statusTone}`}>
                  {active.status}
                </span>
              </div>
            </div>
          </div>

          <h3 className="mt-4 max-w-[620px] text-[21px] font-black leading-[1.16] tracking-[-0.03em] text-slate-950 sm:text-[25px]">
            {active.title}
          </h3>
          <p className="mt-2 max-w-[620px] text-[14px] leading-6 text-slate-600 sm:text-[15px]">
            {active.description}
          </p>

          <Link
            href={active.detailsHref}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-extrabold text-white shadow-[0_8px_18px_rgba(37,99,235,0.14)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Zobacz szczegóły tej roli <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 lg:border-l lg:border-slate-200/80 lg:pl-9">
          {active.benefits.map((item, index) => (
            <div
              key={item}
              className="crpe-row-in flex items-center gap-3 py-3 text-[13px] font-semibold leading-5 text-slate-700 first:pt-0 last:pb-0"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileRolePreview({ active }: { active: AudienceOption }) {
  const labels: Record<AudienceKey, [string, string, string]> = {
    medyk: ["Postęp", "Certyfikaty", "Do uzupełnienia"],
    placowka: ["Zespół", "Kompletne", "Do sprawdzenia"],
    organizator: ["Wydarzenia", "Uczestnicy", "Certyfikaty"],
  };
  const progress: Record<AudienceKey, string> = {
    medyk: "55%",
    placowka: "79%",
    organizator: "84%",
  };

  return (
    <div
      className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_38px_rgba(15,45,75,0.09)] lg:hidden"
      aria-label="Przykładowy podgląd dla wybranej roli"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-600">Podgląd profilu</p>
          <p className="mt-1 text-[14px] font-black text-slate-950">{active.label}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ring-1 ${active.statusTone}`}>
          {active.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {active.facts.map((fact, index) => (
          <div key={fact} className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5">
            <p className="text-[9px] font-bold leading-4 text-slate-500">{labels[active.key][index]}</p>
            <p className={`mt-0.5 text-[12px] font-black leading-4 ${index === 0 ? "text-blue-700" : "text-slate-900"}`}>
              {fact}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="crpe-progress-fill h-full rounded-full bg-blue-600" style={{ width: progress[active.key] }} />
      </div>

      <Link
        href={active.detailsHref}
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-extrabold text-blue-700"
      >
        Dowiedz się więcej <ArrowRight className="h-3.5 w-3.5" />
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
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef6fc_100%)] py-7 sm:py-11 lg:py-14">
      <div className="pointer-events-none absolute -left-36 top-0 h-[360px] w-[360px] rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-12 h-[340px] w-[340px] rounded-full bg-cyan-100/55 blur-3xl" />

      <div className={`${pageWrap} relative`}>
        <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
          <div className="lg:pt-2">
            <div className="crpe-hero-in inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-1.5 text-[11px] font-extrabold text-blue-800 shadow-sm [--hero-delay:40ms]">
              <ShieldCheck className="h-3.5 w-3.5" />
              CRPE dla medyków i organizacji
            </div>

            <h1 className="crpe-hero-in mt-4 max-w-[590px] text-[35px] font-black leading-[1.02] tracking-[-0.046em] text-slate-950 sm:mt-5 sm:text-[48px] lg:text-[54px] [--hero-delay:110ms]">
              <span className="block">Punkty</span>
              <span className="block">i dokumenty</span>
              <span className="block text-blue-600">w jednym miejscu.</span>
            </h1>

            <p className="crpe-hero-in mt-3 max-w-[570px] text-[15px] leading-6 text-slate-600 sm:mt-4 sm:text-[17px] sm:leading-7 [--hero-delay:180ms]">
              Prowadź ewidencję aktywności, certyfikatów i danych potrzebnych do rozliczeń — w zakresie dopasowanym do Twojej roli.
            </p>

            <div className="crpe-hero-in mt-5 lg:hidden [--hero-delay:250ms]">
              <RolePicker selected={selected} onSelect={onSelect} />
            </div>

            <div key={selected} className="crpe-role-swap mt-5 lg:mt-6" aria-live="polite">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-black text-slate-950">{active.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ring-1 sm:text-[10px] ${active.statusTone}`}>
                  {active.status}
                </span>
              </div>

              <h2 className="mt-2.5 max-w-[580px] text-[22px] font-black leading-[1.18] tracking-[-0.03em] text-slate-950 sm:text-[25px]">
                {active.title}
              </h2>
              <p className="mt-2 max-w-[590px] text-[14px] leading-6 text-slate-600 sm:text-[15px]">
                {active.description}
              </p>

              <ul className="mt-3.5 grid gap-2 sm:grid-cols-2">
                {active.benefits.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[14px] leading-5 text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <MobileRolePreview active={active} />

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href={active.href}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[14px] font-extrabold text-white shadow-[0_12px_25px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 sm:w-auto"
                >
                  {active.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="crpe-hero-in mx-auto mb-4 w-full max-w-[570px] [--hero-delay:230ms]">
              <RolePicker selected={selected} onSelect={onSelect} />
            </div>
            <HeroDashboard selected={selected} />
          </div>
        </div>
      </div>
    </section>
  );
}

function AudienceSection({
  selected,
  onSelect,
}: {
  selected: AudienceKey;
  onSelect: (key: AudienceKey) => void;
}) {
  const cards = [
    {
      key: "medyk" as AudienceKey,
      id: "dla-medyka",
      icon: Stethoscope,
      title: "Medyk",
      status: "Dostępne teraz",
      statusClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
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
      status: "Moduł w rozwoju",
      statusClass: "bg-amber-50 text-amber-800 ring-amber-100",
      text: "Ujednolicaj indywidualną ewidencję zespołu. Rozwijamy zbiorczy podgląd kompletności i raportów.",
      benefits: ["Konta pracowników", "Planowany widok zespołu", "Planowany eksport jednostki"],
      cta: "Zobacz zakres",
      href: "/dla-placowki",
    },
    {
      key: "organizator" as AudienceKey,
      id: "dla-organizatora",
      icon: UserRound,
      title: "Organizator kształcenia",
      status: "Zakres ustalany indywidualnie",
      statusClass: "bg-blue-50 text-blue-700 ring-blue-100",
      text: "Porządkuj informacje o wydarzeniach. Narzędzia administracyjne są udostępniane zależnie od uprawnień.",
      benefits: ["Baza wydarzeń", "Dane uczestników", "Obsługa dokumentacji"],
      cta: "Zobacz zakres",
      href: "/dla-organizatora",
    },
  ];

  return (
    <section id="dla-kogo" className="scroll-mt-24 pb-16 pt-10 sm:pb-20 sm:pt-14">
      <div className={pageWrap}>
        <div className="mx-auto max-w-[820px] text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.19em] text-blue-700">
            Wybierz swoją ścieżkę
          </p>
          <h1 className="mt-2 text-[27px] font-black tracking-[-0.04em] text-slate-950 sm:text-[34px]">
            Kim jesteś?
          </h1>
          <p className="mx-auto mt-3 max-w-[620px] text-[13px] leading-5 text-slate-500 sm:text-[14px] sm:leading-6">
            Wybierz rolę — opis, kolejne kroki i końcowa propozycja zmienią się od razu.
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-[980px] sm:mt-7">
          <RolePicker selected={selected} onSelect={onSelect} />
        </div>

        <div className="mx-auto mt-3 max-w-[1080px] sm:mt-4">
          <SelectedRoleSummary selected={selected} />
        </div>
      </div>

      <div className="mt-16 bg-[linear-gradient(180deg,#f7faff_0%,#eff5fb_100%)] py-16 sm:mt-20 sm:py-20">
        <div className={pageWrap}>
          <Reveal>
            <SectionHeading
              eyebrow="Dla kogo jest CRPE"
              title="Porównaj zakres CRPE dla każdej roli."
              text="Profil medyka działa już teraz. Moduły organizacyjne rozwijamy etapami i jasno oznaczamy ich aktualny zakres."
              centered
            />
          </Reveal>

          <div className="mt-9 grid gap-4 lg:mt-11 lg:grid-cols-3">
            {cards.map(({ key, id, icon: Icon, title, status, statusClass, text, benefits, cta, href }, index) => {
              const active = selected === key;
              return (
                <Reveal key={id} delay={index * 90} className="h-full">
                  <article
                    id={id}
                    className={`crpe-interactive-card relative flex h-full scroll-mt-24 flex-col overflow-hidden rounded-[20px] border p-5 shadow-[0_12px_36px_rgba(15,45,75,0.055)] sm:p-6 ${
                      active ? "border-slate-200 bg-blue-50/55" : "border-slate-200 bg-white"
                    }`}
                    aria-current={active ? "true" : undefined}
                  >
                    {active ? <span className="absolute inset-x-0 top-0 h-[3px] bg-blue-600" aria-hidden="true" /> : null}
                    <div className="flex items-start justify-between gap-3">
                      <span className={`crpe-card-icon flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ring-1 sm:text-[10px] ${statusClass}`}>
                        {status}
                      </span>
                    </div>
                    {active ? (
                      <span className="mt-3 inline-flex w-fit rounded-full bg-blue-600 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white">
                        Wybrana rola
                      </span>
                    ) : null}
                    <h3 className="mt-4 text-lg font-black tracking-[-0.02em] text-slate-950">{title}</h3>
                    <p className="mt-2 text-[14px] leading-6 text-slate-600">{text}</p>
                    <ul className="mt-4 grid gap-2">
                      {benefits.map((item) => (
                        <li key={item} className="flex gap-2.5 text-[14px] leading-5 text-slate-700">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                            <Check className="h-3 w-3" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={href}
                      className={`mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[14px] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                        key === "medyk"
                          ? "mt-6 bg-blue-600 text-white shadow-[0_9px_20px_rgba(37,99,235,0.14)] hover:bg-blue-700"
                          : "mt-6 border border-slate-300 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      {cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductToolsSection() {
  const tools = [
    {
      icon: BarChart3,
      title: "Panel CPD i kalkulator",
      status: "Dostępne",
      text: "Ustaw okres i wymagany cel, sprawdzaj postęp, limity oraz podpowiedź kolejnego kroku.",
      bullets: ["Cel i okres rozliczeniowy", "Postęp, limity i braki"],
    },
    {
      icon: CalendarCheck2,
      title: "Aktywności i certyfikaty",
      status: "Dostępne",
      text: "Dodawaj i edytuj aktywności, wpisuj punkty oraz dołączaj PDF lub zdjęcie certyfikatu.",
      bullets: ["Dokument przy właściwym wpisie", "Edycja i kontrola kompletności"],
    },
    {
      icon: FileText,
      title: "Raport użytkownika",
      status: "Dostępne",
      text: "Przygotuj zestawienie aktywności, punktów i załączników oraz eksportuj dokumenty.",
      bullets: ["Podsumowanie wybranego okresu", "Eksport PDF i ZIP"],
    },
    {
      icon: FolderOpen,
      title: "Baza szkoleń",
      status: "Dostępne",
      text: "Wyszukuj kursy, webinary i wydarzenia, filtruj je i dodawaj wybrane pozycje do planu CPD.",
      bullets: ["Filtry zawodu, miejsca i terminu", "Plan CPD bez automatycznego zapisu"],
    },
  ];

  return (
    <section id="narzedzia" className="scroll-mt-24 bg-blue-50/50 py-16 sm:py-20">
      <div className={pageWrap}>
        <Reveal>
          <SectionHeading
            eyebrow="Dostępne narzędzia"
            title="Po zalogowaniu widzisz cały warsztat CRPE, nie tylko kalkulator."
            text="Panel, aktywności, dokumenty, raport i baza szkoleń działają w jednym koncie i prowadzą użytkownika przez kolejne etapy ewidencji."
            centered
          />
        </Reveal>

        <Reveal delay={70}>
          <div className={`${panel} mt-9 overflow-hidden sm:mt-11`}>
            <div className="bg-slate-950 px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                    Stałe menu aplikacji
                  </p>
                  <p className="mt-1 text-[15px] font-black sm:text-base">
                    Najważniejsze funkcje są widoczne od razu po zalogowaniu.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-extrabold text-emerald-200 ring-1 ring-emerald-300/20">
                  Profil medyka dostępny teraz
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {tools.map(({ icon: Icon, title }, index) => (
                  <div
                    key={title}
                    className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] font-extrabold ${
                      index === 0
                        ? "border-blue-400/40 bg-blue-500/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{title.replace(" i kalkulator", "")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
              {tools.map(({ icon: Icon, title, status, text, bullets }, index) => (
                <Reveal key={title} delay={index * 70} className="h-full last:[&>article]:border-b-0">
                  <article className="crpe-interactive-card flex h-full min-h-[280px] flex-col rounded-[18px] border border-slate-200 bg-slate-50/75 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="crpe-card-icon flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                        {status}
                      </span>
                    </div>
                    <h3 className="mt-4 min-h-[44px] text-[17px] font-black leading-[1.25] tracking-[-0.02em] text-slate-950">{title}</h3>
                    <p className="mt-2 text-[14px] leading-6 text-slate-600">{text}</p>
                    <ul className="mt-4 grid gap-2">
                      {bullets.map((item) => (
                        <li key={item} className="flex gap-2 text-[13px] leading-5 text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PracticeSection() {
  const rows = [
    ["Kurs specjalistyczny", "25 pkt", "Certyfikat dodany"],
    ["Webinar", "8 pkt", "Uzupełnij dokument"],
  ];

  return (
    <section className="bg-slate-950 py-16 text-white sm:py-20">
      <div className={`${pageWrap} grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-12`}>
        <Reveal>
          <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] font-extrabold text-cyan-200 ring-1 ring-cyan-300/20">
            Przykład: profil medyka
          </div>
          <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-300">CRPE w praktyce</p>
          <h2 className="mt-2 text-[28px] font-black leading-[1.1] tracking-[-0.035em] sm:text-[39px]">
            Panel CPD łączy kalkulator, aktywności i dokumenty.
          </h2>
          <p className="mt-3 text-[15px] leading-6 text-slate-300 sm:mt-4 sm:text-[16px] sm:leading-7">
            Kalkulator pokazuje postęp, Aktywności przechowują wpisy i certyfikaty, a Raport zbiera wszystko w jedno zestawienie.
          </p>

          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            {["Stały dostęp do Aktywności i Raportów", "Braki oznaczone przed rozliczeniem"].map((item) => (
              <li key={item} className="flex gap-3 text-[13px] leading-5 text-slate-200 sm:text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/30">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="crpe-dashboard-shell overflow-hidden rounded-[20px] border border-white/10 bg-white p-4 text-slate-900 shadow-[0_24px_64px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Panel CPD</p>
              <p className="mt-1 text-[13px] font-extrabold text-slate-900">Podgląd statusu dokumentacji</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700 ring-1 ring-emerald-100">Dane przykładowe</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[0.64fr_0.36fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">Status dokumentacji</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[30px] font-black tracking-tight text-slate-950">110/200</span>
                <span className="pb-1 text-xs font-bold text-slate-500">pkt</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                <div className="crpe-progress-fill h-full w-[55%] rounded-full bg-blue-600" />
              </div>
              <div className="mt-3 space-y-2">
                {rows.map(([name, points, status], index) => (
                  <div key={name} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-extrabold text-slate-900">{name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{points}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${index === 1 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3.5">
                <p className="text-[10px] font-bold text-slate-500">Najbliższy krok</p>
                <p className="mt-1.5 text-[13px] font-black text-slate-950">Uzupełnij 1 dokument</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3.5">
                <UploadCloud className="h-5 w-5 text-blue-600" />
                <p className="mt-2 text-[13px] font-black text-slate-950">Dodaj PDF lub zdjęcie</p>
              </div>
            </div>
          </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

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
      text: "Indywidualne konta pracowników są dostępne teraz. Zakres widoku zbiorczego ustalamy zgodnie z etapem rozwoju modułu.",
      steps: [
        { icon: ClipboardCheck, title: "Ustal zakres", text: "Określ potrzeby jednostki." },
        { icon: Building2, title: "Dodaj strukturę", text: "Przygotuj zespoły i role." },
        { icon: UserRound, title: "Zaproś pracowników", text: "Każdy prowadzi własne dane." },
        { icon: BarChart3, title: "Sprawdzaj kompletność", text: "Wychwytuj braki i terminy." },
      ],
    },
    organizator: {
      title: "Ustal zakres obsługi szkoleń w czterech krokach.",
      text: "Funkcje organizatora rozwijamy indywidualnie — od danych wydarzenia po dokumentację uczestników.",
      steps: [
        { icon: ClipboardCheck, title: "Ustal zakres", text: "Określ rodzaj wydarzeń i danych." },
        { icon: CalendarCheck2, title: "Dodaj wydarzenie", text: "Uzupełnij program i terminy." },
        { icon: UserRound, title: "Dodaj uczestników", text: "Uporządkuj listy i statusy." },
        { icon: FileCheck2, title: "Przygotuj dokumenty", text: "Zarządzaj certyfikatami i historią." },
      ],
    },
  };
  const active = variants[selected];

  return (
    <section id="jak-to-dziala" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className={pageWrap}>
        <Reveal>
          <SectionHeading eyebrow="Jak to działa" title={active.title} text={active.text} centered />
        </Reveal>

        <div key={selected} className="crpe-role-swap relative mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
          <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-blue-100 xl:block" aria-hidden="true" />
          {active.steps.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 90} className="relative h-full">
              <article className="crpe-step-card relative flex h-full min-h-[132px] items-start gap-4 rounded-[18px] border border-slate-200 bg-slate-50/70 p-5 xl:mx-1.5">
                <span className="crpe-card-icon relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white text-blue-700 shadow-[0_7px_18px_rgba(15,45,75,0.06)] ring-1 ring-blue-100">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-400">0{index + 1}</span>
                  <h3 className="mt-1 text-[15px] font-black text-slate-950">{title}</h3>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    <section id="bezpieczenstwo" className={`${pageWrap} scroll-mt-24 py-11 sm:py-14`}>
      <Reveal>
        <div className={`${panel} overflow-hidden p-5 sm:p-8 lg:p-9`}>
          <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10">
            <div>
              <SectionHeading
                eyebrow="Zakres i bezpieczeństwo"
                title="CRPE pomaga prowadzić własną ewidencję."
                text="System porządkuje aktywności, punkty i dokumenty, ale nie zastępuje oficjalnych rejestrów ani wymaganej procedury rozliczenia."
              />
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/polityka-prywatnosci" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-[14px] font-extrabold text-slate-700 hover:border-blue-200 hover:bg-blue-50">
                  Polityka prywatności
                </Link>
                <Link href="/regulamin" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-[14px] font-extrabold text-slate-700 hover:border-blue-200 hover:bg-blue-50">
                  Regulamin
                </Link>
              </div>
            </div>

            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-4 sm:px-5">
              {items.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-950">{title}</h3>
                    <p className="mt-1 text-[14px] leading-5 text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

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
      "Pomaga ujednolicić indywidualną ewidencję w zespole. Zbiorczy moduł organizacyjny z podglądem statusów i raportami jest rozwijany.",
    ],
    [
      "Czy CRPE jest dla organizatorów kształcenia?",
      "CRPE rozwija funkcje związane z wydarzeniami, uczestnikami i dokumentacją. Rozszerzone narzędzia są udostępniane zależnie od uprawnień.",
    ],
    [
      "Czy mogę dodać certyfikat z telefonu?",
      "Tak. Dokument możesz dodać jako plik PDF lub zdjęcie i przypisać do konkretnej aktywności.",
    ],
  ];

  return (
    <section id="faq" className={`${pageWrap} scroll-mt-24 py-16 sm:py-20`}>
      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-8">
        <Reveal>
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 sm:h-11 sm:w-11">
              <HelpCircle className="h-5 w-5" />
            </span>
            <div className="mt-3">
              <SectionHeading
                eyebrow="FAQ"
                title="Najczęstsze pytania przed wyborem swojej ścieżki."
                text="Najważniejsze informacje dla medyka, placówki i organizatora kształcenia."
              />
            </div>
            <Link href="/kontakt#formularz" className="mt-4 inline-flex items-center gap-2 text-[13px] font-extrabold text-blue-700 underline decoration-blue-200 underline-offset-4 sm:mt-5 sm:text-sm">
              Masz inne pytanie? Napisz do nas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="space-y-3">
          {items.map(([question, answer], index) => (
            <Reveal key={question} delay={index * 55}>
              <details className="group rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-[0_9px_26px_rgba(15,45,75,0.045)] transition hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-[0_13px_32px_rgba(15,45,75,0.065)] sm:px-5 sm:py-3.5">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-black leading-5 text-slate-950 sm:min-h-14 sm:text-[15px]">
                  {question}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition duration-200 group-open:rotate-45 group-open:bg-blue-100">+</span>
                </summary>
                <p className="mt-1 max-w-3xl border-t border-slate-100 pb-2 pt-4 pr-8 text-[14px] leading-6 text-slate-600">{answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  const [selectedAudience, setSelectedAudience] = useState<AudienceKey>("medyk");

  return (
    <div className="min-h-screen bg-white">
      <AudienceSection selected={selectedAudience} onSelect={setSelectedAudience} />
      <HowItWorks selected={selectedAudience} />
      <PracticeSection />
      <ProductToolsSection />
      <TrustSection />
      <FaqSection />
      <BottomCTA selected={selectedAudience} />
    </div>
  );
}
