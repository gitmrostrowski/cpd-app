// app/kalkulator/CalculatorClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

import CpdStatusPanel, { type TopLimitItem } from "@/components/dashboard/CpdStatusPanel";

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

type ProfileUpsert = {
  user_id: string;
  profession: Profession;
  profession_other?: string | null;
  pwz_number?: string | null;
  pwz_issue_date?: string | null;
  period_start: number;
  period_end: number;
  required_points: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

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
        note: "1 pkt/h, maks. 6 pkt za jedno szkolenie",
      },
      {
        key: "JOURNAL_SUBSCRIPTION",
        label: "Prenumerata czasopisma",
        mode: "per_period",
        maxPoints: 10,
        note: "5 pkt/tytuł, maks. 10 pkt w okresie",
      },
      {
        key: "SCIENTIFIC_SOCIETY",
        label: "Towarzystwo/Kolegium",
        mode: "per_period",
        maxPoints: 20,
        note: "5 pkt, maks. 20 pkt w okresie",
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
        note: "1 pkt/h, maks. 6 pkt za jedno szkolenie",
      },
      {
        key: "JOURNAL_SUBSCRIPTION",
        label: "Prenumerata czasopisma",
        mode: "per_period",
        maxPoints: 10,
        note: "5 pkt/tytuł, maks. 10 pkt w okresie",
      },
      {
        key: "SCIENTIFIC_SOCIETY",
        label: "Towarzystwo/Kolegium",
        mode: "per_period",
        maxPoints: 20,
        note: "5 pkt, maks. 20 pkt w okresie",
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
        note: "5 pkt/wydarzenie, maks. 50 pkt",
      },
      {
        key: "INTERNAL_TRAINING",
        label: "Szkolenie wewnętrzne",
        mode: "per_period",
        maxPoints: 50,
        note: "2/5 pkt, maks. 50 pkt",
      },
      {
        key: "COMMITTEES",
        label: "Komisje/Zespoły",
        mode: "per_period",
        maxPoints: 30,
        note: "3 pkt/posiedzenie, maks. 30 pkt",
      },
      {
        key: "JOURNAL_SUBSCRIPTION",
        label: "Prenumerata czasopisma",
        mode: "per_year",
        maxPoints: 10,
        note: "5 pkt/tytuł, maks. 10 pkt/rok",
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
        note: "5 pkt/wydarzenie, maks. 50 pkt",
      },
      {
        key: "INTERNAL_TRAINING",
        label: "Szkolenie wewnętrzne",
        mode: "per_period",
        maxPoints: 50,
        note: "2/5 pkt, maks. 50 pkt",
      },
      {
        key: "COMMITTEES",
        label: "Komisje/Zespoły",
        mode: "per_period",
        maxPoints: 30,
        note: "3 pkt/posiedzenie, maks. 30 pkt",
      },
      {
        key: "JOURNAL_SUBSCRIPTION",
        label: "Prenumerata czasopisma",
        mode: "per_year",
        maxPoints: 10,
        note: "5 pkt/tytuł, maks. 10 pkt/rok",
      },
    ],
  },
};

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

function buildNextStep(missingPoints: number, missingEvidenceCount: number, limitWarning: string | null) {
  if (missingEvidenceCount > 0) {
    return {
      title: "Uzupełnij dokumenty",
      description: `Masz ${missingEvidenceCount} wpisów bez certyfikatu. Dodaj zdjęcia/PDF-y, aby zestawienie było gotowe w każdej chwili.`,
      ctaLabel: "Uzupełnij dokumenty",
      ctaHref: "/aktywnosci",
    };
  }

  if (missingPoints <= 0) {
    return {
      title: "Wygeneruj zestawienie",
      description: "Masz komplet punktów. Wygeneruj uporządkowane zestawienie PDF.",
      ctaLabel: "Zestawienie PDF",
      ctaHref: "/portfolio",
    };
  }

  if (limitWarning) {
    return {
      title: "Dobierz inną formę aktywności",
      description: `${limitWarning} Wybierz inną kategorię, żeby punkty na pewno się zaliczyły.`,
      ctaLabel: "+ Dodaj aktywność",
      ctaHref: "/aktywnosci?new=1",
    };
  }

  return {
    title: "Ustal krótki plan",
    description: `Dodaj wpisy jako "plan", a potem uzupełniaj certyfikaty.`,
    ctaLabel: "+ Dodaj aktywność",
    ctaHref: "/aktywnosci?new=1",
  };
}

