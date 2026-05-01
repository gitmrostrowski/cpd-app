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

const btn =
  "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-bold transition";
const primaryBtn = "bg-blue-600 text-white shadow-sm hover:bg-blue-700";
const lightBtn =
  "border border-slate-200 bg-white/80 text-slate-800 hover:bg-white";
const proBtn =
  "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100";

function SmallStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function StatusBadge({
  missingPoints,
  missingEvidenceCount,
}: {
  missingPoints: number;
  missingEvidenceCount: number;
}) {
  if (missingPoints <= 0 && missingEvidenceCount <= 0) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
        Kompletne
      </span>
    );
  }

  if (missingEvidenceCount > 0) {
    return (
      <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
        Wymaga dokumentów
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
      W trakcie
    </span>
  );
}

function LimitMini({ item }: { item: TopLimitItem }) {
  const usedPct = clamp(item.usedPct, 0, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-slate-900">
            {item.label}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-slate-500">
            {Math.round(item.used)} / {Math.round(item.cap)} pkt
          </div>
        </div>

        <div className="shrink-0 text-xs font-extrabold text-slate-700">
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
        <span className="font-bold text-slate-800">
          {Math.round(item.remaining)} pkt
        </span>
      </div>
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

  const nextStepHref = nextStep.ctaHref || primary.href;
  const nextStepLabel = nextStep.ctaLabel || primary.label;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-xl ring-1 ring-slate-200/60 backdrop-blur md:p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* LEWA STRONA */}
        <section className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Panel CPD
            </div>

            <StatusBadge
              missingPoints={missingPoints}
              missingEvidenceCount={missingEvidenceCount}
            />

            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {isBusy ? "Synchronizacja…" : "Zsynchronizowane"}
            </span>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-500">
              Status punktów
            </div>

            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="text-5xl font-black tracking-tight text-slate-950">
                {donePoints}
                <span className="text-3xl text-slate-400">/{requiredPoints}</span>
              </div>

              <div className="pb-1 text-base font-bold text-slate-500">pkt</div>

              {missingPoints > 0 ? (
                <div className="pb-1 text-2xl font-black text-rose-600">
                  brakuje {missingPoints} pkt
                </div>
              ) : (
                <div className="pb-1 text-2xl font-black text-emerald-700">
                  komplet
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Postęp w okresie {periodLabel}</span>
                <span>{pct(pointsPct)}</span>
              </div>

              <div className="mt-2 h-4 rounded-full bg-slate-200">
                <div
                  className="h-4 rounded-full bg-blue-600"
                  style={{ width: `${pointsPct}%` }}
                />
              </div>

              <div className="mt-2 text-xs text-slate-500">
                Ukończone:{" "}
                <span className="font-bold text-slate-800">{doneCount}</span>{" "}
                · Zaplanowane:{" "}
                <span className="font-bold text-slate-800">{plannedCount}</span>
              </div>
            </div>
          </div>

          {/* LIMITY */}
          {topLimits?.length ? (
            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    Najważniejsze limity
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Kontroluj kategorie, które mają ograniczenia punktowe.
                  </div>
                </div>

                <Link
                  href={secondaryCtaHref}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800"
                >
                  Wszystkie aktywności →
                </Link>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {topLimits.map((item) => (
                  <LimitMini key={item.key} item={item} />
                ))}
              </div>

              {limitWarning ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <span className="font-extrabold">Uwaga:</span> {limitWarning}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* PRAWA STRONA */}
        <aside className="space-y-3">
          {/* NASTĘPNY KROK */}
          <div
            className={[
              "rounded-3xl border p-4 shadow-sm",
              missingEvidenceCount > 0
                ? "border-rose-200 bg-rose-50"
                : "border-blue-200 bg-blue-50",
            ].join(" ")}
          >
            <div className="text-xs font-black uppercase tracking-wide text-slate-600">
              Następny krok
            </div>

            <div className="mt-2 text-lg font-black text-slate-950">
              {nextStep.title}
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-700">
              {nextStep.description}
            </p>

            <Link href={nextStepHref} className={`${btn} ${primaryBtn} mt-4 w-full`}>
              {nextStepLabel}
            </Link>
          </div>

          {/* PROFIL */}
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Dane do rozliczenia
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  {profileProfession || "Uzupełnij profil"}
                </div>
                {userEmail ? (
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {userEmail}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {periodLabel}
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Upewnij się, że zawód, okres rozliczeniowy i dane PWZ są poprawne.
            </p>

            <Link href="/profil" className={`${btn} ${lightBtn} mt-3 w-full`}>
              Uzupełnij profil →
            </Link>
          </div>

          {/* LICZBY */}
          <div className="grid grid-cols-2 gap-3">
            <SmallStat label="Dni do końca" value={daysLeft} />
            <SmallStat label="Dowody" value={pct(docsPct)} />
            <SmallStat label="Wymagane" value={`${requiredPoints} pkt`} />
            <SmallStat label="Bez certyfikatu" value={missingEvidenceCount} />
          </div>

          {/* CTA */}
          <div className="grid gap-2">
            <Link href={primary.href} className={`${btn} ${primaryBtn} w-full`}>
              {primary.label}
            </Link>

            <Link href={portfolioHref} className={`${btn} ${proBtn} w-full`}>
              Zestawienie PDF – PRO
            </Link>

            <Link href="/baza-szkolen" className={`${btn} ${lightBtn} w-full`}>
              Znajdź szkolenie
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
