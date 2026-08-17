"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import AppPageHeader from "@/components/AppPageHeader";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";
import {
  createActivity,
  fetchActivities,
  fetchProfessionCatalog,
  fetchProfile,
  fetchVerifiedRuleSet,
  saveProfile,
} from "@/lib/data/crpe";

import {
  type CpdRuleSet,
  type Profession,
  type ProfessionOption,
  FALLBACK_PROFESSION_OPTIONS,
  displayProfession,
  isOtherProfession,
  normalizeOtherProfession,
  professionOptionByName,
} from "@/lib/cpd/professions";
import {
  buildAccrualSeries,
  type AccrualSeries,
} from "@/lib/cpd/accrual";
import { formatOverdue, overdueEntries } from "@/lib/cpd/overdue";
import {
  formatCountdown,
  requiredPace,
  resolvePeriodDeadline,
  upcomingEntries,
} from "@/lib/cpd/deadlines";
import {
  applyMaximumRequirements,
} from "@/lib/cpd/maximumRequirements";

type ActivityStatus = "planned" | "done" | null;

const MONTHS_SHORT = [
  "sty", "lut", "mar", "kwi", "maj", "cze",
  "lip", "sie", "wrz", "paź", "lis", "gru",
] as const;

const PANEL_SECTION_IDS = [
  "status",
  "limity",
  "aktywnosci",
  "terminy",
] as const;

type PanelSectionId = (typeof PANEL_SECTION_IDS)[number];

type ActivityRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
  activity_type_code: string | null;
  activity_date: string | null;
  organizer: string | null;
  created_at: string;
  status?: ActivityStatus;
  planned_start_date?: string | null;
  training_id?: string | null;
  certificate_path?: string | null;
  certificate_name?: string | null;
  certificate_mime?: string | null;
  certificate_size?: number | null;
  certificate_uploaded_at?: string | null;
};

type ProfileRow = {
  user_id: string;
  profession: Profession;
  profession_other?: string | null;
  pwz_number?: string | null;
  pwz_issue_date?: string | null;
  period_start: number;
  period_end: number;
  required_points: number;
  cycle_target_mode?: "custom" | "rule_set";
  suggested_rule_set?: CpdRuleSet | null;
  applied_rule_set?: CpdRuleSet | null;
  formal_status?: "not_confirmed" | "confirmed_externally";
};

type RuleLimit = {
  key: string;
  label: string;
  activityTypeCode: string;
  mode: "per_period" | "per_year" | "per_item";
  maxPoints: number;
  note?: string;
};

const STATUS_VIEW_STORAGE_KEY = "crpe.panel.statusView";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pluralPl(n: number, forms: [string, string, string]) {
  const abs = Math.abs(n);
  const last = abs % 10;
  const lastTwo = abs % 100;

  if (abs === 1) return forms[0];
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1];
  return forms[2];
}

function normalizeStatus(s: ActivityStatus | undefined): "planned" | "done" {
  return s === "planned" ? "planned" : "done";
}

