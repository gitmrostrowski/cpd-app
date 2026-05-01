// app/kalkulator/CalculatorClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

import type { TopLimitItem } from "@/components/dashboard/CpdStatusPanel";

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

function buildNextStep(
  missingPoints: number,
  missingEvidenceCount: number,
  limitWarning: string | null
) {
  if (missingEvidenceCount > 0) {
    return {
      title: "Uzupełnij dokumenty",
      description: `Masz ${missingEvidenceCount} wpisów bez certyfikatu.`,
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
      description: `${limitWarning} Wybierz inną kategorię.`,
      ctaLabel: "+ Dodaj aktywność",
      ctaHref: "/aktywnosci?new=1",
    };
  }

  return {
    title: "Ustal krótki plan",
    description: `Dodaj wpisy jako plan, a potem uzupełniaj certyfikaty.`,
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

function getPeriodFromPwzIssueDate(
  prof: Profession,
  pwzIssueDate: string | null | undefined
) {
  if (!pwzIssueDate) return null;

  const y = Number(String(pwzIssueDate).slice(0, 4));
  if (!y || Number.isNaN(y)) return null;

  const months = RULES_BY_PROFESSION[prof]?.periodMonths ?? 48;
  const years = Math.max(1, Math.round(months / 12));

  return {
    start: y,
    end: y + (years - 1),
  };
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

          const presetLabel = `${start}-${end}`;
          const isPreset =
            presetLabel === "2019-2022" ||
            presetLabel === "2023-2026" ||
            presetLabel === "2027-2030";

          setPeriodMode(derived ? "custom" : isPreset ? "preset" : "custom");

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
          setProfession("Lekarz");
          setProfessionOther("");
          setPeriodStart(2023);
          setPeriodEnd(2026);
          setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.Lekarz ?? 200);
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

    return () => {
      cancelled = true;
    };
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
      const y = x.planned_start_date
        ? Number(String(x.planned_start_date).slice(0, 4))
        : x.year;

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
    return clamp(((total - missingEvidenceCount) / total) * 100, 0, 100);
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
    return `Limit „${hit.label}” jest osiągnięty.`;
  }, [limitsUsage]);

  const nextStep = useMemo(() => {
    return buildNextStep(missingPoints, missingEvidenceCount, limitWarning);
  }, [missingPoints, missingEvidenceCount, limitWarning]);

  const recentRows = useMemo(() => {
    return activities
      .filter((a) => {
        const prog = normalizeStatus(a.status);
        const y =
          prog === "planned" && a.planned_start_date
            ? Number(String(a.planned_start_date).slice(0, 4))
            : a.year;

        return y >= periodStart && y <= periodEnd;
      })
      .slice(0, 5);
  }, [activities, periodStart, periodEnd]);

  const isBusy = authLoading || loading;
  const otherRequired = isOtherProfession(profession);
  const otherValid =
    !otherRequired || normalizeOtherProfession(professionOther).length >= 2;
  const pwzIssueDate = profile?.pwz_issue_date ?? null;

  const trybLabel = pwzIssueDate ? "Tryb okresu — zgodny z PWZ" : "Tryb okresu";
  const okresLabel = pwzIssueDate
    ? `Okres liczony z PWZ (${formatYMD(pwzIssueDate)})`
    : periodMode === "preset"
    ? "Okres rozliczeniowy"
    : "Okres indywidualny";

  async function saveProfilePatch(
    patch: Partial<ProfileRow> & { profession_other?: string | null }
  ) {
    if (!user?.id) return;

    setSavingProfile(true);

    const nextProfession = (patch.profession ?? profession) as Profession;
    const nextPeriodStart =
      patch.period_start !== undefined ? patch.period_start : periodStart;
    const nextPeriodEnd =
      patch.period_end !== undefined ? patch.period_end : periodEnd;
    const nextRequiredPoints =
      patch.required_points !== undefined ? patch.required_points : requiredPoints;

    const otherReq = isOtherProfession(nextProfession);
    const rawOther =
      patch.profession_other !== undefined ? patch.profession_other : professionOther;
    const nextOther = otherReq ? normalizeOtherProfession(rawOther) || null : null;

    const ps = Number(nextPeriodStart) || 2023;
    const pe = Math.max(Number(nextPeriodEnd) || ps, ps);
    const rp = Math.max(0, Number(nextRequiredPoints) || 0);

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
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50";

  const sectionCls =
    "rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40";

  return (
    <div className="-mx-4 min-h-screen space-y-5 bg-gradient-to-b from-slate-50 via-white to-white px-4 pb-8 pt-1 sm:-mx-6 sm:px-6">
      {/* USTAWIENIA */}
      <div className={sectionCls}>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Ustawienia okresu i zawodu
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Zmiany zapisujesz przyciskiem.
              {savedAt && !dirty && !savingProfile ? (
                <span className="ml-1 font-semibold text-blue-600">✓ Zapisano</span>
              ) : null}
              {!otherValid ? (
                <span className="ml-1 font-semibold text-red-500">
                  Uzupełnij zawód
                </span>
              ) : null}
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
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Domyślne
            </button>

            <button
              type="button"
              onClick={saveAllSettings}
              disabled={isBusy || savingProfile || !dirty || !otherValid}
              className="min-w-[130px] rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              {savingProfile ? "Zapisuję..." : "Zapisz zmiany"}
            </button>

            <Link
              href="/profil"
              className="inline-flex min-w-[130px] items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Profil →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Zawód
            </label>
            <select
              value={profession}
              onChange={(e) => {
                const v = e.target.value as Profession;
                setProfession(v);
                if (!isOtherProfession(v)) setProfessionOther("");

                setRequiredPoints(
                  RULES_BY_PROFESSION[v]?.requiredPoints ??
                    DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[v] ??
                    200
                );

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
              {PROFESSION_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {trybLabel}
            </label>
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
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {okresLabel}
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <input
                  value={periodStart}
                  onChange={(e) => {
                    setPeriodStart(Number(e.target.value || 0));
                    setDirty(true);
                  }}
                  type="number"
                  placeholder="Start"
                  disabled={Boolean(pwzIssueDate)}
                  className={inputCls}
                />
                <input
                  value={periodEnd}
                  onChange={(e) => {
                    setPeriodEnd(Number(e.target.value || 0));
                    setDirty(true);
                  }}
                  type="number"
                  placeholder="Koniec"
                  disabled={Boolean(pwzIssueDate)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Wymagane punkty
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
            <div className="sm:col-span-2 xl:col-span-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Jaki zawód?
              </label>
              <input
                value={professionOther}
                onChange={(e) => {
                  setProfessionOther(e.target.value);
                  setDirty(true);
                }}
                placeholder="np. Psycholog, Logopeda..."
                className={`mt-1.5 ${inputCls} ${!otherValid ? "border-red-300" : ""}`}
              />
              <p className={`mt-1 text-xs ${otherValid ? "text-slate-500" : "text-red-500"}`}>
                {otherValid
                  ? "Doprecyzowanie pomaga dopasować zasady."
                  : "Wpisz nazwę zawodu, minimum 2 znaki."}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* HERO STATUS */}
      {!isBusy ? (
        <div className="rounded-2xl border border-red-100 bg-white px-6 py-5 shadow-md ring-1 ring-red-50">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-3">
                {progress >= 100 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-300">
                    ✅ Spełniasz wymagania
                  </span>
                ) : progress >= 50 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-300">
                    🟡 Jesteś na dobrej drodze
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200">
                    ❗ Nie spełniasz wymagań
                  </span>
                )}
              </div>

              {missingPoints > 0 ? (
                <>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Brakuje Ci
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-4xl font-extrabold tracking-tight text-red-600">
                      {missingPoints} pkt
                    </span>
                    {missingEvidenceCount > 0 ? (
                      <>
                        <span className="text-xl text-slate-300">+</span>
                        <span className="text-2xl font-bold text-amber-500">
                          {missingEvidenceCount} certyfikatów
                        </span>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-1.5 text-sm text-slate-600">
                    Masz {donePoints} / {requiredPoints} pkt · okres {periodStart}–
                    {periodEnd} · {daysLeft} dni
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900">
                    Masz komplet punktów{" "}
                    <span className="text-green-600">
                      {donePoints} / {requiredPoints} pkt
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Okres {periodStart}–{periodEnd} · {daysLeft} dni do końca
                  </div>
                </>
              )}

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {Math.round(progress)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    {donePoints} / {requiredPoints} pkt
                  </span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 transition-all duration-700"
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    Ukończone:{" "}
                    <strong className="text-slate-900">{inPeriodDone.length}</strong>
                  </span>
                  <span>
                    Zaplanowane:{" "}
                    <strong className="text-slate-900">{inPeriodPlanned.length}</strong>
                  </span>
                  {missingEvidenceCount > 0 ? (
                    <span className="font-semibold text-amber-600">
                      Bez certyfikatu: {missingEvidenceCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="shrink-0 sm:w-72">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-600">
                  Co teraz zrobić
                </div>
                <div className="mt-2 text-base font-bold text-slate-900">
                  {nextStep.title}
                </div>
                <div className="mt-1 text-sm text-slate-600">{nextStep.description}</div>
                <Link
                  href={nextStep.ctaHref}
                  className="mt-4 block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.99]"
                >
                  {nextStep.ctaLabel}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-600">
              📅 <strong className="text-slate-900">{daysLeft}</strong> dni
            </span>
            <span className="text-slate-600">
              📄{" "}
              <strong
                className={missingEvidenceCount > 0 ? "text-amber-600" : "text-slate-900"}
              >
                {Math.round(evidencePct)}% dokumentów
              </strong>
            </span>
            <span className="text-slate-600">
              🎯 <strong className="text-slate-900">{requiredPoints} pkt</strong>{" "}
              wymagane
            </span>
            <span className="text-slate-600">
              👤{" "}
              <strong className="text-slate-800">
                {displayProfession(profession, professionOther)}
              </strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Wczytuję dane...
        </div>
      )}

      {/* REGUŁY I LIMITY */}
      <div className={sectionCls}>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Twoje limity</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Najbardziej ograniczające kategorie w tym okresie
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-slate-600">
              Zaliczone:{" "}
              <span className="font-bold text-slate-900">{donePoints} pkt</span>
            </span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="text-slate-600">
              Brakuje:{" "}
              <span className="font-bold text-red-500">{missingPoints} pkt</span>
            </span>
          </div>
        </div>

        <div className="p-6">
          {(planInfo || planErr) && (
            <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
              {planInfo ? <p className="font-semibold text-blue-700">{planInfo}</p> : null}
              {planErr ? <p className="font-semibold text-red-600">{planErr}</p> : null}
            </div>
          )}

          <div className="space-y-3">
            {limitsUsage.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                Brak zdefiniowanych limitów dla tego zawodu.
              </div>
            ) : (
              limitsUsage.map((r) => {
                const isMax =
                  (r.usedPct ?? 0) >= 100 || (Number(r.remaining) || 0) <= 0;

                return (
                  <div
                    key={r.key}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {r.label}
                        </span>
                        {isMax ? (
                          <span className="rounded-md border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                            ✓
                          </span>
                        ) : null}
                      </div>

                      <div className="text-xs text-slate-500">
                        {r.mode === "per_item"
                          ? `max ${r.cap} pkt / szkolenie`
                          : r.mode === "per_year"
                          ? `max ${r.maxPoints} pkt / rok`
                          : `max ${r.cap} pkt w okresie`}
                        {" · "}
                        {r.used === 0 ? (
                          <span className="italic text-slate-400">Nie rozpoczęto</span>
                        ) : (
                          <span>
                            {Math.round(r.used)} / {Math.round(r.cap)} pkt
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              r.usedPct >= 100
                                ? "bg-green-400"
                                : r.usedPct >= 50
                                ? "bg-blue-400"
                                : "bg-slate-400"
                            }`}
                            style={{ width: `${r.usedPct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-bold text-slate-700">
                          {Math.round(r.usedPct)}%
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isMax ? (
                        <Link
                          href="/aktywnosci"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Zobacz
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy || planningKey === r.key}
                          onClick={() => planForRule(r)}
                          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-slate-700 disabled:opacity-40"
                        >
                          {planningKey === r.key ? "Dodaję..." : "+ Zaplanuj"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Link
              href="/aktywnosci"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Aktywności →
            </Link>
            <Link
              href="/aktywnosci?new=1"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              + Dodaj aktywność
            </Link>
            <Link
              href="/portfolio"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Raport / PDF →
            </Link>
          </div>
        </div>
      </div>

      {/* OSTATNIE AKTYWNOŚCI */}
      <div className={sectionCls}>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Ostatnie aktywności
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs text-slate-500">
                Wpisy {periodStart}–{periodEnd}
              </p>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />{" "}
                zaplanowane
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />{" "}
                braki
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400" />{" "}
                kompletne
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/aktywnosci"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Aktywności
            </Link>
            <Link
              href="/portfolio"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Raporty / PDF
            </Link>
            <Link
              href="/baza-szkolen"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Baza szkoleń
            </Link>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {isBusy ? (
              <p className="text-sm text-slate-500">Wczytuję...</p>
            ) : recentRows.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
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
                      "rounded-xl border border-slate-200 p-4 shadow-sm transition hover:shadow-md",
                      prog === "planned"
                        ? "bg-blue-50/25"
                        : missing.length
                        ? "bg-amber-50/30"
                        : "bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {a.type}
                          </span>

                          {prog === "planned" ? (
                            <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                              Zaplanowane
                            </span>
                          ) : (
                            <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
                              Ukończone
                            </span>
                          )}

                          {missing.length === 0 ? (
                            <span className="rounded-md border border-green-100 bg-green-50 px-2 py-0.5 text-xs text-green-600">
                              Kompletne
                            </span>
                          ) : (
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              Braki
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {a.organizer ? `${a.organizer} · ` : ""}
                          Rok: <span className="font-medium text-slate-700">{a.year}</span>
                          {prog === "planned" && a.planned_start_date ? (
                            <>
                              {" "}
                              · Termin:{" "}
                              <span className="font-medium text-slate-700">
                                {formatYMD(a.planned_start_date)}
                              </span>
                            </>
                          ) : null}
                        </p>

                        {missing.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {missing.map((m) => (
                              <span
                                key={m}
                                className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          +{a.points} pkt
                        </span>
                        <Link
                          href="/aktywnosci"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Otwórz →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {recentRows.length >= 5 ? (
            <div className="mt-4 border-t border-slate-100 pt-4 text-center">
              <Link
                href="/aktywnosci"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Zobacz wszystkie aktywności →
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
