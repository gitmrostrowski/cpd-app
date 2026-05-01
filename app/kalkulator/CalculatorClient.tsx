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
      .select("id, user_id, type, points, year, organizer, created_at, status, planned_start_date, training_id, certificate_path, certificate_name, certificate_mime, certificate_size, certificate_uploaded_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!aErr && a) setActivities(a as ActivityRow[]);
    else setActivities([]);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user?.id) {
        if (!cancelled) { setProfile(null); setActivities([]); setLoading(false); }
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
          setPeriodMode(derived ? "custom" : ((`${start}-${end}` === "2019-2022" || `${start}-${end}` === "2023-2026" || `${start}-${end}` === "2027-2030") ? "preset" : "custom"));
          const rpDb = (p as any).required_points as number | null | undefined;
          const rp = (rpDb ?? undefined) ?? DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? RULES_BY_PROFESSION[prof]?.requiredPoints ?? 200;
          setRequiredPoints(rp);
          setProfile({ user_id: user.id, profession: prof, profession_other: isOtherProfession(prof) ? po || null : null, pwz_number: (p as any).pwz_number ?? null, pwz_issue_date: (p as any).pwz_issue_date ?? null, period_start: start, period_end: end, required_points: rp });
          setDirty(false);
        } else {
          setProfession("Lekarz"); setProfessionOther(""); setPeriodStart(2023); setPeriodEnd(2026);
          setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.Lekarz ?? 200);
          setPeriodMode("preset"); setProfile(null); setDirty(false);
        }
      }
      const { data: a, error: aErr } = await supabase
        .from("activities")
        .select("id, user_id, type, points, year, organizer, created_at, status, planned_start_date, training_id, certificate_path, certificate_name, certificate_mime, certificate_size, certificate_uploaded_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) { if (!aErr && a) setActivities(a as ActivityRow[]); else setActivities([]); setLoading(false); }
    }
    run();
    return () => { cancelled = true; };
  }, [user?.id, supabase]);

  const periodLabel = `${periodStart}-${periodEnd}`;

  const inPeriodDone = useMemo(() => activities.filter((x) => {
    const st = (x.status ?? "done") as ActivityStatus;
    return st === "done" && x.year >= periodStart && x.year <= periodEnd;
  }), [activities, periodStart, periodEnd]);

  const inPeriodPlanned = useMemo(() => activities.filter((x) => {
    const st = x.status ?? null;
    const isPlanned = st === "planned" || (!!x.planned_start_date && st !== "done");
    const y = x.planned_start_date ? Number(String(x.planned_start_date).slice(0, 4)) : x.year;
    return isPlanned && y >= periodStart && y <= periodEnd;
  }), [activities, periodStart, periodEnd]);

  const donePoints = useMemo(() => inPeriodDone.reduce((sum, a) => sum + (Number(a.points) || 0), 0), [inPeriodDone]);
  const missingPoints = useMemo(() => Math.max(0, (Number(requiredPoints) || 0) - donePoints), [requiredPoints, donePoints]);
  const progress = useMemo(() => { const req = Number(requiredPoints) || 0; if (req <= 0) return 0; return clamp((donePoints / req) * 100, 0, 100); }, [requiredPoints, donePoints]);
  const missingEvidenceCount = useMemo(() => inPeriodDone.filter((a) => !a.certificate_path).length, [inPeriodDone]);
  const evidencePct = useMemo(() => { const total = inPeriodDone.length; if (total <= 0) return 0; return clamp(((total - missingEvidenceCount) / total) * 100, 0, 100); }, [inPeriodDone.length, missingEvidenceCount]);
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

  const topLimits = useMemo<TopLimitItem[]>(() => [...limitsUsage].sort((a, b) => (b.usedPct ?? 0) - (a.usedPct ?? 0)).slice(0, 3).map((x) => ({ key: x.key, label: x.label, used: x.used, cap: x.cap, remaining: x.remaining, usedPct: x.usedPct, note: x.note, mode: x.mode })), [limitsUsage]);
  const limitWarning = useMemo(() => { const hit = limitsUsage.find((x) => (x.usedPct ?? 0) >= 100); if (!hit) return null; return `Limit "${hit.label}" jest osiagniety.`; }, [limitsUsage]);
  const nextStep = useMemo(() => buildNextStep(missingPoints, missingEvidenceCount, limitWarning), [missingPoints, missingEvidenceCount, limitWarning]);

  const recentRows = useMemo(() => {
    return activities.filter((a) => {
      const prog = normalizeStatus(a.status);
      const y = prog === "planned" && a.planned_start_date ? Number(String(a.planned_start_date).slice(0, 4)) : a.year;
      return y >= periodStart && y <= periodEnd;
    }).slice(0, 5);
  }, [activities, periodStart, periodEnd]);

  const isBusy = authLoading || loading;
  const otherRequired = isOtherProfession(profession);
  const otherValid = !otherRequired || normalizeOtherProfession(professionOther).length >= 2;
  const pwzIssueDate = (profile as any)?.pwz_issue_date ?? null;

  const trybLabel = pwzIssueDate ? "Tryb okresu - zgodny z PWZ" : "Tryb okresu";
  const okresLabel = pwzIssueDate ? `Okres liczony z PWZ (${formatYMD(pwzIssueDate)})` : periodMode === "preset" ? "Okres rozliczeniowy" : "Okres (indywidualny)";

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
    const payload: ProfileUpsert = { user_id: user.id, profession: nextProfession, profession_other: nextOther, pwz_number: (profile as any)?.pwz_number ?? null, pwz_issue_date: (profile as any)?.pwz_issue_date ?? null, period_start: ps, period_end: pe, required_points: rp };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSavingProfile(false);
    if (!error) { setSavedAt(Date.now()); setDirty(false); }
  }

  async function saveAllSettings() {
    if (!user?.id || !otherValid) return;
    const other = isOtherProfession(profession) ? normalizeOtherProfession(professionOther) || null : null;
    const ps = Number(periodStart) || 0;
    const pe = Math.max(Number(periodEnd) || 0, ps);
    setPeriodEnd(pe);
    await saveProfilePatch({ profession, profession_other: other, period_start: ps, period_end: pe, required_points: requiredPoints });
  }

  async function planForRule(r: (typeof limitsUsage)[number]) {
    if (!user?.id) return;
    setPlanInfo(null); setPlanErr(null);
    if ((Number(r.remaining) || 0) <= 0) return;
    const nowY = new Date().getFullYear();
    const y = clamp(nowY, periodStart, periodEnd);
    const pts = suggestPlannedPoints({ mode: r.mode, remaining: r.remaining });
    if (pts <= 0) return;
    setPlanningKey(r.key);
    try {
      const { error } = await supabase.from("activities").insert({ user_id: user.id, type: r.label, points: pts, year: y, organizer: null, status: "planned" as const, planned_start_date: null as string | null });
      if (error) { setPlanErr(error.message); return; }
      setPlanInfo(`Dodano do planu: ${r.label} (+${pts} pkt)`);
      await reloadActivities();
    } catch (e: any) {
      setPlanErr(e?.message || "Nie udalo sie dodac planu.");
    } finally {
      setPlanningKey(null);
    }
  }

  // ─── shared input/select class ─────────────────────────────────────────
  const inputCls =
    "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50";

  return (
<div className="space-y-4 bg-gradient-to-b from-slate-50 to-white min-h-screen -mx-4 px-4 sm:-mx-6 sm:px-6 pt-1 pb-8">

      {/* ══ 1. USTAWIENIA — white card, no color header ══════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Ustawienia okresu i zawodu</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Zmiany zapisujesz przyciskiem.{" "}
              {savedAt && !dirty && !savingProfile && <span className="font-semibold text-blue-600">✓ Zapisano</span>}
              {!otherValid && <span className="font-semibold text-red-500"> Uzupelnij zawod</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const prof: Profession = "Lekarz";
                setProfession(prof);
                setProfessionOther("");
                const derived = getPeriodFromPwzIssueDate(prof, pwzIssueDate);
                setPeriodStart(derived?.start ?? 2023);
                setPeriodEnd(derived?.end ?? 2026);
                setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200);
                setPeriodMode(derived ? "custom" : "preset");
                setDirty(true);
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Domyslne
            </button>
            <button
              type="button"
              onClick={saveAllSettings}
              disabled={isBusy || savingProfile || !dirty || !otherValid}
              className="min-w-[130px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              {savingProfile ? "Zapisuje..." : "Zapisz zmiany"}
            </button>
            <Link
              href="/profil"
              className="min-w-[130px] inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Profil →
            </Link>
          </div>
        </div>

        <div className="px-5 py-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* Zawód */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Zawod</label>
            <select
              value={profession}
              onChange={(e) => {
                const v = e.target.value as Profession;
                setProfession(v);
                if (!isOtherProfession(v)) setProfessionOther("");
                setRequiredPoints(RULES_BY_PROFESSION[v]?.requiredPoints ?? DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[v] ?? 200);
                if (pwzIssueDate) {
                  const d = getPeriodFromPwzIssueDate(v, pwzIssueDate);
                  if (d) { setPeriodMode("custom"); setPeriodStart(d.start); setPeriodEnd(d.end); }
                }
                setDirty(true);
              }}
              className={`mt-1.5 ${inputCls}`}
            >
              {PROFESSION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Tryb okresu */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">{trybLabel}</label>
            <select
              value={periodMode}
              onChange={(e) => {
                const v = e.target.value as "preset" | "custom";
                setPeriodMode(v);
                if (v === "custom" && pwzIssueDate) {
                  const d = getPeriodFromPwzIssueDate(profession, pwzIssueDate);
                  if (d) { setPeriodStart(d.start); setPeriodEnd(d.end); }
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
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">{okresLabel}</label>
              <select
                value={periodLabel}
                onChange={(e) => {
                  const [a, b] = e.target.value.split("-").map(Number);
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
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">{okresLabel}</label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <input value={periodStart} onChange={(e) => { setPeriodStart(Number(e.target.value||0)); setDirty(true); }} type="number" placeholder="Start" disabled={Boolean(pwzIssueDate)} className={inputCls} />
                <input value={periodEnd} onChange={(e) => { setPeriodEnd(Number(e.target.value||0)); setDirty(true); }} type="number" placeholder="Koniec" disabled={Boolean(pwzIssueDate)} className={inputCls} />
              </div>
            </div>
          )}

          {/* Wymagane punkty */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wymagane punkty</label>
            <input
              value={requiredPoints}
              onChange={(e) => { setRequiredPoints(Number(e.target.value||0)); setDirty(true); }}
              type="number" min={0}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>

          {otherRequired && (
            <div className="sm:col-span-2 xl:col-span-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jaki zawod?</label>
              <input
                value={professionOther}
                onChange={(e) => { setProfessionOther(e.target.value); setDirty(true); }}
                placeholder="np. Psycholog, Logopeda..."
                className={`mt-1.5 ${inputCls} ${!otherValid ? "border-red-300" : ""}`}
              />
              <p className={`mt-1 text-xs ${otherValid ? "text-slate-400" : "text-red-500"}`}>
                {otherValid ? "Doprecyzowanie pomaga dopasowac zasady." : "Wpisz nazwe zawodu (min. 2 znaki)."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══ 2. HERO STATUS — jeden jasny komunikat ═══════════════════════════ */}
      {!isBusy && (
        <div className={`rounded-2xl border bg-white px-6 py-5 transition-all duration-200 ${
        progress >= 100
          ? "border-green-100 shadow-sm"
          : progress >= 50
          ? "border-slate-200 shadow-sm"
          : "border-red-100 shadow-sm"
      }`}>
          {/* Główny komunikat */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              {/* Status badge */}
          <div className="mb-3">
            {progress >= 100 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-300">
                ✅ Spelniasz wymagania
              </span>
            ) : progress >= 50 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-300">
                🟡 Jestes na dobrej drodze
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-300">
                ❗ Nie spelniasz wymagan
              </span>
            )}
          </div>

          {missingPoints > 0 ? (
                <>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Brakuje Ci</div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-4xl font-extrabold text-red-600">{missingPoints} pkt</span>
                    {missingEvidenceCount > 0 && (
                      <>
                        <span className="text-slate-300 text-xl">+</span>
                        <span className="text-2xl font-bold text-amber-500">{missingEvidenceCount} certyfikatow</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1.5 text-sm text-slate-500">
                    Masz {donePoints} / {requiredPoints} pkt • okres {periodStart}–{periodEnd} • {daysLeft} dni
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900">
                    Masz komplet punktow!{" "}
                    <span className="text-green-600">{donePoints} / {requiredPoints} pkt</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Okres {periodStart}–{periodEnd} • {daysLeft} dni do konca
                  </div>
                </>
              )}

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">{Math.round(progress)}%</span>
                  <span className="text-xs text-slate-500">{donePoints} / {requiredPoints} pkt</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full transition-all duration-700 bg-gradient-to-r from-red-400 via-orange-400 to-amber-400"
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  />
                </div>
                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                  <span>Ukonczone: <strong className="text-slate-900">{inPeriodDone.length}</strong></span>
                  <span>Zaplanowane: <strong className="text-slate-900">{inPeriodPlanned.length}</strong></span>
                  {missingEvidenceCount > 0 && (
                    <span className="text-amber-600 font-semibold">Bez certyfikatu: {missingEvidenceCount}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Co teraz zrobic — główny CTA */}
            <div className="sm:w-72 shrink-0">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-600">Co teraz zrobic</div>
                <div className="mt-2 text-base font-bold text-slate-900">{nextStep.title}</div>
                {missingEvidenceCount > 0 && <div className="mt-1 text-sm text-slate-600">Masz {missingEvidenceCount} wpisow bez certyfikatu</div>}
                <Link
                  href={nextStep.ctaHref}
                  className="mt-4 block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.99]"
                >
                  {nextStep.ctaLabel}
                </Link>
              </div>
            </div>
          </div>

          {/* Szybkie statystyki — 1 linia */}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-500">📅 <strong className="text-slate-900">{daysLeft}</strong> dni</span>
            <span>📄 <strong className={missingEvidenceCount > 0 ? "text-amber-600" : "text-slate-900"}>{Math.round(evidencePct)}% dokumentów</strong></span>
            <span className="text-slate-500">🎯 <strong className="text-slate-900">{requiredPoints} pkt</strong> wymagane</span>
            <span className="text-slate-500">👤 <strong className="text-slate-700">{displayProfession(profession, professionOther)}</strong></span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isBusy && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Wczytuje dane...
        </div>
      )}

      {/* ══ 3. REGUŁY I LIMITY ═══════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-10 w-1 shrink-0 rounded-full bg-blue-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Twoje limity</h2>
              <p className="mt-0.5 text-xs text-slate-500">Najbardziej ograniczajace kategorie w tym okresie</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-4 text-sm sm:pl-0">
            <span className="text-slate-500">Zaliczone: <span className="font-bold text-slate-900">{donePoints} pkt</span></span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-500">Brakuje: <span className="font-bold text-red-500">{missingPoints} pkt</span></span>
          </div>
        </div>

        <div className="p-6">
          {(planInfo || planErr) && (
            <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
              {planInfo && <p className="font-semibold text-blue-700">{planInfo}</p>}
              {planErr && <p className="font-semibold text-red-600">{planErr}</p>}
            </div>
          )}

          <div className="space-y-2">
            {limitsUsage.length === 0 ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                Brak zdefiniowanych limitow dla tego zawodu.
              </div>
            ) : (
              limitsUsage.map((r) => {
                const isMax = (r.usedPct ?? 0) >= 100 || (Number(r.remaining) || 0) <= 0;
                return (
                  <div key={r.key} className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-blue-400 bg-white p-4 transition hover:shadow-sm hover:border-blue-200 hover:border-l-blue-500">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-900">{r.label}</span>
                        {isMax && (
                          <span className="rounded-md border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-700">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.mode === "per_item" ? `max ${r.cap} pkt / szkolenie` : r.mode === "per_year" ? `max ${r.maxPoints} pkt / rok` : `max ${r.cap} pkt w okresie`}
                        {" · "}
                        {r.used === 0
                          ? <span className="text-slate-400 italic">Nie rozpoczeto</span>
                          : <span>{Math.round(r.used)} / {Math.round(r.cap)} pkt</span>
                        }
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${r.usedPct >= 100 ? "bg-green-400" : r.usedPct >= 50 ? "bg-blue-400" : "bg-slate-400"}`}
                            style={{ width: `${r.usedPct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-bold text-slate-700">{Math.round(r.usedPct)}%</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isMax ? (
                        <Link href="/aktywnosci" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                          Zobacz
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy || planningKey === r.key}
                          onClick={() => planForRule(r)}
                          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 hover:scale-[1.02] disabled:opacity-40"
                        >
                          {planningKey === r.key ? "Dodaje..." : "+ Zaplanuj"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Link href="/aktywnosci" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Aktywnosci →</Link>
            <Link href="/aktywnosci?new=1" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">+ Dodaj aktywnosc</Link>
            <Link href="/portfolio" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Raport / PDF →</Link>
          </div>
        </div>
      </div>

      {/* ══ 4. OSTATNIE AKTYWNOŚCI ═══════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-10 w-1 shrink-0 rounded-full bg-blue-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Ostatnie aktywnosci</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-xs text-slate-500">Wpisy {periodStart}–{periodEnd}</p>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400" /> zaplanowane
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> braki
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400" /> kompletne
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/aktywnosci" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Aktywnosci</Link>
            <Link href="/portfolio" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Raporty / PDF</Link>
            <Link href="/baza-szkolen" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Baza szkolen</Link>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-2">
            {isBusy ? (
              <p className="text-sm text-slate-500">Wczytuję...</p>
            ) : recentRows.length === 0 ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                Brak wpisow w okresie {periodStart}–{periodEnd}.
              </div>
            ) : (
              recentRows.map((a) => {
                const prog = normalizeStatus(a.status);
                const missing = getRowMissing(a);
                return (
                  <div
                    key={a.id}
                    className={[
                      "rounded-xl border-l-4 border border-slate-100 p-4 transition hover:shadow-sm",
                      prog === "planned"
                        ? "border-l-blue-400 bg-blue-50/20"
                        : missing.length
                        ? "border-l-amber-400 bg-amber-50/30"
                        : "border-l-green-400 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{a.type}</span>
                          {prog === "planned" ? (
                            <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">Zaplanowane</span>
                          ) : (
                            <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">Ukonczone</span>
                          )}
                          {missing.length === 0 ? (
                            <span className="rounded-md border border-green-100 bg-green-50 px-2 py-0.5 text-xs text-green-600">Kompletne</span>
                          ) : (
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Braki</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {a.organizer ? `${a.organizer} · ` : ""}
                          Rok: <span className="font-medium text-slate-700">{a.year}</span>
                          {prog === "planned" && a.planned_start_date && (
                            <> · Termin: <span className="font-medium text-slate-700">{formatYMD(a.planned_start_date)}</span></>
                          )}
                        </p>
                        {missing.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {missing.map((m) => (
                              <span key={m} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{m}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-sm font-bold text-slate-900">+{a.points} pkt</span>
                        <Link href="/aktywnosci" className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                          Otworz →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {recentRows.length >= 5 && (
            <div className="mt-4 border-t border-slate-100 pt-4 text-center">
              <Link
                href="/aktywnosci"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Zobacz wszystkie aktywnosci →
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
