// app/kalkulator/CalculatorClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  normalizePeriod,
  calcMissing,
  calcProgress,
  getStatus,
  getQuickRecommendations,
  applyRules,
  sumPointsWithRules,
  type CpdRules,
} from "@/lib/cpd/calc";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";
import {
  type Profession,
  PROFESSION_OPTIONS,
  DEFAULT_REQUIRED_POINTS_BY_PROFESSION,
  isProfession,
} from "@/lib/cpd/professions";

type ActivityType =
  | "Kurs stacjonarny"
  | "Kurs online / webinar"
  | "Konferencja / kongres"
  | "Warsztaty praktyczne"
  | "Publikacja naukowa"
  | "Prowadzenie szkolenia"
  | "Samokształcenie"
  | "Staż / praktyka";

type ActivityStatus = "done" | "planned";

type Activity = {
  id: string;
  type: ActivityType;
  points: number;
  year: number;
  organizer?: string;
  pointsAuto?: boolean;

  status?: ActivityStatus | null;

  comment?: string;
  certificate_name?: string | null;

  // opcjonalnie — jeśli kiedyś zaczniesz ładować created_at
  created_at?: string;
};

const TYPES: ActivityType[] = [
  "Kurs stacjonarny",
  "Kurs online / webinar",
  "Konferencja / kongres",
  "Warsztaty praktyczne",
  "Publikacja naukowa",
  "Prowadzenie szkolenia",
  "Samokształcenie",
  "Staż / praktyka",
];

const DEFAULT_POINTS_BY_TYPE: Record<ActivityType, number> = {
  "Kurs stacjonarny": 15,
  "Kurs online / webinar": 10,
  "Konferencja / kongres": 20,
  "Warsztaty praktyczne": 15,
  "Publikacja naukowa": 25,
  "Prowadzenie szkolenia": 20,
  "Samokształcenie": 5,
  "Staż / praktyka": 10,
};

const PERIODS = [
  { label: "2023–2026", start: 2023, end: 2026 },
  { label: "2022–2025", start: 2022, end: 2025 },
  { label: "2021–2024", start: 2021, end: 2024 },
  { label: "Inny", start: 0, end: 0 },
] as const;

