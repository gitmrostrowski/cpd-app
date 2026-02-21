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
  progressPct: number; // % punktów

  evidencePct: number; // % ukończonych z certyfikatem
  daysLeft: number; // dni do końca

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

const PRIMARY_BTN = "bg-blue-600 hover:bg-blue-700 text-white shadow-sm";
const OUTLINE_BTN =
  "border border-slate-200/70 bg-white/80 text-slate-800 hover:bg-white backdrop-blur";
const BTN_BASE = "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold";

const PRIMARY_BAR = "bg-blue-600";
const PRIMARY_DOT = "bg-blue-700";

type DocTone = "ok" | "warn" | "bad";

// ✅ mniej „straszenia”: czerwony tylko przy realnie złej kompletności
function statusFromCompleteness(pointsPct: number, evidencePct: number, doneCount: number) {
  const p = clamp(pointsPct, 0, 100);
  const e = clamp(evidencePct, 0, 100);

  // Brak danych → neutralny „wymaga uzupełnienia”
  if (doneCount <= 0) {
    return {
      label: "Wymaga uzupełnienia",
      tone: "warn" as const,
      reason: "brak wpisów",
      hint: "Dodaj pierwszą aktywność i dokument (certyfikat), aby zacząć budować archiwum.",
    };
  }

  // Komplet
  if (p >= 85 && e >= 90) {
    return {
      label: "Dokumentacja kompletna",
      tone: "ok" as const,
      reason: "wysoka kompletność",
      hint: "Masz dobrą kompletność punktów i dokumentów. Zestawienie możesz pobrać w każdej chwili.",
    };
  }

  // Czerwony tylko wtedy, gdy jest bardzo słabo (albo punkty, albo dowody) i jest już co oceniać
  if (p < 35 || e < 50) {
    return {
      label: "Dokumentacja niekompletna",
      tone: "bad" as const,
      reason: "niska kompletność",
      hint: "Uzupełnij dokumenty i zaplanuj aktywności, aby archiwum było spójne i gotowe do wykorzystania.",
    };
  }

  // Domyślnie: warn
  return {
    label: "Wymaga uzupełnienia",
    tone: "warn" as const,
    reason: "częściowe braki",
    hint: "Uzupełnij dokumenty i zaplanuj aktywności, żeby domknąć okres bez stresu.",
  };
}