function daysUntilEndOfYear(yearEnd: number) {
  const end = new Date(yearEnd, 11, 31, 23, 59, 59);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
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

function getPeriodFromPwzIssueDate(prof: Profession, pwzIssueDate: string | null | undefined) {
  if (!pwzIssueDate) return null;
  const y = Number(String(pwzIssueDate).slice(0, 4));
  if (!y || Number.isNaN(y)) return null;

  const months = RULES_BY_PROFESSION[prof]?.periodMonths ?? 48;
  const years = Math.max(1, Math.round(months / 12));
  const start = y;
  const end = y + (years - 1);
  return { start, end };
}

function getRowMissing(a: ActivityRow) {
  const missing: string[] = [];
  const orgOk = Boolean(a.organizer && String(a.organizer).trim());

  if (!orgOk) missing.push("Brak organizatora");

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

  const step = rule.mode === "per_item" ? 2 : rule.mode === "per_year" ? 5 : 5;
  return Math.max(1, Math.min(rem, step));
}

// ─── Design system atoms ───────────────────────────────────────────────────

// ─── Design tokens ────────────────────────────────────────────────────────
// Palette inspired by Renata Magda's pool painting:
//   Deep teal water  →  section accent (settings header bg)
//   Sandy warm white →  card backgrounds
//   Swimmer orange   →  single CTA colour
//   Clean slate      →  text
// ──────────────────────────────────────────────────────────────────────────

/** Icon badge — muted warm white, barely visible */
function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/60 text-slate-500">
      {children}
    </span>
  );
}

function FieldLabel({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/70">
      {icon}
      {title}
    </div>
  );
}

