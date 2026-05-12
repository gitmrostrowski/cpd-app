"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

import {
  type Profession,
  PROFESSION_OPTIONS,
  DEFAULT_REQUIRED_POINTS_BY_PROFESSION,
  displayProfession,
  isOtherProfession,
  normalizeOtherProfession,
} from "@/lib/cpd/professions";

type ActivityStatus = "planned" | "done" | null;

type ActivityRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
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
};

type ProfileUpsert = ProfileRow;

type RuleLimit = {
  key: string;
  label: string;
  mode: "per_period" | "per_year" | "per_item";
  maxPoints: number;
  note?: string;
};

type ProfessionRules = {
  periodMonths: number;
  requiredPoints: number;
  limits: RuleLimit[];
};

const RULES_BY_PROFESSION: Partial<Record<Profession, ProfessionRules>> = {
  Lekarz: {
    periodMonths: 48,
    requiredPoints: 200,
    limits: [
      {
        key: "INTERNAL_TRAINING",
        label: "Szkolenie wewnętrzne",
        mode: "per_item",
        maxPoints: 6,
        note: "Maks. 6 pkt za jedno szkolenie. Limit dotyczy pojedynczego wpisu, nie sumy w okresie.",
      },
      {
        key: "JOURNAL_SUBSCRIPTION",
        label: "Prenumerata czasopisma",
        mode: "per_period",
        maxPoints: 10,
        note: "Po osiągnięciu limitu lepiej wybrać inną aktywność.",
      },
      {
        key: "SCIENTIFIC_SOCIETY",
        label: "Towarzystwo/Kolegium",
        mode: "per_period",
        maxPoints: 20,
        note: "Pamiętaj o potwierdzeniu członkostwa lub opłacenia składki.",
      },
    ],
  },
  "Lekarz dentysta": {
    periodMonths: 48,
    requiredPoints: 200,
    limits: [
      {
        key: "INTERNAL_TRAINING",
        label: "Szkolenie wewnętrzne",
        mode: "per_item",
        maxPoints: 6,
        note: "Maks. 6 pkt za jedno szkolenie. Limit dotyczy pojedynczego wpisu, nie sumy w okresie.",
      },
      {
        key: "JOURNAL_SUBSCRIPTION",
        label: "Prenumerata czasopisma",
        mode: "per_period",
        maxPoints: 10,
        note: "Po osiągnięciu limitu lepiej wybrać inną aktywność.",
      },
      {
        key: "SCIENTIFIC_SOCIETY",
        label: "Towarzystwo/Kolegium",
        mode: "per_period",
        maxPoints: 20,
        note: "Pamiętaj o potwierdzeniu członkostwa lub opłacenia składki.",
      },
    ],
  },
  Pielęgniarka: {
    periodMonths: 60,
    requiredPoints: 100,
    limits: [
      {
        key: "WEBINAR",
        label: "Webinary",
        mode: "per_period",
        maxPoints: 50,
        note: "Dobre do uzupełnienia punktów, ale nie opieraj całego okresu tylko na webinarach.",
      },
      {
        key: "INTERNAL_TRAINING",
        label: "Szkolenie wewnętrzne",
        mode: "per_period",
        maxPoints: 50,
        note: "Dobre do uzupełnienia braków, jeśli masz potwierdzenie udziału.",
      },
      {
        key: "COMMITTEES",
        label: "Komisje/Zespoły",
        mode: "per_period",
        maxPoints: 30,
        note: "Wymaga dobrej dokumentacji obecności lub udziału.",
      },
      {
        key: "JOURNAL_SUBSCRIPTION",
        label: "Prenumerata czasopisma",
        mode: "per_year",
        maxPoints: 10,
        note: "Limit liczony rocznie — sprawdź, których lat dotyczy prenumerata.",
      },
    ],
  },
  Położna: {
    periodMonths: 60,
    requiredPoints: 100,
    limits: [
      {
        key: "WEBINAR",
        label: "Webinary",
        mode: "per_period",
        maxPoints: 50,
        note: "Dobre do uzupełnienia punktów, ale nie opieraj całego okresu tylko na webinarach.",
      },
      {
        key: "INTERNAL_TRAINING",
        label: "Szkolenie wewnętrzne",
        mode: "per_period",
        maxPoints: 50,
        note: "Dobre do uzupełnienia braków, jeśli masz potwierdzenie udziału.",
      },
      {
        key: "COMMITTEES",
        label: "Komisje/Zespoły",
        mode: "per_period",
        maxPoints: 30,
        note: "Wymaga dobrej dokumentacji obecności lub udziału.",
      },
      {
        key: "JOURNAL_SUBSCRIPTION",
        label: "Prenumerata czasopisma",
        mode: "per_year",
        maxPoints: 10,
        note: "Limit liczony rocznie — sprawdź, których lat dotyczy prenumerata.",
      },
    ],
  },
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function mapTypeToRuleKey(type: string): string | null {
  const t = (type || "").toLowerCase();
  if (t.includes("webinar")) return "WEBINAR";
  if (t.includes("kurs online")) return "WEBINAR";
  if (t.includes("szkolenie wewn")) return "INTERNAL_TRAINING";
  if (t.includes("prenumer")) return "JOURNAL_SUBSCRIPTION";
  if (t.includes("towarzyst") || t.includes("kolegium")) return "SCIENTIFIC_SOCIETY";
  if (t.includes("komisj") || t.includes("zesp")) return "COMMITTEES";
  return null;
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

function getPeriodFromPwzIssueDate(
  prof: Profession,
  pwzIssueDate: string | null | undefined,
) {
  if (!pwzIssueDate) return null;
  const y = Number(String(pwzIssueDate).slice(0, 4));
  if (!y || Number.isNaN(y)) return null;
  const months = RULES_BY_PROFESSION[prof]?.periodMonths ?? 48;
  const years = Math.max(1, Math.round(months / 12));
  return { start: y, end: y + years - 1 };
}

function getRowMissing(a: ActivityRow) {
  const missing: string[] = [];
  if (!Boolean(a.organizer && String(a.organizer).trim())) missing.push("Brak organizatora");
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
  missingEvidenceCount: number,
  limitWarning: string | null,
) {
  const steps: {
    title: string;
    description: string;
    ctaHref: string;
    tone: "amber" | "blue" | "green";
    priority: "high" | "normal";
  }[] = [];

  if (missingEvidenceCount > 0) {
    steps.push({
      title: "Uzupełnij dokumenty",
      description: `Masz ${missingEvidenceCount} brakujących dokumentów. To najszybszy krok do uporządkowania panelu.`,
      ctaHref: "/aktywnosci",
      tone: "amber",
      priority: "high",
    });
  }

  if (missingPoints > 0) {
    steps.push({
      title: limitWarning ? "Dobierz inną aktywność" : "Zaplanuj szkolenie",
      description:
        limitWarning ||
        "Wybierz aktywność, która realnie przybliży Cię do wymaganej liczby punktów.",
      ctaHref: "/baza-szkolen",
      tone: "blue",
      priority: missingEvidenceCount === 0 ? "high" : "normal",
    });
  }

  steps.push({
    title: "Sprawdź raport",
    description:
      missingPoints <= 0
        ? "Masz komplet punktów. Sprawdź, czy raport jest gotowy."
        : "Zobacz, jak wygląda podsumowanie okresu.",
    ctaHref: "/portfolio",
    tone: "green",
    priority: "normal",
  });

  return steps.slice(0, 3);
}

function IconBubble({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
}) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-red-100 bg-red-50 text-red-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${tones[tone]}`}>
      {children}
    </div>
  );
}

function MiniIcon({
  name,
  className = "h-4 w-4",
}: {
  name: "calendar" | "shield" | "chart" | "doc" | "user" | "bell" | "hourglass";
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

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 6 3 8H3c0-2 3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function CircularProgress({
  value,
  label = "realizacji",
  size = "normal",
  tone = "blue",
}: {
  value: number;
  label?: string;
  size?: "normal" | "small";
  tone?: "blue" | "slate" | "amber";
}) {
  const isSmall = size === "small";
  const svgSize = isSmall ? 72 : 96;
  const center = svgSize / 2;
  const radius = isSmall ? 28 : 36;
  const stroke = isSmall ? 7 : 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (clamp(value, 0, 100) / 100) * circumference;
  const strokeTone = tone === "amber" ? "text-amber-500" : tone === "slate" ? "text-slate-500" : "text-blue-600";

  return (
    <div className={`relative shrink-0 ${isSmall ? "h-[72px] w-[72px]" : "h-24 w-24"}`}>
      <svg className="-rotate-90" height={svgSize} width={svgSize}>
        <circle stroke="currentColor" className="text-slate-200" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={center} cy={center} />
        <circle
          stroke="currentColor"
          className={`${strokeTone} transition-all duration-700`}
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          r={normalizedRadius}
          cx={center}
          cy={center}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`${isSmall ? "text-base" : "text-xl"} font-semibold tracking-tight text-slate-900`}>
          {Math.round(value)}%
        </div>
        <div className="mt-0.5 text-center text-[10px] font-medium leading-tight text-slate-500">
          {label}
        </div>
      </div>
    </div>
  );
}

function PulsingTargetMarker({ progress }: { progress: number }) {
  return (
    <div
      className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
      style={{ left: `${clamp(progress, 4, 96)}%` }}
    >
      <div className="relative grid h-9 w-9 place-items-center text-blue-700">
        <span className="cpd-target-pulse absolute h-9 w-9 rounded-full border border-blue-300/70" />
        <span className="cpd-target-pulse-delay absolute h-6 w-6 rounded-full border border-blue-400/80" />
        <svg
          viewBox="0 0 24 24"
          className="relative h-5 w-5 drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </div>
    </div>
  );
}

function StatMiniCard({
  label,
  value,
  suffix,
  subtitle,
  tone = "slate",
  icon,
  compact = false,
  emphasis = false,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  subtitle?: string;
  tone?: "slate" | "amber" | "blue" | "green";
  icon?: React.ReactNode;
  compact?: boolean;
  emphasis?: boolean;
}) {
  const toneWrap =
    tone === "amber"
      ? "bg-amber-50/70 border-amber-200"
      : tone === "blue"
        ? "bg-blue-50/70 border-blue-200"
        : tone === "green"
          ? "bg-emerald-50/70 border-emerald-200"
          : "bg-white border-slate-200";

  const toneValue =
    tone === "amber"
      ? "text-amber-700"
      : tone === "blue"
        ? "text-blue-700"
        : tone === "green"
          ? "text-emerald-700"
          : "text-slate-950";

  const iconTone =
    tone === "amber"
      ? "text-amber-600"
      : tone === "blue"
        ? "text-blue-600"
        : tone === "green"
          ? "text-emerald-600"
          : "text-slate-500";

  return (
    <div className={`h-full rounded-2xl border ${compact ? "p-3" : "p-4"} ${toneWrap}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</div>
          <div className={`mt-1.5 flex items-end gap-1 ${toneValue}`}>
            <div className={`font-extrabold leading-none tracking-[-0.04em] ${emphasis ? "text-[2rem]" : compact ? "text-[1.12rem]" : "text-[1.35rem]"}`}>
              {value}
            </div>
            {suffix ? <div className="pb-0.5 text-xs font-semibold text-slate-400">{suffix}</div> : null}
          </div>
          {subtitle ? <div className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{subtitle}</div> : null}
        </div>

        {icon ? <div className={`shrink-0 ${iconTone}`}>{icon}</div> : null}
      </div>
    </div>
  );
}

