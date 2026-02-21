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
  usedPct: number; // 0..100
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

function fmtPct(n: number) {
  return `${Math.round(n)}%`;
}

// Spójny „activity blue”
const PRIMARY_BTN =
  "bg-blue-600 hover:bg-blue-700 text-white shadow-sm";
const PRIMARY_BTN_BASE =
  "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold";
const PRIMARY_BAR = "bg-blue-600";
const PRIMARY_DOT = "bg-blue-700";

function statusFromProgress(progressPct: number, missingPoints: number) {
  if (missingPoints <= 0) {
    return {
      label: "Bezpiecznie",
      tone: "ok" as const,
      reason: "komplet punktów",
      hint: "Masz komplet punktów w tym okresie. Portfolio możesz wygenerować w 1 kliknięcie.",
    };
  }
  if (progressPct >= 70) {
    return {
      label: "Na dobrej drodze",
      tone: "ok" as const,
      reason: "wysoki postęp",
      hint: "Utrzymaj tempo, a domkniesz okres bez stresu.",
    };
  }
  if (progressPct >= 35) {
    return {
      label: "Ryzyko",
      tone: "warn" as const,
      reason: "średni postęp",
      hint: "Warto zaplanować 1–2 aktywności i uzupełnić dowody.",
    };
  }
  return {
    label: "Alarm",
    tone: "bad" as const,
    reason: "niski postęp",
    hint: "Masz dużo do nadrobienia — dodaj plan i dowody, żeby być gotowym „na kontrolę”.",
  };
}

