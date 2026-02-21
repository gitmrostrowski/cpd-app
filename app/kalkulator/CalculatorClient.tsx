// app/kalkulator/CalculatorClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

import CpdStatusPanel, {
  type TopLimitItem,
} from "@/components/dashboard/CpdStatusPanel";

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

function buildNextStep(
  missingPoints: number,
  missingEvidenceCount: number,
  limitWarning: string | null
) {
  if (missingEvidenceCount > 0) {
    return {
      title: "Uzupełnij dokumenty",
      description: `Masz ${missingEvidenceCount} wpisów bez certyfikatu. Dodaj zdjęcia/PDF-y, aby zestawienie było gotowe w każdej chwili.`,
      // ✅ jednoznacznie: nie "Dodaj dokumenty" (żeby nie robić dubla w UI)
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

  const supabase = useMemo(() => supabaseClient(), []);

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

  return (
    <div className="space-y-6">
      {/* USTAWIENIA */}
      <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/50 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900">
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
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
          >
            Przywróć domyślne
          </button>
        </div>

        {/* ✅ grid stabilny + "Inne" przeniesione do osobnego wiersza */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Zawód</label>
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
            <label className="text-xs font-semibold text-slate-600">Tryb okresu</label>
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
              <label className="text-xs font-semibold text-slate-600">Okres (preset)</label>
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
              <label className="text-xs font-semibold text-slate-600">Okres (indywidualny)</label>
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
            <label className="text-xs font-semibold text-slate-600">Wymagane punkty</label>
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

          {/* ✅ osobny wiersz na "Jaki zawód?" — nie psuje szerokości kafla */}
          {otherRequired ? (
            <div className="md:col-span-2 xl:col-span-4">
              <label className="text-xs font-semibold text-slate-600">Jaki zawód?</label>
              <input
                value={professionOther}
                onChange={(e) => setProfessionOther(e.target.value)}
                onBlur={async () => {
                  const norm = normalizeOtherProfession(professionOther);
                  setProfessionOther(norm);
                  await saveProfilePatch({ profession_other: norm || null });
                }}
                placeholder="np. Psycholog, Logopeda, Technik elektroradiolog…"
                className={`mt-1 w-full rounded-2xl border bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
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

      {/* PANEL STATUSU (owijka daje „głębię”, nawet jeśli panel ma swoje tło) */}
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

      {/* Reszta strony */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm ring-1 ring-slate-200/50 backdrop-blur lg:col-span-2">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Reguły i limity</div>
              <div className="mt-1 text-sm text-slate-600">
                Limity cząstkowe i wykorzystanie na podstawie ukończonych wpisów w okresie {periodLabel}.
              </div>
            </div>
            <div className="text-sm text-slate-700">
              Zaliczone: <span className="font-extrabold text-slate-900">{donePoints} pkt</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {limitsUsage.map((r) => (
              <div
                key={r.key}
                className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 ring-1 ring-slate-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">{r.label}</div>
                    {r.note ? (
                      <div className="mt-1 text-xs text-slate-600">
                        {r.note}
                        {r.mode === "per_year" ? ` (×${r.yearsInPeriod} lat)` : ""}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-sm font-extrabold text-slate-900">
                      {Math.round(r.used)} / {Math.round(r.cap)}
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      Pozostało: {Math.round(r.remaining)} pkt
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  {/* ✅ grubszy, czytelniejszy pasek */}
                  <div className="h-3 rounded-full bg-slate-200/80">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                      style={{ width: `${r.usedPct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm">
            <Link href="/aktywnosci" className="font-semibold text-blue-700 hover:text-blue-800">
              Przejdź do Aktywności, żeby dodać/edytować wpisy →
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm ring-1 ring-slate-200/50 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold text-slate-900">Ostatnie aktywności</div>
            <Link href="/aktywnosci" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Przejdź →
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {isBusy ? (
              <div className="text-sm text-slate-600">Wczytuję…</div>
            ) : inPeriodDone.slice(0, 5).length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white/70 p-3 text-sm text-slate-700">
                Brak ukończonych aktywności w okresie {periodLabel}.
              </div>
            ) : (
              inPeriodDone.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-2xl border border-slate-200/70 bg-white/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{a.type}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {a.organizer ? `${a.organizer} • ` : ""}
                        {a.year}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700">
                      ukończone
                    </div>
                  </div>

                  <div className="mt-2 text-right text-sm font-extrabold text-slate-900">
                    +{a.points} pkt
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
