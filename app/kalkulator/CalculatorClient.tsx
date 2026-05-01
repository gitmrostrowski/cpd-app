// app/kalkulator/CalculatorClient.tsx
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
      { key: "INTERNAL_TRAINING", label: "Szkolenie wewnętrzne", mode: "per_item", maxPoints: 6, note: "1 pkt/h, maks. 6 pkt za jedno szkolenie" },
      { key: "JOURNAL_SUBSCRIPTION", label: "Prenumerata czasopisma", mode: "per_period", maxPoints: 10, note: "5 pkt/tytuł, maks. 10 pkt w okresie" },
      { key: "SCIENTIFIC_SOCIETY", label: "Towarzystwo/Kolegium", mode: "per_period", maxPoints: 20, note: "5 pkt, maks. 20 pkt w okresie" },
    ],
  },
  "Lekarz dentysta": {
    periodMonths: 48,
    requiredPoints: 200,
    limits: [
      { key: "INTERNAL_TRAINING", label: "Szkolenie wewnętrzne", mode: "per_item", maxPoints: 6, note: "1 pkt/h, maks. 6 pkt za jedno szkolenie" },
      { key: "JOURNAL_SUBSCRIPTION", label: "Prenumerata czasopisma", mode: "per_period", maxPoints: 10, note: "5 pkt/tytuł, maks. 10 pkt w okresie" },
      { key: "SCIENTIFIC_SOCIETY", label: "Towarzystwo/Kolegium", mode: "per_period", maxPoints: 20, note: "5 pkt, maks. 20 pkt w okresie" },
    ],
  },
  Pielęgniarka: {
    periodMonths: 60,
    requiredPoints: 100,
    limits: [
      { key: "WEBINAR", label: "Webinary", mode: "per_period", maxPoints: 50, note: "5 pkt/wydarzenie, maks. 50 pkt" },
      { key: "INTERNAL_TRAINING", label: "Szkolenie wewnętrzne", mode: "per_period", maxPoints: 50, note: "2/5 pkt, maks. 50 pkt" },
      { key: "COMMITTEES", label: "Komisje/Zespoły", mode: "per_period", maxPoints: 30, note: "3 pkt/posiedzenie, maks. 30 pkt" },
      { key: "JOURNAL_SUBSCRIPTION", label: "Prenumerata czasopisma", mode: "per_year", maxPoints: 10, note: "5 pkt/tytuł, maks. 10 pkt/rok" },
    ],
  },
  Położna: {
    periodMonths: 60,
    requiredPoints: 100,
    limits: [
      { key: "WEBINAR", label: "Webinary", mode: "per_period", maxPoints: 50, note: "5 pkt/wydarzenie, maks. 50 pkt" },
      { key: "INTERNAL_TRAINING", label: "Szkolenie wewnętrzne", mode: "per_period", maxPoints: 50, note: "2/5 pkt, maks. 50 pkt" },
      { key: "COMMITTEES", label: "Komisje/Zespoły", mode: "per_period", maxPoints: 30, note: "3 pkt/posiedzenie, maks. 30 pkt" },
      { key: "JOURNAL_SUBSCRIPTION", label: "Prenumerata czasopisma", mode: "per_year", maxPoints: 10, note: "5 pkt/tytuł, maks. 10 pkt/rok" },
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

function daysUntilEndOfYear(yearEnd: number) {
  const end = new Date(yearEnd, 11, 31, 23, 59, 59);
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
  return { start: y, end: y + years - 1 };
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

function suggestPlannedPoints(rule: { mode: "per_period" | "per_year" | "per_item"; remaining: number }) {
  const rem = Math.max(0, Number(rule.remaining) || 0);
  if (rem <= 0) return 0;
  const step = rule.mode === "per_item" ? 2 : 5;
  return Math.max(1, Math.min(rem, step));
}

function buildNextSteps(missingPoints: number, missingEvidenceCount: number, limitWarning: string | null) {
  const steps = [];

  if (missingEvidenceCount > 0) {
    steps.push({
      icon: "doc",
      tone: "red",
      title: "Uzupełnij dokumenty",
      description: `Masz ${missingEvidenceCount} brakujących dokumentów.`,
      ctaHref: "/aktywnosci",
    });
  }

  if (missingPoints > 0) {
    steps.push({
      icon: "shield",
      tone: "blue",
      title: limitWarning ? "Dobierz inną aktywność" : "Zaplanuj szkolenie",
      description: limitWarning || "Wybierz szkolenia i zdobądź punkty.",
      ctaHref: "/aktywnosci?new=1",
    });
  }

  steps.push({
    icon: "chart",
    tone: "green",
    title: "Sprawdź raport",
    description: missingPoints <= 0 ? "Masz komplet punktów. Wygeneruj PDF." : "Zobacz szczegóły swojego postępu.",
    ctaHref: "/portfolio",
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
    blue: "border-blue-100 bg-blue-50 text-blue-600",
    green: "border-emerald-100 bg-emerald-50 text-emerald-600",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
    red: "border-red-100 bg-red-50 text-red-600",
    slate: "border-slate-100 bg-slate-50 text-slate-600",
  };

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${tones[tone]}`}>
      {children}
    </div>
  );
}

function MiniIcon({ name }: { name: "calendar" | "shield" | "chart" | "doc" | "user" | "bell" }) {
  const common = "h-5 w-5";
  if (name === "calendar") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5M4 19h16" />
        <path d="M8 16v-5M12 16V8M16 16v-8" />
      </svg>
    );
  }
  if (name === "doc") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 6 3 8H3c0-2 3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function CircularProgress({ value }: { value: number }) {
  const radius = 46;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (clamp(value, 0, 100) / 100) * circumference;

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="-rotate-90" height="128" width="128">
        <circle stroke="currentColor" className="text-blue-100" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx="64" cy="64" />
        <circle
          stroke="currentColor"
          className="text-blue-600 transition-all duration-700"
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          r={normalizedRadius}
          cx="80"
          cy="80"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-semibold tracking-tight text-slate-950">{Math.round(value)}%</div>
        <div className="mt-0.5 text-xs font-medium text-slate-500">realizacji</div>
      </div>
    </div>
  );
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
          setPeriodMode(derived ? "custom" : ["2019-2022", "2023-2026", "2027-2030"].includes(`${start}-${end}`) ? "preset" : "custom");

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
    [activities, periodStart, periodEnd]
  );

  const inPeriodPlanned = useMemo(
    () =>
      activities.filter((x) => {
        const st = x.status ?? null;
        const isPlanned = st === "planned" || (!!x.planned_start_date && st !== "done");
        const y = x.planned_start_date ? Number(String(x.planned_start_date).slice(0, 4)) : x.year;
        return isPlanned && y >= periodStart && y <= periodEnd;
      }),
    [activities, periodStart, periodEnd]
  );

  const donePoints = useMemo(() => inPeriodDone.reduce((sum, a) => sum + (Number(a.points) || 0), 0), [inPeriodDone]);
  const missingPoints = useMemo(() => Math.max(0, (Number(requiredPoints) || 0) - donePoints), [requiredPoints, donePoints]);
  const progress = useMemo(() => {
    const req = Number(requiredPoints) || 0;
    return req <= 0 ? 0 : clamp((donePoints / req) * 100, 0, 100);
  }, [requiredPoints, donePoints]);

  const missingEvidenceCount = useMemo(() => inPeriodDone.filter((a) => !a.certificate_path).length, [inPeriodDone]);
  const evidencePct = useMemo(() => {
    if (inPeriodDone.length <= 0) return 0;
    return clamp(((inPeriodDone.length - missingEvidenceCount) / inPeriodDone.length) * 100, 0, 100);
  }, [inPeriodDone.length, missingEvidenceCount]);

  const daysLeft = useMemo(() => daysUntilEndOfYear(periodEnd), [periodEnd]);

  const limitsUsage = useMemo(() => {
    const limits = RULES_BY_PROFESSION[profession]?.limits ?? [];
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

  const limitWarning = useMemo(() => {
    const hit = limitsUsage.find((x) => (x.usedPct ?? 0) >= 100);
    return hit ? `Limit „${hit.label}” jest osiągnięty.` : null;
  }, [limitsUsage]);

  const nextSteps = useMemo(() => buildNextSteps(missingPoints, missingEvidenceCount, limitWarning), [missingPoints, missingEvidenceCount, limitWarning]);

  const recentRows = useMemo(() => {
    return activities
      .filter((a) => {
        const prog = normalizeStatus(a.status);
        const y = prog === "planned" && a.planned_start_date ? Number(String(a.planned_start_date).slice(0, 4)) : a.year;
        return y >= periodStart && y <= periodEnd;
      })
      .slice(0, 5);
  }, [activities, periodStart, periodEnd]);

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

  const inputCls =
    "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400";

  const cardCls = "scroll-mt-32 rounded-xl border border-slate-200 bg-white shadow-sm";

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    // Uwzględnia górny header, żeby sekcja nie chowała się pod nawigacją.
    const offset = 86;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const subNavItemCls =
    "shrink-0 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700";
  const subNavActiveCls =
    "shrink-0 border-b-2 border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-700";

  return (
    <div className="-mx-4 min-h-screen bg-slate-50 px-4 pb-10 pt-1 sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <section id="ustawienia" className={cardCls}>
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <IconBubble tone="blue"><MiniIcon name="calendar" /></IconBubble>
              <div>
                <h2 className="text-base font-medium text-slate-950">Ustawienia okresu i zawodu</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Zmień preferencje w dowolnym momencie.
                  {savedAt && !dirty && !savingProfile ? <span className="ml-1 font-bold text-blue-600">✓ Zapisano</span> : null}
                  {!otherValid ? <span className="ml-1 font-bold text-red-500">Uzupełnij zawód</span> : null}
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
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Domyślne
              </button>
              <button
                type="button"
                onClick={saveAllSettings}
                disabled={isBusy || savingProfile || !dirty || !otherValid}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {savingProfile ? "Zapisuję..." : "Zapisz zmiany"}
              </button>
              <Link href="/profil" className="rounded-lg border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50">
                Profil →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Zawód</label>
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
                className={`mt-2 ${inputCls}`}
              >
                {PROFESSION_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{trybLabel}</label>
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
                className={`mt-2 ${inputCls}`}
              >
                <option value="preset">Preset najczęstszy</option>
                <option value="custom">Indywidualny</option>
              </select>
            </div>

            {periodMode === "preset" && !pwzIssueDate ? (
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{okresLabel}</label>
                <select
                  value={periodLabel}
                  onChange={(e) => {
                    const [a, b] = e.target.value.split("-").map(Number);
                    setPeriodStart(a);
                    setPeriodEnd(b);
                    setDirty(true);
                  }}
                  className={`mt-2 ${inputCls}`}
                >
                  <option value="2019-2022">2019–2022</option>
                  <option value="2023-2026">2023–2026</option>
                  <option value="2027-2030">2027–2030</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{okresLabel}</label>
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input value={periodStart} onChange={(e) => { setPeriodStart(Number(e.target.value || 0)); setDirty(true); }} type="number" disabled={Boolean(pwzIssueDate)} className={inputCls} />
                  <span className="text-slate-400">–</span>
                  <input value={periodEnd} onChange={(e) => { setPeriodEnd(Number(e.target.value || 0)); setDirty(true); }} type="number" disabled={Boolean(pwzIssueDate)} className={inputCls} />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Wymagane punkty</label>
              <input
                value={requiredPoints}
                onChange={(e) => { setRequiredPoints(Number(e.target.value || 0)); setDirty(true); }}
                type="number"
                min={0}
                className={`mt-2 ${inputCls}`}
              />
            </div>

            {otherRequired ? (
              <div className="md:col-span-2 xl:col-span-4">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Jaki zawód?</label>
                <input
                  value={professionOther}
                  onChange={(e) => { setProfessionOther(e.target.value); setDirty(true); }}
                  placeholder="np. Psycholog, Logopeda..."
                  className={`mt-2 ${inputCls} ${!otherValid ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* SZYBKIE MENU */}
        <nav className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-max">
            <button type="button" onClick={() => scrollToSection("ustawienia")} className={subNavActiveCls}>
              Ustawienia
            </button>
            <button type="button" onClick={() => scrollToSection("status")} className={subNavItemCls}>
              Status punktów
            </button>
            <button type="button" onClick={() => scrollToSection("kroki")} className={subNavItemCls}>
              Co dalej?
            </button>
            <button type="button" onClick={() => scrollToSection("limity")} className={subNavItemCls}>
              Limity
            </button>
            <button type="button" onClick={() => scrollToSection("aktywnosci")} className={subNavItemCls}>
              Ostatnie aktywności
            </button>
          </div>
        </nav>

        {isBusy ? (
          <div className={cardCls + " p-10 text-center text-sm font-medium text-slate-500"}>Wczytuję dane...</div>
        ) : (
          <>
            <section id="status" className="scroll-mt-32 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <CircularProgress value={progress} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                    {progress >= 100 ? "Cel zrealizowany" : "Jesteś w trakcie realizacji celu"}
                  </div>
                  {missingEvidenceCount > 0 ? (
                    <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                      {missingEvidenceCount} dokumentów do uzupełnienia
                    </div>
                  ) : null}
                </div>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  {missingPoints > 0 ? (
                    <>Zostało <span className="text-orange-500">{missingPoints} pkt</span></>
                  ) : (
                    <>Masz komplet <span className="text-emerald-600">punktów</span></>
                  )}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Masz <strong className="text-slate-950">{donePoints} / {requiredPoints} pkt</strong> w okresie {periodStart}–{periodEnd}. 
                  Do końca zostało <strong className="text-slate-950">{daysLeft} dni</strong>.
                </p>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                    <span>Postęp punktów</span>
                    <span>{donePoints} / {requiredPoints} pkt</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-blue-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-700" style={{ width: `${Math.max(progress, 2)}%` }} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 border-t border-slate-200 pt-4 sm:grid-cols-4">
                  {[
                    ["calendar", `${daysLeft}`, "dni do końca"],
                    ["doc", `${missingEvidenceCount}`, "brak. dok."],
                    ["chart", `${requiredPoints}`, "pkt wymagane"],
                    ["user", displayProfession(profession, professionOther), "Twój zawód"],
                  ].map(([icon, value, label]) => (
                    <div key={label} className="border-r border-slate-200 px-4 last:border-r-0">
                      <div className="mb-2 text-blue-600"><MiniIcon name={icon as any} /></div>
                      <div className="truncate text-xl font-semibold text-slate-950">{value}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </section>

            <section id="kroki" className="scroll-mt-32 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <IconBubble tone="blue"><MiniIcon name="chart" /></IconBubble>
              <div>
                <h2 className="text-base font-medium text-slate-950">Co dalej?</h2>
                <p className="text-sm text-slate-500">Najważniejsze działania na podstawie braków</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {nextSteps.map((step) => (
                <Link
                  key={step.title}
                  href={step.ctaHref}
                  className="group flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:bg-slate-50"
                >
                  <IconBubble tone={step.tone as any}><MiniIcon name={step.icon as any} /></IconBubble>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-950">{step.title}</div>
                    <div className="mt-0.5 text-sm leading-5 text-slate-500">{step.description}</div>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600">→</span>
                </Link>
              ))}
            </div>
            </section>
          </>
        )}

        <section className="space-y-5">
          <div id="limity" className={cardCls}>
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <IconBubble tone="blue"><MiniIcon name="shield" /></IconBubble>
                <div>
                  <h2 className="text-base font-medium text-slate-950">Twoje limity</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Najbardziej ograniczające kategorie w tym okresie</p>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                Zaliczone: <strong className="text-slate-950">{donePoints} pkt</strong>
                <span className="mx-2 text-slate-300">|</span>
                Brakuje: <strong className="text-red-500">{missingPoints} pkt</strong>
              </div>
            </div>

            <div className="p-6">
              {(planInfo || planErr) ? (
                <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                  {planInfo ? <p className="font-bold text-blue-700">{planInfo}</p> : null}
                  {planErr ? <p className="font-bold text-red-600">{planErr}</p> : null}
                </div>
              ) : null}

              <div className="grid gap-3 lg:grid-cols-3">
                {limitsUsage.length === 0 ? (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 lg:col-span-3">Brak zdefiniowanych limitów dla tego zawodu.</div>
                ) : (
                  limitsUsage.map((r) => {
                    const isMax = r.usedPct >= 100 || (Number(r.remaining) || 0) <= 0;

                    return (
                      <div key={r.key} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300">
                        <div className="flex items-center gap-4">
                          <IconBubble tone={isMax ? "green" : "blue"}>
                            <MiniIcon name={r.key === "JOURNAL_SUBSCRIPTION" ? "doc" : r.key === "SCIENTIFIC_SOCIETY" ? "user" : "chart"} />
                          </IconBubble>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-950">{r.label}</h3>
                              {isMax ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">wykorzystane</span> : null}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {r.mode === "per_item" ? `max ${r.cap} pkt / szkolenie` : r.mode === "per_year" ? `max ${r.maxPoints} pkt / rok` : `max ${r.cap} pkt w okresie`} · {r.used} / {r.cap} pkt
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full ${isMax ? "bg-emerald-500" : r.usedPct >= 50 ? "bg-blue-500" : "bg-slate-300"}`} style={{ width: `${r.usedPct}%` }} />
                              </div>
                              <span className="w-10 text-right text-xs font-medium text-slate-600">{Math.round(r.usedPct)}%</span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className={`mb-2 rounded-lg px-3 py-2 text-sm font-medium ${isMax ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-950"}`}>
                              {Math.round(r.remaining)} pkt<br />
                              <span className="text-xs font-medium text-slate-500">zostało</span>
                            </div>

                            {isMax ? (
                              <Link href="/aktywnosci" className="text-xs font-medium text-slate-500 hover:text-blue-600">Zobacz →</Link>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy || planningKey === r.key}
                                onClick={() => planForRule(r)}
                                className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-40"
                              >
                                {planningKey === r.key ? "Dodaję..." : "+ Zaplanuj"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Link href="/aktywnosci" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Aktywności →</Link>
                <Link href="/aktywnosci?new=1" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">+ Dodaj aktywność</Link>
                <Link href="/portfolio" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Raport / PDF →</Link>
              </div>
            </div>
          </div>

          <div id="aktywnosci" className={cardCls}>
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <IconBubble tone="green"><MiniIcon name="calendar" /></IconBubble>
                <div>
                  <h2 className="text-base font-medium text-slate-950">Ostatnie aktywności</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> zaplanowane</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> dokumentacja</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" /> kompletne</span>
                  </div>
                </div>
              </div>

              <Link href="/aktywnosci" className="text-sm font-medium text-blue-600 hover:text-blue-700">Zobacz wszystkie</Link>
            </div>

            <div className="p-6">
              <div className="grid gap-3 xl:grid-cols-2">
                {isBusy ? (
                  <p className="text-sm text-slate-500 xl:col-span-2">Wczytuję...</p>
                ) : recentRows.length === 0 ? (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 xl:col-span-2">Brak wpisów w okresie {periodStart}–{periodEnd}.</div>
                ) : (
                  recentRows.map((a) => {
                    const prog = normalizeStatus(a.status);
                    const missing = getRowMissing(a);
                    const stripe = prog === "planned" ? "bg-blue-500" : missing.length ? "bg-amber-500" : "bg-emerald-500";

                    return (
                      <div
                        key={a.id}
                        className={`relative overflow-hidden rounded-lg border border-slate-200 p-4 pl-5 transition hover:border-blue-300 ${
                          prog === "planned" ? "bg-white" : missing.length ? "bg-white" : "bg-white"
                        }`}
                      >
                        <div className={`absolute inset-y-4 left-0 w-1.5 rounded-r-full ${stripe}`} />
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-950">{a.type}</h3>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                                prog === "planned" ? "bg-blue-50 text-blue-700 ring-blue-100" : "bg-slate-50 text-slate-600 ring-slate-100"
                              }`}>
                                {prog === "planned" ? "Zaplanowane" : "Ukończone"}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                                missing.length ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"
                              }`}>
                                {missing.length ? "Brak dokumentacji" : "Kompletne"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {a.organizer ? `${a.organizer} · ` : ""}
                              Rok: <span className="font-bold text-slate-700">{a.year}</span>
                              {prog === "planned" && a.planned_start_date ? <> · Termin: <span className="font-bold text-slate-700">{formatYMD(a.planned_start_date)}</span></> : null}
                            </p>

                            {missing.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {missing.map((m) => (
                                  <span key={m} className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="text-sm font-medium text-slate-950">+{a.points} pkt</span>
                            <Link href="/aktywnosci" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                              Otwórz →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <IconBubble tone="blue"><MiniIcon name="bell" /></IconBubble>
              <div>
                <h2 className="font-semibold text-slate-950">Bądź na bieżąco i nie przegap ważnych terminów</h2>
                <p className="mt-1 text-sm text-slate-600">Włącz powiadomienia, aby otrzymywać przypomnienia o szkoleniach i terminach.</p>
              </div>
            </div>
            <Link href="/profil" className="rounded-lg border border-blue-100 bg-white px-5 py-2.5 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50">
              Ustawienia powiadomień →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