/** ONE primary CTA colour — swimmer's warm orange. Used sparingly. */
function BtnPrimary({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

/** Ghost — plain white border, no colour noise */
function BtnGhost({
  children,
  onClick,
  href,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95 ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/** Ghost on dark — for buttons sitting on teal header */
function BtnGhostOnDark({
  children,
  onClick,
  href,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 active:scale-95 ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/** Standard white card — clean, no colour borders */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/** Coloured section header strip inside a card */
function SectionHeader({
  title,
  subtitle,
  color = "slate",
}: {
  title: string;
  subtitle?: string;
  color?: "teal" | "sand" | "slate";
}) {
  const bg =
    color === "teal"
      ? "bg-[#2a6b6b]"          // deep pool teal
      : color === "sand"
      ? "bg-[#f5f0e8]"          // warm sand — light section
      : "bg-slate-50";

  const headingColor =
    color === "teal" ? "text-white" : "text-slate-900";
  const subColor =
    color === "teal" ? "text-white/70" : "text-slate-500";

  return (
    <div className={`${bg} rounded-t-2xl px-6 py-4`}>
      <h2 className={`text-sm font-bold uppercase tracking-wide ${headingColor}`}>{title}</h2>
      {subtitle && <p className={`mt-0.5 text-xs ${subColor}`}>{subtitle}</p>}
    </div>
  );
}

/** Plain header for cards without coloured strip */
function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────

export default function CalculatorClient() {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [professionOther, setProfessionOther] = useState<string>("");

  const [periodStart, setPeriodStart] = useState<number>(2023);
  const [periodEnd, setPeriodEnd] = useState<number>(2026);
  const [requiredPoints, setRequiredPoints] = useState<number>(
    DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.Lekarz ?? 200
  );

  const [periodMode, setPeriodMode] = useState<"preset" | "custom">("preset");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [planInfo, setPlanInfo] = useState<string | null>(null);
  const [planErr, setPlanErr] = useState<string | null>(null);
  const [planningKey, setPlanningKey] = useState<string | null>(null);

  const [dirty, setDirty] = useState(false);

  const supabase = useMemo(() => supabaseClient(), []);

  async function reloadActivities() {
    if (!user?.id) return;

    const { data: a, error: aErr } = await supabase
      .from("activities")
      .select(
        "id, user_id, type, points, year, organizer, created_at, status, planned_start_date, training_id, certificate_path, certificate_name, certificate_mime, certificate_size, certificate_uploaded_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!aErr && a) setActivities(a as ActivityRow[]);
    else setActivities([]);
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
        .select(
          "user_id, profession, profession_other, pwz_number, pwz_issue_date, period_start, period_end, required_points"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (!pErr && p) {
          const prof = ((p as any).profession ?? "Lekarz") as Profession;
          setProfession(prof);

          const po = normalizeOtherProfession((p as any).profession_other);
          setProfessionOther(po);

          const pwzIssue = (p as any).pwz_issue_date as string | null;
          const derived = getPeriodFromPwzIssueDate(prof, pwzIssue);

          const psDb = (p as any).period_start as number | null | undefined;
          const peDb = (p as any).period_end as number | null | undefined;

          const start = derived?.start ?? (psDb ?? 2023);
          const end = derived?.end ?? (peDb ?? 2026);

          setPeriodStart(start);
          setPeriodEnd(end);

          if (derived) {
            setPeriodMode("custom");
          } else {
            const presetLabel = `${start}-${end}`;
            const isPreset =
              presetLabel === "2019-2022" ||
              presetLabel === "2023-2026" ||
              presetLabel === "2027-2030";
            setPeriodMode(isPreset ? "preset" : "custom");
          }

          const rpDb = (p as any).required_points as number | null | undefined;
          const rp =
            (rpDb ?? undefined) ??
            DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ??
            RULES_BY_PROFESSION[prof]?.requiredPoints ??
            200;

          setRequiredPoints(rp);

          setProfile({
            user_id: user.id,
            profession: prof,
            profession_other: isOtherProfession(prof) ? po || null : null,
            pwz_number: (p as any).pwz_number ?? null,
            pwz_issue_date: (p as any).pwz_issue_date ?? null,
            period_start: start,
            period_end: end,
            required_points: rp,
          });

          setDirty(false);
        } else {
          const prof: Profession = "Lekarz";
          setProfession(prof);
          setProfessionOther("");
          setPeriodStart(2023);
          setPeriodEnd(2026);
          setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200);
          setPeriodMode("preset");
          setProfile(null);
          setDirty(false);
        }
      }

      const { data: a, error: aErr } = await supabase
        .from("activities")
        .select(
          "id, user_id, type, points, year, organizer, created_at, status, planned_start_date, training_id, certificate_path, certificate_name, certificate_mime, certificate_size, certificate_uploaded_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (!aErr && a) setActivities(a as ActivityRow[]);
        else setActivities([]);
        setLoading(false);
      }
    }

    run();

    return () => { cancelled = true; };
  }, [user?.id, supabase]);

  const periodLabel = `${periodStart}-${periodEnd}`;

  const inPeriodDone = useMemo(() => {
    return activities.filter((x) => {
      const st = (x.status ?? "done") as ActivityStatus;
      return st === "done" && x.year >= periodStart && x.year <= periodEnd;
    });
  }, [activities, periodStart, periodEnd]);

  const inPeriodPlanned = useMemo(() => {
    return activities.filter((x) => {
      const st = x.status ?? null;
      const isPlanned = st === "planned" || (!!x.planned_start_date && st !== "done");
      const y = x.planned_start_date ? Number(String(x.planned_start_date).slice(0, 4)) : x.year;
      return isPlanned && y >= periodStart && y <= periodEnd;
    });
  }, [activities, periodStart, periodEnd]);

  const donePoints = useMemo(() => {
    return inPeriodDone.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
  }, [inPeriodDone]);

  const missingPoints = useMemo(() => {
    return Math.max(0, (Number(requiredPoints) || 0) - donePoints);
  }, [requiredPoints, donePoints]);

  const progress = useMemo(() => {
    const req = Number(requiredPoints) || 0;
    if (req <= 0) return 0;
    return clamp((donePoints / req) * 100, 0, 100);
  }, [requiredPoints, donePoints]);

  const missingEvidenceCount = useMemo(() => {
    return inPeriodDone.filter((a) => !a.certificate_path).length;
  }, [inPeriodDone]);

  const evidencePct = useMemo(() => {
    const total = inPeriodDone.length;
    if (total <= 0) return 0;
    const withProof = total - missingEvidenceCount;
    return clamp((withProof / total) * 100, 0, 100);
  }, [inPeriodDone.length, missingEvidenceCount]);

  const daysLeft = useMemo(() => daysUntilEndOfYear(periodEnd), [periodEnd]);

  const limitsUsage = useMemo(() => {
    const rules = RULES_BY_PROFESSION[profession];
    const limits = rules?.limits ?? [];
    const usage = new Map<string, number>();

    for (const a of inPeriodDone) {
      const key = mapTypeToRuleKey(a.type);
      if (!key) continue;
      usage.set(key, (usage.get(key) || 0) + (Number(a.points) || 0));
    }

    const yearsInPeriod = Math.max(1, periodEnd - periodStart + 1);

    return limits.map((l) => {
      const used = usage.get(l.key) || 0;
      const cap = l.mode === "per_year" ? l.maxPoints * yearsInPeriod : l.maxPoints;
      const remaining = Math.max(0, cap - used);
      const usedPct = cap > 0 ? clamp((used / cap) * 100, 0, 100) : 0;

      return { ...l, used, cap, remaining, usedPct, yearsInPeriod };
    });
  }, [profession, inPeriodDone, periodStart, periodEnd]);

  const topLimits = useMemo<TopLimitItem[]>(() => {
    return [...limitsUsage]
      .sort((a, b) => (b.usedPct ?? 0) - (a.usedPct ?? 0))
      .slice(0, 3)
      .map((x) => ({
        key: x.key,
        label: x.label,
        used: x.used,
        cap: x.cap,
        remaining: x.remaining,
        usedPct: x.usedPct,
        note: x.note,
        mode: x.mode,
      }));
  }, [limitsUsage]);

  const limitWarning = useMemo(() => {
    const hit = limitsUsage.find((x) => (x.usedPct ?? 0) >= 100);
    if (!hit) return null;
    return `Limit "${hit.label}" jest osiagniety - kolejne podobne aktywnosci moga nie zwiekszac punktow w tym okresie.`;
  }, [limitsUsage]);

  const nextStep = useMemo(() => {
    return buildNextStep(missingPoints, missingEvidenceCount, limitWarning);
  }, [missingPoints, missingEvidenceCount, limitWarning]);

  const isBusy = authLoading || loading;

  const otherRequired = isOtherProfession(profession);
  const otherValid = !otherRequired || normalizeOtherProfession(professionOther).length >= 2;
  const pwzIssueDate = (profile as any)?.pwz_issue_date ?? null;

  async function saveProfilePatch(patch: Partial<ProfileRow> & { profession_other?: string | null }) {
    if (!user?.id) return;

    setSavingProfile(true);

    const nextProfession = (patch.profession ?? profession) as Profession;
    const nextPeriodStart = patch.period_start !== undefined ? patch.period_start : periodStart;
    const nextPeriodEnd = patch.period_end !== undefined ? patch.period_end : periodEnd;
    const nextRequiredPoints = patch.required_points !== undefined ? patch.required_points : requiredPoints;

    const otherReq = isOtherProfession(nextProfession);
    const rawOther = patch.profession_other !== undefined ? patch.profession_other : professionOther;
    const nextOther = otherReq ? normalizeOtherProfession(rawOther) || null : null;

    const ps = Number(nextPeriodStart) || 2023;
    const pe = Math.max(Number(nextPeriodEnd) || ps, ps);
    const rp = Math.max(0, Number(nextRequiredPoints) || 0);

    const payload: ProfileUpsert = {
      user_id: user.id,
      profession: nextProfession,
      profession_other: nextOther,
      pwz_number: (profile as any)?.pwz_number ?? null,
      pwz_issue_date: (profile as any)?.pwz_issue_date ?? null,
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
    if (!user?.id) return;
    if (!otherValid) return;

    const other = isOtherProfession(profession)
      ? normalizeOtherProfession(professionOther) || null
      : null;

    const ps = Number(periodStart) || 0;
    const pe = Math.max(Number(periodEnd) || 0, ps);

    setPeriodEnd(pe);

    await saveProfilePatch({
      profession,
      profession_other: other,
      period_start: ps,
      period_end: pe,
      required_points: requiredPoints,
    });
  }

  async function planForRule(r: (typeof limitsUsage)[number]) {
    if (!user?.id) return;

    setPlanInfo(null);
    setPlanErr(null);

    if ((Number(r.remaining) || 0) <= 0) return;

    const nowY = new Date().getFullYear();
    const y = clamp(nowY, periodStart, periodEnd);

    const pts = suggestPlannedPoints({ mode: r.mode, remaining: r.remaining });
    if (pts <= 0) return;

    setPlanningKey(r.key);

    try {
      const payload = {
        user_id: user.id,
        type: r.label,
        points: pts,
        year: y,
        organizer: null,
        status: "planned" as const,
        planned_start_date: null as string | null,
      };

      const { error } = await supabase.from("activities").insert(payload);

      if (error) {
        setPlanErr(error.message);
        return;
      }

      setPlanInfo(`Dodano do planu: ${r.label} (+${pts} pkt) ✅`);
      await reloadActivities();
    } catch (e: any) {
      setPlanErr(e?.message || "Nie udało się dodać planu.");
    } finally {
      setPlanningKey(null);
    }
  }

  const recentRows = useMemo(() => {
    const rows = activities.filter((a) => {
      const prog = normalizeStatus(a.status);
      const y =
        prog === "planned" && a.planned_start_date
          ? Number(String(a.planned_start_date).slice(0, 4))
          : a.year;

      return y >= periodStart && y <= periodEnd;
    });

    return rows.slice(0, 10);
  }, [activities, periodStart, periodEnd]);

  const trybLabel = pwzIssueDate ? "Tryb okresu — zgodny z PWZ" : "Tryb okresu";
  const okresLabel = pwzIssueDate
    ? `Okres liczony z PWZ (${formatYMD(pwzIssueDate)})`
    : periodMode === "preset"
    ? "Okres rozliczeniowy"
    : "Okres (indywidualny)";

  // ─── shared input/select class — white bg so <option> text is readable ────
  const inputCls =
    "h-11 w-full rounded-lg border border-white/40 bg-white/95 px-3 text-sm font-medium text-slate-800 transition focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50";

  return (
    /* ── Page wrapper — no background override, no max-width constraint ── */
    <div className="space-y-5">

        {/* ── USTAWIENIA ─────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          {/* Teal header band */}
          <div className="bg-[#2a6b6b] px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                  Ustawienia okresu i zawodu
                </h2>
                <p className="mt-0.5 text-xs text-white/60">
                  Zmiany zapisujesz przyciskiem po prawej.{" "}
                  {savedAt && !dirty && !savingProfile && (
                    <span className="font-semibold text-orange-300">✓ Zapisano</span>
                  )}
                  {!otherValid && (
                    <span className="font-semibold text-red-300"> Uzupelnij zawod</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BtnGhostOnDark
                  onClick={() => {
                    const prof: Profession = "Lekarz";
                    setProfession(prof);
                    setProfessionOther("");
                    const derived = getPeriodFromPwzIssueDate(prof, pwzIssueDate);
                    const ps = derived?.start ?? 2023;
                    const pe = derived?.end ?? 2026;
                    setPeriodStart(ps);
                    setPeriodEnd(pe);
                    const rp = DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200;
                    setRequiredPoints(rp);
                    setPeriodMode(derived ? "custom" : "preset");
                    setDirty(true);
                  }}
                >
                  ↩ Domyslne
                </BtnGhostOnDark>
                <BtnPrimary
                  onClick={saveAllSettings}
                  disabled={isBusy || savingProfile || !dirty || !otherValid}
                  className="min-w-[130px]"
                >
                  {savingProfile ? "Zapisuję…" : "Zapisz zmiany"}
                </BtnPrimary>
                {/* Profil — white solid, same width as primary, equally prominent */}
                <Link
                  href="/profil"
                  className="inline-flex min-w-[130px] items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#2a6b6b] transition hover:bg-white/90 active:scale-95"
                >
                  Profil →
                </Link>
              </div>
            </div>

            {/* Fields — inside teal band */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {/* Zawód */}
              <div>
                <FieldLabel
                  icon={<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M7 4c0 5 2 6 5 8 3-2 5-3 5-8"/><path d="M9 12h6"/></svg>}
                  title="Zawod"
                />
                <select
                  value={profession}
                  onChange={(e) => {
                    const v = e.target.value as Profession;
                    setProfession(v);
                    if (!isOtherProfession(v)) setProfessionOther("");
                    const rp = RULES_BY_PROFESSION[v]?.requiredPoints ?? DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[v] ?? 200;
                    setRequiredPoints(rp);
                    if (pwzIssueDate) {
                      const derived = getPeriodFromPwzIssueDate(v, pwzIssueDate);
                      if (derived) { setPeriodMode("custom"); setPeriodStart(derived.start); setPeriodEnd(derived.end); }
                    }
                    setDirty(true);
                  }}
                  className={`mt-1.5 ${inputCls}`}
                >
                  {PROFESSION_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Tryb okresu */}
              <div>
                <FieldLabel
                  icon={<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 2"/><path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"/></svg>}
                  title={trybLabel}
                />
                <select
                  value={periodMode}
                  onChange={(e) => {
                    const v = e.target.value as "preset" | "custom";
                    setPeriodMode(v);
                    if (v === "custom" && pwzIssueDate) {
                      const derived = getPeriodFromPwzIssueDate(profession, pwzIssueDate);
                      if (derived) { setPeriodStart(derived.start); setPeriodEnd(derived.end); }
                    }
                    setDirty(true);
                  }}
                  className={`mt-1.5 ${inputCls}`}
                >
                  <option value="preset">Preset (najczestszy)</option>
                  <option value="custom">Indywidualny</option>
                </select>
              </div>

              {/* Okres */}
              {periodMode === "preset" && !pwzIssueDate ? (
                <div>
                  <FieldLabel
                    icon={<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/></svg>}
                    title={okresLabel}
                  />
                  <select
                    value={periodLabel}
                    onChange={(e) => {
                      const [a, b] = e.target.value.split("-").map((x) => Number(x));
                      setPeriodStart(a); setPeriodEnd(b); setDirty(true);
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
                  <FieldLabel
                    icon={<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/></svg>}
                    title={okresLabel}
                  />
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <input
                      value={periodStart}
                      onChange={(e) => { setPeriodStart(Number(e.target.value || 0)); setDirty(true); }}
                      type="number"
                      placeholder="Start"
                      disabled={Boolean(pwzIssueDate)}
                      className={inputCls}
                    />
                    <input
                      value={periodEnd}
                      onChange={(e) => { setPeriodEnd(Number(e.target.value || 0)); setDirty(true); }}
                      type="number"
                      placeholder="Koniec"
                      disabled={Boolean(pwzIssueDate)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* Wymagane punkty */}
              <div>
                <FieldLabel
                  icon={<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21l2-7.8L2 9h7l3-7Z"/></svg>}
                  title="Wymagane punkty"
                />
                <input
                  value={requiredPoints}
                  onChange={(e) => { setRequiredPoints(Number(e.target.value || 0)); setDirty(true); }}
                  type="number"
                  min={0}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>

              {/* Inny zawód */}
              {otherRequired && (
                <div className="sm:col-span-2 xl:col-span-4">
                  <FieldLabel
                    icon={<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>}
                    title="Jaki zawod?"
                  />
                  <input
                    value={professionOther}
                    onChange={(e) => { setProfessionOther(e.target.value); setDirty(true); }}
                    placeholder="np. Psycholog, Logopeda..."
                    className={`mt-1.5 ${inputCls} ${!otherValid ? "border-red-400" : ""}`}
                  />
                  <p className={`mt-1.5 text-xs ${otherValid ? "text-white/50" : "text-red-300"}`}>
                    {otherValid
                      ? "Doprecyzowanie pomaga dopasowac zasady i raporty."
                      : "Wpisz nazwe zawodu (min. 2 znaki)."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── PANEL STATUSU ─────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CpdStatusPanel
            isBusy={authLoading || loading}
            userEmail={user?.email ?? null}
            profileProfession={displayProfession(profession, professionOther)}
            periodLabel={`${periodStart}-${periodEnd}`}
            donePoints={donePoints}
            requiredPoints={requiredPoints}
            missingPoints={missingPoints}
            progressPct={progress}
            evidencePct={evidencePct}
            daysLeft={daysLeft}
            doneCount={inPeriodDone.length}
            plannedCount={inPeriodPlanned.length}
            missingEvidenceCount={missingEvidenceCount}
            nextStep={nextStep}
            topLimits={topLimits}
            limitWarning={limitWarning}
            primaryCtaHref="/aktywnosci?new=1"
            secondaryCtaHref="/aktywnosci"
            portfolioHref="/portfolio"
          />
        </div>

        {/* ── REGUŁY I LIMITY ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Clean header — no background color, just a bottom border */}
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {/* Teal left accent bar */}
              <div className="mt-0.5 h-10 w-1 shrink-0 rounded-full bg-[#2a6b6b]" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Reguly i limity</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Limity w okresie {periodStart}–{periodEnd} na podstawie ukonczonych wpisow.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-4 text-sm text-slate-500 sm:pl-0">
              <span>Zaliczone: <span className="font-bold text-slate-900">{donePoints} pkt</span></span>
              <span className="hidden text-slate-200 sm:inline">|</span>
              <span>Brakuje: <span className="font-bold text-orange-500">{missingPoints} pkt</span></span>
              {missingEvidenceCount > 0 && (
                <>
                  <span className="hidden text-slate-200 sm:inline">|</span>
                  <span>Bez cert.: <span className="font-bold text-slate-900">{missingEvidenceCount}</span></span>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {(planInfo || planErr) && (
              <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                {planInfo && <p className="font-semibold text-[#2a6b6b]">{planInfo}</p>}
                {planErr && <p className="font-semibold text-rose-600">{planErr}</p>}
              </div>
            )}

          {/* Limit rows */}
          <div className="space-y-2">
            {limitsUsage.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                Brak zdefiniowanych limitow dla tego zawodu.
              </div>
            ) : (
              limitsUsage.map((r) => {
                const isMax = (r.usedPct ?? 0) >= 100 || (Number(r.remaining) || 0) <= 0;

                return (
                  <div
                    key={r.key}
                    className="rounded-xl border border-slate-100 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-sm font-bold text-slate-900">{r.label}</span>

                          {r.note && (
                            <span className="text-xs text-slate-400">
                              {r.note}
                              {r.mode === "per_year" ? ` (×${r.yearsInPeriod} lat)` : ""}
                            </span>
                          )}

                          {isMax && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                              W pelni zrealizowane
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {Math.round(r.used)} / {Math.round(r.cap)} pkt — {Math.round(r.usedPct)}%
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isMax ? (
                          <BtnGhost href="/aktywnosci">Zobacz wpisy</BtnGhost>
                        ) : (
                          <BtnPrimary
                            disabled={isBusy || planningKey === r.key}
                            onClick={() => planForRule(r)}
                          >
                            {planningKey === r.key ? "Dodaję…" : "+ Zaplanuj"}
                          </BtnPrimary>
                        )}
                      </div>
                    </div>

                    {/* Progress bar — teal fill */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-[#2a6b6b] transition-all"
                          style={{ width: `${r.usedPct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-slate-500">
                        Pozostało:{" "}
                        <span className="font-bold text-slate-900">{Math.round(r.remaining)} pkt</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer links */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <BtnGhost href="/aktywnosci">Aktywnosci →</BtnGhost>
            <BtnGhost href="/aktywnosci?new=1">+ Dodaj aktywnosc</BtnGhost>
            <BtnGhost href="/portfolio">Raport / PDF →</BtnGhost>
          </div>
          </div>{/* /white body */}
        </div>{/* /limits card */}

        {/* ── OSTATNIE AKTYWNOŚCI ────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Clean header matching limits style */}
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-10 w-1 shrink-0 rounded-full bg-[#2a6b6b]" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Ostatnie aktywnosci</h2>
                <p className="mt-0.5 text-xs text-slate-500">Wpisy w okresie {periodStart}–{periodEnd} z sygnalizacja brakow.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <BtnGhost href="/aktywnosci">Aktywnosci</BtnGhost>
              <BtnGhost href="/portfolio">Raporty / PDF</BtnGhost>
              <BtnGhost href="/baza-szkolen">Baza szkolen</BtnGhost>
            </div>
          </div>

          <div className="p-6">
          <div className="space-y-2">
            {authLoading || loading ? (
              <p className="text-sm text-slate-400">Wczytuję…</p>
            ) : recentRows.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Brak wpisów w okresie {periodStart}–{periodEnd}.
              </div>
            ) : (
              recentRows.map((a) => {
                const prog = normalizeStatus(a.status);
                const missing = getRowMissing(a);

                return (
                  <div
                    key={a.id}
                    className={[
                      "rounded-xl border-l-4 border border-slate-100 p-4 transition",
                      prog === "planned"
                        ? "border-l-[#2a6b6b] bg-white"
                        : missing.length
                        ? "border-l-orange-400 bg-white"
                        : "border-l-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {a.type}
                          </span>

                          {prog === "planned" ? (
                            <span className="inline-flex shrink-0 items-center rounded-md border border-[#2a6b6b]/30 bg-[#2a6b6b]/5 px-2 py-0.5 text-xs font-medium text-[#2a6b6b]">
                              Zaplanowane
                            </span>
                          ) : (
                            <span className="inline-flex shrink-0 items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
                              Ukonczone
                            </span>
                          )}

                          {missing.length === 0 ? (
                            <span className="inline-flex shrink-0 items-center rounded-md border border-[#2a6b6b]/30 bg-[#2a6b6b]/5 px-2 py-0.5 text-xs text-[#2a6b6b]">
                              Kompletne
                            </span>
                          ) : (
                            <span className="inline-flex shrink-0 items-center rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                              Braki
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {a.organizer ? `${a.organizer} · ` : ""}
                          Rok: <span className="font-medium text-slate-700">{a.year}</span>
                          {prog === "planned" && a.planned_start_date && (
                            <> · Termin: <span className="font-medium text-slate-700">{formatYMD(a.planned_start_date)}</span></>
                          )}
                        </p>

                        {missing.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {missing.map((m) => (
                              <span
                                key={m}
                                className="inline-flex items-center rounded-lg border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-600"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: points + link */}
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-sm font-bold text-slate-900">+{a.points} pkt</span>
                        <Link
                          href="/aktywnosci"
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Otworz →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </div>{/* /p-6 */}
        </div>{/* /activities card */}

    </div>
  );
}
