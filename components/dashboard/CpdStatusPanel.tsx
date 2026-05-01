// components/dashboard/CpdStatusPanel.tsx
"use client";

import Link from "next/link";
import React from "react";

type NextStep = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type TopLimitItem = {
  key: string;
  label: string;
  used: number;
  cap: number;
  remaining: number;
  usedPct: number;
  note?: string;
  mode?: "per_period" | "per_year" | "per_item";
};

type Props = {
  title?: string;
  userEmail?: string | null;
  profileProfession?: string | null;
  isBusy: boolean;
  periodLabel: string;
  donePoints: number;
  requiredPoints: number;
  missingPoints: number;
  progressPct: number;
  evidencePct: number;
  daysLeft: number;
  doneCount: number;
  plannedCount: number;
  missingEvidenceCount: number;
  nextStep: NextStep;
  topLimits: TopLimitItem[];
  limitWarning?: string | null;
  primaryCtaHref?: string;
  secondaryCtaHref?: string;
  portfolioHref?: string;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pct(n: number) {
  return `${Math.round(clamp(n, 0, 100))}%`;
}

const BTN =
  "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition";
const BTN_PRIMARY = "bg-blue-600 text-white hover:bg-blue-700";
const BTN_SECONDARY =
  "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
const BTN_PRO =
  "border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100";

function StatusBadge({
  missingPoints,
  missingEvidenceCount,
}: {
  missingPoints: number;
  missingEvidenceCount: number;
}) {
  if (missingPoints <= 0 && missingEvidenceCount <= 0) {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        Kompletne
      </span>
    );
  }

  if (missingEvidenceCount > 0) {
    return (
      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
        Wymaga dokumentów
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
      W trakcie
    </span>
  );
}

function LimitCard({ item }: { item: TopLimitItem }) {
  const usedPct = clamp(item.usedPct, 0, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">
            {item.label}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {Math.round(item.used)} / {Math.round(item.cap)} pkt
          </div>
        </div>
        <div className="shrink-0 text-xs font-bold text-slate-700">
          {pct(usedPct)}
        </div>
      </div>

      <div className="mt-3 h-2.5 rounded-full bg-slate-200">
        <div
          className="h-2.5 rounded-full bg-blue-600"
          style={{ width: `${usedPct}%` }}
        />
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Pozostało:{" "}
        <span className="font-semibold text-slate-800">
          {Math.round(item.remaining)} pkt
        </span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function CpdStatusPanel({
  userEmail,
  profileProfession,
  isBusy,
  periodLabel,
  donePoints,
  requiredPoints,
  missingPoints,
  progressPct,
  evidencePct,
  daysLeft,
  doneCount,
  plannedCount,
  missingEvidenceCount,
  nextStep,
  topLimits,
  limitWarning,
  primaryCtaHref = "/aktywnosci?new=1",
  secondaryCtaHref = "/aktywnosci",
  portfolioHref = "/portfolio",
}: Props) {
  const pointsPct = clamp(progressPct, 0, 100);
  const docsPct = clamp(evidencePct, 0, 100);

  const primary =
    missingEvidenceCount > 0
      ? { href: "/aktywnosci", label: "Uzupełnij dokumenty" }
      : missingPoints > 0
      ? { href: primaryCtaHref, label: "+ Dodaj aktywność" }
      : { href: portfolioHref, label: "Wygeneruj PDF" };

  const nextHref = nextStep.ctaHref || primary.href;
  const nextLabel = nextStep.ctaLabel || primary.label;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm ring-1 ring-slate-200/60 md:px-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Panel CPD
            </p>

            <StatusBadge
              missingPoints={missingPoints}
              missingEvidenceCount={missingEvidenceCount}
            />

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              {isBusy ? "Synchronizacja…" : "Zsynchronizowane"}
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-slate-950">
            Status punktów
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Najważniejsze informacje o Twoim okresie rozliczeniowym i brakach.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/profil" className={`${BTN} ${BTN_SECONDARY}`}>
            Uzupełnij profil
          </Link>
          <Link href={primary.href} className={`${BTN} ${BTN_PRIMARY}`}>
            {primary.label}
          </Link>
        </div>
      </div>

      {/* MAIN STATUS */}
      <div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <div className="text-5xl font-bold tracking-[-0.04em] text-slate-950">
              {donePoints}
              <span className="text-3xl text-slate-400">/{requiredPoints}</span>
            </div>

            <div className="pb-1 text-base font-semibold text-slate-500">pkt</div>

            {missingPoints > 0 ? (
              <div className="pb-1 text-2xl font-bold text-rose-600">
                brakuje {missingPoints} pkt
              </div>
            ) : (
              <div className="pb-1 text-2xl font-bold text-emerald-700">
                komplet
              </div>
            )}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Postęp w okresie {periodLabel}</span>
              <span>{pct(pointsPct)}</span>
            </div>

            <div className="mt-2 h-3 rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full bg-blue-600"
                style={{ width: `${pointsPct}%` }}
              />
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Ukończone:{" "}
              <span className="font-semibold text-slate-800">{doneCount}</span>{" "}
              · Zaplanowane:{" "}
              <span className="font-semibold text-slate-800">
                {plannedCount}
              </span>
            </div>
          </div>
        </div>

        {/* NEXT STEP */}
        <div
          className={[
            "rounded-2xl border p-5",
            missingEvidenceCount > 0
              ? "border-rose-200 bg-rose-50"
              : "border-blue-100 bg-blue-50",
          ].join(" ")}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Następny krok
          </p>

          <h3 className="mt-2 text-xl font-bold text-slate-950">
            {nextStep.title}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {nextStep.description}
          </p>

          <Link href={nextHref} className={`${BTN} ${BTN_PRIMARY} mt-4 w-full`}>
            {nextLabel}
          </Link>
        </div>
      </div>

      {/* PROFILE + STATS */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Dane do rozliczenia
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">
                {profileProfession || "Uzupełnij profil"}
              </h3>
              {userEmail ? (
                <p className="mt-1 text-sm text-slate-500">{userEmail}</p>
              ) : null}
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {periodLabel}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Sprawdź zawód, okres rozliczeniowy i dane PWZ. To pomoże poprawnie
            liczyć punkty i przygotować raport.
          </p>

          <Link href="/profil" className={`${BTN} ${BTN_SECONDARY} mt-4`}>
            Przejdź do profilu →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MiniStat label="Dni do końca" value={daysLeft} />
          <MiniStat label="Dowody" value={pct(docsPct)} />
          <MiniStat label="Wymagane" value={`${requiredPoints} pkt`} />
          <MiniStat label="Bez certyfikatu" value={missingEvidenceCount} />
        </div>
      </div>

      {/* LIMITS */}
      {topLimits?.length ? (
        <div className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Limity
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">
                Najważniejsze limity
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Kontroluj kategorie, które mają ograniczenia punktowe.
              </p>
            </div>

            <Link
              href={secondaryCtaHref}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Wszystkie aktywności →
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {topLimits.map((item) => (
              <LimitCard key={item.key} item={item} />
            ))}
          </div>

          {limitWarning ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <span className="font-bold">Uwaga:</span> {limitWarning}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* BOTTOM ACTIONS */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={primary.href} className={`${BTN} ${BTN_PRIMARY}`}>
          {primary.label}
        </Link>
        <Link href={portfolioHref} className={`${BTN} ${BTN_PRO}`}>
          Zestawienie PDF – PRO
        </Link>
        <Link href="/baza-szkolen" className={`${BTN} ${BTN_SECONDARY}`}>
          Znajdź szkolenie
        </Link>
        <Link href="/profil" className={`${BTN} ${BTN_SECONDARY}`}>
          Profil
        </Link>
      </div>
    </div>
  );
}