function formatYMD(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}.${m}.${y}`;
}

function agendaDay(isoDate: string) {
  return Number(isoDate.slice(8, 10));
}

function agendaMonth(isoDate: string) {
  const monthIndex = Number(isoDate.slice(5, 7)) - 1;
  return MONTHS_SHORT[monthIndex] ?? "";
}

function timelineDate(activity: ActivityRow) {
  const exactDate =
    normalizeStatus(activity.status) === "planned"
      ? activity.planned_start_date
      : activity.activity_date;
  const canShowDay =
    Boolean(exactDate) &&
    !String(exactDate).endsWith("-12-31");

  if (exactDate && canShowDay) {
    return {
      primary: String(Number(exactDate.slice(8, 10))),
      secondary: `${agendaMonth(exactDate)} ${exactDate.slice(0, 4)}`,
      sort: exactDate,
    };
  }

  return {
    primary: String(activity.year),
    secondary: "rok",
    sort: `${activity.year}-06-30`,
  };
}

function getPeriodFromPwzIssueDate(
  ruleSet: CpdRuleSet | null | undefined,
  pwzIssueDate: string | null | undefined,
) {
  if (
    !pwzIssueDate ||
    ruleSet?.status !== "verified" ||
    !ruleSet.period_months
  ) return null;
  const y = Number(String(pwzIssueDate).slice(0, 4));
  if (!y || Number.isNaN(y)) return null;
  const months = ruleSet.period_months;
  const years = Math.max(1, Math.round(months / 12));
  return { start: y, end: y + years - 1 };
}

function getRowMissing(a: ActivityRow) {
  const missing: string[] = [];

  if (!Boolean(a.organizer && String(a.organizer).trim())) {
    missing.push("Brak organizatora");
  }

  const prog = normalizeStatus(a.status);

  if (prog === "planned") {
    if (!a.planned_start_date) missing.push("Brak daty");
  } else {
    if (!a.certificate_path) missing.push("Brak certyfikatu");
  }

  return missing;
}

function suggestPlannedPoints(rule: {
  mode: "per_period" | "per_year" | "per_item";
  remaining: number;
}) {
  const rem = Math.max(0, Number(rule.remaining) || 0);
  if (rem <= 0) return 0;
  const step = rule.mode === "per_item" ? 2 : 5;
  return Math.max(1, Math.min(rem, step));
}

function buildNextSteps(
  missingPoints: number,
  incompleteCount: number,
  incompletePoints: number,
  hasPointTarget: boolean,
  limitWarning: string | null,
  periodStart: number,
  periodEnd: number,
  overdueCount: number,
  overduePoints: number,
  reportEntries: number,
) {
  type NextStep = {
    title: string;
    description: string;
    ctaHref: string;
    icon: MiniIconName;
    tone: "amber" | "blue" | "green";
    priority: "high" | "normal";
  };

  const incompleteStep: NextStep = incompleteCount > 0
    ? {
        title: `Uzupełnij ${incompleteCount} ${pluralPl(incompleteCount, ["wpis", "wpisy", "wpisów"])}`,
        description: `Do uzupełnienia: ${incompletePoints} pkt`,
        ctaHref: "/aktywnosci?filtr=braki",
        icon: "document",
        tone: "amber",
        priority: "high",
      }
    : {
        title: "Dodaj aktywność",
        description: "Wszystkie ukończone wpisy są kompletne.",
        ctaHref: "/aktywnosci?new=1",
        icon: "calendar",
        tone: "green",
        priority: "normal",
      };

  const planningStep: NextStep = {
      title: !hasPointTarget
        ? "Ustaw cel punktowy"
        : limitWarning
          ? "Dobierz inną aktywność"
          : "Zaplanuj szkolenie",
      description:
        !hasPointTarget
          ? "Określ cel, aby CRPE mogło policzyć postęp."
          : limitWarning ||
            (missingPoints > 0
              ? `Zostało ${missingPoints} pkt do zdobycia`
              : "Cel osiągnięty — zaplanuj dalszy rozwój."),
      ctaHref: hasPointTarget ? "/baza-szkolen" : "#ustawienia",
      icon: "school",
      tone: "blue",
      priority: incompleteCount === 0 && missingPoints > 0 ? "high" : "normal",
    };

  const reportStep: NextStep = {
      title: "Pobierz zestawienie",
      description:
        reportEntries > 0
          ? `${reportEntries} ${pluralPl(reportEntries, ["pozycja", "pozycje", "pozycji"])} · CSV lub PDF`
          : `Podsumowanie okresu ${periodStart}–${periodEnd}`,
      ctaHref: "/raporty/uzytkownik",
      icon: "download",
      tone: "green",
      priority: "normal",
    };

  const steps: NextStep[] = overdueCount > 0
    ? [
        {
          title: `Rozstrzygnij ${overdueCount} ${pluralPl(overdueCount, ["zaległy termin", "zaległe terminy", "zaległych terminów"])}`,
          description: `Minęły, a wciąż są zaplanowane · ${overduePoints} pkt`,
          ctaHref: "/aktywnosci?filtr=zalegle",
          icon: "alert",
          tone: "amber",
          priority: "high",
        },
        incompleteCount > 0 ? incompleteStep : planningStep,
        reportStep,
      ]
    : [incompleteStep, planningStep, reportStep];

  return steps;
}

function IconBubble({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
}) {
  const tones = {
    blue: "border-crpe-brand-border bg-crpe-brand-soft text-crpe-brand",
    green: "border-crpe-success-border bg-crpe-success-soft text-crpe-success",
    amber: "border-crpe-warning-border bg-crpe-warning-soft text-crpe-warning",
    red: "border-crpe-danger-border bg-crpe-danger-soft text-crpe-danger",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    /**
     * Ikona zajmuje ok. 62 % kafla. Przy 50 % kontur „pływał” w środku i
     * czytał się jako mniejszy niż jest — outline potrzebuje więcej masy
     * niż ikona wypełniona. Wymuszamy rozmiar na dziecku, żeby wszystkie
     * miejsca wywołania miały tę samą proporcję bez zmiany call-site.
     */
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border [&_svg]:h-7 [&_svg]:w-7 [&_svg]:stroke-[1.75] ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

type MiniIconName =
  | "calendar"
  | "shield"
  | "chart"
  | "doc"
  | "document"
  | "user"
  | "bell"
  | "hourglass"
  | "target"
  | "school"
  | "alert"
  | "download";

function MiniIcon({
  name,
  className = "h-4 w-4",
}: {
  name: MiniIconName;
  className?: string;
}) {
  if (name === "calendar") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5M4 19h16" />
        <path d="M8 16v-5M12 16V8M16 16v-8" />
      </svg>
    );
  }

  if (name === "doc") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  if (name === "hourglass") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2h12" />
        <path d="M6 22h12" />
        <path d="M8 2c0 4 4 5 4 8s-4 4-4 8" />
        <path d="M16 2c0 4-4 5-4 8s4 4 4 8" />
        <path d="M9 6h6" />
        <path d="M9 18h6" />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    );
  }

  if (name === "alert") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }

  if (name === "download") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M12 3v12" />
        <path d="m7 11 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    );
  }

  if (name === "document") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    );
  }

  if (name === "school") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m3 10 9-5 9 5-9 5-9-5Z" />
        <path d="M7 12v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 6 3 8H3c0-2 3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

/**
 * Punkty i czas na jednej skali: oś X to okres rozliczeniowy, oś Y to punkty.
 * Przekątna pokazuje równomierne tempo, więc odstęp krzywej od niej *jest*
 * informacją „ile jestem do tyłu” — wcześniej podawaną wyłącznie słowem.
 */
function PointsAccrualChart({
  series,
  periodStart,
  periodEnd,
}: {
  series: AccrualSeries;
  periodStart: number;
  periodEnd: number;
}) {
  const W = 430;
  const H = 224;
  const L = 42;
  const R = 16;
  const T = 28;
  const B = 40;

  const px = (x: number) => L + clamp(x, 0, 1) * (W - L - R);
  const py = (v: number) => H - B - (clamp(v, 0, series.max) / series.max) * (H - T - B);

  const stepPoints = (points: { x: number; value: number }[]) => {
    if (!points.length) return [] as [number, number][];
    const result: [number, number][] = [[px(points[0].x), py(points[0].value)]];
    let prev = points[0];
    for (const point of points.slice(1)) {
      result.push([px(point.x), py(prev.value)]);
      result.push([px(point.x), py(point.value)]);
      prev = point;
    }
    return result;
  };

  const donePoints = stepPoints(series.done);
  const plannedPoints = stepPoints(series.planned);
  const toPolyline = (points: [number, number][]) =>
    points.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPath = donePoints.length
    ? [
        `M${donePoints[0][0]},${donePoints[0][1]}`,
        ...donePoints.slice(1).map(([x, y]) => `L${x},${y}`),
        `L${donePoints[donePoints.length - 1][0]},${py(0)}`,
        `L${donePoints[0][0]},${py(0)}`,
        "Z",
      ].join(" ")
    : "";

  const allYears = Array.from(
    { length: Math.max(1, periodEnd - periodStart + 1) },
    (_, i) => periodStart + i,
  );
  const yearSpan = allYears.length;
  const tickStep = Math.max(1, Math.ceil(yearSpan / 5));
  const visibleYears = allYears.filter(
    (_, index) => index % tickStep === 0 || index === yearSpan - 1,
  );
  const behind = Math.round(series.targetToday - series.doneTotal);
  const gapMidY = (py(series.doneTotal) + py(series.targetToday)) / 2;
  const gapLabelWidth = 76;
  const gapLabelX = series.todayX > 0.76
    ? px(series.todayX) - gapLabelWidth - 10
    : px(series.todayX) + 10;
  const gapLabelY = clamp(gapMidY - 11, T + 4, H - B - 26);
  const gapTextY = gapLabelY + 14.5;
  const accessibleTarget =
    series.target > 0
      ? `Przy równomiernym tempie na dziś ${Math.round(series.targetToday)} pkt, cel ${series.target} pkt.`
      : "Cel punktowy nie jest ustawiony.";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full min-w-[360px]"
      role="img"
      aria-label={`Wykres narastania punktów w okresie ${periodStart}–${periodEnd}. Zdobyte ${series.doneTotal} pkt. ${accessibleTarget}`}
    >
      <defs>
        <linearGradient id="crpe-accrual-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.18} />
          <stop offset="70%" stopColor="#CFDDFB" stopOpacity={0.07} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((ratio) => (
        <g key={ratio}>
          <line
            x1={L}
            y1={py(series.max * ratio)}
            x2={W - R}
            y2={py(series.max * ratio)}
            stroke={ratio === 0 ? "#cbd5e1" : "#e7ebf0"}
            strokeWidth={1}
          />
          <text
            x={L - 7}
            y={py(series.max * ratio) + 4}
            textAnchor="end"
            fontSize={11}
            fill="#94a3b8"
          >
            {Math.round(series.max * ratio)}
          </text>
        </g>
      ))}

      <line
        x1={px(series.todayX)}
        y1={T}
        x2={px(series.todayX)}
        y2={py(0)}
        stroke="#d7dde5"
        strokeWidth={1}
        strokeDasharray="3 5"
      />

      <line
        x1={px(0)}
        y1={py(0)}
        x2={px(1)}
        y2={py(series.target)}
        stroke="#9ca3af"
        strokeWidth={1.7}
        strokeDasharray="6 5"
      />

      {areaPath ? <path d={areaPath} fill="url(#crpe-accrual-fill)" /> : null}

      {plannedPoints.length > 1 ? (
        <polyline
          points={toPolyline(plannedPoints)}
          fill="none"
          stroke="#CFDDFB"
          strokeWidth={2.5}
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      <polyline
        points={toPolyline(donePoints)}
        fill="none"
        stroke="#1D4ED8"
        strokeWidth={3.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {behind > 0 ? (
        <>
          <line
            x1={px(series.todayX)}
            y1={py(series.doneTotal)}
            x2={px(series.todayX)}
            y2={py(series.targetToday)}
            stroke="#9A4600"
            strokeWidth={2.25}
            strokeLinecap="round"
          />
          <line
            x1={L}
            y1={py(series.targetToday)}
            x2={px(series.todayX)}
            y2={py(series.targetToday)}
            stroke="#FAD6C0"
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.78}
          />
          <circle
            cx={px(series.todayX)}
            cy={py(series.targetToday)}
            r={4.2}
            fill="#9A4600"
            stroke="#ffffff"
            strokeWidth={2}
          />
          <g aria-hidden="true">
            <rect
              x={gapLabelX}
              y={gapLabelY}
              width={gapLabelWidth}
              height={22}
              rx={11}
              fill="#FFEEE2"
              stroke="#FAD6C0"
            />
            <text
              x={gapLabelX + gapLabelWidth / 2}
              y={gapTextY}
              textAnchor="middle"
              fontSize={10.5}
              fontWeight={800}
              fill="#9a3412"
              paintOrder="stroke"
            >
              −{behind} pkt
            </text>
          </g>
        </>
      ) : null}

      <circle
        cx={px(series.todayX)}
        cy={py(series.doneTotal)}
        r={10}
        fill="#1D4ED8"
        opacity={0.12}
      />
      <circle
        cx={px(series.todayX)}
        cy={py(series.doneTotal)}
        r={5.4}
        fill="#1D4ED8"
        stroke="#ffffff"
        strokeWidth={2.3}
      />
      <text
        x={px(series.todayX)}
        y={H - 9}
        textAnchor="middle"
        fontSize={11}
        fontWeight={800}
        fill="#0f172a"
      >
        dziś
      </text>

      {visibleYears.map((year) => {
        const index = year - periodStart;
        const x = px((index + 0.5) / yearSpan);
        if (Math.abs(x - px(series.todayX)) < 26) return null;
        return (
          <text key={year} x={x} y={H - 9} textAnchor="middle" fontSize={11} fill="#94a3b8">
            {year}
          </text>
        );
      })}
    </svg>
  );
}

/**
 * Ten sam stan co krzywa, ale bez osi punktowej: jedna oś czasu okresu,
 * na niej zdobyte punkty i luka do równego tempa. Krzywa odpowiada na
 * pytanie „jak to szło”, pasek na „gdzie jestem dziś”.
 */
function PointsProgressBar({
  series,
  periodStart,
  periodEnd,
  periodTimeProgress,
  pointsPerYear,
  yearsLeft,
  completePoints,
}: {
  series: AccrualSeries;
  periodStart: number;
  periodEnd: number;
  periodTimeProgress: number;
  pointsPerYear: number | null;
  yearsLeft: number | null;
  completePoints: number;
}) {
  const target = Math.max(1, series.target);
  const donePct = clamp((series.doneTotal / target) * 100, 0, 100);
  const completePct = clamp((completePoints / target) * 100, 0, donePct);
  const timePct = clamp(periodTimeProgress, 0, 100);
  const gapPct = Math.max(0, timePct - donePct);
  const gapPoints = Math.max(0, Math.round(series.targetToday - series.doneTotal));
  const leftPoints = Math.max(0, Math.round(series.target - series.doneTotal));

  const years = Array.from(
    { length: Math.max(1, periodEnd - periodStart + 1) },
    (_, index) => periodStart + index,
  );
  const tickStep = Math.max(1, Math.ceil(years.length / 5));
  const visibleYears = years.filter(
    (_, index) => index % tickStep === 0 || index === years.length - 1,
  );

  const monthsLeft = yearsLeft === null ? null : Math.round(yearsLeft * 12);
  const perMonth =
    gapPoints > 0 && monthsLeft !== null && monthsLeft >= 2
      ? Math.ceil(gapPoints / Math.min(monthsLeft, 12))
      : null;

  const remainingText =
    yearsLeft === null
      ? null
      : yearsLeft >= 1
        ? `Na ${Math.floor(yearsLeft)} ${pluralPl(Math.floor(yearsLeft), ["rok", "lata", "lat"])} ${Math.round((yearsLeft % 1) * 12)} mies.`
        : `Na ${Math.max(1, Math.round(yearsLeft * 12))} mies.`;

  return (
    <div
      role="group"
      aria-label={`Pasek postępu w okresie ${periodStart}–${periodEnd}. Zdobyte ${series.doneTotal} z ${series.target} pkt, w tym ${completePoints} pkt z kompletnych wpisów. Minęło ${Math.round(timePct)}% okresu.`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-0.5 text-[11px] leading-4 text-slate-500">
        <span className="font-bold text-slate-700">Postęp cyklu edukacyjnego</span>
        <span>
          Równe tempo na dziś: <strong className="text-slate-800">{Math.round(series.targetToday)} pkt</strong>
        </span>
      </div>

      <div className="relative pt-6">
        <div
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-slate-900 shadow-sm ring-1 ring-slate-200"
          style={{ left: `clamp(1rem, ${timePct}%, calc(100% - 1rem))` }}
        >
          dziś
        </div>

        <div className="relative h-9 overflow-hidden rounded-xl bg-slate-100 max-h-6 ring-1 ring-slate-200/90 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]">
          <div
            className="absolute inset-y-0 left-0 bg-crpe-brand"
            style={{ width: `${donePct}%` }}
          />
          {completePct > 0 ? (
            <div
              className="absolute bottom-0 left-0 h-1.5 bg-crpe-success"
              style={{ width: `${completePct}%` }}
              aria-hidden="true"
            />
          ) : null}
          {gapPct > 0 ? (
            <div
              className="absolute inset-y-0 bg-crpe-warning-soft"
              style={{
                left: `${donePct}%`,
                width: `${gapPct}%`,
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(154,70,0,0.36) 0 2px, transparent 2px 7px)",
              }}
            />
          ) : null}
          {donePct >= 12 ? (
            <span
              className="absolute inset-y-0 left-2 flex items-center text-[10px] font-black text-white"
              aria-hidden="true"
            >
              {Math.round(series.doneTotal)} pkt
            </span>
          ) : null}
          {gapPct >= 13 ? (
            <span
              className="absolute inset-y-0 flex items-center px-2 text-[10px] font-black text-crpe-warning"
              style={{ left: `${donePct}%` }}
              aria-hidden="true"
            >
              {gapPoints} pkt
            </span>
          ) : null}
          <div
            className="absolute -top-1.5 bottom-[-6px] w-[2px] bg-slate-950"
            style={{ left: `${timePct}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium text-slate-400">
          <span>0 pkt</span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-crpe-brand" aria-hidden="true" />
              zdobyte
            </span>
            <span className="inline-flex items-center gap-1.5 text-crpe-success">
              <span className="h-1.5 w-3 rounded-full bg-crpe-success" aria-hidden="true" />
              kompletne {Math.round(completePoints)} pkt
            </span>
            {gapPoints > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-crpe-warning">
                <span className="h-2 w-2 rounded-sm bg-crpe-warning-soft ring-1 ring-crpe-warning-border" aria-hidden="true" />
                luka do tempa
              </span>
            ) : null}
          </div>
          <span>{series.target} pkt</span>
        </div>

        <div className="relative mt-1 h-4">
          {visibleYears.map((year) => {
            const index = year - periodStart;
            const left = clamp(((index + 0.5) / years.length) * 100, 0, 100);
            return (
              <span
                key={year}
                className="absolute -translate-x-1/2 text-[11px] text-slate-400"
                style={{ left: `${left}%` }}
              >
                {year}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-crpe-brand-border bg-crpe-brand-soft/35 px-3.5 py-3.5 pl-4">
          <span className="absolute inset-y-0 left-0 w-1 bg-crpe-brand" aria-hidden="true" />
          <div className="text-[11px] font-semibold text-slate-600">Zebrane</div>
          <div className="mt-1 text-[24px] font-black leading-none tracking-[-0.04em] text-crpe-brand">
            {series.doneTotal}
            <span className="ml-1 text-xs font-semibold text-slate-400">pkt</span>
          </div>
          <div className="mt-1.5 text-[11px] leading-4 text-slate-500">
            {Math.round(donePct)}% celu {series.target} pkt
            <span className="mt-0.5 block font-bold text-crpe-success">
              {Math.round(completePoints)} pkt z kompletnych wpisów
            </span>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border px-3.5 py-3.5 pl-4 ${gapPoints > 0 ? "border-crpe-warning-border bg-crpe-warning-soft/40" : "border-crpe-success-border bg-crpe-success-soft/35"}`}>
          <span
            className={`absolute inset-y-0 left-0 w-1 ${gapPoints > 0 ? "bg-crpe-warning-border" : "bg-crpe-success"}`}
            aria-hidden="true"
          />
          <div className="text-[11px] font-semibold text-slate-600">
            {gapPoints > 0 ? "Luka do tempa" : "Zapas nad tempem"}
          </div>
          <div
            className={`mt-1 text-[24px] font-black leading-none tracking-[-0.04em] ${
              gapPoints > 0 ? "text-crpe-warning" : "text-crpe-success"
            }`}
          >
            {gapPoints > 0 ? gapPoints : Math.round(series.doneTotal - series.targetToday)}
            <span className="ml-1 text-xs font-semibold opacity-60">pkt</span>
          </div>
          <div className="mt-1.5 text-[11px] leading-4 text-slate-500">
            {gapPoints > 0
              ? perMonth
                ? `Do wyrównania ≈ ${perMonth} pkt / mies.`
                : "Do wyrównania równego tempa"
              : "Jesteś przed równym tempem"}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/65 px-3.5 py-3.5 pl-4">
          <span className="absolute inset-y-0 left-0 w-1 bg-slate-300" aria-hidden="true" />
          <div className="text-[11px] font-semibold text-slate-600">Pozostaje</div>
          <div className="mt-1 text-[24px] font-black leading-none tracking-[-0.04em] text-slate-950">
            {leftPoints}
            <span className="ml-1 text-xs font-semibold text-slate-400">pkt</span>
          </div>
          <div className="mt-1.5 text-[11px] leading-4 text-slate-500">
            {leftPoints === 0
              ? "Cel osiągnięty"
              : pointsPerYear
                ? `Tempo ${pointsPerYear} pkt rocznie`
                : (remainingText ?? "Do końca okresu")}
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentedCapacityBar({ pct, status }: { pct: number; status: "available" | "warning" | "blocked" | "per_item" }) {
  const segments = 10;
  const active = Math.round(clamp(pct, 0, 100) / 10);
  const fillClass =
    status === "blocked"
      ? "bg-slate-400"
      : status === "warning"
        ? "bg-crpe-warning-border"
        : status === "per_item"
          ? "bg-crpe-brand"
          : "bg-crpe-success";

  return (
    <div className="mt-2 grid grid-cols-10 gap-1" aria-label={`Wykorzystanie limitu ${Math.round(pct)}%`}>
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 rounded-full ${index < active ? fillClass : "bg-slate-200"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function LimitStatusBadge({ kind }: { kind: "available" | "warning" | "blocked" | "per_item" }) {
  const cls =
    kind === "blocked"
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : kind === "warning"
        ? "border-crpe-warning-border bg-crpe-warning-soft text-crpe-warning"
        : kind === "per_item"
          ? "border-crpe-brand-border bg-crpe-brand-soft text-crpe-brand"
          : "border-crpe-success-border bg-crpe-success-soft text-crpe-success";

  const label =
    kind === "blocked"
      ? "Limit wykorzystany"
      : kind === "warning"
        ? "Blisko limitu"
        : kind === "per_item"
          ? "Limit na wpis"
          : "Możesz użyć";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

export default function CalculatorClient() {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoadError, setActivityLoadError] = useState<string | null>(null);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [professionOptions, setProfessionOptions] =
    useState<ProfessionOption[]>([...FALLBACK_PROFESSION_OPTIONS]);
  const [suggestedRuleSet, setSuggestedRuleSet] =
    useState<CpdRuleSet | null>(null);
  const [appliedRuleSet, setAppliedRuleSet] = useState<CpdRuleSet | null>(null);
  const [cycleTargetMode, setCycleTargetMode] =
    useState<"custom" | "rule_set">("custom");
  const [formalStatus, setFormalStatus] =
    useState<"not_confirmed" | "confirmed_externally">("not_confirmed");

  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [professionOther, setProfessionOther] = useState("");
  const [periodStart, setPeriodStart] = useState(2023);
  const [periodEnd, setPeriodEnd] = useState(2026);
  const [requiredPoints, setRequiredPoints] = useState(0);
  const [periodMode, setPeriodMode] = useState<"preset" | "custom">("preset");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [planInfo, setPlanInfo] = useState<string | null>(null);
  const [planErr, setPlanErr] = useState<string | null>(null);
  const [planningKey, setPlanningKey] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<"all" | "planned" | "missing" | "complete">("all");
  const [selectedLimitKey, setSelectedLimitKey] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<PanelSectionId>("status");
  const [settingsOpen, setSettingsOpen] = useState(false);
  /**
   * Wybór widoku statusu zapamiętujemy lokalnie, a nie w profilu: to
   * preferencja czytania jednego ekranu, nie dana rozliczeniowa.
   * Odczyt idzie po montażu, żeby nie rozjechać hydratacji SSR.
   */
  const [statusView, setStatusView] = useState<"curve" | "bar">("curve");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STATUS_VIEW_STORAGE_KEY);
      if (saved === "curve" || saved === "bar") setStatusView(saved);
    } catch {
      /* prywatny tryb przeglądarki blokuje storage — zostaje domyślny widok */
    }
  }, []);

  function chooseStatusView(view: "curve" | "bar") {
    setStatusView(view);
    try {
      window.localStorage.setItem(STATUS_VIEW_STORAGE_KEY, view);
    } catch {
      /* brak zapisu preferencji nie może przerywać pracy panelu */
    }
  }

  const supabase = useMemo(() => supabaseClient(), []);

  async function reloadActivities() {
    if (!user?.id) return;

    try {
      const data = await fetchActivities(supabase, user.id, {
        includeCertificateFields: true,
      });
      setActivities(data as ActivityRow[]);
      setActivityLoadError(null);
    } catch (caught) {
      setActivityLoadError(
        caught instanceof Error
          ? caught.message
          : "Nie udało się wczytać aktywności i punktów.",
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user?.id) {
        if (!cancelled) {
          setProfile(null);
          setActivities([]);
          setActivityLoadError(null);
          setProfileLoadError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      let p = null;
      let profileFailed = false;
      try {
        const [profileResult, catalogResult] = await Promise.all([
          fetchProfile(supabase, user.id),
          fetchProfessionCatalog(supabase),
        ]);
        p = profileResult;
        setProfessionOptions(catalogResult);
        setProfileLoadError(null);
      } catch (caught) {
        profileFailed = true;
        setProfileLoadError(
          caught instanceof Error
            ? caught.message
            : "Nie udało się wczytać ustawień profilu.",
        );
      }

      if (!cancelled) {
        if (!profileFailed && p) {
          const prof = (p.profession ?? "Lekarz") as Profession;
          const po = normalizeOtherProfession(p.profession_other);
          const pwzIssue = p.pwz_issue_date as string | null;
          const applied = p.applied_rule_set ?? null;
          const suggested = p.suggested_rule_set ?? null;
          const targetMode = p.cycle_target_mode ?? "custom";
          const derived =
            targetMode === "rule_set"
              ? getPeriodFromPwzIssueDate(applied, pwzIssue)
              : null;
          const start = derived?.start ?? (p.period_start ?? 2023);
          const end = derived?.end ?? (p.period_end ?? 2026);
          const rp = Number(p.required_points ?? 0);

          setProfession(prof);
          setProfessionOther(po);
          setPeriodStart(start);
          setPeriodEnd(end);
          setRequiredPoints(rp);
          setSuggestedRuleSet(suggested);
          setAppliedRuleSet(applied);
          setCycleTargetMode(targetMode);
          setFormalStatus(p.formal_status ?? "not_confirmed");
          setPeriodMode(
            derived
              ? "custom"
              : ["2019-2022", "2023-2026", "2027-2030"].includes(`${start}-${end}`)
                ? "preset"
                : "custom",
          );

          setProfile({
            user_id: user.id,
            profession: prof,
            profession_other: isOtherProfession(prof) ? po || null : null,
            pwz_number: p.pwz_number ?? null,
            pwz_issue_date: pwzIssue,
            period_start: start,
            period_end: end,
            required_points: rp,
            cycle_target_mode: targetMode,
            suggested_rule_set: suggested,
            applied_rule_set: applied,
            formal_status: p.formal_status ?? "not_confirmed",
          });
        } else {
          const firstProfession =
            professionOptions[0]?.name_pl ??
            FALLBACK_PROFESSION_OPTIONS[0].name_pl;
          setProfession(firstProfession);
          setProfessionOther("");
          setPeriodStart(2023);
          setPeriodEnd(2026);
          setRequiredPoints(0);
          setSuggestedRuleSet(null);
          setAppliedRuleSet(null);
          setCycleTargetMode("custom");
          setFormalStatus("not_confirmed");
          setPeriodMode("preset");
          setProfile(null);
        }

        setDirty(false);
      }

      await reloadActivities();
      if (!cancelled) setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  const periodLabel = `${periodStart}-${periodEnd}`;

  const limitsRuleSet = useMemo(() => {
    if (appliedRuleSet?.status === "verified") return appliedRuleSet;
    if (suggestedRuleSet?.status === "verified") return suggestedRuleSet;
    return null;
  }, [appliedRuleSet, suggestedRuleSet]);

  const maximumRequirements = useMemo(
    () =>
      (limitsRuleSet?.requirements ?? []).filter(
        (requirement) =>
          requirement.requirement_kind === "maximum" &&
          Boolean(requirement.activity_type_code),
      ),
    [limitsRuleSet],
  );

  const inPeriodActivities = useMemo(
    () =>
      activities.filter((activity) => {
        const year =
          normalizeStatus(activity.status) === "planned" && activity.planned_start_date
            ? Number(activity.planned_start_date.slice(0, 4))
            : activity.year;
        return year >= periodStart && year <= periodEnd;
      }),
    [activities, periodEnd, periodStart],
  );

  const inPeriodDone = useMemo(
    () =>
      inPeriodActivities.filter(
        (x) =>
          normalizeStatus(x.status) === "done",
      ),
    [inPeriodActivities],
  );

  const adjustedDoneRows = useMemo(
    () => applyMaximumRequirements(inPeriodDone, maximumRequirements),
    [inPeriodDone, maximumRequirements],
  );

  const adjustedAllRows = useMemo(
    () =>
      applyMaximumRequirements(
        inPeriodActivities.map((activity) => ({
          ...activity,
          rule_order: normalizeStatus(activity.status) === "done" ? 0 : 1,
        })),
        maximumRequirements,
      ),
    [inPeriodActivities, maximumRequirements],
  );

  const adjustedPointsById = useMemo(
    () =>
      new Map([
        ...adjustedAllRows.map((activity) => [
          activity.id,
          {
            applied: activity.applied_points,
            raw: activity.raw_points,
            over: activity.over_points,
          },
        ] as const),
        ...adjustedDoneRows.map((activity) => [
          activity.id,
          {
            applied: activity.applied_points,
            raw: activity.raw_points,
            over: activity.over_points,
          },
        ] as const),
      ]),
    [adjustedAllRows, adjustedDoneRows],
  );

  const donePoints = useMemo(
    () => adjustedDoneRows.reduce((sum, a) => sum + a.applied_points, 0),
    [adjustedDoneRows],
  );

  /**
   * Jedna definicja kompletności dla licznika, warstw postępu, kroków i listy.
   * Wpis jest kompletny dopiero wtedy, gdy nie brakuje żadnego pola
   * wskazanego przez getRowMissing (np. organizatora lub certyfikatu).
   */
  const incompleteEntries = useMemo(
    () => inPeriodDone.filter((a) => getRowMissing(a).length > 0),
    [inPeriodDone],
  );
  const completeEntries = useMemo(
    () => inPeriodDone.filter((a) => getRowMissing(a).length === 0),
    [inPeriodDone],
  );

  const incompleteCount = incompleteEntries.length;
  const incompletePoints = useMemo(
    () =>
      incompleteEntries.reduce(
        (sum, activity) =>
          sum + (adjustedPointsById.get(activity.id)?.applied ?? 0),
        0,
      ),
    [adjustedPointsById, incompleteEntries],
  );
  const completePoints = useMemo(
    () =>
      completeEntries.reduce(
        (sum, activity) =>
          sum + (adjustedPointsById.get(activity.id)?.applied ?? 0),
        0,
      ),
    [adjustedPointsById, completeEntries],
  );

  const missingPoints = useMemo(
    () => Math.max(0, (Number(requiredPoints) || 0) - donePoints),
    [requiredPoints, donePoints],
  );

  const progress = useMemo(() => {
    const req = Number(requiredPoints) || 0;
    return req <= 0 ? 0 : clamp((donePoints / req) * 100, 0, 100);
  }, [requiredPoints, donePoints]);

  const periodTimeProgress = useMemo(() => {
    const start = new Date(periodStart, 0, 1).getTime();
    const end = new Date(periodEnd, 11, 31, 23, 59, 59).getTime();
    const now = Date.now();

    if (end <= start) return 0;
    return clamp(((now - start) / (end - start)) * 100, 0, 100);
  }, [periodStart, periodEnd]);

  const hasPointTarget = Number(requiredPoints) > 0;
  const paceDelta = Math.round(progress - periodTimeProgress);

  /**
   * Odstęp od równego tempa podajemy w punktach, a nie w punktach procentowych.
   * Wykres obok pokazuje dokładnie tę samą różnicę jako „−N pkt”, a cały panel
   * liczy w punktach — dwie jednostki na jedną wielkość zmuszały do przeliczania.
   */
  const paceGapPoints = Math.round(
    (Number(requiredPoints) || 0) * (periodTimeProgress / 100) - donePoints,
  );

  const paceBadgeLabel =
    !hasPointTarget
      ? "Cel nieustawiony"
      : progress <= 0
      ? "Brak punktów"
      : paceDelta >= 10
        ? `${Math.abs(paceGapPoints)} pkt zapasu`
        : paceDelta >= -10
          ? "Zgodnie z tempem"
          : `${Math.abs(paceGapPoints)} pkt poniżej tempa`;

  const paceBadgeClass =
    !hasPointTarget
      ? "bg-slate-100 text-slate-700"
      : progress > 0 && paceDelta >= 10
      ? "bg-crpe-success-soft text-crpe-success"
      : progress > 0 && paceDelta >= -10
        ? "bg-slate-100 text-slate-700"
        : "bg-crpe-warning-soft text-crpe-warning";

  const limitsUsage = useMemo(() => {
    const yearsInPeriod = Math.max(1, periodEnd - periodStart + 1);

    return maximumRequirements.map((requirement) => {
      const code = requirement.activity_type_code as string;
      const matching = adjustedDoneRows.filter(
        (activity) => activity.activity_type_code === code,
      );
      const mode =
        requirement.scope === "item"
          ? "per_item"
          : requirement.scope === "year"
            ? "per_year"
            : "per_period";
      const cap =
        mode === "per_year"
          ? Number(requirement.points) * yearsInPeriod
          : Number(requirement.points);
      const used =
        mode === "per_item"
          ? Math.max(0, ...matching.map((activity) => activity.applied_points))
          : matching.reduce((sum, activity) => sum + activity.applied_points, 0);
      const remaining = mode === "per_item" ? cap : Math.max(0, cap - used);
      const usedPct = cap > 0 ? clamp((used / cap) * 100, 0, 100) : 0;
      const status =
        mode === "per_item"
          ? ("per_item" as const)
          : remaining <= 0
            ? ("blocked" as const)
            : usedPct >= 80
              ? ("warning" as const)
              : ("available" as const);

      return {
        key: requirement.id,
        label: requirement.activity_type_name_pl ?? "Aktywność",
        activityTypeCode: code,
        mode,
        maxPoints: Number(requirement.points),
        note: requirement.note_pl ?? undefined,
        used,
        count: matching.length,
        cap,
        remaining,
        usedPct,
        yearsInPeriod,
        status,
      } satisfies RuleLimit & {
        used: number;
        count: number;
        cap: number;
        remaining: number;
        usedPct: number;
        yearsInPeriod: number;
        status: "available" | "warning" | "blocked" | "per_item";
      };
    });
  }, [adjustedDoneRows, maximumRequirements, periodEnd, periodStart]);

  const bestLimit = useMemo(() => {
    const sorted = [...limitsUsage].sort((a, b) => {
      const score = (x: (typeof limitsUsage)[number]) => {
        if (x.status === "available") return 400 + Number(x.remaining || 0);
        if (x.status === "warning") return 300 + Number(x.remaining || 0);
        if (x.status === "per_item") return 200 + Number(x.cap || 0);
        return 0;
      };

      return score(b) - score(a);
    });

    return sorted[0] ?? null;
  }, [limitsUsage]);

  useEffect(() => {
    if (!limitsUsage.length) {
      setSelectedLimitKey(null);
      return;
    }

    const exists = selectedLimitKey
      ? limitsUsage.some((x) => x.key === selectedLimitKey)
      : false;

    if (!exists) {
      setSelectedLimitKey(bestLimit?.key ?? limitsUsage[0].key);
    }
  }, [limitsUsage, selectedLimitKey, bestLimit]);

  const selectedLimit = useMemo(
    () =>
      limitsUsage.find((x) => x.key === selectedLimitKey) ??
      bestLimit ??
      limitsUsage[0] ??
      null,
    [limitsUsage, selectedLimitKey, bestLimit],
  );

  const usableLimitsCount = useMemo(
    () => limitsUsage.filter((x) => x.status !== "blocked").length,
    [limitsUsage],
  );

  const blockedLimitsCount = useMemo(
    () => limitsUsage.filter((x) => x.status === "blocked").length,
    [limitsUsage],
  );

  const limitWarning = useMemo(() => {
    const exceeded = adjustedDoneRows.find((activity) => activity.over_points > 0);
    if (exceeded) {
      const limit = limitsUsage.find(
        (item) => item.activityTypeCode === exceeded.activity_type_code,
      );
      return limit
        ? `Część punktów w kategorii „${limit.label}” przekracza limit i nie zwiększa wyniku.`
        : "Część wpisanych punktów przekracza limit i nie zwiększa wyniku.";
    }
    const hit = limitsUsage.find((x) => x.status === "blocked");
    return hit ? `Limit "${hit.label}" jest osiągnięty.` : null;
  }, [adjustedDoneRows, limitsUsage]);

  const overdue = useMemo(
    () =>
      overdueEntries({
        activities: activities.map((a) => ({
          id: a.id,
          type: a.type,
          organizer: a.organizer,
          points: Number(a.points) || 0,
          status: normalizeStatus(a.status),
          planned_start_date: a.planned_start_date ?? null,
        })),
        today: new Date(),
      }),
    [activities],
  );

  const overduePoints = overdue.reduce((sum, entry) => sum + entry.points, 0);

  const nextSteps = useMemo(
    () =>
      buildNextSteps(
        missingPoints,
        incompleteCount,
        incompletePoints,
        hasPointTarget,
        limitWarning,
        periodStart,
        periodEnd,
        overdue.length,
        overduePoints,
        inPeriodDone.length,
      ),
    [
      missingPoints,
      incompleteCount,
      incompletePoints,
      hasPointTarget,
      limitWarning,
      periodStart,
      periodEnd,
      overdue.length,
      overduePoints,
      inPeriodDone.length,
    ],
  );

  const accrualSeries = useMemo<AccrualSeries | null>(
    () =>
      buildAccrualSeries({
        activities: adjustedAllRows.map((activity) => ({
          ...activity,
          points: activity.applied_points,
        })),
        doneActivities: adjustedDoneRows.map((activity) => ({
          ...activity,
          points: activity.applied_points,
        })),
        periodStart,
        periodEnd,
        periodTimeProgress,
        requiredPoints,
        overdueActivityIds: new Set(overdue.map((entry) => entry.id)),
      }),
    [adjustedAllRows, adjustedDoneRows, overdue, periodEnd, periodStart, periodTimeProgress, requiredPoints],
  );

  const recentRows = useMemo(() => {
    const rank = (a: ActivityRow) => {
      const prog = normalizeStatus(a.status);
      const missing = getRowMissing(a);

      if (prog !== "planned" && missing.length > 0) return 0;
      if (prog === "planned") return 1;
      return 2;
    };

    return activities
      .filter((a) => {
        const prog = normalizeStatus(a.status);
        const y =
          prog === "planned" && a.planned_start_date
            ? Number(String(a.planned_start_date).slice(0, 4))
            : a.year;
        const inPeriod = y >= periodStart && y <= periodEnd;

        if (!inPeriod) return false;

        const missing = getRowMissing(a);
        const hasMissing = prog !== "planned" && missing.length > 0;

        if (activityFilter === "planned") return prog === "planned";
        if (activityFilter === "missing") return hasMissing;
        if (activityFilter === "complete") return prog !== "planned" && !hasMissing;
        return true;
      })
      .sort((a, b) => {
        const byRank = rank(a) - rank(b);
        if (byRank !== 0) return byRank;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [activities, periodStart, periodEnd, activityFilter]);

  const upcoming = useMemo(
    () =>
      upcomingEntries({
        activities: activities.map((a) => ({
          id: a.id,
          type: a.type,
          organizer: a.organizer,
          points: Number(a.points) || 0,
          status: normalizeStatus(a.status),
          planned_start_date: a.planned_start_date ?? null,
        })),
        today: new Date(),
      }),
    [activities],
  );
  /**
   * Oś aktywności pokazuje to, co już się wydarzyło.
   *
   * Przyszłe terminy mają własną sekcję z odliczaniem, a wcześniej te same
   * wpisy pojawiały się w trzech miejscach naraz: tutaj, w „Najbliższych
   * terminach” i jako linia przerywana na wykresie.
   */
  const timelineRows = useMemo(() => {
    const agendaIds = new Set([
      ...upcoming.map((entry) => entry.id),
      ...overdue.map((entry) => entry.id),
    ]);

    return [...recentRows]
      .filter((activity) => !agendaIds.has(activity.id))
      .sort((a, b) => {
        const plannedA = normalizeStatus(a.status) === "planned";
        const plannedB = normalizeStatus(b.status) === "planned";
        if (plannedA !== plannedB) return plannedA ? -1 : 1;

        const dateA = timelineDate(a).sort;
        const dateB = timelineDate(b).sort;
        return plannedA
          ? dateA.localeCompare(dateB)
          : dateB.localeCompare(dateA);
      })
      .slice(0, 8);
  }, [recentRows, upcoming, overdue]);

  const isBusy = authLoading || loading;

  useEffect(() => {
    if (isBusy) return;

    const ids = PANEL_SECTION_IDS;

    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!nodes.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const id = visible?.target?.id as (typeof ids)[number] | undefined;
        if (id) setActiveNav(id);
      },
      {
        rootMargin: "-145px 0px -62% 0px",
        threshold: [0.02, 0.12, 0.28],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [isBusy]);
  const pwzIssueDate = profile?.pwz_issue_date ?? null;
  const otherRequired = isOtherProfession(profession);
  const otherValid =
    !otherRequired || normalizeOtherProfession(professionOther).length >= 2;
  const trybLabel =
    cycleTargetMode === "rule_set" && pwzIssueDate
      ? "Tryb okresu — według reguły"
      : "Tryb okresu";
  const canUseRuleDeadline =
    cycleTargetMode === "rule_set" &&
    appliedRuleSet?.status === "verified" &&
    Boolean(appliedRuleSet.period_months);
  const periodDeadline = useMemo(
    () =>
      resolvePeriodDeadline({
        periodEnd,
        pwzIssueDate: canUseRuleDeadline ? pwzIssueDate : null,
        ruleMonths: canUseRuleDeadline ? appliedRuleSet?.period_months ?? null : null,
        today: new Date(),
      }),
    [appliedRuleSet?.period_months, canUseRuleDeadline, periodEnd, pwzIssueDate],
  );

  const pace = useMemo(
    () => requiredPace({ missingPoints, deadline: periodDeadline }),
    [missingPoints, periodDeadline],
  );


  /**
   * Data, którą wskazałaby reguła zawodu. Liczymy ją także w trybie okresu
   * własnego — inaczej użytkownik widzi koniec roku kalendarzowego, mając tuż
   * obok zweryfikowaną regułę i datę PWZ, i nie wie, skąd ta różnica.
   */
  const ruleDeadline = useMemo(() => {
    if (!pwzIssueDate) return null;
    const months =
      appliedRuleSet?.status === "verified" ? appliedRuleSet.period_months : null;
    if (!months) return null;
    return resolvePeriodDeadline({
      periodEnd,
      pwzIssueDate,
      ruleMonths: months,
      today: new Date(),
    });
  }, [appliedRuleSet?.period_months, appliedRuleSet?.status, periodEnd, pwzIssueDate]);

  const deadlineFallbackMessage =
    periodDeadline?.source !== "period_year"
      ? null
      : cycleTargetMode === "rule_set"
        ? !pwzIssueDate
          ? "Termin liczony do końca roku kalendarzowego. Uzupełnij datę wydania PWZ w profilu, żeby CRPE liczyło okres od niej."
          : "Termin liczony do końca roku kalendarzowego, ponieważ przypięta reguła nie pozwala wyznaczyć dokładnej daty końca."
        : ruleDeadline && ruleDeadline.source !== "period_year"
          ? `Masz ustawiony okres własny, dlatego termin biegnie do końca roku kalendarzowego. Według reguły dla zawodu wypadłby ${formatYMD(ruleDeadline.date)}.`
          : null;

  const okresLabel = cycleTargetMode === "rule_set" && pwzIssueDate
    ? `Okres liczony z PWZ (${formatYMD(pwzIssueDate)})`
    : periodMode === "preset"
      ? "Okres rozliczeniowy"
      : "Okres indywidualny";

  async function saveProfilePatch(
    patch: Partial<ProfileRow> & { profession_other?: string | null },
  ) {
    if (!user?.id) return;

    setSavingProfile(true);

    const nextProfession = (patch.profession ?? profession) as Profession;
    const rawOther =
      patch.profession_other !== undefined
        ? patch.profession_other
        : professionOther;
    const nextOther = isOtherProfession(nextProfession)
      ? normalizeOtherProfession(rawOther) || null
      : null;
    const ps =
      Number(
        patch.period_start !== undefined ? patch.period_start : periodStart,
      ) || 2023;
    const pe = Math.max(
      Number(patch.period_end !== undefined ? patch.period_end : periodEnd) ||
        ps,
      ps,
    );
    const rp = Math.max(
      0,
      Number(
        patch.required_points !== undefined
          ? patch.required_points
          : requiredPoints,
      ) || 0,
    );

    const payload = {
      profession: nextProfession,
      profession_other: nextOther,
      pwz_number: profile?.pwz_number ?? null,
      pwz_issue_date: profile?.pwz_issue_date ?? null,
      period_start: ps,
      period_end: pe,
      required_points: rp,
    };

    let error: Error | null = null;
    try {
      await saveProfile(supabase, user.id, payload);
    } catch (caught) {
      error =
        caught instanceof Error
          ? caught
          : new Error("Nie udało się zapisać profilu.");
    }

    setSavingProfile(false);

    if (!error) {
      setSavedAt(Date.now());
      setDirty(false);
    }
  }

  async function saveAllSettings() {
    if (!user?.id || !otherValid) return;

    const ps = Number(periodStart) || 0;
    const pe = Math.max(Number(periodEnd) || 0, ps);
    setPeriodEnd(pe);

    await saveProfilePatch({
      profession,
      profession_other: isOtherProfession(profession)
        ? normalizeOtherProfession(professionOther) || null
        : null,
      period_start: ps,
      period_end: pe,
      required_points: requiredPoints,
    });
  }

  async function planForRule(r: (typeof limitsUsage)[number]) {
    if (!user?.id || (Number(r.remaining) || 0) <= 0) return;

    setPlanInfo(null);
    setPlanErr(null);
    setPlanningKey(r.key);

    try {
      const nowY = new Date().getFullYear();
      const y = clamp(nowY, periodStart, periodEnd);
      const pts = suggestPlannedPoints({
        mode: r.mode,
        remaining: r.remaining,
      });

      await createActivity(supabase, user.id, {
        type: r.label,
        points: pts,
        year: y,
        organizer: null,
        status: "planned",
        planned_start_date: null,
      });

      setPlanInfo(`Dodano do planu: ${r.label} (+${pts} pkt)`);
      await reloadActivities();
    } catch (e: unknown) {
      setPlanErr(e instanceof Error ? e.message : "Nie udało się dodać planu.");
    } finally {
      setPlanningKey(null);
    }
  }

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 shadow-[0_3px_10px_rgba(15,45,75,0.04)] transition focus:border-crpe-brand focus:ring-4 focus:ring-crpe-brand-border/80 disabled:bg-slate-50 disabled:text-slate-400";

  const cardCls =
    "scroll-mt-44 relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,45,75,0.07)] transition-shadow hover:shadow-[0_18px_44px_rgba(15,45,75,0.09)]";

  function scrollToSection(
    id: PanelSectionId,
  ) {
    const el = document.getElementById(id);
    if (!el) return;

    setActiveNav(id);

    const offset = 140;
    const targetTop = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(targetTop, 80), behavior: "smooth" });
  }

  function filterActivities(next: "all" | "planned" | "missing" | "complete") {
    setActivityFilter(next);
    setActiveNav("aktywnosci");
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => scrollToSection("aktywnosci")),
    );
  }

  const emptyStateHref =
    activityFilter === "planned"
      ? "/aktywnosci?new=1"
      : activityFilter === "missing"
        ? "/aktywnosci"
        : "/aktywnosci?new=1";

  const emptyStateMsg =
    activityFilter === "planned"
      ? "Nie masz zaplanowanych aktywności."
      : activityFilter === "missing"
        ? "Brak wpisów z brakującą dokumentacją."
        : activityFilter === "complete"
          ? "Brak kompletnych wpisów w tym okresie."
          : "Nie masz jeszcze żadnych aktywności w tym okresie.";

  const emptyStateCta =
    activityFilter === "missing" ? "Uzupełnij wpisy" : "Dodaj pierwszą aktywność";

  // Sekcja pojawia się tylko wtedy, gdy zweryfikowana reguła zawodu zawiera
  // jawne maksima powiązane z typami aktywności. Działa również przy własnym
  // okresie, ale interfejs wyraźnie odróżnia regułę sugerowaną od przypiętej.
  const hasLimits = limitsUsage.length > 0;

  const panelSections: {
    id: PanelSectionId;
    label: string;
    mobileLabel: string;
    icon: "user" | "chart" | "target" | "shield" | "calendar";
  }[] = [
    { id: "status", label: "Status i kroki", mobileLabel: "Status", icon: "chart" },
    ...(hasLimits
      ? [{ id: "limity" as const, label: "Limity", mobileLabel: "Limity", icon: "shield" as const }]
      : []),
    { id: "aktywnosci", label: "Aktywności", mobileLabel: "Wpisy", icon: "calendar" },
    { id: "terminy", label: "Najbliższe terminy", mobileLabel: "Terminy", icon: "target" },
  ];

  return (
    <div
      className="space-y-4 sm:space-y-5"
      data-crpe-build="frankfurt-fix-v3"
    >
      <style jsx global>{`
        @keyframes cpdTargetPulse {
          0% { transform: scale(0.72); opacity: 0.55; }
          70% { transform: scale(1.2); opacity: 0; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        @keyframes cpdTargetPulseDelay {
          0% { transform: scale(0.82); opacity: 0.75; }
          70% { transform: scale(1.18); opacity: 0; }
          100% { transform: scale(1.18); opacity: 0; }
        }

        .cpd-target-pulse { animation: cpdTargetPulse 1.55s ease-out infinite; }
        .cpd-target-pulse-delay { animation: cpdTargetPulseDelay 1.55s ease-out infinite; animation-delay: 0.28s; }
      `}</style>

      <AppPageHeader
        eyebrow="Twój pulpit edukacyjny"
        title="Panel CPD"
        description="W jednym miejscu sprawdzasz postęp, braki w dokumentach, limity i kolejne kroki."
        icon={<MiniIcon name="chart" className="h-5 w-5" />}
        actions={[
          {
            label: "Dodaj aktywność",
            href: "/aktywnosci?new=1",
            icon: <span className="text-base leading-none">+</span>,
          },
          {
            label: "Znajdź szkolenie",
            href: "/baza-szkolen",
            variant: "secondary",
            icon: <MiniIcon name="school" />,
          },
        ]}
      />

      <nav className="sticky top-[62px] z-30 rounded-[18px] border border-slate-200 bg-white/95 p-1.5 shadow-[0_12px_32px_rgba(15,45,75,0.09)] backdrop-blur sm:top-[70px]">
        <div className="grid grid-cols-2 gap-1 sm:flex sm:items-center">
          {panelSections.map(({ id, label, mobileLabel, icon }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold transition sm:flex-1 sm:px-3 sm:text-[13px] ${
                  active
                    ? "bg-crpe-brand text-white shadow-[0_7px_16px_rgba(29,78,216,0.22)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-current={active ? "location" : undefined}
              >
                <MiniIcon name={icon} className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate sm:hidden">{mobileLabel}</span>
                <span className="hidden truncate sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>



      {isBusy ? (
        <div className={`${cardCls} p-8 text-center text-sm font-medium text-slate-500`}>
          Wczytuję dane...
        </div>
      ) : (
        <>
          {activityLoadError || profileLoadError ? (
            <div
              role="alert"
              className="rounded-[20px] border border-crpe-warning-border bg-crpe-warning-soft px-5 py-4 text-sm text-crpe-warning shadow-sm"
            >
              <div className="font-extrabold">
                Nie udało się wczytać wszystkich danych z bazy Frankfurt.
              </div>
              <div className="mt-1 break-words text-[13px] leading-5 text-crpe-warning">
                {activityLoadError ?? profileLoadError}
              </div>
              <button
                type="button"
                onClick={() => void reloadActivities()}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-crpe-warning-border bg-white px-3.5 text-xs font-bold text-crpe-warning transition hover:bg-crpe-warning-soft"
              >
                Spróbuj ponownie
              </button>
            </div>
          ) : null}

          <section id="status" className={cardCls}>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pb-1 pt-4">
              <div className="flex items-center gap-3">
                <IconBubble tone="blue">
                  <MiniIcon name="chart" />
                </IconBubble>
                <h2 className="text-base font-extrabold tracking-tight text-slate-950">
                  Twój status i kolejne kroki
                </h2>
              </div>

              <span
                className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold ${paceBadgeClass}`}
              >
                {paceBadgeLabel}
              </span>
            </div>

            <div className="px-5 pb-3 pt-1">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-[46px] font-black leading-[0.92] tracking-[-0.055em] text-crpe-brand sm:text-[52px]">
                  {donePoints}
                </span>
                {hasPointTarget ? (
                  <>
                    <span className="text-[15px] font-semibold text-slate-500">
                      z {requiredPoints} pkt
                    </span>
                    <span className="text-[13px] text-slate-500">
                      brakuje <span className="font-bold text-slate-900">{missingPoints}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-[13px] font-bold text-crpe-warning">cel nieustawiony</span>
                )}
                <span className="text-[13px] text-slate-500">
                  okres {periodStart}–{periodEnd}, minęło{" "}
                  <span className="font-bold text-slate-900">
                    {Math.round(periodTimeProgress)}%
                  </span>
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-crpe-success-soft px-2.5 py-1 font-bold text-crpe-success ring-1 ring-crpe-success-border">
                  <span className="h-1.5 w-1.5 rounded-full bg-crpe-success" aria-hidden="true" />
                  Kompletne wpisy: {completePoints} pkt
                </span>
                {incompletePoints > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-crpe-warning-soft px-2.5 py-1 font-bold text-crpe-warning ring-1 ring-crpe-warning-border">
                    <span className="h-1.5 w-1.5 rounded-full bg-crpe-warning-border" aria-hidden="true" />
                    Do uzupełnienia: {incompletePoints} pkt
                  </span>
                ) : null}
                <span className="text-slate-500">
                  Planowane wpisy nie zwiększają wyniku.
                </span>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
              <div className="min-w-0 px-3 pb-3 pt-1">
                {hasPointTarget && accrualSeries ? (
                  <div className="px-2 pb-1 pt-1">
                    <div
                      role="group"
                      aria-label="Widok wykresu"
                      className="inline-flex rounded-xl border border-slate-200 bg-[#f7f8fa] p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]"
                    >
                      {(
                        [
                          { id: "curve", label: "Przebieg" },
                          { id: "bar", label: "Przegląd" },
                        ] as const
                      ).map((option) => {
                        const active = statusView === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => chooseStatusView(option.id)}
                            className={[
                              "rounded-[7px] px-3 py-1.5 text-[12px] font-bold transition",
                              active
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-800",
                            ].join(" ")}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {hasPointTarget && accrualSeries ? (
                  statusView === "bar" ? (
                    <div className="px-2 pb-1 pt-2">
                      <PointsProgressBar
                        series={accrualSeries}
                        periodStart={periodStart}
                        periodEnd={periodEnd}
                        periodTimeProgress={periodTimeProgress}
                        pointsPerYear={pace && !pace.achieved ? pace.pointsPerYear : null}
                        yearsLeft={pace ? pace.yearsLeft : null}
                        completePoints={completePoints}
                      />
                      <p className="mt-2 px-2 text-[12px] leading-[18px] text-slate-500">
                        Niebieski pokazuje zdobyte punkty, zielona krawędź — część z kompletnych wpisów, a pole zakreskowane — lukę do równego tempa na dziś.
                      </p>
                    </div>
                  ) : (
                    <div className="px-2 pb-1 pt-2">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] leading-4 text-slate-500">
                        <span className="font-bold text-slate-700">Przebieg punktów</span>
                        <span>
                          Równe tempo na dziś: <strong className="text-slate-800">{Math.round(accrualSeries.targetToday)} pkt</strong>
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,#fbfcff_0%,#ffffff_100%)] px-1.5 pb-1 pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <div
                          className="overflow-x-auto pb-1"
                          role="region"
                          aria-label="Wykres punktów w czasie"
                          tabIndex={0}
                        >
                          <PointsAccrualChart
                            series={accrualSeries}
                            periodStart={periodStart}
                            periodEnd={periodEnd}
                          />
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-2 pl-9 text-[12px] font-medium leading-5 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-crpe-brand-soft px-2.5 py-1 text-crpe-brand ring-1 ring-crpe-brand-border">
                          <span className="h-[3px] w-3.5 rounded-full bg-crpe-brand" aria-hidden="true" />
                          zdobyte
                        </span>
                        {accrualSeries.plannedTotal > accrualSeries.doneTotal ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-sky-800 ring-1 ring-sky-100">
                            <span
                              className="h-0 w-3.5 border-t-2 border-dashed border-sky-500"
                              aria-hidden="true"
                            />
                            z planem (+{Math.round(accrualSeries.plannedTotal - accrualSeries.doneTotal)} pkt)
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
                          <span
                            className="h-0 w-3.5 border-t-2 border-dashed border-slate-400"
                            aria-hidden="true"
                          />
                          równe tempo
                        </span>
                      </div>

                      <p className="mt-2.5 px-2 text-[12px] leading-[18px] text-slate-500">
                        {accrualSeries.usesApproximateDoneDates
                          ? "Wpisy z dokładną datą są pokazane w tym dniu; starsze wpisy zapisane tylko z rokiem — w jego połowie. "
                          : "Ukończone wpisy są pokazane według zapisanych dat. "}
                        Schodki pokazują rzeczywiste momenty zdobywania punktów. Linia równomiernego tempa służy wyłącznie planowaniu i nie zmienia zasad właściwych dla Twojego zawodu ani okresu.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex h-[190px] items-center justify-center px-6 text-center text-[13px] leading-5 text-slate-500">
                    Ustaw cel punktowy, żeby zobaczyć, jak Twoje punkty narastają w okresie.
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center gap-2 border-t border-slate-100 bg-[#fafbfc] p-4 lg:border-l lg:border-t-0">
                <p className="text-xs font-bold text-slate-600">
                  {nextSteps[0]?.priority === "high" ? "Najpierw to" : "Co dalej"}
                </p>

                {nextSteps.map((step, index) => {
                  const isPrimary = index === 0;

                  /**
                   * Akcja główna ma zawsze ten sam, granatowy kolor. Pilność
                   * niesie plakietka, dzięki czemu ostrzeżenie nie konkuruje
                   * wizualnie z wynikiem i pozostałymi sekcjami panelu.
                   */
                  const urgencyLabel =
                    step.tone === "amber"
                      ? "pilne"
                      : step.tone === "green"
                        ? "gotowe"
                        : null;

                  const urgencyClass =
                    step.tone === "amber"
                      ? "bg-crpe-warning-border/90 text-crpe-warning"
                      : "bg-crpe-success-border/90 text-crpe-success";

                  if (isPrimary) {
                    return (
                      <Link
                        key={step.title}
                        href={step.ctaHref}
                        onClick={(event) => {
                          if (step.ctaHref !== "#ustawienia") return;
                          event.preventDefault();
                          setSettingsOpen(true);
                          window.requestAnimationFrame(() => {
                            const el = document.getElementById("ustawienia");
                            if (!el) return;
                            const targetTop = el.getBoundingClientRect().top + window.scrollY - 140;
                            window.scrollTo({ top: Math.max(targetTop, 80), behavior: "smooth" });
                          });
                        }}
                        className="mb-1.5 flex items-center gap-3 rounded-xl bg-crpe-brand px-3.5 py-3 text-white shadow-sm transition-colors hover:bg-crpe-brand-hover"
                      >
                        <MiniIcon name={step.icon} className="h-5 w-5 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-bold leading-5">{step.title}</span>
                            {urgencyLabel ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${urgencyClass}`}
                              >
                                {urgencyLabel}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs leading-4 text-white/85">
                            {step.description}
                          </span>
                        </span>
                        <ChevronRight className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={step.title}
                      href={step.ctaHref}
                      onClick={(event) => {
                        if (step.ctaHref !== "#ustawienia") return;
                        event.preventDefault();
                        setSettingsOpen(true);
                        window.requestAnimationFrame(() => {
                          const el = document.getElementById("ustawienia");
                          if (!el) return;
                          const targetTop = el.getBoundingClientRect().top + window.scrollY - 140;
                          window.scrollTo({ top: Math.max(targetTop, 80), behavior: "smooth" });
                        });
                      }}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      <MiniIcon name={step.icon} className="h-[18px] w-[18px] shrink-0 text-slate-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold leading-5 text-slate-950">
                          {step.title}
                        </span>
                        <span className="mt-0.5 block text-sm leading-5 text-slate-500">
                          {step.description}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div
              role="group"
              aria-label="Poziomy statusu wyniku"
              className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-[12px] leading-[18px] text-slate-600"
            >
              <span className="sr-only">
                {cycleTargetMode === "rule_set" ? "Reguła CRPE" : "Własny cel"}
              </span>
              <span className="sr-only">Reguły CRPE:</span>
              <span className="sr-only">Status formalny:</span>
              <span className="font-semibold text-slate-700">
                {displayProfession(profession, professionOther)}
                <span className="mx-1.5 text-slate-300">·</span>
                {requiredPoints} pkt
                <span className="mx-1.5 text-slate-300">·</span>
                {periodStart}–{periodEnd}
                <span className="mx-1.5 text-slate-300">·</span>
                {periodMode === "custom" ? "Indywidualny" : "Preset"}
              </span>
              <button
                type="button"
                aria-expanded={settingsOpen}
                onClick={() => {
                  setSettingsOpen((value) => !value);
                  if (!settingsOpen) {
                    window.requestAnimationFrame(() => {
                      const el = document.getElementById("ustawienia");
                      if (!el) return;
                      const targetTop = el.getBoundingClientRect().top + window.scrollY - 140;
                      window.scrollTo({ top: Math.max(targetTop, 80), behavior: "smooth" });
                    });
                  }
                }}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl border border-crpe-brand-border bg-white px-3 text-xs font-bold text-crpe-brand shadow-sm transition hover:bg-crpe-brand-soft"
              >
                {settingsOpen ? "Ukryj ustawienia" : "Zmień ustawienia"}
              </button>
            </div>
          </section>

          {settingsOpen ? (
      <section id="ustawienia" className={`${cardCls} scroll-mt-44`}>
                  <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <IconBubble tone="blue">
                        <MiniIcon name="calendar" />
                      </IconBubble>

                      <div>
                        <h2 className="text-base font-extrabold tracking-tight text-slate-950">
                          Ustawienia okresu i zawodu
                        </h2>
                        <p className="mt-0.5 text-[13px] leading-5 text-slate-500">
                          Szczegóły celu, zawodu i okresu rozliczeniowego.
                          {savedAt && !dirty && !savingProfile ? (
                            <span className="ml-1 font-medium text-crpe-brand">Zapisano</span>
                          ) : null}
                          {!otherValid ? (
                            <span className="ml-1 font-medium text-crpe-danger">
                              Uzupełnij zawód
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(false)}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                      >
                        Zamknij
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const prof =
                            professionOptions[0]?.name_pl ??
                            FALLBACK_PROFESSION_OPTIONS[0].name_pl;
                          setProfession(prof);
                          setProfessionOther("");
                          setPeriodStart(2023);
                          setPeriodEnd(2026);
                          setRequiredPoints(0);
                          setSuggestedRuleSet(null);
                          setAppliedRuleSet(null);
                          setCycleTargetMode("custom");
                          setPeriodMode("preset");
                          setDirty(true);
                        }}
                        className="inline-flex h-9 w-28 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                      >
                        Domyślne
                      </button>

                      <button
                        type="button"
                        onClick={saveAllSettings}
                        disabled={isBusy || savingProfile || !dirty || !otherValid}
                        className="inline-flex h-9 w-28 items-center justify-center rounded-xl bg-crpe-brand px-3 text-sm font-semibold text-white shadow-[0_5px_12px_rgba(29,78,216,0.20)] transition hover:bg-crpe-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingProfile ? "Zapisuję..." : "Zapisz"}
                      </button>

                      <Link
                        href="/profil"
                        className="inline-flex h-9 w-28 items-center justify-center rounded-xl border border-crpe-brand-border bg-white px-3 text-sm font-semibold text-crpe-brand shadow-sm transition hover:bg-crpe-brand-soft active:scale-95"
                      >
                        Profil →
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label className="text-[12px] font-semibold text-slate-600">
                        Zawód
                      </label>
                      <select
                        value={profession}
                        onChange={async (e) => {
                          const v = e.target.value as Profession;
                          setProfession(v);
                          if (!isOtherProfession(v)) setProfessionOther("");

                          setAppliedRuleSet(null);
                          setCycleTargetMode("custom");
                          const option = professionOptionByName(professionOptions, v);
                          if (option?.id) {
                            try {
                              const rule = await fetchVerifiedRuleSet(supabase, option.id);
                              setSuggestedRuleSet(rule);
                            } catch {
                              setSuggestedRuleSet(null);
                            }
                          } else {
                            setSuggestedRuleSet(null);
                          }

                          setDirty(true);
                        }}
                        className={`mt-1.5 ${inputCls}`}
                      >
                        {professionOptions.map((option) => (
                          <option key={option.code} value={option.name_pl}>
                            {option.name_pl}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[12px] font-semibold text-slate-600">
                        {trybLabel}
                      </label>
                      <select
                        value={periodMode}
                        onChange={(e) => {
                          const v = e.target.value as "preset" | "custom";
                          setPeriodMode(v);

                          if (v === "custom" && pwzIssueDate) {
                            const d = getPeriodFromPwzIssueDate(
                              appliedRuleSet,
                              pwzIssueDate,
                            );
                            if (d) {
                              setPeriodStart(d.start);
                              setPeriodEnd(d.end);
                            }
                          }

                          setDirty(true);
                        }}
                        className={`mt-1.5 ${inputCls}`}
                      >
                        <option value="preset">Preset najczęstszy</option>
                        <option value="custom">Indywidualny</option>
                      </select>
                    </div>

                    {periodMode === "preset" && !pwzIssueDate ? (
                      <div>
                        <label className="text-[12px] font-semibold text-slate-600">
                          {okresLabel}
                        </label>
                        <select
                          value={periodLabel}
                          onChange={(e) => {
                            const [a, b] = e.target.value.split("-").map(Number);
                            setPeriodStart(a);
                            setPeriodEnd(b);
                            setDirty(true);
                          }}
                          className={`mt-1.5 ${inputCls}`}
                        >
                          <option value="2019-2022">2019–2022</option>
                          <option value="2023-2026">2023–2026</option>
                          <option value="2027-2030">2027–2030</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[12px] font-semibold text-slate-600">
                          {okresLabel}
                        </label>
                        <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <input
                            value={periodStart}
                            onChange={(e) => {
                              setPeriodStart(Number(e.target.value || 0));
                              setDirty(true);
                            }}
                            type="number"
                            disabled={Boolean(pwzIssueDate)}
                            className={inputCls}
                          />
                          <span className="text-slate-400">–</span>
                          <input
                            value={periodEnd}
                            onChange={(e) => {
                              setPeriodEnd(Number(e.target.value || 0));
                              setDirty(true);
                            }}
                            type="number"
                            disabled={Boolean(pwzIssueDate)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[12px] font-semibold text-slate-600">
                        Własny cel punktowy
                      </label>
                      <input
                        value={requiredPoints}
                        onChange={(e) => {
                          setRequiredPoints(Number(e.target.value || 0));
                          setDirty(true);
                        }}
                        type="number"
                        min={0}
                        className={`mt-1.5 ${inputCls}`}
                      />
                    </div>

                    {otherRequired ? (
                      <div className="md:col-span-2 xl:col-span-4">
                        <label className="text-[12px] font-semibold text-slate-600">
                          Jaki zawód?
                        </label>
                        <input
                          value={professionOther}
                          onChange={(e) => {
                            setProfessionOther(e.target.value);
                            setDirty(true);
                          }}
                          placeholder="np. Psycholog, Logopeda..."
                          className={`mt-1.5 ${inputCls} ${
                            !otherValid
                              ? "border-crpe-danger-border focus:border-crpe-danger-border focus:ring-crpe-danger-border"
                              : ""
                          }`}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="mx-6 mb-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    {appliedRuleSet ? (
                      <>
                        <span className="font-bold text-slate-800">
                          Reguła: {appliedRuleSet.required_points} pkt /{" "}
                          {appliedRuleSet.period_months} miesięcy
                        </span>
                        <span>
                          {" "}· wersja {appliedRuleSet.version}
                          {appliedRuleSet.last_verified_on
                            ? ` · zweryfikowana ${appliedRuleSet.last_verified_on}`
                            : ""}
                        </span>
                      </>
                    ) : suggestedRuleSet ? (
                      <>
                        <span className="font-bold text-slate-800">
                          Reguła dla zawodu:{" "}
                          {suggestedRuleSet.required_points} pkt /{" "}
                          {suggestedRuleSet.period_months} miesięcy
                        </span>
                        <span> · zweryfikowana</span>
                        {suggestedRuleSet.sources[0] ? (
                          <details className="ml-1 inline">
                            <summary className="inline cursor-pointer font-bold text-crpe-brand hover:text-crpe-brand">
                              Szczegóły i źródło
                            </summary>
                            <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                              Obecny cykl pozostaje własnym celem i nie został
                              automatycznie zmieniony. Wersja {suggestedRuleSet.version}.{" "}
                              <a
                                href={suggestedRuleSet.sources[0].url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-crpe-brand hover:text-crpe-brand"
                              >
                                {suggestedRuleSet.sources[0].title} →
                              </a>
                            </div>
                          </details>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-slate-800">Cel własny.</span>{" "}
                        Brak aktywnej, zweryfikowanej reguły dla tego zawodu.
                      </>
                    )}
                  </div>
                </section>
          ) : null}
        </>
      )}

      {hasLimits ? (
      <section id="limity" className={`${cardCls} scroll-mt-44`}>
        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconBubble tone="blue">
              <MiniIcon name="shield" />
            </IconBubble>

            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-950">
                Twoje limity
              </h2>
              <p className="mt-0.5 text-[13px] leading-5 text-slate-500">
                Wybierz kategorię i sprawdź, ile możesz jeszcze bezpiecznie doliczyć.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right text-[11px] leading-4 text-slate-500">
            <div className="font-bold text-slate-700">{limitsRuleSet?.name_pl}</div>
            {cycleTargetMode === "custom" ? (
              <div>Reguła zawodu · okres własny</div>
            ) : (
              <div>Reguła przypięta do okresu</div>
            )}
          </div>
        </div>

        <div className="p-4">
          {planInfo || planErr ? (
            <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
              {planInfo ? (
                <p className="font-semibold text-crpe-brand">{planInfo}</p>
              ) : null}
              {planErr ? (
                <p className="font-semibold text-crpe-danger">{planErr}</p>
              ) : null}
            </div>
          ) : null}

          {limitsUsage.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
              Brak zdefiniowanych limitów dla tego zawodu.
            </div>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(250px,300px)_minmax(0,1fr)]">
              {/**
               * Wybór po lewej, wyjaśnienie po prawej. Kafle 2×2 nad opisem
               * zmuszały do przeskoku wzrokiem w dół po każdym kliknięciu i
               * przy czterech kategoriach czytały się jak cztery osobne wyniki,
               * a nie jak jedna lista do wyboru.
               */}
              <div className="space-y-2">
                <div className="px-1 text-[11px] font-semibold text-slate-600">
                  Kategorie
                </div>

                <div className="space-y-1.5">
                  {limitsUsage.map((r) => {
                    const active = selectedLimit?.key === r.key;
                    const isPerItem = r.mode === "per_item";
                    /**
                     * Ułamek pokazuje wykorzystanie, nie zapas. Licznik rośnie
                     * razem z paskiem i pozostaje spójny z polem „Masz już”.
                     */
                    const value = isPerItem
                      ? `${r.cap} pkt`
                      : `${Math.round(r.used)}/${Math.round(r.cap)}`;
                    const suffix = isPerItem
                      ? "maksymalnie na jeden wpis"
                      : r.status === "blocked"
                        ? "limit wyczerpany"
                        : `zostało ${Math.round(r.remaining)} pkt`;
                    const description =
                      r.mode === "per_item"
                        ? "limit pojedynczego wpisu"
                        : r.mode === "per_year"
                          ? "limit roczny"
                          : "limit w okresie";

                    return (
                      <button
                        key={r.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedLimitKey(r.key)}
                        className={[
                          "group relative w-full rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.995]",
                          active
                            ? "border-crpe-brand-border bg-white ring-1 ring-crpe-brand-border shadow-[0_2px_10px_rgba(15,45,75,0.08)]"
                            : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "absolute inset-y-2 left-0 w-1 rounded-r-full transition",
                            active ? "bg-crpe-brand" : "bg-transparent group-hover:bg-slate-300",
                          ].join(" ")}
                          aria-hidden="true"
                        />

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div
                              className={[
                                "truncate text-sm font-semibold tracking-[-0.01em]",
                                active ? "text-slate-950" : "text-slate-700",
                              ].join(" ")}
                            >
                              {r.label}
                            </div>
                            <div
                              className={[
                                "mt-1 truncate text-[11px] font-medium leading-none",
                                r.status === "blocked"
                                  ? "text-slate-500"
                                  : active
                                    ? "text-crpe-brand"
                                    : "text-slate-500",
                              ].join(" ")}
                            >
                              {description}
                            </div>
                            <div
                              className={[
                                "mt-1 truncate text-[11px] font-semibold leading-none",
                                r.status === "blocked"
                                  ? "text-slate-400"
                                  : r.status === "warning"
                                    ? "text-crpe-warning"
                                    : "text-crpe-success",
                              ].join(" ")}
                            >
                              {suffix}
                            </div>
                          </div>

                          <div
                            className={[
                              "shrink-0 text-base font-bold leading-none tracking-[-0.03em] tabular-nums",
                              active ? "text-crpe-brand" : "text-slate-500",
                            ].join(" ")}
                          >
                            {value}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                              r.status === "blocked"
                                ? "bg-slate-400"
                                : r.status === "warning"
                                  ? "bg-crpe-warning-border"
                                  : r.mode === "per_item"
                                    ? "bg-crpe-brand"
                                    : "bg-crpe-success"
                            }`}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            {r.mode === "per_item" ? (
                              <div className="grid grid-cols-10 gap-1" aria-label="Limit pojedynczego wpisu">
                                {Array.from({ length: 10 }, (_, index) => (
                                  <span key={index} className="h-1.5 rounded-full bg-crpe-brand-border" aria-hidden="true" />
                                ))}
                              </div>
                            ) : (
                              <SegmentedCapacityBar pct={r.usedPct} status={r.status} />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-semibold text-slate-600">
                    Podsumowanie kategorii
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="text-[10px] font-medium text-slate-500">Z wolnym miejscem</div>
                      <div className="mt-0.5 text-lg font-bold leading-none text-crpe-success">
                        {usableLimitsCount}
                        <span className="ml-1 text-[11px] font-semibold text-slate-400">
                          z {limitsUsage.length}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="text-[10px] font-medium text-slate-500">Wyczerpane</div>
                      <div
                        className={[
                          "mt-0.5 text-lg font-bold leading-none",
                          blockedLimitsCount > 0 ? "text-crpe-warning" : "text-slate-500",
                        ].join(" ")}
                      >
                        {blockedLimitsCount}
                        <span className="ml-1 text-[11px] font-semibold text-slate-400">
                          z {limitsUsage.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    Liczby przy kategoriach to punkty już wykorzystane z limitu.
                  </p>
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                {selectedLimit ? (
                  <div className="relative overflow-hidden rounded-[1.35rem] border border-crpe-brand-border bg-gradient-to-br from-crpe-brand-soft/55 via-white to-crpe-brand-soft/20 p-4 shadow-sm shadow-crpe-brand-border/50">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-crpe-brand via-crpe-brand-border to-transparent" />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-crpe-brand">
                          Wybrana kategoria
                        </div>
                        <h3 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-2xl">
                          {selectedLimit.label}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                          {selectedLimit.note ||
                            "Ta kategoria może pomóc w domknięciu brakujących punktów."}
                        </p>
                      </div>

                      <LimitStatusBadge kind={selectedLimit.status} />
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-[1.05rem] border border-slate-200 bg-white/80 px-3 py-3 shadow-sm shadow-slate-900/[0.03]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-600">
                              Maksymalnie
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {selectedLimit.mode === "per_item"
                                ? "za jeden wpis"
                                : selectedLimit.mode === "per_year"
                                  ? "z limitów rocznych"
                                  : "w całym okresie"}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-2xl font-extrabold tracking-[-0.05em] text-slate-950">
                            {selectedLimit.cap}
                            <span className="ml-1 text-xs font-semibold text-slate-400">pkt</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.05rem] border border-slate-200 bg-white/80 px-3 py-3 shadow-sm shadow-slate-900/[0.03]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-600">
                              {selectedLimit.mode === "per_item" ? "Najwyższy wpis" : "Masz już"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {selectedLimit.count > 0
                                ? `${selectedLimit.count} ${pluralPl(selectedLimit.count, ["wpis", "wpisy", "wpisów"])}`
                                : "brak wpisów"}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-2xl font-extrabold tracking-[-0.05em] text-slate-950">
                            {selectedLimit.used}
                            <span className="ml-1 text-xs font-semibold text-slate-400">pkt</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`rounded-[1.05rem] border px-3 py-3 shadow-sm ${
                          selectedLimit.status === "blocked"
                            ? "border-slate-200 bg-white/80 shadow-slate-900/[0.03]"
                            : selectedLimit.status === "warning"
                              ? "border-crpe-warning-border bg-crpe-warning-soft/70 shadow-crpe-warning-border/40"
                              : "border-crpe-brand-border bg-crpe-brand-soft/80 shadow-crpe-brand-border/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-600">
                              Możesz jeszcze
                            </div>
                            <div className="mt-1 text-xs text-slate-600">
                              {selectedLimit.mode === "per_item"
                                ? "w kolejnym wpisie"
                                : selectedLimit.status === "blocked"
                                  ? "limit wykorzystany"
                                  : "bezpiecznego zapasu"}
                            </div>
                          </div>
                          <div
                            className={`shrink-0 text-right text-[34px] font-black leading-none tracking-[-0.06em] ${
                              selectedLimit.status === "blocked"
                                ? "text-slate-500"
                                : selectedLimit.status === "warning"
                                  ? "text-crpe-warning"
                                  : "text-crpe-brand"
                            }`}
                          >
                            {selectedLimit.mode === "per_item"
                              ? selectedLimit.cap
                              : Math.round(selectedLimit.remaining)}
                            <span className="ml-1 text-xs font-semibold opacity-60">pkt</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-[1.05rem] border border-slate-200 bg-white/85 p-3 shadow-sm shadow-slate-900/[0.03]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-950">
                            Co to oznacza?
                          </div>
                          <div className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                            {selectedLimit.mode === "per_item"
                              ? `Ten limit działa na pojedynczy wpis. Każdą aktywność oceniasz osobno, maksymalnie do ${selectedLimit.cap} pkt.`
                              : selectedLimit.status === "blocked"
                                ? "Ta kategoria jest już wykorzystana. Nie planuj jej dalej pod brakujące punkty."
                                : selectedLimit.status === "warning"
                                  ? `Możesz jeszcze skorzystać z tej kategorii, ale zostało tylko ${Math.round(selectedLimit.remaining)} pkt miejsca.`
                                  : `To dobra kategoria do dalszego uzupełniania. Możesz jeszcze doliczyć ${Math.round(selectedLimit.remaining)} pkt.`}
                          </div>
                        </div>

                        {selectedLimit.status === "blocked" ? (
                          <Link
                            href="/aktywnosci"
                            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                          >
                            Zobacz wpisy
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy || planningKey === selectedLimit.key}
                            onClick={() => planForRule(selectedLimit)}
                            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-crpe-brand-border bg-white px-3.5 text-sm font-semibold text-crpe-brand shadow-sm transition hover:bg-crpe-brand-soft active:scale-95 disabled:opacity-40"
                          >
                            {planningKey === selectedLimit.key
                              ? "Dodaję..."
                              : "Zaplanuj tę kategorię"}
                          </button>
                        )}
                      </div>

                      {selectedLimit.mode !== "per_item" ? (
                        <div className="mt-3">
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-medium text-slate-500">
                            <span>Wykorzystanie limitu</span>
                            <span>{Math.round(selectedLimit.usedPct)}%</span>
                          </div>

                          <SegmentedCapacityBar pct={selectedLimit.usedPct} status={selectedLimit.status} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-crpe-brand-border bg-crpe-brand-soft text-crpe-brand">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 10v6" />
                        <path d="M12 7h.01" />
                      </svg>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-950">
                        Skąd wynikają te limity?
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        Pokazane maksima pochodzą ze zweryfikowanej reguły dla
                        wybranego zawodu i są liczone w ustawionym okresie.
                      </p>
                      {limitsRuleSet?.sources[0] ? (
                        <a
                          href={limitsRuleSet.sources[0].url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-[11px] font-bold text-crpe-brand hover:underline"
                        >
                          Otwórz źródło reguły →
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <div className="text-[11px] font-semibold text-slate-600">
                      Najlepszy ruch
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-950">
                      {bestLimit?.label ?? "Sprawdź aktywności"}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      {bestLimit
                        ? bestLimit.mode === "per_item"
                          ? `Możesz dodać kolejny wpis do ${bestLimit.cap} pkt.`
                          : `Możesz jeszcze doliczyć ${Math.round(bestLimit.remaining)} pkt.`
                        : "Brak oczywistej rekomendacji."}
                    </div>
                    <Link
                      href="/profil"
                      className="mt-2 inline-flex text-xs font-semibold text-crpe-brand hover:text-crpe-brand"
                    >
                      Sprawdź profil i ustawienia →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <Link
              href="/aktywnosci"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Aktywności →
            </Link>
            <Link
              href="/aktywnosci?new=1"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              + Dodaj aktywność
            </Link>
            <Link
              href="/raporty/uzytkownik"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Raport / PDF →
            </Link>
          </div>
        </div>
      </section>
      ) : null}

      <section id="aktywnosci" className={`${cardCls} scroll-mt-44`}>
        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconBubble tone="blue">
              <MiniIcon name="calendar" />
            </IconBubble>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-slate-950">
                  Ostatnie aktywności
                </h2>
                {recentRows.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {recentRows.length}
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                {(["all", "missing", "planned", "complete"] as const).map((f) => {
                  const labels = {
                    all: "wszystkie",
                    missing: "do uzupełnienia",
                    planned: "zaplanowane",
                    complete: "kompletne",
                  };

                  const dots = {
                    all: "",
                    missing: "bg-crpe-warning-border",
                    planned: "bg-crpe-brand",
                    complete: "bg-crpe-success-border",
                  };

                  const active = {
                    all: "bg-slate-100 text-slate-800",
                    missing: "bg-crpe-warning-soft text-crpe-warning",
                    planned: "bg-crpe-brand-soft text-crpe-brand",
                    complete: "bg-crpe-success-soft text-crpe-success",
                  };

                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => filterActivities(f)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                        activityFilter === f
                          ? active[f]
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {dots[f] ? (
                        <span className={`h-2 w-2 rounded-full ${dots[f]}`} />
                      ) : null}
                      {labels[f]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Link
            href="/aktywnosci"
            className="shrink-0 text-sm font-medium text-crpe-brand hover:text-crpe-brand"
          >
            Przejdź do aktywności
          </Link>
        </div>

        <div className="p-5">
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-3">
            {recentRows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                <div className="text-sm font-medium text-slate-700">
                  {emptyStateMsg}
                </div>
                <Link
                  href={emptyStateHref}
                  className="rounded-xl bg-crpe-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-crpe-brand-hover active:scale-95"
                >
                  {emptyStateCta}
                </Link>
              </div>
            ) : (
              recentRows.slice(0, 6).map((a) => {
                const prog = normalizeStatus(a.status);
                const missing = getRowMissing(a);
                const hasMissing = prog !== "planned" && missing.length > 0;
                const counted = adjustedPointsById.get(a.id);
                const date = timelineDate(a);
                const isOverdue = overdue.some((entry) => entry.id === a.id);
                const stripe = isOverdue
                  ? "bg-rose-500"
                  : prog === "planned"
                    ? "bg-crpe-brand"
                    : hasMissing
                      ? "bg-crpe-warning"
                      : "bg-crpe-success";
                const statusLabel = isOverdue
                  ? "Po terminie"
                  : prog === "planned"
                    ? "Zaplanowane"
                    : hasMissing
                      ? "Do uzupełnienia"
                      : "Kompletne";
                const statusClass = isOverdue
                  ? "bg-rose-50 text-rose-700 ring-rose-200"
                  : prog === "planned"
                    ? "bg-crpe-brand-soft text-crpe-brand ring-crpe-brand-border"
                    : hasMissing
                      ? "bg-crpe-warning-soft text-crpe-warning ring-crpe-warning-border"
                      : "bg-crpe-success-soft text-crpe-success ring-crpe-success-border";

                return (
                  <article
                    key={a.id}
                    className="group relative overflow-hidden rounded-2xl border border-l-[3px] border-slate-200 bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.045)] transition hover:border-slate-300 hover:shadow-[0_3px_12px_rgba(15,23,42,0.07)]"
                    style={{ borderLeftColor: isOverdue ? "#A42F30" : prog === "planned" ? "#1D4ED8" : hasMissing ? "#9A4600" : "#006A4E" }}
                  >
                    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 sm:grid-cols-[64px_minmax(0,1fr)_150px] sm:items-center sm:gap-4">
                      <div className="flex w-[64px] shrink-0 flex-col items-center self-start text-center sm:self-center">
                        <span className={`mb-1 h-1 w-6 rounded-full ${stripe}`} aria-hidden="true" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          {date.secondary === "rok" ? "ROK" : date.secondary.split(" ")[0]}
                        </span>
                        <span className="mt-0.5 text-[24px] font-black leading-none tracking-[-0.04em] text-slate-950">
                          {date.primary}
                        </span>
                        <span className="mt-1 text-[10px] font-semibold text-slate-400">
                          {date.secondary === "rok" ? a.year : date.secondary.split(" ").slice(1).join(" ")}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <h3 className="mt-1.5 text-[15px] font-bold leading-[1.35] tracking-[-0.015em] text-slate-950 transition group-hover:text-crpe-brand">
                          {a.type}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {a.organizer ? a.organizer : "Aktywność własna"}
                          {prog === "planned" && a.planned_start_date ? ` · termin ${formatYMD(a.planned_start_date)}` : ""}
                        </p>
                        {hasMissing ? (
                          <p className="mt-1.5 text-[11px] font-medium text-crpe-warning">
                            Brakuje: {missing.join(", ")}
                          </p>
                        ) : null}
                      </div>

                      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:col-span-1 sm:block sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                        <div>
                          <div className="flex items-baseline gap-1 text-crpe-brand">
                            <span className="text-[28px] font-black leading-none tracking-[-0.05em]">
                              +{counted?.applied ?? a.points}
                            </span>
                            <span className="text-xs font-bold">pkt</span>
                          </div>
                          {counted && counted.over > 0 ? (
                            <span className="mt-1 block text-[10px] font-medium text-crpe-warning">
                              wpisano {counted.raw} pkt
                            </span>
                          ) : null}
                        </div>
                        <Link
                          href={`/aktywnosci/${a.id}`}
                          className={`mt-0 inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition sm:mt-2 ${
                            hasMissing || prog === "planned" || isOverdue
                              ? "bg-crpe-brand text-white shadow-sm hover:bg-crpe-brand-hover"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isOverdue ? "Rozstrzygnij" : hasMissing ? "Uzupełnij" : prog === "planned" ? "Otwórz plan" : "Szczegóły"}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

          {recentRows.length > 6 && (
            <div className="mt-3 border-t border-slate-100 pt-3 text-center">
              <Link
                href="/aktywnosci"
                className="text-sm font-medium text-crpe-brand hover:text-crpe-brand"
              >
                Zobacz wszystkie {recentRows.length} aktywności →
              </Link>
            </div>
          )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <aside className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50/65">
            <div className="border-b border-slate-200 bg-white px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950">Oś aktywności</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Okres {periodStart}–{periodEnd}
                  </p>
                </div>
                <MiniIcon name="calendar" className="h-4 w-4 text-crpe-brand" />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-crpe-brand" />plan</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-crpe-warning" />braki</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-crpe-success" />kompletne</span>
              </div>
            </div>

            {timelineRows.length ? (
              <ol className="px-4 py-3">
                {timelineRows.map((activity, index) => {
                  const planned = normalizeStatus(activity.status) === "planned";
                  const incomplete = !planned && getRowMissing(activity).length > 0;
                  const date = timelineDate(activity);
                  const counted = adjustedPointsById.get(activity.id);
                  const dotClass = planned
                    ? "border-crpe-brand-border bg-crpe-brand"
                    : incomplete
                      ? "border-crpe-warning-border bg-crpe-warning"
                      : "border-crpe-success-border bg-crpe-success";

                  return (
                    <li key={activity.id} className="grid grid-cols-[50px_18px_minmax(0,1fr)] gap-2">
                      <div className="pt-0.5 text-right">
                        <div className="text-[12px] font-extrabold leading-4 text-slate-800">{date.primary}</div>
                        <div className="text-[9px] font-bold uppercase leading-3 text-slate-400">{date.secondary}</div>
                      </div>
                      <div className="relative flex justify-center">
                        {index < timelineRows.length - 1 ? (
                          <span className="absolute bottom-[-1px] top-3 w-px bg-slate-200" aria-hidden="true" />
                        ) : null}
                        <span className={`relative mt-1 h-3 w-3 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(148,163,184,0.28)] ${dotClass}`} />
                      </div>
                      <Link
                        href={`/aktywnosci/${activity.id}`}
                        className={`group min-w-0 text-left ${index < timelineRows.length - 1 ? "pb-4" : "pb-1"}`}
                      >
                        <span className="block truncate text-[12px] font-bold text-slate-900 transition group-hover:text-crpe-brand">
                          {activity.type}
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                          <span>{planned ? "Zaplanowane" : incomplete ? "Do uzupełnienia" : "Ukończone"}</span>
                          <span className="shrink-0 font-bold text-slate-700">+{counted?.applied ?? activity.points} pkt</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="px-5 py-10 text-center text-xs leading-5 text-slate-500">
                Brak aktywności dla wybranego filtra.
              </div>
            )}
          </aside>

            <section id="terminy" className="scroll-mt-44 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-100 px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <IconBubble tone="blue">
                          <MiniIcon name="bell" />
                        </IconBubble>
                        <div>
                          <h2 className="text-base font-extrabold tracking-tight text-slate-950">
                            Najbliższe terminy
                          </h2>
                          <p className="mt-0.5 text-[13px] leading-5 text-slate-500">
                            Zaległe plany, nadchodzące wpisy i koniec okresu.
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/profil"
                        className="shrink-0 text-[13px] font-bold text-crpe-brand hover:underline"
                      >
                        Przypomnienia →
                      </Link>
                    </div>

                    <ul className="divide-y divide-slate-100">
                      {overdue.map((entry) => (
                        <li key={`overdue-${entry.id}`} className="bg-rose-50/55">
                          <Link
                            href={`/aktywnosci/${entry.id}`}
                            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-rose-50"
                          >
                            <span className="w-10 shrink-0 text-center">
                              <span className="block text-lg font-extrabold leading-tight tracking-[-0.03em] text-rose-800">
                                {agendaDay(entry.date)}
                              </span>
                              <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-rose-500">
                                {agendaMonth(entry.date)}
                              </span>
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-slate-950">
                                {entry.title}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-rose-700">
                                Nadal oznaczone jako zaplanowane
                                {entry.detail ? ` · ${entry.detail}` : ""}
                              </span>
                            </span>

                            <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
                              {formatOverdue(entry.daysOverdue)}
                            </span>
                          </Link>
                        </li>
                      ))}

                      {upcoming.map((entry) => (
                        <li key={entry.id}>
                          <Link
                            href="/aktywnosci"
                            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
                          >
                            <span className="w-10 shrink-0 text-center">
                              <span className="block text-lg font-extrabold leading-tight tracking-[-0.03em] text-slate-950">
                                {agendaDay(entry.date)}
                              </span>
                              <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                {agendaMonth(entry.date)}
                              </span>
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-slate-950">
                                {entry.title}
                              </span>
                              {entry.detail ? (
                                <span className="mt-0.5 block truncate text-xs text-slate-500">
                                  {entry.detail}
                                </span>
                              ) : null}
                            </span>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                                entry.daysAway <= 30
                                  ? "bg-crpe-warning-soft text-crpe-warning"
                                  : "text-slate-500"
                              }`}
                            >
                              {formatCountdown(entry.daysAway)}
                            </span>
                          </Link>
                        </li>
                      ))}

                      {upcoming.length === 0 && overdue.length === 0 ? (
                        <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                          <p className="text-[13px] leading-5 text-slate-500">
                            Nie masz zaplanowanych aktywności. Dodaj termin, a CRPE przypomni o nim
                            z wyprzedzeniem.
                          </p>
                          <Link
                            href="/baza-szkolen"
                            className="shrink-0 rounded-xl border border-crpe-brand-border bg-crpe-brand-soft px-3.5 py-2 text-[13px] font-bold text-crpe-brand transition hover:bg-crpe-brand-soft"
                          >
                            Znajdź szkolenie →
                          </Link>
                        </li>
                      ) : null}

                      {periodDeadline ? (
                        <li className="flex items-center gap-4 bg-slate-50/70 px-5 py-3">
                          <span className="grid w-10 shrink-0 place-items-center text-slate-400">
                            <MiniIcon name="target" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-slate-950">
                              Koniec okresu rozliczeniowego
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {formatYMD(periodDeadline.date)}
                              {missingPoints > 0 ? ` · zostało ${missingPoints} pkt do zdobycia` : " · cel osiągnięty"}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-bold text-slate-500">
                            {formatCountdown(periodDeadline.daysAway)}
                          </span>
                        </li>
                      ) : null}
                    </ul>

                    {pace && !pace.achieved ? (
                      <p className="border-t border-slate-100 px-4 py-3 text-[13px] leading-5 text-slate-600">
                        Przy pozostałym czasie musisz zdobywać średnio{" "}
                        <span className="font-bold text-slate-900">{pace.pointsPerYear} pkt rocznie</span>, żeby
                        zamknąć okres na czas.
                      </p>
                    ) : null}

                    {deadlineFallbackMessage ? (
                      <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-[12px] leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <p>{deadlineFallbackMessage}</p>
                        {cycleTargetMode === "custom" && ruleDeadline?.source !== "period_year" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSettingsOpen(true);
                              window.requestAnimationFrame(() => {
                                const el = document.getElementById("ustawienia");
                                if (!el) return;
                                const targetTop = el.getBoundingClientRect().top + window.scrollY - 140;
                                window.scrollTo({ top: Math.max(targetTop, 80), behavior: "smooth" });
                              });
                            }}
                            className="shrink-0 font-bold text-crpe-brand hover:underline"
                          >
                            Przejdź do ustawień okresu
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
          </div>
          </div>
        </div>
      </section>


    </div>
  );
}
