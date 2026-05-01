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
    description: "Dodaj wpisy jako „plan”, a potem uzupełniaj certyfikaty.",
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

function IconSoft({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
      {children}
    </span>
  );
}

function FieldLabel({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
      {icon}
      {title}
    </div>
  );
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

  const daysLeft = useMemo(() => {
    return daysUntilEndOfYear(periodEnd);
  }, [periodEnd]);

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
    return `Limit „${hit.label}” jest osiągnięty — kolejne podobne aktywności mogą nie zwiększyć punktów w tym okresie.`;
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
    ? "Okres (preset)"
    : "Okres (indywidualny)";

  return (
    <div className="space-y-6">
      {/* USTAWIENIA */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <IconSoft>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                  <path d="M19.4 15a7.97 7.97 0 0 0 .1-1 7.97 7.97 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8.1 8.1 0 0 0-1.7-1l-.4-2.6H9.1l-.4 2.6a8.1 8.1 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.97 7.97 0 0 0-.1 1c0 .34.03.67.1 1l-2 1.5 2 3.5 2.4-1a8.1 8.1 0 0 0 1.7 1l.4 2.6h5.8l.4-2.6a8.1 8.1 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z" />
                </svg>
              </IconSoft>
              Ustawienia okresu i zawodu
            </div>

            <div className="mt-1 text-xs text-slate-600">
              Zmiany zapisujesz przyciskiem po prawej.
              {savedAt && !dirty && !savingProfile ? (
                <span className="ml-2 font-semibold text-emerald-700">Zapisano</span>
              ) : null}
              {!otherValid ? (
                <span className="ml-2 font-semibold text-rose-700">
                  Uzupełnij „Inny zawód”
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:justify-end">
            <button
              type="button"
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v6h6" />
                </svg>
              </span>
              Przywróć domyślne
            </button>

            <button
              type="button"
              onClick={saveAllSettings}
              disabled={isBusy || savingProfile || !dirty || !otherValid}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {savingProfile ? "Zapisuję…" : "Zapisz zmiany"}
            </button>

            <Link
              href="/profil"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Profil →
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <FieldLabel
              icon={
                <IconSoft>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                    <path d="M7 4h10" />
                    <path d="M7 4c0 5 2 6 5 8 3-2 5-3 5-8" />
                    <path d="M9 12h6" />
                  </svg>
                </IconSoft>
              }
              title="Zawód"
            />

            <select
              value={profession}
              onChange={(e) => {
                const v = e.target.value as Profession;
                setProfession(v);

                if (!isOtherProfession(v)) setProfessionOther("");

                const rp =
                  RULES_BY_PROFESSION[v]?.requiredPoints ??
                  DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[v] ??
                  200;

                setRequiredPoints(rp);

                if (pwzIssueDate) {
                  const derived = getPeriodFromPwzIssueDate(v, pwzIssueDate);
                  if (derived) {
                    setPeriodMode("custom");
                    setPeriodStart(derived.start);
                    setPeriodEnd(derived.end);
                  }
                }

                setDirty(true);
              }}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {PROFESSION_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel
              icon={
                <IconSoft>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 8v4l3 2" />
                    <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" />
                  </svg>
                </IconSoft>
              }
              title={trybLabel}
            />

            <select
              value={periodMode}
              onChange={(e) => {
                const v = e.target.value as "preset" | "custom";
                setPeriodMode(v);

                if (v === "custom" && pwzIssueDate) {
                  const derived = getPeriodFromPwzIssueDate(profession, pwzIssueDate);
                  if (derived) {
                    setPeriodStart(derived.start);
                    setPeriodEnd(derived.end);
                  }
                }

                setDirty(true);
              }}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="preset">Preset (najczęstszy)</option>
              <option value="custom">Indywidualny</option>
            </select>
          </div>

          {periodMode === "preset" && !pwzIssueDate ? (
            <div>
              <FieldLabel
                icon={
                  <IconSoft>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 2v4" />
                      <path d="M16 2v4" />
                      <path d="M3 10h18" />
                      <path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
                    </svg>
                  </IconSoft>
                }
                title={okresLabel}
              />

              <select
                value={periodLabel}
                onChange={(e) => {
                  const [a, b] = e.target.value.split("-").map((x) => Number(x));
                  setPeriodStart(a);
                  setPeriodEnd(b);
                  setDirty(true);
                }}
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="2019-2022">2019-2022</option>
                <option value="2023-2026">2023-2026</option>
                <option value="2027-2030">2027-2030</option>
              </select>
            </div>
          ) : (
            <div className="xl:col-span-1">
              <FieldLabel
                icon={
                  <IconSoft>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 2v4" />
                      <path d="M16 2v4" />
                      <path d="M3 10h18" />
                      <path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
                    </svg>
                  </IconSoft>
                }
                title={okresLabel}
              />

              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  value={periodStart}
                  onChange={(e) => {
                    setPeriodStart(Number(e.target.value || 0));
                    setDirty(true);
                  }}
                  type="number"
                  className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Start"
                  disabled={Boolean(pwzIssueDate)}
                />

                <input
                  value={periodEnd}
                  onChange={(e) => {
                    setPeriodEnd(Number(e.target.value || 0));
                    setDirty(true);
                  }}
                  type="number"
                  className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Koniec"
                  disabled={Boolean(pwzIssueDate)}
                />
              </div>
            </div>
          )}

          <div>
            <FieldLabel
              icon={
                <IconSoft>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21l2-7.8L2 9h7l3-7Z" />
                  </svg>
                </IconSoft>
              }
              title="Wymagane punkty — domyślne"
            />

            <input
              value={requiredPoints}
              onChange={(e) => {
                setRequiredPoints(Number(e.target.value || 0));
                setDirty(true);
              }}
              type="number"
              min={0}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {otherRequired ? (
            <div className="md:col-span-2 xl:col-span-4">
              <FieldLabel
                icon={
                  <IconSoft>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                    </svg>
                  </IconSoft>
                }
                title="Jaki zawód?"
              />

              <input
                value={professionOther}
                onChange={(e) => {
                  setProfessionOther(e.target.value);
                  setDirty(true);
                }}
                placeholder="np. Psycholog, Logopeda, Technik elektroradiolog…"
                className={`mt-2 h-11 w-full rounded-2xl border bg-white px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  otherValid
                    ? "border-slate-200/70 focus:ring-blue-200"
                    : "border-rose-200/70 focus:ring-rose-200"
                }`}
              />

              <p className={`mt-2 text-[11px] ${otherValid ? "text-slate-500" : "text-rose-700"}`}>
                {otherValid
                  ? "Doprecyzowanie pomaga dopasować zasady i raporty."
                  : "Wpisz nazwę zawodu (min. 2 znaki), żeby profil był kompletny."}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* PANEL STATUSU */}
      <div className="rounded-3xl bg-white/30 shadow-lg ring-1 ring-slate-200/60 backdrop-blur">
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

      {/* REGUŁY I LIMITY */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Reguły i limity</div>
            <div className="mt-1 text-sm text-slate-600">
              Limity cząstkowe i wykorzystanie na podstawie ukończonych wpisów w okresie{" "}
              {periodStart}-{periodEnd}.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="text-slate-700">
              Zaliczone: <span className="font-extrabold text-slate-900">{donePoints} pkt</span>
            </div>

            <span className="text-slate-300">•</span>

            <div className="text-slate-700">
              Brakuje: <span className="font-extrabold text-slate-900">{missingPoints} pkt</span>
            </div>

            {missingEvidenceCount > 0 ? (
              <>
                <span className="text-slate-300">•</span>
                <div className="text-slate-700">
                  Bez certyfikatu:{" "}
                  <span className="font-extrabold text-slate-900">{missingEvidenceCount}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {planInfo || planErr ? (
          <div className="mt-4 rounded-2xl border bg-[#fbfaf7] p-3 text-sm">
            {planInfo ? <div className="font-semibold text-emerald-700">{planInfo}</div> : null}
            {planErr ? <div className="font-semibold text-rose-700">{planErr}</div> : null}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {limitsUsage.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/70 bg-[#fbfaf7] p-4 text-sm text-slate-700">
              Brak zdefiniowanych limitów dla tego zawodu.
            </div>
          ) : (
            limitsUsage.map((r) => {
              const isMax = (r.usedPct ?? 0) >= 100 || (Number(r.remaining) || 0) <= 0;

              return (
                <div
                  key={r.key}
                  className="w-full rounded-2xl border border-slate-200/70 bg-[#fbfaf7] p-4 ring-1 ring-slate-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <div className="text-sm font-extrabold text-slate-900">{r.label}</div>

                        {r.note ? (
                          <div className="text-xs font-semibold text-slate-600">
                            {r.note}
                            {r.mode === "per_year" ? ` (×${r.yearsInPeriod} lat)` : ""}
                          </div>
                        ) : null}

                        {isMax ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                            W pełni zrealizowane
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-slate-600">
                        {Math.round(r.used)} / {Math.round(r.cap)} pkt • {Math.round(r.usedPct)}%
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isMax ? (
                        <Link
                          href="/aktywnosci"
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Zobacz wpisy
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy || planningKey === r.key}
                          onClick={() => planForRule(r)}
                          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {planningKey === r.key ? "Dodaję…" : "Zaplanuj aktywność"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-slate-200/80">
                        <div className="h-3 rounded-full bg-blue-600" style={{ width: `${r.usedPct}%` }} />
                      </div>
                    </div>

                    <div className="shrink-0 text-xs font-semibold text-slate-700">
                      Pozostało: <span className="font-extrabold">{Math.round(r.remaining)}</span> pkt
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/aktywnosci"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Przejdź do Aktywności →
          </Link>

          <Link
            href="/aktywnosci?new=1"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            + Dodaj aktywność
          </Link>

          <Link
            href="/portfolio"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Raport / PDF →
          </Link>
        </div>
      </div>

      {/* OSTATNIE AKTYWNOŚCI */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Ostatnie aktywności</div>
            <div className="mt-1 text-sm text-slate-600">
              Ostatnio dodane wpisy w okresie {periodStart}-{periodEnd} z sygnalizacją braków.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/aktywnosci"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Aktywności
            </Link>

            <Link
              href="/portfolio"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Raporty / PDF
            </Link>

            <Link
              href="/baza-szkolen"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Baza szkoleń
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {authLoading || loading ? (
            <div className="text-sm text-slate-600">Wczytuję…</div>
          ) : recentRows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/70 bg-[#fbfaf7] p-4 text-sm text-slate-700">
              Brak wpisów w okresie {periodStart}-{periodEnd}.
            </div>
          ) : (
            recentRows.map((a) => {
              const prog = normalizeStatus(a.status);
              const missing = getRowMissing(a);

              return (
                <div
                  key={a.id}
                  className={[
                    "rounded-2xl border p-4",
                    prog === "planned"
                      ? "border-blue-200 bg-blue-50/40"
                      : missing.length
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-slate-200 bg-[#fbfaf7]",
                  ].join(" ")}
                >
                  <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0 truncate text-sm font-semibold text-slate-900">
                          {a.type}
                        </div>

                        {prog === "planned" ? (
                          <span className="inline-flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            🗓️ Zaplanowane
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                            ✅ Ukończone
                          </span>
                        )}

                        {missing.length === 0 ? (
                          <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                            Kompletne
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                            Braki
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-sm font-extrabold text-slate-900">+{a.points} pkt</div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs text-slate-600">
                        {a.organizer ? `${a.organizer} • ` : ""}
                        Rok: <span className="font-semibold text-slate-900">{a.year}</span>
                        {prog === "planned" ? (
                          <>
                            {" "}
                            • Termin:{" "}
                            <span className="font-semibold text-slate-900">
                              {formatYMD(a.planned_start_date)}
                            </span>
                          </>
                        ) : null}
                      </div>

                      {missing.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {missing.map((m) => (
                            <span
                              key={m}
                              className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 md:justify-self-end">
                      <Link
                        href="/aktywnosci"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Otwórz w Aktywnościach →
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
  );
}