function ToneBadge({ tone, label, reason }: { tone: DocTone; label: string; reason: string }) {
  const map = {
    ok: {
      wrap: "border-blue-200/70 bg-blue-50/70 text-blue-950",
      dot: "bg-blue-600",
    },
    warn: {
      wrap: "border-amber-200/70 bg-amber-50/70 text-amber-950",
      dot: "bg-amber-500",
    },
    bad: {
      wrap: "border-rose-200/70 bg-rose-50/70 text-rose-900",
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
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur">
      <div className="text-[11px] font-semibold text-slate-600">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function MiniCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white backdrop-blur"
    >
      {label}
    </Link>
  );
}

function limitTone(used: number, usedPct: number) {
  // ✅ 0 użycia to nie „Brak” jako błąd — tylko „Nie rozpoczęto”
  if (used <= 0) return { badge: "Nie rozpoczęto", tone: "ok" as const };
  if (usedPct >= 100) return { badge: "Limit", tone: "bad" as const };
  if (usedPct >= 80) return { badge: "Uwaga", tone: "warn" as const };
  return { badge: "W trakcie", tone: "ok" as const };
}

function LimitBadge({ tone, text }: { tone: "ok" | "warn" | "bad"; text: string }) {
  const cls =
    tone === "ok"
      ? "bg-blue-50 text-blue-950"
      : tone === "warn"
      ? "bg-amber-50 text-amber-950"
      : "bg-rose-50 text-rose-900";

  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${cls}`}>{text}</span>;
}

function MiniLimitCard({ item }: { item: TopLimitItem }) {
  const pct = clamp(item.usedPct, 0, 100);
  const t = limitTone(item.used, pct);

  const wrapCls =
    t.tone === "bad"
      ? "rounded-2xl border border-rose-200/70 bg-rose-50/40 p-3 shadow-sm"
      : t.tone === "warn"
      ? "rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3 shadow-sm"
      : "rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm";

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

      <div className="mt-2">
        <div className="h-2 rounded-full bg-slate-200/70">
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
  title = "Status dokumentacji",
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

  const status = statusFromCompleteness(pointsPct, docsPct, doneCount);

  // ✅ CTA priorytet: dokumenty > aktywność > pdf
  const primary =
    missingEvidenceCount > 0
      ? { href: "/aktywnosci", label: "Uzupełnij dokumenty" }
      : missingPoints > 0
      ? { href: primaryCtaHref, label: "+ Dodaj aktywność" }
      : { href: portfolioHref, label: "Zestawienie PDF" };

  const secondary =
    missingEvidenceCount > 0
      ? { href: primaryCtaHref, label: "+ Dodaj aktywność" }
      : { href: "/aktywnosci", label: "Aktywności" };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-semibold text-slate-600">Panel CPD</div>

              <ToneBadge tone={status.tone} label={status.label} reason={status.reason} />

              {isBusy ? (
                <span className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
                  Synchronizacja…
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
                  Zsynchronizowane
                </span>
              )}
            </div>

            <div className="mt-2">
              <div className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</div>
              <div className="mt-1 text-sm text-slate-700">{status.hint}</div>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="text-4xl font-extrabold text-slate-900">
                {donePoints}/{requiredPoints}
                <span className="ml-2 text-base font-semibold text-slate-600">pkt</span>
              </div>

              {missingPoints > 0 ? (
                <div className="text-2xl font-extrabold text-rose-600">
                  brakuje {missingPoints}
                  <span className="ml-2 text-base font-semibold text-rose-600">pkt</span>
                </div>
              ) : (
                <div className="text-2xl font-extrabold text-emerald-700">komplet ✅</div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700">Punkty w okresie {periodLabel}</div>
                <div className="text-xs font-semibold text-slate-700">{fmtPct(pointsPct)}</div>
              </div>

              <div className="mt-2">
                <div className="relative h-4 rounded-full bg-slate-200/70">
                  <div className={`h-4 rounded-full ${PRIMARY_BAR}`} style={{ width: `${pointsPct}%` }} />
                  <div
                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white ${PRIMARY_DOT} shadow`}
                    style={{ left: `calc(${pointsPct}% - 8px)` }}
                    aria-hidden
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[25%]">
                    <span className="h-3 w-px bg-white/60" />
                    <span className="h-3 w-px bg-white/60" />
                    <span className="h-3 w-px bg-white/60" />
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-600">
                Ukończone: <span className="font-semibold text-slate-900">{doneCount}</span> • Plan:{" "}
                <span className="font-semibold text-slate-900">{plannedCount}</span>
              </div>
            </div>

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
                  <div className="mt-3 rounded-2xl border border-rose-200/70 bg-rose-50/60 p-3 text-sm text-rose-900">
                    <span className="font-extrabold">Uwaga:</span> {limitWarning}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {userEmail ? (
                <span className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">
                  {userEmail}
                </span>
              ) : null}

              {profileProfession ? (
                <span className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">
                  Profil: {profileProfession}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-[360px]">
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Okres" value={periodLabel} />
              <StatPill label="Dni do końca" value={`${daysLeft}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Dowody" value={fmtPct(docsPct)} />
              <StatPill label="Wymagane" value={`${requiredPoints} pkt`} />
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-600">Najbliższy krok</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">{nextStep.title}</div>
              <div className="mt-1 text-sm text-slate-700">{nextStep.description}</div>

              {nextStep.ctaHref && nextStep.ctaLabel ? (
                <Link href={nextStep.ctaHref} className={`${BTN_BASE} ${PRIMARY_BTN} mt-3 w-full`}>
                  {nextStep.ctaLabel}
                </Link>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Link href={primary.href} className={`${BTN_BASE} ${PRIMARY_BTN} w-full`}>
                {primary.label}
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link href={secondary.href} className={`${BTN_BASE} ${OUTLINE_BTN}`}>
                  {secondary.label}
                </Link>
                <MiniCta href={portfolioHref} label="Zestawienie PDF" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur">
          <div className="text-xs font-semibold text-slate-600">Do uzupełnienia</div>
          <div className="mt-2 text-lg font-extrabold text-slate-900">
            {missingEvidenceCount > 0 ? `${missingEvidenceCount} wpisów bez certyfikatu` : "Wszystkie wpisy mają dokumenty ✅"}
          </div>
          <div className="mt-1 text-sm text-slate-700">
            Dodaj zdjęcie/PDF certyfikatu, żeby zestawienie było zawsze kompletne.
          </div>
          <div className="mt-4">
            <Link href="/aktywnosci" className={`${BTN_BASE} ${OUTLINE_BTN}`}>
              Uzupełnij dokumenty
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur">
          <div className="text-xs font-semibold text-slate-600">Plan domknięcia limitu</div>
          <div className="mt-2 text-lg font-extrabold text-slate-900">
            {missingPoints > 0 ? `Brakuje ${missingPoints} pkt` : "Limit domknięty ✅"}
          </div>
          <div className="mt-1 text-sm text-slate-700">
            Najlepsza praktyka: kilka mniejszych aktywności + jedna większa daje najlepszy efekt.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/aktywnosci?new=1" className={`${BTN_BASE} ${PRIMARY_BTN}`}>
              Dodaj do planu
            </Link>
            <Link href="/aktywnosci" className={`${BTN_BASE} ${OUTLINE_BTN}`}>
              Zobacz wpisy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
