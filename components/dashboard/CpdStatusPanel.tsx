// components/dashboard/CpdStatusPanel.tsx
"use client";

import Link from "next/link";
import React from "react";

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

  doneCount: number;
  plannedCount: number;

  primaryCtaHref?: string; // np. /aktywnosci?new=1
  secondaryCtaHref?: string; // np. /aktywnosci
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function fmtPct(n: number) {
  return `${Math.round(n)}%`;
}

function statusFromProgress(progressPct: number, missingPoints: number) {
  // Proste, czytelne progi (możesz później podmienić na logikę "dni do końca okresu" itd.)
  if (missingPoints <= 0) {
    return { label: "Bezpiecznie", tone: "ok" as const, hint: "Masz komplet punktów w tym okresie." };
  }
  if (progressPct >= 70) {
    return { label: "Na dobrej drodze", tone: "ok" as const, hint: "Utrzymaj tempo, a domkniesz okres bez stresu." };
  }
  if (progressPct >= 35) {
    return { label: "Ryzyko", tone: "warn" as const, hint: "Warto zaplanować 1–2 aktywności w najbliższym czasie." };
  }
  return { label: "Alarm", tone: "bad" as const, hint: "Masz dużo do nadrobienia — dodaj plan i dowody." };
}

function ToneBadge({ tone, label }: { tone: "ok" | "warn" | "bad"; label: string }) {
  const map = {
    ok: {
      wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
      dot: "bg-emerald-500",
    },
    warn: {
      wrap: "border-amber-200 bg-amber-50 text-amber-900",
      dot: "bg-amber-500",
    },
    bad: {
      wrap: "border-rose-200 bg-rose-50 text-rose-800",
      dot: "bg-rose-500",
    },
  }[tone];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${map.wrap}`}>
      <span className={`h-2 w-2 rounded-full ${map.dot}`} />
      {label}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-[11px] font-semibold text-slate-600">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

export default function CpdStatusPanel({
  title = "Twój status CPD",
  userEmail,
  profileProfession,
  isBusy,
  periodLabel,
  donePoints,
  requiredPoints,
  missingPoints,
  progressPct,
  doneCount,
  plannedCount,
  primaryCtaHref = "/aktywnosci?new=1",
  secondaryCtaHref = "/aktywnosci",
}: Props) {
  const safeProgress = clamp(progressPct, 0, 100);
  const status = statusFromProgress(safeProgress, missingPoints);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-semibold text-slate-600">Panel CPD</div>

            <ToneBadge tone={status.tone} label={status.label} />

            {isBusy ? (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Synchronizacja…
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Zsynchronizowane
              </span>
            )}
          </div>

          <div className="mt-2">
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-700">{status.hint}</div>
          </div>

          {/* Big numbers */}
          <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
            <div className="text-4xl font-extrabold text-slate-900">
              {donePoints}/{requiredPoints}
              <span className="ml-2 text-base font-semibold text-slate-600">pkt</span>
            </div>

            {missingPoints > 0 ? (
              <div className="text-2xl font-extrabold text-rose-700">
                brakuje {missingPoints}
                <span className="ml-2 text-base font-semibold text-rose-600">pkt</span>
              </div>
            ) : (
              <div className="text-2xl font-extrabold text-emerald-700">komplet ✅</div>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700">Postęp w okresie {periodLabel}</div>
              <div className="text-xs font-semibold text-slate-700">{fmtPct(safeProgress)}</div>
            </div>

            <div className="mt-2 rounded-full bg-slate-100 p-1">
              <div className="h-3 rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-blue-700"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600">
              Ukończone: <span className="font-semibold text-slate-900">{doneCount}</span> • Plan:{" "}
              <span className="font-semibold text-slate-900">{plannedCount}</span>
            </div>
          </div>

          {/* Identity pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {userEmail ? (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                {userEmail}
              </span>
            ) : null}

            {profileProfession ? (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                Profil: {profileProfession}
              </span>
            ) : null}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex w-full flex-col gap-3 md:w-[340px]">
          <div className="grid grid-cols-2 gap-3">
            <StatPill label="Okres" value={periodLabel} />
            <StatPill label="Wymagane" value={`${requiredPoints} pkt`} />
            <StatPill label="Zaliczone" value={`${donePoints} pkt`} />
            <StatPill label="Brakuje" value={`${missingPoints} pkt`} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              + Dodaj aktywność
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Aktywności
              </Link>

              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Portfolio PDF
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            Wskazówka: uzupełniaj wpisy na bieżąco i dodawaj dowody — wtedy raport PDF jest zawsze gotowy „na kontrolę”.
          </div>
        </div>
      </div>
    </div>
  );
}
