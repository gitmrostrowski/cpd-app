// app/kalkulator/CalculatorClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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
  planned_start_date?: string | null; // YYYY-MM-DD
  training_id?: string | null;

  certificate_path?: string | null;
  certificate_name?: string | null;
  certificate_mime?: string | null;
  certificate_size?: number | null;
  certificate_uploaded_at?: string | null;
};

type ProfileRow = {
  user_id: string;
  profession: Profession | null;
  profession_other?: string | null;
  period_start: number | null;
  period_end: number | null;
  required_points: number | null;
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

  const step = rule.mode === "per_item" ? 2 : rule.mode === "per_year" ? 5 : 5;
  return Math.max(1, Math.min(rem, step));
}

function ValuePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
      {children}
    </span>
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
      if (!user?.id) return;
      setLoading(true);

      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, profession, profession_other, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (!pErr && p) {
          setProfile(p as ProfileRow);

          const prof = (p.profession ?? "Lekarz") as Profession;
          setProfession(prof);

          const po = normalizeOtherProfession((p as any).profession_other);
          setProfessionOther(po);

          const ps = p.period_start ?? 2023;
          const pe = p.period_end ?? 2026;
          setPeriodStart(ps);
          setPeriodEnd(pe);

          const presetLabel = `${ps}-${pe}`;
          const isPreset =
            presetLabel === "2019-2022" || presetLabel === "2023-2026" || presetLabel === "2027-2030";
          setPeriodMode(isPreset ? "preset" : "custom");

          const rp =
            p.required_points ??
            DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ??
            RULES_BY_PROFESSION[prof]?.requiredPoints ??
            200;

          setRequiredPoints(rp);
        } else {
          const prof: Profession = "Lekarz";
          setProfession(prof);
          setProfessionOther("");
          setPeriodStart(2023);
          setPeriodEnd(2026);
          setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200);
          setPeriodMode("preset");
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

  async function saveProfilePatch(patch: Partial<ProfileRow> & { profession_other?: string | null }) {
    if (!user?.id) return;
    setSavingProfile(true);

    const nextProfession = (patch.profession ?? profession) as Profession;

    const nextPeriodStart = patch.period_start !== undefined ? patch.period_start : periodStart;
    const nextPeriodEnd = patch.period_end !== undefined ? patch.period_end : periodEnd;
    const nextRequiredPoints =
      patch.required_points !== undefined ? patch.required_points : requiredPoints;

    const otherReq = isOtherProfession(nextProfession);

    const rawOther = patch.profession_other !== undefined ? patch.profession_other : professionOther;
    const nextOther = otherReq ? normalizeOtherProfession(rawOther) || null : null;

    const payload: ProfileRow = {
      user_id: user.id,
      profession: nextProfession,
      profession_other: nextOther,
      period_start: nextPeriodStart,
      period_end: nextPeriodEnd,
      required_points: nextRequiredPoints,
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    setSavingProfile(false);
    if (!error) setSavedAt(Date.now());
  }

  const profileLabelForPanel = useMemo(() => {
    return displayProfession(profession, professionOther);
  }, [profession, professionOther]);

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

  return (
    <div className="space-y-6">
      {/* USTAWIENIA */}
      <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/50 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl border border-slate-200 bg-white/80">
                ⚙️
              </span>
              Ustawienia okresu i zawodu
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>Zmiany zapisujemy w profilu.</span>
              <span className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                {savingProfile ? "Zapisywanie…" : savedAt ? "Zapisano" : "—"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const prof: Profession = "Lekarz";
              setProfession(prof);
              setProfessionOther("");
              setPeriodStart(2023);
              setPeriodEnd(2026);
              setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200);
              setPeriodMode("preset");

              await saveProfilePatch({
                profession: prof,
                profession_other: null,
                period_start: 2023,
                period_end: 2026,
                required_points: DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200,
              });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              ↺
            </span>
            Przywróć domyślne
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                  🧑‍⚕️
                </span>
                Zawód
              </span>
              <ValuePill>{profession}</ValuePill>
            </label>

            <select
              value={profession}
              onChange={async (e) => {
                const v = e.target.value as Profession;

                setProfession(v);
                if (!isOtherProfession(v)) setProfessionOther("");

                const rp =
                  RULES_BY_PROFESSION[v]?.requiredPoints ??
                  DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[v] ??
                  200;

                setRequiredPoints(rp);

                await saveProfilePatch({
                  profession: v,
                  required_points: rp,
                  profession_other: isOtherProfession(v) ? professionOther : null,
                });
              }}
              className="mt-1 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {PROFESSION_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                  ⏱️
                </span>
                Tryb okresu
              </span>
              <ValuePill>{periodMode === "preset" ? "Preset" : "Indywidualny"}</ValuePill>
            </label>

            <select
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value as "preset" | "custom")}
              className="mt-1 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="preset">Preset (najczęstszy)</option>
              <option value="custom">Indywidualny</option>
            </select>

            <p className="mt-1 text-[11px] text-slate-500">
              Jeśli masz inny zakres (np. start od uzyskania PWZ), wybierz „Indywidualny”.
            </p>
          </div>

          {periodMode === "preset" ? (
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-slate-900">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                    🗓️
                  </span>
                  Okres (preset)
                </span>
                <ValuePill>{periodLabel}</ValuePill>
              </label>

              <select
                value={periodLabel}
                onChange={async (e) => {
                  const [a, b] = e.target.value.split("-").map((x) => Number(x));
                  setPeriodStart(a);
                  setPeriodEnd(b);
                  await saveProfilePatch({ period_start: a, period_end: b });
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="2019-2022">2019-2022</option>
                <option value="2023-2026">2023-2026</option>
                <option value="2027-2030">2027-2030</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-slate-900">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                    📅
                  </span>
                  Okres (indywidualny)
                </span>
                <ValuePill>
                  {periodStart}-{periodEnd}
                </ValuePill>
              </label>

              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  value={periodStart}
                  onChange={(e) => setPeriodStart(Number(e.target.value || 0))}
                  onBlur={async () => {
                    if (periodEnd < periodStart) setPeriodEnd(periodStart);
                    await saveProfilePatch({
                      period_start: periodStart,
                      period_end: Math.max(periodEnd, periodStart),
                    });
                  }}
                  type="number"
                  className="w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Start"
                />
                <input
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(Number(e.target.value || 0))}
                  onBlur={async () => {
                    const pe = Math.max(periodEnd, periodStart);
                    setPeriodEnd(pe);
                    await saveProfilePatch({ period_end: pe });
                  }}
                  type="number"
                  className="w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Koniec"
                />
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                  🎯
                </span>
                Wymagane punkty
              </span>
              <ValuePill>{requiredPoints}</ValuePill>
            </label>

            <input
              value={requiredPoints}
              onChange={(e) => setRequiredPoints(Number(e.target.value || 0))}
              onBlur={async () => {
                await saveProfilePatch({ required_points: requiredPoints });
              }}
              type="number"
              min={0}
              className="mt-1 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />

            <p className="mt-1 text-[11px] text-slate-500">
              Domyślnie: {DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[profession] ?? requiredPoints}
            </p>
          </div>

          {otherRequired ? (
            <div className="md:col-span-2 xl:col-span-4">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-900">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                    ✍️
                  </span>
                  Jaki zawód?
                </span>
                <ValuePill>{normalizeOtherProfession(professionOther) || "—"}</ValuePill>
              </label>

              <input
                value={professionOther}
                onChange={(e) => setProfessionOther(e.target.value)}
                onBlur={async () => {
                  const norm = normalizeOtherProfession(professionOther);
                  setProfessionOther(norm);
                  await saveProfilePatch({ profession_other: norm || null });
                }}
                placeholder="np. Psycholog, Logopeda, Technik elektroradiolog…"
                className={`mt-1 w-full rounded-2xl border bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  otherValid
                    ? "border-slate-200/70 focus:ring-blue-200"
                    : "border-rose-200/70 focus:ring-rose-200"
                }`}
              />
              <p className={`mt-1 text-[11px] ${otherValid ? "text-slate-500" : "text-rose-700"}`}>
                {otherValid
                  ? "Doprecyzowanie pomaga dopasować zasady i raporty."
                  : "Wpisz nazwę zawodu (min. 2 znaki), żeby profil był kompletny."}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* PANEL STATUSU */}
      <div className="rounded-3xl ring-1 ring-slate-200/60 shadow-lg bg-white/40 backdrop-blur">
        <CpdStatusPanel
          isBusy={isBusy}
          userEmail={user?.email ?? null}
          profileProfession={profileLabelForPanel}
          periodLabel={periodLabel}
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

      {/* NOWY UKŁAD */}
      <div className="space-y-5">
        {/* REGUŁY I LIMITY */}
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm ring-1 ring-slate-200/50 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Reguły i limity</div>
              <div className="mt-1 text-sm text-slate-600">
                Limity cząstkowe i wykorzystanie na podstawie ukończonych wpisów w okresie {periodLabel}.
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

          {(planInfo || planErr) ? (
            <div className="mt-4 rounded-2xl border bg-white/70 p-3 text-sm">
              {planInfo ? <div className="text-emerald-700 font-semibold">{planInfo}</div> : null}
              {planErr ? <div className="text-rose-700 font-semibold">{planErr}</div> : null}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {limitsUsage.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm text-slate-700">
                Brak zdefiniowanych limitów dla tego zawodu.
              </div>
            ) : (
              limitsUsage.map((r) => {
                const isMax = (r.usedPct ?? 0) >= 100 || (Number(r.remaining) || 0) <= 0;

                return (
                  <div
                    key={r.key}
                    className="w-full rounded-2xl border border-slate-200/70 bg-white/80 p-4 ring-1 ring-slate-100"
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
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
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
                          <div
                            className="h-3 rounded-full bg-blue-600"
                            style={{ width: `${r.usedPct}%` }}
                          />
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
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
            >
              Przejdź do Aktywności →
            </Link>
            <Link
              href="/aktywnosci?new=1"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
            >
              + Dodaj aktywność
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
            >
              Raport / PDF →
            </Link>
          </div>
        </div>

        {/* OSTATNIE AKTYWNOŚCI */}
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm ring-1 ring-slate-200/50 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Ostatnie aktywności</div>
              <div className="mt-1 text-sm text-slate-600">
                Ostatnio dodane wpisy w okresie {periodLabel} (z sygnalizacją braków).
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/aktywnosci"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
              >
                Aktywności
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
              >
                Raporty / PDF
              </Link>
              <Link
                href="/baza-szkolen"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
              >
                Baza szkoleń
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {isBusy ? (
              <div className="text-sm text-slate-600">Wczytuję…</div>
            ) : recentRows.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm text-slate-700">
                Brak wpisów w okresie {periodLabel}.
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
                        : "border-slate-200 bg-white/80",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="min-w-0 truncate text-sm font-semibold text-slate-900">{a.type}</div>

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

                        <div className="mt-1 text-xs text-slate-600">
                          {a.organizer ? `${a.organizer} • ` : ""}
                          Rok: <span className="font-semibold text-slate-900">{a.year}</span>
                          {prog === "planned" ? (
                            <>
                              {" "}
                              • Termin:{" "}
                              <span className="font-semibold text-slate-900">{formatYMD(a.planned_start_date)}</span>
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

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-extrabold text-slate-900">+{a.points} pkt</div>
                        <Link
                          href="/aktywnosci"
                          className="mt-2 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
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
    </div>
  );
}// components/dashboard/CpdStatusPanel.tsx
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

const BTN_BASE =
  "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors";
const PRIMARY_BTN = "bg-blue-600 hover:bg-blue-700 text-white shadow-sm";
const OUTLINE_BTN =
  "border border-slate-200/70 bg-white/80 text-slate-800 hover:bg-white backdrop-blur";

const PRIMARY_BAR = "bg-blue-600";
const PRIMARY_DOT = "bg-blue-700";

type DocTone = "ok" | "warn" | "bad";

function statusFromCompleteness(pointsPct: number, evidencePct: number, doneCount: number) {
  const p = clamp(pointsPct, 0, 100);
  const e = clamp(evidencePct, 0, 100);

  if (doneCount <= 0) {
    return {
      label: "Wymaga uzupełnienia",
      tone: "warn" as const,
      reason: "brak wpisów",
      hint: "Dodaj pierwszą aktywność i dokument (certyfikat), aby zacząć budować archiwum.",
    };
  }

  if (p >= 85 && e >= 90) {
    return {
      label: "Dokumentacja kompletna",
      tone: "ok" as const,
      reason: "wysoka kompletność",
      hint: "Masz dobrą kompletność punktów i dokumentów. Zestawienie możesz pobrać w każdej chwili.",
    };
  }

  if (p < 35 || e < 50) {
    return {
      label: "Dokumentacja niekompletna",
      tone: "bad" as const,
      reason: "niska kompletność",
      hint: "Uzupełnij dokumenty i zaplanuj aktywności, aby archiwum było spójne i gotowe do wykorzystania.",
    };
  }

  return {
    label: "Wymaga uzupełnienia",
    tone: "warn" as const,
    reason: "częściowe braki",
    hint: "Uzupełnij dokumenty i zaplanuj aktywności, żeby domknąć okres bez stresu.",
  };
}

function ToneBadge({
  tone,
  label,
  reason,
  attention,
}: {
  tone: DocTone;
  label: string;
  reason: string;
  attention?: boolean;
}) {
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

      {attention ? (
        <span className="ml-1 inline-flex items-center gap-2 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Wymaga uwagi
        </span>
      ) : null}
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

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${cls}`}>
      {text}
    </span>
  );
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
      {/* ✅ badge przeniesione na linię z 0/6 pkt i wyrównane do prawej */}
      <div className="min-w-0">
        <div className="truncate text-xs font-extrabold text-slate-900">{item.label}</div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold text-slate-600">
            {Math.round(item.used)}/{Math.round(item.cap)} pkt
          </div>
          <LimitBadge tone={t.tone} text={t.badge} />
        </div>
      </div>

      <div className="mt-2">
        <div className="h-3 rounded-full bg-slate-200/70">
          <div className={`h-3 rounded-full ${PRIMARY_BAR}`} style={{ width: `${pct}%` }} />
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

  const docsActionNeeded = missingEvidenceCount > 0;

  const primary =
    docsActionNeeded
      ? { href: "/aktywnosci", label: "Uzupełnij dokumenty" }
      : missingPoints > 0
      ? { href: primaryCtaHref, label: "+ Dodaj aktywność" }
      : { href: portfolioHref, label: "Zestawienie PDF" };

  const secondary =
    docsActionNeeded
      ? { href: primaryCtaHref, label: "+ Dodaj aktywność" }
      : { href: "/aktywnosci", label: "Aktywności" };

  const showNextStepCta =
    !!nextStep.ctaHref &&
    !!nextStep.ctaLabel &&
    !(docsActionNeeded && nextStep.ctaHref === primary.href);

  const dotLeft = clamp(pointsPct, 0, 100);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-lg ring-1 ring-slate-200/50 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-semibold text-slate-600">Panel CPD</div>

              <ToneBadge tone={status.tone} label={status.label} reason={status.reason} attention={docsActionNeeded} />

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
                <div className="relative h-5 rounded-full bg-slate-200/70">
                  <div className={`h-5 rounded-full ${PRIMARY_BAR}`} style={{ width: `${pointsPct}%` }} />
                  <div
                    className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white ${PRIMARY_DOT} shadow`}
                    style={{ left: `calc(${dotLeft}% - 10px)` }}
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

            <div
              className={
                docsActionNeeded
                  ? "rounded-2xl border border-rose-200/70 bg-rose-50/60 p-4 shadow-sm"
                  : "rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 shadow-sm"
              }
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-slate-600">Najbliższy krok</div>

                {docsActionNeeded ? (
                  <span className="inline-flex items-center gap-2 text-[11px] font-bold text-rose-700">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Do zrobienia
                  </span>
                ) : null}
              </div>

              <div className="mt-1 text-sm font-extrabold text-slate-900">{nextStep.title}</div>
              <div className="mt-1 text-sm text-slate-700">{nextStep.description}</div>

              {showNextStepCta ? (
                <Link href={nextStep.ctaHref!} className={`${BTN_BASE} ${OUTLINE_BTN} mt-3 w-full`}>
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

      {/* ✅ usunięto dolne kafle “Do uzupełnienia” i “Plan domknięcia limitu” (dublowały informacje) */}
    </div>
  );
}