type PeriodLabel = (typeof PERIODS)[number]["label"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function formatInt(n: number) {
  return Number.isFinite(n) ? Math.round(n).toString() : "0";
}
const STORAGE_KEY = "crpe_calculator_v1";

function safeNumber(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function safeString(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function isActivityType(v: unknown): v is ActivityType {
  return typeof v === "string" && (TYPES as readonly string[]).includes(v);
}
function normalizeActivityType(v: unknown): ActivityType {
  return isActivityType(v) ? v : "Kurs online / webinar";
}
function isPeriodLabel(v: unknown): v is PeriodLabel {
  return typeof v === "string" && PERIODS.some((p) => p.label === v);
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function normalizeStatus(v: unknown): ActivityStatus {
  return v === "planned" ? "planned" : "done";
}

/**
 * Reguły na bazie zawodu (MVP).
 */
function rulesForProfession(prof: Profession): CpdRules | undefined {
  if (prof === "Lekarz" || prof === "Lekarz dentysta") {
    return {
      yearlyMaxByType: {
        Samokształcenie: 20,
      },
    };
  }
  return undefined;
}

function isValueDefaultForSomeOtherProfession(value: number, current: Profession) {
  const currentDefault = DEFAULT_REQUIRED_POINTS_BY_PROFESSION[current] ?? 0;
  if (value === currentDefault) return false;

  const defaults = Object.entries(DEFAULT_REQUIRED_POINTS_BY_PROFESSION) as Array<[Profession, number]>;
  return defaults.some(([prof, def]) => prof !== current && def === value);
}

function pillToneForProgress(progress: number) {
  if (progress >= 100) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (progress >= 60) return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

export default function CalculatorClient() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const currentYear = new Date().getFullYear();

  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [periodLabel, setPeriodLabel] = useState<PeriodLabel>("2023–2026");
  const [customStart, setCustomStart] = useState<number>(currentYear - 1);
  const [customEnd, setCustomEnd] = useState<number>(currentYear + 2);

  const [requiredPoints, setRequiredPoints] = useState<number>(
    DEFAULT_REQUIRED_POINTS_BY_PROFESSION["Lekarz"],
  );

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: uid(),
      type: "Kurs online / webinar",
      points: DEFAULT_POINTS_BY_TYPE["Kurs online / webinar"],
      year: currentYear,
      organizer: "",
      pointsAuto: true,
      comment: "",
      certificate_name: null,
      status: "done",
    },
    {
      id: uid(),
      type: "Konferencja / kongres",
      points: DEFAULT_POINTS_BY_TYPE["Konferencja / kongres"],
      year: currentYear,
      organizer: "",
      pointsAuto: true,
      comment: "",
      certificate_name: null,
      status: "done",
    },
  ]);

  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const profileLoadedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const requiredDirtyRef = useRef(false);

  function clearMessages() {
    setInfo(null);
    setErr(null);
  }

  async function saveProfilePrefs(patch: {
    profession?: Profession;
    required_points?: number;
    period_start?: number;
    period_end?: number;
  }) {
    if (!user) return;

    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          ...patch,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zapisać ustawień profilu.");
    }
  }

  /** ---------- localStorage: load (guest draft) ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed: any = JSON.parse(raw);

      const nextProfession = parsed?.profession;
      const nextPeriodLabel = parsed?.periodLabel;

      if (isProfession(nextProfession)) setProfession(nextProfession);
      if (isPeriodLabel(nextPeriodLabel)) setPeriodLabel(nextPeriodLabel);

      setCustomStart(safeNumber(parsed?.customStart, currentYear - 1));
      setCustomEnd(safeNumber(parsed?.customEnd, currentYear + 2));

      requiredDirtyRef.current =
        typeof parsed?.requiredDirty === "boolean" ? parsed.requiredDirty : false;

      const rpFallback = DEFAULT_REQUIRED_POINTS_BY_PROFESSION["Lekarz"];
      const rp = safeNumber(parsed?.requiredPoints, rpFallback);
      setRequiredPoints(Math.max(0, rp));

      const nextActivities = parsed?.activities;
      if (Array.isArray(nextActivities)) {
        const cleaned: Activity[] = nextActivities
          .map((a: any) => {
            const type: ActivityType = normalizeActivityType(a?.type);
            const year = safeNumber(a?.year, currentYear);
            const points = Math.max(0, safeNumber(a?.points, DEFAULT_POINTS_BY_TYPE[type]));
            const organizer = safeString(a?.organizer ?? "", "");
            const pointsAuto = typeof a?.pointsAuto === "boolean" ? a.pointsAuto : false;

            const comment = safeString(a?.comment ?? "", "");
            const certificate_name =
              typeof a?.certificate_name === "string" ? a.certificate_name : null;

            const status = normalizeStatus(a?.status);

            return {
              id: safeString(a?.id, uid()) || uid(),
              type,
              year,
              points,
              organizer,
              pointsAuto,
              comment,
              certificate_name,
              status,
              created_at: typeof a?.created_at === "string" ? a.created_at : undefined,
            };
          })
          .filter((a: Activity) => !!a.id);

        if (cleaned.length) setActivities(cleaned);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ---------- localStorage: save draft ---------- */
  useEffect(() => {
    try {
      const payload = {
        profession,
        periodLabel,
        customStart,
        customEnd,
        requiredPoints,
        requiredDirty: requiredDirtyRef.current,
        activities,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [profession, periodLabel, customStart, customEnd, requiredPoints, activities]);

  /** ---------- DB profile: load on login ---------- */
  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("profession, required_points, period_start, period_end")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!alive) return;
        if (error) return;

        const dbProfession =
          data?.profession && isProfession(data.profession) ? (data.profession as Profession) : null;

        if (dbProfession) {
          setProfession(dbProfession);
        }

        if (typeof data?.required_points === "number") {
          const prof = dbProfession ?? profession;
          const def = DEFAULT_REQUIRED_POINTS_BY_PROFESSION[prof] ?? 0;

          if (isValueDefaultForSomeOtherProfession(data.required_points, prof)) {
            requiredDirtyRef.current = false;
            setRequiredPoints(def);

            await saveProfilePrefs({
              profession: prof,
              required_points: def,
            });
          } else {
            setRequiredPoints(Math.max(0, data.required_points));
            requiredDirtyRef.current = true;
          }
        } else {
          const prof = dbProfession ?? profession;
          requiredDirtyRef.current = false;
          setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION[prof] ?? 0);
        }

        const ps = Number((data as any)?.period_start);
        const pe = Number((data as any)?.period_end);
        if (Number.isFinite(ps) && Number.isFinite(pe) && ps > 1900 && pe > 1900) {
          const preset = PERIODS.find((p) => p.label !== "Inny" && p.start === ps && p.end === pe);
          if (preset) {
            setPeriodLabel(preset.label as PeriodLabel);
          } else {
            setPeriodLabel("Inny");
            setCustomStart(ps);
            setCustomEnd(pe);
          }
        }
      } finally {
        if (alive) profileLoadedRef.current = true;
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase]);

  /** ---------- Period ---------- */
  const rawPeriod = useMemo(() => {
    const found = PERIODS.find((p) => p.label === periodLabel);
    if (!found) return { start: currentYear - 3, end: currentYear };
    if (found.label !== "Inny") return { start: found.start, end: found.end };
    return { start: customStart, end: customEnd };
  }, [periodLabel, customStart, customEnd, currentYear]);

  const period = useMemo(() => normalizePeriod(rawPeriod), [rawPeriod]);

  const isYearInPeriod = (year: number) => year >= period.start && year <= period.end;

  /** ---------- Auto-save profile prefs (debounced) ---------- */
  useEffect(() => {
    if (!user) return;
    if (!profileLoadedRef.current) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      saveProfilePrefs({
        profession,
        required_points: requiredPoints,
        period_start: period.start,
        period_end: period.end,
      });
    }, 450);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profession, requiredPoints, period.start, period.end, user]);

  /** ---------- ✅ DB activities: load on login ---------- */
  useEffect(() => {
    let alive = true;

    async function loadActivities() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("activities")
          .select("id,type,points,year,organizer,status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!alive) return;

        if (error) {
          setErr(error.message);
          return;
        }

        const rows = (data ?? []) as any[];

        const mapped: Activity[] = rows.map((r) => ({
          id: String(r.id),
          type: normalizeActivityType(r.type),
          points: Math.max(0, Number(r.points) || 0),
          year: Number(r.year) || currentYear,
          organizer: r.organizer ?? "",
          pointsAuto: false,
          comment: "",
          certificate_name: null,
          status: normalizeStatus(r.status),
          created_at: typeof r.created_at === "string" ? r.created_at : undefined,
        }));

        if (mapped.length > 0) setActivities(mapped);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Nie udało się pobrać aktywności z bazy.");
      }
    }

    loadActivities();
    return () => {
      alive = false;
    };
  }, [user, supabase, currentYear]);

  function clearCalculator() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    setProfession("Lekarz");
    setPeriodLabel("2023–2026");
    setCustomStart(currentYear - 1);
    setCustomEnd(currentYear + 2);

    requiredDirtyRef.current = false;
    setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION["Lekarz"]);

    setActivities([
      {
        id: uid(),
        type: "Kurs online / webinar",
        points: DEFAULT_POINTS_BY_TYPE["Kurs online / webinar"],
        year: currentYear,
        organizer: "",
        pointsAuto: true,
        comment: "",
        certificate_name: null,
        status: "done",
      },
    ]);
    clearMessages();
  }

  function handleProfessionChange(next: Profession) {
    setProfession(next);
    requiredDirtyRef.current = false;
    setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION[next] ?? 0);
  }

  function handleRequiredPointsChange(nextValue: number) {
    requiredDirtyRef.current = true;
    setRequiredPoints(Math.max(0, nextValue));
  }

  // ✅ liczymy tylko done
  const doneActivities = useMemo(
    () => activities.filter((a) => normalizeStatus(a.status) === "done"),
    [activities],
  );

  const plannedActivities = useMemo(
    () => activities.filter((a) => normalizeStatus(a.status) === "planned"),
    [activities],
  );

  const rules = useMemo(() => rulesForProfession(profession), [profession]);

  const appliedDone = useMemo(
    () => applyRules(doneActivities, { period, rules }),
    [doneActivities, period, rules],
  );

  const totalPoints = useMemo(
    () => sumPointsWithRules(doneActivities, { period, rules }),
    [doneActivities, period, rules],
  );

  const missing = useMemo(() => calcMissing(totalPoints, requiredPoints), [totalPoints, requiredPoints]);

  const progressRaw = useMemo(() => calcProgress(totalPoints, requiredPoints), [totalPoints, requiredPoints]);
  const progress = useMemo(() => clamp(progressRaw, 0, 100), [progressRaw]);

  const status = useMemo(() => getStatus(totalPoints, requiredPoints), [totalPoints, requiredPoints]);
  const recommendations = useMemo(() => getQuickRecommendations(missing), [missing]);

  const plan = useMemo(() => {
    const yearsLeft = Math.max(1, period.end - currentYear + 1);
    const perYear = missing > 0 ? Math.ceil(missing / yearsLeft) : 0;
    const perMonth = missing > 0 ? Math.ceil(perYear / 12) : 0;
    const perQuarter = missing > 0 ? Math.ceil(perYear / 4) : 0;
    return { yearsLeft, perYear, perQuarter, perMonth };
  }, [missing, period.end, currentYear]);

  // --- dashboard lists ---
  const recentDone = useMemo(() => appliedDone.slice(0, 5), [appliedDone]);
  const recentPlanned = useMemo(() => plannedActivities.slice(0, 3), [plannedActivities]);

  // --- quality signals (MVP) ---
  const missingOrganizerCount = useMemo(() => {
    return activities.filter((a) => {
      const org = (a.organizer ?? "").trim();
      return normalizeStatus(a.status) === "done" && isYearInPeriod(a.year) && !org;
    }).length;
  }, [activities, isYearInPeriod]);

  const missingCertificateCount = useMemo(() => {
    return activities.filter((a) => {
      const hasCert = typeof a.certificate_name === "string" && a.certificate_name.trim().length > 0;
      return normalizeStatus(a.status) === "done" && isYearInPeriod(a.year) && !hasCert;
    }).length;
  }, [activities, isYearInPeriod]);

  const progressBarClass =
    progress >= 100 ? "bg-emerald-600" : progress >= 60 ? "bg-blue-600" : "bg-rose-600";

  const progressPill = pillToneForProgress(progress);

  return (
    <div className="space-y-6">
      {/* ===== PAGE HEADER ===== */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Panel CPD</h1>
            <p className="mt-2 text-sm text-slate-600">
              Podgląd Twojego postępu w okresie rozliczeniowym. Dodawanie i edycja wpisów jest w{" "}
              <span className="font-medium text-slate-900">Aktywnościach</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/aktywnosci?new=1"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Dodaj aktywność
            </Link>
            <Link
              href="/aktywnosci"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Zobacz aktywności
            </Link>
            {!user && (
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Zaloguj się
              </Link>
            )}
          </div>
        </div>

        {/* ===== SESSION STRIP ===== */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {authLoading ? (
              <span className="text-slate-600">Sprawdzam sesję…</span>
            ) : user ? (
              <>
                <span className="text-slate-700">
                  <span className="font-semibold text-emerald-700">✅ Zalogowany</span>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700">{user.email}</span>
              </>
            ) : (
              <>
                <span className="text-slate-700">
                  <span className="font-semibold text-rose-700">Tryb gościa</span>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">Zapis lokalny na urządzeniu</span>
              </>
            )}
          </div>

          <button
            onClick={clearCalculator}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            type="button"
            title="Czyści zapis lokalny panelu"
          >
            Wyczyść
          </button>
        </div>
      </div>

      {/* messages */}
      {(info || err) && (
        <div className="rounded-2xl border bg-white p-4 text-sm">
          {info ? <div className="text-emerald-700">{info}</div> : null}
          {err ? <div className="text-rose-700">{err}</div> : null}
        </div>
      )}

      {/* ===== SUMMARY BAR ===== */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Zawód</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  value={profession}
                  onChange={(e) => handleProfessionChange(e.target.value as Profession)}
                >
                  {PROFESSION_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Okres rozliczeniowy</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value as PeriodLabel)}
                >
                  {PERIODS.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>

                {periodLabel === "Inny" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Start</label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={customStart}
                        onChange={(e) => setCustomStart(Number(e.target.value || 0))}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Koniec</label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(Number(e.target.value || 0))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Wymagane punkty (łącznie)</label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  value={requiredPoints}
                  onChange={(e) => handleRequiredPointsChange(Number(e.target.value || 0))}
                />
                <div className="mt-1 text-[11px] text-slate-500">
                  Domyślne dla <span className="font-medium">{profession}</span>:{" "}
                  {DEFAULT_REQUIRED_POINTS_BY_PROFESSION[profession] ?? 0}
                </div>
              </div>
            </div>

            {(profession === "Lekarz" || profession === "Lekarz dentysta") && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                <span className="font-semibold">Limity (MVP):</span> dla{" "}
                <span className="font-medium">{profession}</span> aktywność{" "}
                <span className="font-medium">Samokształcenie</span> ma limit{" "}
                <span className="font-medium">20 pkt / rok</span>.
              </div>
            )}
          </div>

          {/* pills */}
          <div className="lg:col-span-4">
            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              <div className="rounded-xl border bg-white px-3 py-2 text-sm">
                <span className="text-slate-600">Okres:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {period.start}–{period.end}
                </span>
              </div>
              <div className="rounded-xl border bg-white px-3 py-2 text-sm">
                <span className="text-slate-600">DONE:</span>{" "}
                <span className="font-semibold text-slate-900">{formatInt(totalPoints)}</span>
              </div>
              <div className="rounded-xl border bg-white px-3 py-2 text-sm">
                <span className="text-slate-600">Wymagane:</span>{" "}
                <span className="font-semibold text-slate-900">{formatInt(requiredPoints)}</span>
              </div>
              <div className={`rounded-xl border px-3 py-2 text-sm ${progressPill}`}>
                <span className="opacity-80">Brakuje:</span>{" "}
                <span className="font-semibold">{formatInt(missing)}</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Postęp</span>
                <span className="font-semibold text-slate-900">{Math.round(progress)}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full ${progressBarClass}`} style={{ width: `${progress}%` }} />
              </div>

              {plannedActivities.length > 0 && (
                <div className="mt-2 text-xs text-slate-600">
                  Zaplanowane: <span className="font-semibold">{plannedActivities.length}</span> (nie liczone)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== KPI / HERO (SaaS) ===== */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* HERO: Brakuje */}
        <div className="relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-rose-100 blur-2xl" />
          <div className="absolute -left-10 -bottom-16 h-44 w-44 rounded-full bg-blue-100 blur-2xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                Do nadrobienia
              </div>

              <div className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                {formatInt(missing)} pkt
              </div>

              <div className="mt-1 text-sm text-slate-600">
                Cel: <span className="font-semibold text-slate-900">{formatInt(requiredPoints)}</span> • Masz:{" "}
                <span className="font-semibold text-slate-900">{formatInt(totalPoints)}</span>
              </div>

              <div className="mt-3 inline-flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  Okres: {period.start}–{period.end}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${progressPill}`}>
                  Postęp: {Math.round(progress)}%
                </span>
                {plannedActivities.length > 0 && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    Plan: {plannedActivities.length}
                  </span>
                )}
              </div>
            </div>

            <div className="relative min-w-[240px] flex-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Postęp</span>
                <span className="font-semibold text-slate-900">{Math.round(progress)}%</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full ${progressBarClass}`} style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {formatInt(totalPoints)} / {formatInt(requiredPoints)} pkt
              </div>
            </div>
          </div>

          {missing > 0 ? (
            <div className="relative mt-4 flex flex-wrap gap-2">
              <Link
                href="/baza-szkolen"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Znajdź szkolenie
              </Link>
              <Link
                href="/aktywnosci?new=1"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Dodaj ręcznie
              </Link>
            </div>
          ) : (
            <div className="relative mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Wszystko gra — spełniasz wymagania w tym okresie 🎉
            </div>
          )}
        </div>

        {/* Zdobyte */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-600">Zdobyte (DONE w okresie)</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{formatInt(totalPoints)}</div>
          <div className="mt-2 text-sm text-slate-600">
            Liczymy tylko status <span className="font-semibold">DONE</span> w latach {period.start}–{period.end}.
          </div>
        </div>

        {/* Zaplanowane */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm lg:hidden">
          <div className="text-xs font-semibold text-slate-600">Zaplanowane</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{plannedActivities.length}</div>
          <div className="mt-2 text-sm text-slate-600">
            Po realizacji ustawiasz na <span className="font-semibold">DONE</span> w Aktywnościach.
          </div>
        </div>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT: lists */}
        <section className="lg:col-span-8 space-y-6">
          {/* Recent DONE */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Ostatnie aktywności (DONE)</h2>
                <p className="mt-1 text-sm text-slate-600">Podgląd ostatnich wpisów zaliczonych do sumy.</p>
              </div>
              <Link
                href="/aktywnosci"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Przejdź do Aktywności →
              </Link>
            </div>

            <div className="mt-4 divide-y rounded-xl border">
              {recentDone.length === 0 ? (
                <div className="p-4 text-sm text-slate-600">
                  Brak zaliczonych wpisów. Dodaj aktywność w{" "}
                  <Link className="text-blue-700 hover:underline" href="/aktywnosci?new=1">
                    Aktywnościach
                  </Link>
                  .
                </div>
              ) : (
                recentDone.map((row) => {
                  const outside = !row.in_period;
                  return (
                    <div
                      key={String(row.id)}
                      className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between ${
                        outside ? "opacity-60" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-slate-900">{String(row.type)}</div>
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            DONE
                          </span>
                          {outside && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              Poza okresem
                            </span>
                          )}
                          {row.warning ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                              Limit / reguła
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 truncate text-sm text-slate-600">
                          {row.year} • {(row as any).organizer ? String((row as any).organizer) : "Brak organizatora"}
                        </div>
                        {row.in_period && row.applied_points !== Math.max(0, Number(row.points) || 0) ? (
                          <div className="mt-1 text-xs text-slate-600">
                            Zaliczone do sumy: <span className="font-semibold">{row.applied_points}</span> pkt
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                        <div className="text-right">
                          <div className="text-xs text-slate-600">Punkty</div>
                          <div className="text-lg font-extrabold text-slate-900">{formatInt(Number(row.points) || 0)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Planned */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Zaplanowane</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Te wpisy nie wchodzą do sumy. Zmień status na DONE po realizacji.
                </p>
              </div>
              <Link
                href="/aktywnosci"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Zarządzaj planem →
              </Link>
            </div>

            <div className="mt-4 divide-y rounded-xl border">
              {recentPlanned.length === 0 ? (
                <div className="p-4 text-sm text-slate-600">
                  Brak zaplanowanych. Możesz dodać plan w{" "}
                  <Link className="text-blue-700 hover:underline" href="/baza-szkolen">
                    Bazie szkoleń
                  </Link>{" "}
                  albo w Aktywnościach.
                </div>
              ) : (
                recentPlanned.map((a) => {
                  const outside = !isYearInPeriod(a.year);
                  return (
                    <div
                      key={a.id}
                      className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between ${
                        outside ? "opacity-70" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-slate-900">{a.type}</div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            Plan
                          </span>
                          {outside && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              Rok poza okresem
                            </span>
                          )}
                        </div>
                        <div className="mt-1 truncate text-sm text-slate-600">
                          {a.year} • {(a.organizer ?? "").trim() ? a.organizer : "Brak organizatora"}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                        <div className="text-right">
                          <div className="text-xs text-slate-600">Punkty</div>
                          <div className="text-lg font-extrabold text-slate-900">{formatInt(a.points)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {plannedActivities.length > recentPlanned.length && (
              <div className="mt-3 text-xs text-slate-600">
                Pokazuję {recentPlanned.length} z {plannedActivities.length}.{" "}
                <Link className="text-blue-700 hover:underline" href="/aktywnosci">
                  Zobacz wszystkie →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: insights (secondary panel) */}
        <section className="lg:col-span-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-semibold text-slate-900">{status.title}</div>
            {status.desc ? <div className="mt-1 text-sm text-slate-600">{status.desc}</div> : null}

            {missing > 0 ? (
              <div className="mt-4 rounded-xl bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Tempo, żeby zdążyć</div>
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-600">Na rok</div>
                    <div className="font-extrabold text-slate-900">{plan.perYear} pkt</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Na kwartał</div>
                    <div className="font-extrabold text-slate-900">{plan.perQuarter} pkt</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Na miesiąc</div>
                    <div className="font-extrabold text-slate-900">{plan.perMonth} pkt</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  Liczone wg lat do końca okresu (do {period.end}).
                </div>
              </div>
            ) : null}
          </div>

          {recommendations.length > 0 && (
            <div className="rounded-2xl border bg-white p-5">
              <div className="text-sm font-semibold text-slate-900">Szybkie propozycje uzupełnienia</div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-800">
                {recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-slate-600">
                *Scenariusze na bazie domyślnych punktów dla typów aktywności.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/baza-szkolen"
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Znajdź szkolenie
                </Link>
                <Link
                  href="/aktywnosci?new=1"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Dodaj ręcznie
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-semibold text-slate-900">Jakość danych (MVP)</div>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Brak organizatora (DONE w okresie)</span>
                <span className="font-semibold">{missingOrganizerCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Brak certyfikatu (DONE w okresie)</span>
                <span className="font-semibold">{missingCertificateCount}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600">
              Uzupełnisz to w{" "}
              <Link className="text-blue-700 hover:underline" href="/aktywnosci">
                Aktywnościach
              </Link>
              .
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