function ToneBadge({
  tone,
  label,
  reason,
}: {
  tone: "ok" | "warn" | "bad";
  label: string;
  reason: string;
}) {
  const map = {
    ok: {
      wrap: "border-blue-200 bg-blue-50 text-blue-900",
      dot: "bg-blue-600",
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
      <span className="text-[11px] font-semibold opacity-80">• {reason}</span>
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

function MiniCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}

function limitTone(used: number, usedPct: number) {
  // jeśli 0 → ostrzeżenie (czerwony), bo użytkownik jeszcze „nie zaczął”
  if (used <= 0) return { badge: "Brak", tone: "bad" as const };

  if (usedPct >= 100) return { badge: "Limit", tone: "bad" as const };
  if (usedPct >= 80) return { badge: "Uwaga", tone: "warn" as const };

  // neutralnie/niebiesko (miękko, a nie zielono)
  return { badge: "W trakcie", tone: "ok" as const };
}

function LimitBadge({ tone, text }: { tone: "ok" | "warn" | "bad"; text: string }) {
  const cls =
    tone === "ok"
      ? "bg-blue-50 text-blue-900"
      : tone === "warn"
      ? "bg-amber-50 text-amber-900"
      : "bg-rose-50 text-rose-800";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${cls}`}>
      {text}
    </span>
  );
}

function MiniLimitCard({ item }: { item: TopLimitItem }) {
  const pct = clamp(item.usedPct, 0, 100);
  const t = limitTone(item.used, pct);

  // jeśli 0 → delikatny czerwony akcent na obrysie (miękko)
  const wrapCls =
    item.used <= 0
      ? "rounded-2xl border border-rose-200 bg-white p-3 shadow-sm"
      : "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm";

  return (
    <div className={wrapCls}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-extrabold text-slate-900">{item.label}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-slate-600">
            {Math.round(item.used)}/{Math.round(item.cap)} pkt
          </div>
        </div>
        <LimitBadge tone={t.tone} text={t.badge} />
      </div>

      {/* mini bar – czytelny, nieprzygnębiający */}
      <div className="mt-2">
        <div className="h-2 rounded-full border border-slate-200 bg-slate-100">
          <div className={`h-2 rounded-full ${PRIMARY_BAR}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-1 text-[11px] text-slate-600">
        Pozostało: <span className="font-semibold text-slate-900">{Math.round(item.remaining)} pkt</span>
      </div>
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
  missingEvidenceCount,
  nextStep,
  topLimits,
  limitWarning,
  primaryCtaHref = "/aktywnosci?new=1",
  secondaryCtaHref = "/aktywnosci",
  portfolioHref = "/portfolio",
}: Props) {
  const safeProgress = clamp(progressPct, 0, 100);
  const status = statusFromProgress(safeProgress, missingPoints);

  return (
    <div className="space-y-4">
      {/* GŁÓWNA KARTA */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* LEFT */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-semibold text-slate-600">Panel CPD</div>

              <ToneBadge tone={status.tone} label={status.label} reason={status.reason} />

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

            {/* PROGRESS – niebieski jak w Aktywnościach */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700">Postęp w okresie {periodLabel}</div>
                <div className="text-xs font-semibold text-slate-700">{fmtPct(safeProgress)}</div>
              </div>

              <div className="mt-2">
                <div className="relative h-5 rounded-full border border-slate-200 bg-slate-100">
                  <div className={`h-5 rounded-full ${PRIMARY_BAR}`} style={{ width: `${safeProgress}%` }} />
                  <div
                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white ${PRIMARY_DOT} shadow`}
                    style={{ left: `calc(${safeProgress}% - 8px)` }}
                    aria-hidden
                  />
                  {/* ticks 25/50/75 */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[25%]">
                    <span className="h-3 w-px bg-slate-200/80" />
                    <span className="h-3 w-px bg-slate-200/80" />
                    <span className="h-3 w-px bg-slate-200/80" />
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-600">
                Ukończone: <span className="font-semibold text-slate-900">{doneCount}</span> • Plan:{" "}
                <span className="font-semibold text-slate-900">{plannedCount}</span>
              </div>
            </div>

            {/* MINI-LIMITY POD PASKIEM */}
            {topLimits?.length ? (
              <div className="mt-4">
                <div className="text-xs font-extrabold text-slate-900">Limity w tym okresie</div>
                <div className="mt-1 text-xs text-slate-600">
                  Jeśli limit jest osiągnięty, kolejne podobne aktywności mogą nie zwiększyć punktów.
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {topLimits.map((x) => (
                    <MiniLimitCard key={x.key} item={x} />
                  ))}
                </div>

                {limitWarning ? (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    <span className="font-extrabold">Uwaga:</span> {limitWarning}
                  </div>
                ) : null}
              </div>
            ) : null}

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
          <div className="flex w-full flex-col gap-3 md:w-[360px]">
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Okres" value={periodLabel} />
              <StatPill label="Wymagane" value={`${requiredPoints} pkt`} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-semibold text-slate-600">Najbliższy krok</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">{nextStep.title}</div>
              <div className="mt-1 text-sm text-slate-700">{nextStep.description}</div>

              {nextStep.ctaHref && nextStep.ctaLabel ? (
                <Link
                  href={nextStep.ctaHref}
                  className={`${PRIMARY_BTN_BASE} ${PRIMARY_BTN} mt-3 w-full`}
                >
                  {nextStep.ctaLabel}
                </Link>
              ) : null}
            </div>

            {/* CTA — symetria: ten sam rozmiar/klasa */}
            <div className="grid grid-cols-1 gap-2">
              <Link
                href={primaryCtaHref}
                className={`${PRIMARY_BTN_BASE} ${PRIMARY_BTN} w-full`}
              >
                + Dodaj aktywność
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <MiniCta href={secondaryCtaHref} label="Aktywności" />
                <MiniCta href={portfolioHref} label="Portfolio (PDF do kontroli)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DWA KAFLE */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-600">Do uzupełnienia</div>
          <div className="mt-2 text-lg font-extrabold text-slate-900">
            {missingEvidenceCount > 0 ? `${missingEvidenceCount} wpisów bez certyfikatu` : "Wszystkie wpisy mają dowody ✅"}
          </div>
          <div className="mt-1 text-sm text-slate-700">
            Dodaj zdjęcie/PDF certyfikatu, żeby portfolio było zawsze gotowe.
          </div>
          <div className="mt-4">
            <Link
              href="/aktywnosci"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Dodaj dowody
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-600">Plan domknięcia limitu</div>
          <div className="mt-2 text-lg font-extrabold text-slate-900">
            {missingPoints > 0 ? `Brakuje ${missingPoints} pkt` : "Limit domknięty ✅"}
          </div>
          <div className="mt-1 text-sm text-slate-700">
            Ustal krótką ścieżkę: kilka mniejszych aktywności + 1 większa daje najlepszy efekt.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/aktywnosci?new=1"
              className={`${PRIMARY_BTN_BASE} ${PRIMARY_BTN}`}
            >
              Dodaj do planu
            </Link>
            <Link
              href="/aktywnosci"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Zobacz wpisy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