function LimitStatusPill({ status }: { status: "available" | "warning" | "blocked" | "per_item" }) {
  const cls =
    status === "blocked"
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : status === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  const label =
    status === "blocked"
      ? "Nie doliczaj"
      : status === "warning"
        ? "Kończy się"
        : status === "per_item"
          ? "Na wpis"
          : "Dostępne";

  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>{label}</span>;
}

export default function CalculatorClient() {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [professionOther, setProfessionOther] = useState("");
  const [periodStart, setPeriodStart] = useState(2023);
  const [periodEnd, setPeriodEnd] = useState(2026);
  const [requiredPoints, setRequiredPoints] = useState(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.Lekarz ?? 200);
  const [periodMode, setPeriodMode] = useState<"preset" | "custom">("preset");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [planInfo, setPlanInfo] = useState<string | null>(null);
  const [planErr, setPlanErr] = useState<string | null>(null);
  const [planningKey, setPlanningKey] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<"all" | "planned" | "missing" | "complete">("all");
  const [activeNav, setActiveNav] = useState<"ustawienia" | "status" | "kroki" | "limity" | "aktywnosci" | "powiadomienia">("ustawienia");

  const supabase = useMemo(() => supabaseClient(), []);

  async function reloadActivities() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("activities")
      .select("id, user_id, type, points, year, organizer, created_at, status, planned_start_date, training_id, certificate_path, certificate_name, certificate_mime, certificate_size, certificate_uploaded_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setActivities(!error && data ? (data as ActivityRow[]) : []);
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user?.id) {
        if (!cancelled) {
          setProfile(null);
          setActivities([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, profession, profession_other, pwz_number, pwz_issue_date, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (!pErr && p) {
          const prof = ((p as any).profession ?? "Lekarz") as Profession;
          const po = normalizeOtherProfession((p as any).profession_other);
          const pwzIssue = (p as any).pwz_issue_date as string | null;
          const derived = getPeriodFromPwzIssueDate(prof, pwzIssue);
          const start = derived?.start ?? ((p as any).period_start ?? 2023);
          const end = derived?.end ?? ((p as any).period_end ?? 2026);
          const rp =
            ((p as any).required_points ?? undefined) ??
            DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ??
            RULES_BY_PROFESSION[prof]?.requiredPoints ??
            200;

          setProfession(prof);
          setProfessionOther(po);
          setPeriodStart(start);
          setPeriodEnd(end);
          setRequiredPoints(rp);
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
            pwz_number: (p as any).pwz_number ?? null,
            pwz_issue_date: pwzIssue,
            period_start: start,
            period_end: end,
            required_points: rp,
          });
        } else {
          setProfession("Lekarz");
          setProfessionOther("");
          setPeriodStart(2023);
          setPeriodEnd(2026);
          setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.Lekarz ?? 200);
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

  const inPeriodDone = useMemo(
    () => activities.filter((x) => normalizeStatus(x.status) === "done" && x.year >= periodStart && x.year <= periodEnd),
    [activities, periodStart, periodEnd],
  );

  const donePoints = useMemo(() => inPeriodDone.reduce((sum, a) => sum + (Number(a.points) || 0), 0), [inPeriodDone]);
  const missingPoints = useMemo(() => Math.max(0, (Number(requiredPoints) || 0) - donePoints), [requiredPoints, donePoints]);

  const progress = useMemo(() => {
    const req = Number(requiredPoints) || 0;
    return req <= 0 ? 0 : clamp((donePoints / req) * 100, 0, 100);
  }, [requiredPoints, donePoints]);

  const missingEvidenceCount = useMemo(() => inPeriodDone.filter((a) => !a.certificate_path).length, [inPeriodDone]);

  const periodTimeProgress = useMemo(() => {
    const start = new Date(periodStart, 0, 1).getTime();
    const end = new Date(periodEnd, 11, 31, 23, 59, 59).getTime();
    const now = Date.now();
    if (end <= start) return 0;
    return clamp(((now - start) / (end - start)) * 100, 0, 100);
  }, [periodStart, periodEnd]);

  const paceDelta = Math.round(progress - periodTimeProgress);
  const paceLabel = progress <= 0 ? "Start" : paceDelta >= 10 ? "Zapas" : paceDelta >= -10 ? "Równo" : "Do nadrobienia";
  const paceDescription =
    paceDelta < -10
      ? `Jesteś ${Math.abs(paceDelta)} pp. za upływem czasu.`
      : paceDelta >= 10
        ? `Masz ${paceDelta} pp. zapasu względem czasu.`
        : "Postęp punktów jest blisko upływu okresu.";

  const limitsUsage = useMemo(() => {
    const limits = RULES_BY_PROFESSION[profession]?.limits ?? [];
    const usage = new Map<string, number>();
    const counts = new Map<string, number>();

    for (const a of inPeriodDone) {
      const key = mapTypeToRuleKey(a.type);
      if (!key) continue;
      usage.set(key, (usage.get(key) || 0) + (Number(a.points) || 0));
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const yearsInPeriod = Math.max(1, periodEnd - periodStart + 1);

    return limits.map((l) => {
      const used = usage.get(l.key) || 0;
      const count = counts.get(l.key) || 0;
      const cap = l.mode === "per_year" ? l.maxPoints * yearsInPeriod : l.maxPoints;
      const remaining = l.mode === "per_item" ? l.maxPoints : Math.max(0, cap - used);
      const usedPct = l.mode === "per_item" ? 0 : cap > 0 ? clamp((used / cap) * 100, 0, 100) : 0;
      const status: "available" | "warning" | "blocked" | "per_item" =
        l.mode === "per_item" ? "per_item" : remaining <= 0 ? "blocked" : usedPct >= 70 ? "warning" : "available";

      return { ...l, used, count, cap, remaining, usedPct, yearsInPeriod, status };
    });
  }, [profession, inPeriodDone, periodStart, periodEnd]);

  const limitWarning = useMemo(() => {
    const hit = limitsUsage.find((x) => x.status === "blocked");
    return hit ? `Limit "${hit.label}" jest osiągnięty.` : null;
  }, [limitsUsage]);

  const bestLimit = useMemo(() => {
    const normal = limitsUsage.filter((r) => r.status === "available" || r.status === "warning").sort((a, b) => Number(b.remaining) - Number(a.remaining));
    return normal[0] ?? limitsUsage.find((r) => r.status === "per_item") ?? null;
  }, [limitsUsage]);

  const usableLimits = useMemo(() => limitsUsage.filter((r) => r.status !== "blocked"), [limitsUsage]);
  const blockedLimits = useMemo(() => limitsUsage.filter((r) => r.status === "blocked"), [limitsUsage]);

  const nextSteps = useMemo(() => buildNextSteps(missingPoints, missingEvidenceCount, limitWarning), [missingPoints, missingEvidenceCount, limitWarning]);

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
        const y = prog === "planned" && a.planned_start_date ? Number(String(a.planned_start_date).slice(0, 4)) : a.year;
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

  const isBusy = authLoading || loading;
  const pwzIssueDate = profile?.pwz_issue_date ?? null;
  const otherRequired = isOtherProfession(profession);
  const otherValid = !otherRequired || normalizeOtherProfession(professionOther).length >= 2;
  const trybLabel = pwzIssueDate ? "Tryb okresu — zgodny z PWZ" : "Tryb okresu";
  const okresLabel = pwzIssueDate ? `Okres liczony z PWZ (${formatYMD(pwzIssueDate)})` : periodMode === "preset" ? "Okres rozliczeniowy" : "Okres indywidualny";

  async function saveProfilePatch(patch: Partial<ProfileRow> & { profession_other?: string | null }) {
    if (!user?.id) return;
    setSavingProfile(true);

    const nextProfession = (patch.profession ?? profession) as Profession;
    const rawOther = patch.profession_other !== undefined ? patch.profession_other : professionOther;
    const nextOther = isOtherProfession(nextProfession) ? normalizeOtherProfession(rawOther) || null : null;
    const ps = Number(patch.period_start !== undefined ? patch.period_start : periodStart) || 2023;
    const pe = Math.max(Number(patch.period_end !== undefined ? patch.period_end : periodEnd) || ps, ps);
    const rp = Math.max(0, Number(patch.required_points !== undefined ? patch.required_points : requiredPoints) || 0);

    const payload: ProfileUpsert = {
      user_id: user.id,
      profession: nextProfession,
      profession_other: nextOther,
      pwz_number: profile?.pwz_number ?? null,
      pwz_issue_date: profile?.pwz_issue_date ?? null,
      period_start: ps,
      period_end: pe,
      required_points: rp,
    };

    const { error } = await supabase.from("profiles").upsert(payload);
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
      profession_other: isOtherProfession(profession) ? normalizeOtherProfession(professionOther) || null : null,
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
      const pts = suggestPlannedPoints({ mode: r.mode, remaining: r.remaining });

      const { error } = await supabase.from("activities").insert({
        user_id: user.id,
        type: r.label,
        points: pts,
        year: y,
        organizer: null,
        status: "planned" as const,
        planned_start_date: null as string | null,
      });

      if (error) {
        setPlanErr(error.message);
        return;
      }

      setPlanInfo(`Dodano do planu: ${r.label} (+${pts} pkt)`);
      await reloadActivities();
    } catch (e: any) {
      setPlanErr(e?.message || "Nie udało się dodać planu.");
    } finally {
      setPlanningKey(null);
    }
  }

  const inputCls = "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 shadow-sm shadow-slate-900/5 transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/80 disabled:bg-slate-50 disabled:text-slate-400";
  const cardCls = "scroll-mt-44 relative overflow-hidden rounded-[1.35rem] border border-slate-300/80 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.075)] transition-shadow hover:shadow-[0_8px_18px_rgba(15,23,42,0.09)]";

  function scrollToSection(id: "ustawienia" | "status" | "kroki" | "limity" | "aktywnosci" | "powiadomienia") {
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
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => scrollToSection("aktywnosci")));
  }

  const navBase = "shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none";
  const navActive = "shrink-0 border-b-2 border-blue-600 px-3 py-2.5 text-sm font-semibold text-blue-700 focus:outline-none";

  const emptyStateHref = activityFilter === "planned" ? "/aktywnosci?new=1" : activityFilter === "missing" ? "/aktywnosci" : "/aktywnosci?new=1";
  const emptyStateMsg =
    activityFilter === "planned"
      ? "Nie masz zaplanowanych aktywności."
      : activityFilter === "missing"
        ? "Brak wpisów z brakującą dokumentacją."
        : activityFilter === "complete"
          ? "Brak kompletnych wpisów w tym okresie."
          : "Nie masz jeszcze żadnych aktywności w tym okresie.";
  const emptyStateCta = activityFilter === "missing" ? "Uzupełnij dokumenty" : "Dodaj pierwszą aktywność";

  const mainAction =
    missingEvidenceCount > 0
      ? { label: "Uzupełnij dokumenty", href: "/aktywnosci", tone: "amber" as const, description: "Najpierw domknij braki w certyfikatach i organizatorach." }
      : missingPoints > 0
        ? { label: "Zaplanuj szkolenie", href: "/baza-szkolen", tone: "blue" as const, description: "Następny krok to dobranie aktywności za brakujące punkty." }
        : { label: "Sprawdź raport", href: "/portfolio", tone: "green" as const, description: "Punkty są domknięte. Sprawdź kompletność raportu." };

  return (
    <div className="space-y-5">
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

      <div className="relative overflow-hidden rounded-[1.35rem] border border-slate-300/80 bg-white px-5 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)] sm:px-6">
        <div className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-blue-500" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <IconBubble tone="blue"><MiniIcon name="chart" /></IconBubble>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">Panel CPD</h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                Podgląd postępu w okresie rozliczeniowym. Dodawanie, edycja i certyfikaty są w <span className="font-semibold text-slate-800">Aktywnościach</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/aktywnosci" className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">Aktywności</Link>
            <Link href="/baza-szkolen" className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">Baza szkoleń</Link>
          </div>
        </div>
      </div>

      <nav className="sticky top-[76px] z-30 overflow-x-auto rounded-[1.1rem] border border-slate-300/80 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
        <div className="flex min-w-max">
          {(["ustawienia", "status", "kroki", "limity", "aktywnosci", "powiadomienia"] as const).map((id) => {
            const labels: Record<string, string> = {
              ustawienia: "Ustawienia",
              status: "Realizacja celu",
              kroki: "Co dalej?",
              limity: "Limity",
              aktywnosci: "Aktywności",
              powiadomienia: "Powiadomienia",
            };

            return (
              <button key={id} type="button" onClick={() => scrollToSection(id)} className={activeNav === id ? navActive : navBase}>
                {labels[id]}
              </button>
            );
          })}
        </div>
      </nav>

      <section id="ustawienia" className={cardCls}>
        <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />

        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconBubble tone="blue"><MiniIcon name="calendar" /></IconBubble>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Ustawienia okresu i zawodu</h2>
              <p className="text-xs text-slate-500">
                Zmień preferencje w dowolnym momencie.
                {savedAt && !dirty && !savingProfile ? <span className="ml-1 font-medium text-blue-600">Zapisano</span> : null}
                {!otherValid ? <span className="ml-1 font-medium text-red-500">Uzupełnij zawód</span> : null}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const prof: Profession = "Lekarz";
                const derived = getPeriodFromPwzIssueDate(prof, pwzIssueDate);
                setProfession(prof);
                setProfessionOther("");
                setPeriodStart(derived?.start ?? 2023);
                setPeriodEnd(derived?.end ?? 2026);
                setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200);
                setPeriodMode(derived ? "custom" : "preset");
                setDirty(true);
              }}
              className="inline-flex h-9 w-28 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              Domyślne
            </button>

            <button type="button" onClick={saveAllSettings} disabled={isBusy || savingProfile || !dirty || !otherValid} className="inline-flex h-9 w-28 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-[0_5px_12px_rgba(37,99,235,0.20)] transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
              {savingProfile ? "Zapisuję..." : "Zapisz"}
            </button>

            <Link href="/profil" className="inline-flex h-9 w-28 items-center justify-center rounded-xl border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-95">Profil →</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Zawód</label>
            <select
              value={profession}
              onChange={(e) => {
                const v = e.target.value as Profession;
                setProfession(v);
                if (!isOtherProfession(v)) setProfessionOther("");
                setRequiredPoints(RULES_BY_PROFESSION[v]?.requiredPoints ?? DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[v] ?? 200);

                if (pwzIssueDate) {
                  const d = getPeriodFromPwzIssueDate(v, pwzIssueDate);
                  if (d) {
                    setPeriodMode("custom");
                    setPeriodStart(d.start);
                    setPeriodEnd(d.end);
                  }
                }

                setDirty(true);
              }}
              className={`mt-1.5 ${inputCls}`}
            >
              {PROFESSION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{trybLabel}</label>
            <select
              value={periodMode}
              onChange={(e) => {
                const v = e.target.value as "preset" | "custom";
                setPeriodMode(v);

                if (v === "custom" && pwzIssueDate) {
                  const d = getPeriodFromPwzIssueDate(profession, pwzIssueDate);
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
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{okresLabel}</label>
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
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{okresLabel}</label>
              <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input value={periodStart} onChange={(e) => { setPeriodStart(Number(e.target.value || 0)); setDirty(true); }} type="number" disabled={Boolean(pwzIssueDate)} className={inputCls} />
                <span className="text-slate-400">–</span>
                <input value={periodEnd} onChange={(e) => { setPeriodEnd(Number(e.target.value || 0)); setDirty(true); }} type="number" disabled={Boolean(pwzIssueDate)} className={inputCls} />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Wymagane punkty</label>
            <input value={requiredPoints} onChange={(e) => { setRequiredPoints(Number(e.target.value || 0)); setDirty(true); }} type="number" min={0} className={`mt-1.5 ${inputCls}`} />
          </div>

          {otherRequired ? (
            <div className="md:col-span-2 xl:col-span-4">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Jaki zawód?</label>
              <input value={professionOther} onChange={(e) => { setProfessionOther(e.target.value); setDirty(true); }} placeholder="np. Psycholog, Logopeda..." className={`mt-1.5 ${inputCls} ${!otherValid ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`} />
            </div>
          ) : null}
        </div>
      </section>

      {isBusy ? (
        <div className={`${cardCls} p-8 text-center text-sm font-medium text-slate-500`}>Wczytuję dane...</div>
      ) : (
        <>
          <section id="status" className={cardCls}>
            <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />

            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <IconBubble tone="blue"><MiniIcon name="chart" /></IconBubble>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Realizacja celu</h2>
                  <p className="text-xs text-slate-500">Najpierw braki, potem tempo i szczegóły.</p>
                </div>
              </div>

              <Link href={mainAction.href} className={`inline-flex h-10 shrink-0 items-center justify-center rounded-xl border px-4 text-sm font-semibold shadow-sm transition active:scale-95 ${mainAction.tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100" : mainAction.tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                {mainAction.label} →
              </Link>
            </div>

            <div className="grid gap-4 p-4 xl:grid-cols-[310px_1fr]">
              <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600"><span className="h-2 w-2 rounded-full bg-blue-500" />Aktualny wynik</div>
                <div className="mt-3 flex items-center gap-3">
                  <CircularProgress value={progress} label="pkt" />
                  <div className="min-w-0">
                    <div className="text-2xl font-extrabold leading-none tracking-[-0.05em] text-slate-950">{donePoints}<span className="text-sm font-semibold text-slate-400"> / {requiredPoints}</span></div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-600">punktów w okresie {periodStart}–{periodEnd}</div>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold text-slate-900">Najbliższy krok</div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-600">{mainAction.description}</div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-3 lg:grid-cols-4">
                  <div className="lg:col-span-2"><StatMiniCard label="Brakuje punktów" value={missingPoints} suffix="pkt" subtitle={missingPoints > 0 ? `Do celu zostało ${missingPoints} pkt.` : "Cel punktowy jest osiągnięty."} tone={missingPoints > 0 ? "blue" : "green"} icon={<MiniIcon name="chart" className="h-7 w-7" />} emphasis /></div>
                  <div className="lg:col-span-2"><StatMiniCard label="Brakujące dokumenty" value={missingEvidenceCount} suffix={missingEvidenceCount === 1 ? "brak" : "braki"} subtitle={missingEvidenceCount > 0 ? "To najważniejsza blokada raportu." : "Dokumentacja wygląda dobrze."} tone={missingEvidenceCount > 0 ? "amber" : "green"} icon={<MiniIcon name="doc" className="h-7 w-7" />} emphasis /></div>
                  <StatMiniCard label="Tempo" value={paceLabel} subtitle={paceDescription} tone="slate" icon={<MiniIcon name="hourglass" className="h-6 w-6" />} compact />
                  <StatMiniCard label="Zasady" value={displayProfession(profession, professionOther)} subtitle={`${requiredPoints} pkt · ${periodStart}–${periodEnd}`} tone="slate" compact />
                </div>

                <div className="rounded-[1.15rem] border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-slate-700">Postęp punktów</div>
                    <div className="text-xs font-medium text-slate-500">{donePoints} / {requiredPoints} pkt</div>
                  </div>

                  <div className="relative h-12">
                    <div className="absolute left-0 right-0 top-5 h-2.5 rounded-full bg-slate-100" />
                    <div className="absolute left-0 top-5 h-2.5 rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${Math.max(progress, 2)}%` }} />
                    <PulsingTargetMarker progress={progress} />
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr]">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500"><span>Upływ okresu</span><span>{Math.round(periodTimeProgress)}%</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-500 transition-all duration-700" style={{ width: `${periodTimeProgress}%` }} /></div>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">{paceDescription}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="kroki" className={cardCls}>
            <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <IconBubble tone="blue"><MiniIcon name="chart" /></IconBubble>
              <div><h2 className="text-sm font-semibold text-slate-900">Co dalej?</h2><p className="text-xs text-slate-500">Krótka lista kolejnych działań — bez zgadywania</p></div>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-3">
              {nextSteps.map((step, index) => {
                const tone =
                  step.tone === "amber"
                    ? { card: "border-amber-200 bg-amber-50/70 hover:bg-amber-50", icon: "bg-white text-amber-700 ring-amber-200", badge: "bg-amber-100 text-amber-800", arrow: "border-amber-200 text-amber-700" }
                    : step.tone === "green"
                      ? { card: "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50", icon: "bg-white text-emerald-700 ring-emerald-200", badge: "bg-emerald-100 text-emerald-800", arrow: "border-emerald-200 text-emerald-700" }
                      : { card: "border-blue-200 bg-blue-50/60 hover:bg-blue-50", icon: "bg-white text-blue-700 ring-blue-200", badge: "bg-blue-100 text-blue-800", arrow: "border-blue-200 text-blue-700" };

                return (
                  <Link key={step.title} href={step.ctaHref} className={`group flex min-h-[104px] items-start gap-3 rounded-2xl border p-4 transition active:scale-[0.99] ${tone.card}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1 ${tone.icon}`}>{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><div className="text-sm font-bold text-slate-950">{step.title}</div>{step.priority === "high" ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.badge}`}>najpierw</span> : null}</div>
                      <div className="mt-1 text-xs leading-relaxed text-slate-600">{step.description}</div>
                    </div>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border bg-white text-sm font-bold transition group-hover:translate-x-0.5 ${tone.arrow}`}>→</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      <section id="limity" className={`${cardCls} scroll-mt-44`}>
        <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />

        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconBubble tone="blue"><MiniIcon name="shield" /></IconBubble>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Twoje limity</h2>
              <p className="text-xs text-slate-500">Najpierw widzisz decyzję, potem szczegóły kategorii.</p>
            </div>
          </div>

          <div className="pl-12 text-xs text-slate-500 sm:pl-0">
            Zaliczone: <strong className="text-slate-900">{donePoints} pkt</strong><span className="mx-2 text-slate-300">|</span>Brakuje: <strong className="text-slate-900">{missingPoints} pkt</strong>
          </div>
        </div>

        <div className="p-4">
          {planInfo || planErr ? (
            <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
              {planInfo ? <p className="font-semibold text-blue-700">{planInfo}</p> : null}
              {planErr ? <p className="font-semibold text-red-600">{planErr}</p> : null}
            </div>
          ) : null}

          {limitsUsage.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">Brak zdefiniowanych limitów dla tego zawodu.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[1.35fr_0.75fr_0.75fr]">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700">Najlepszy następny ruch</div>
                  <div className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">{bestLimit ? bestLimit.label : "Sprawdź aktywności"}</div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-600">
                    {bestLimit
                      ? bestLimit.mode === "per_item"
                        ? `Możesz dodać kolejny wpis. Maksymalnie ${bestLimit.cap} pkt za jeden wpis.`
                        : `W tej kategorii możesz jeszcze doliczyć ${Math.round(bestLimit.remaining)} pkt.`
                      : "Brak oczywistej kategorii z dostępnym limitem."}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Możesz użyć</div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-950">{usableLimits.length}</div>
                  <div className="mt-1 text-xs text-slate-600">kategorii bez blokady</div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">Zablokowane</div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-950">{blockedLimits.length}</div>
                  <div className="mt-1 text-xs text-slate-600">kategorii po limicie</div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="grid grid-cols-[1.4fr_0.9fr_0.75fr_0.75fr_0.9fr_auto] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 max-lg:hidden">
                  <div>Kategoria</div>
                  <div>Zasada</div>
                  <div className="text-right">Masz</div>
                  <div className="text-right">Doliczysz</div>
                  <div>Status</div>
                  <div />
                </div>

                <div className="divide-y divide-slate-100">
                  {limitsUsage.map((r) => {
                    const blocked = r.status === "blocked";
                    const warning = r.status === "warning";
                    const accent = blocked ? "bg-slate-400" : warning ? "bg-amber-400" : "bg-blue-500";
                    const ruleLabel = r.mode === "per_item" ? `${r.cap} pkt / wpis` : r.mode === "per_year" ? `${r.maxPoints} pkt / rok` : `${r.cap} pkt / okres`;
                    const canAddLabel = r.mode === "per_item" ? `${r.cap} pkt / wpis` : blocked ? "0 pkt" : `${Math.round(r.remaining)} pkt`;
                    const advice =
                      r.mode === "per_item"
                        ? "Limit dotyczy pojedynczego wpisu. Możesz dodawać kolejne, każdy licz osobno."
                        : blocked
                          ? "Ta kategoria jest już po limicie. Wybierz inną aktywność."
                          : warning
                            ? "Zostało niewiele miejsca w limicie — planuj ostrożnie."
                            : "Ta kategoria nadal może pomóc domknąć brakujące punkty.";

                    return (
                      <article key={r.key} className="relative grid gap-3 px-4 py-4 lg:grid-cols-[1.4fr_0.9fr_0.75fr_0.75fr_0.9fr_auto] lg:items-center">
                        <div className={`absolute bottom-3 left-0 top-3 w-1 rounded-r-full ${accent}`} />

                        <div className="pl-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-950">{r.label}</h3>
                            <LimitStatusPill status={r.status} />
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500 lg:hidden">{advice}</p>
                          {r.note ? <p className="mt-1 hidden text-[11px] leading-relaxed text-slate-500 lg:block">{r.note}</p> : null}
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 lg:bg-white">
                          {ruleLabel}
                        </div>

                        <div className="flex items-center justify-between gap-3 lg:block lg:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 lg:hidden">Masz</span>
                          <span className="text-sm font-extrabold text-slate-950">{r.used} pkt</span>
                        </div>

                        <div className="flex items-center justify-between gap-3 lg:block lg:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 lg:hidden">Doliczysz</span>
                          <span className={`text-sm font-extrabold ${blocked ? "text-slate-500" : warning ? "text-amber-600" : "text-blue-700"}`}>{canAddLabel}</span>
                        </div>

                        <div>
                          {r.mode === "per_item" ? (
                            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">Nie sumuje się w okresie.</div>
                          ) : (
                            <div>
                              <div className="mb-1 flex justify-between text-[10px] font-semibold text-slate-500"><span>Limit</span><span>{Math.round(r.usedPct)}%</span></div>
                              <div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${accent}`} style={{ width: `${Math.max(r.usedPct, r.used > 0 ? 5 : 0)}%` }} /></div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end">
                          {blocked ? (
                            <Link href="/aktywnosci" className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">Zobacz</Link>
                          ) : (
                            <button type="button" disabled={isBusy || planningKey === r.key} onClick={() => planForRule(r)} className="inline-flex h-8 items-center justify-center rounded-xl border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-95 disabled:opacity-40">
                              {planningKey === r.key ? "Dodaję..." : "Zaplanuj"}
                            </button>
                          )}
                        </div>

                        <div className="pl-2 text-xs leading-relaxed text-slate-500 lg:col-span-6 lg:hidden">{advice}</div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-900">Jak to czytać?</span> „Doliczysz” pokazuje bezpieczne miejsce w limicie. Przy limicie „na wpis” liczysz każdy wpis osobno, dlatego nie pokazujemy procentowego wykorzystania okresu.
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <Link href="/aktywnosci" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Aktywności →</Link>
            <Link href="/aktywnosci?new=1" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">+ Dodaj aktywność</Link>
            <Link href="/portfolio" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Raport / PDF →</Link>
          </div>
        </div>
      </section>

      <section id="aktywnosci" className={`${cardCls} scroll-mt-44`}>
        <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />

        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconBubble tone="blue"><MiniIcon name="calendar" /></IconBubble>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">Ostatnie aktywności</h2>
                {recentRows.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{recentRows.length}</span>}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                {(["all", "missing", "planned", "complete"] as const).map((f) => {
                  const labels = { all: "wszystkie", missing: "brakująca dokumentacja", planned: "zaplanowane", complete: "kompletne" };
                  const dots = { all: "", missing: "bg-amber-400", planned: "bg-slate-400", complete: "bg-emerald-400" };
                  const active = { all: "bg-slate-100 text-slate-800", missing: "bg-amber-50 text-amber-700", planned: "bg-slate-100 text-slate-800", complete: "bg-emerald-50 text-emerald-700" };

                  return (
                    <button key={f} type="button" onClick={() => filterActivities(f)} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ${activityFilter === f ? active[f] : "text-slate-500 hover:bg-slate-50"}`}>
                      {dots[f] ? <span className={`h-2 w-2 rounded-full ${dots[f]}`} /> : null}
                      {labels[f]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Link href="/aktywnosci" className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700">Przejdź do aktywności</Link>
        </div>

        <div className="p-5">
          <div className="space-y-3">
            {recentRows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                <div className="text-sm font-medium text-slate-700">{emptyStateMsg}</div>
                <Link href={emptyStateHref} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95">{emptyStateCta}</Link>
              </div>
            ) : (
              recentRows.slice(0, 8).map((a) => {
                const prog = normalizeStatus(a.status);
                const missing = getRowMissing(a);
                const hasMissing = prog !== "planned" && missing.length > 0;
                const stripe = prog === "planned" ? "bg-slate-400" : hasMissing ? "bg-amber-500" : "bg-emerald-500";

                return (
                  <div key={a.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pl-6 transition hover:border-blue-200 hover:shadow-sm active:scale-[0.99]">
                    <div className={`absolute inset-y-3 left-0 w-1.5 rounded-r-full ${stripe}`} />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-slate-900">{a.type}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${prog === "planned" ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-slate-50 text-slate-500 ring-slate-100"}`}>{prog === "planned" ? "Zaplanowane" : "Ukończone"}</span>
                          {prog !== "planned" ? <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${hasMissing ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"}`}>{hasMissing ? "Brakująca dokumentacja" : "Kompletne"}</span> : null}
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {a.organizer ? `${a.organizer} · ` : ""}Rok: <span className="font-medium text-slate-700">{a.year}</span>
                          {prog === "planned" && a.planned_start_date ? <> · Termin: <span className="font-medium text-slate-700">{formatYMD(a.planned_start_date)}</span></> : null}
                        </p>

                        {hasMissing ? <div className="mt-1.5 flex flex-wrap gap-1">{missing.map((m) => <span key={m} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">{m}</span>)}</div> : null}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-sm font-semibold text-slate-900">+{a.points} pkt</span>
                        <Link href="/aktywnosci" className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Otwórz →</Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {recentRows.length > 8 && (
            <div className="mt-3 border-t border-slate-100 pt-3 text-center">
              <Link href="/aktywnosci" className="text-sm font-medium text-blue-600 hover:text-blue-700">Zobacz wszystkie {recentRows.length} aktywności →</Link>
            </div>
          )}
        </div>
      </section>

      <section id="powiadomienia" className={`${cardCls} scroll-mt-44`}>
        <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />
        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconBubble tone="blue"><MiniIcon name="bell" /></IconBubble>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Bądź na bieżąco i nie przegap ważnych terminów</h2>
              <p className="mt-0.5 text-xs text-slate-500">Włącz powiadomienia, aby otrzymywać przypomnienia o szkoleniach i terminach.</p>
            </div>
          </div>

          <Link href="/profil" className="shrink-0 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-95">Ustawienia powiadomień →</Link>
        </div>
      </section>
    </div>
  );
}
