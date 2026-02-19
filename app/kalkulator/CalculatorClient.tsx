"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  normalizePeriod,
  sumPoints,
  calcMissing,
  calcProgress,
  getStatus,
  getQuickRecommendations,
} from "@/lib/cpd/calc";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type ActivityType =
  | "Kurs stacjonarny"
  | "Kurs online / webinar"
  | "Konferencja / kongres"
  | "Warsztaty praktyczne"
  | "Publikacja naukowa"
  | "Prowadzenie szkolenia"
  | "Samokształcenie"
  | "Staż / praktyka";

type Activity = {
  id: string;
  type: ActivityType;
  points: number;
  year: number;
  organizer?: string;
  pointsAuto?: boolean;
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
type Profession = "Lekarz" | "Lekarz dentysta" | "Inne";

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
function isProfession(v: unknown): v is Profession {
  return v === "Lekarz" || v === "Lekarz dentysta" || v === "Inne";
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * MVP reguł / limitów (po zawodzie i typie aktywności).
 * Na start pokazujemy mechanizm: limit roczny dla "Samokształcenie"
 * dla lekarza/dentysty.
 *
 * Potem to przeniesiemy do JSON-a / bazy.
 */
const CATEGORY_LIMITS: Record<
  Profession,
  Partial<
    Record<
      ActivityType,
      {
        yearlyMaxPoints?: number; // max zaliczanych pkt/rok w tej kategorii
        label?: string;
      }
    >
  >
> = {
  Lekarz: {
    "Samokształcenie": { yearlyMaxPoints: 20, label: "Samokształcenie (limit roczny)" },
  },
  "Lekarz dentysta": {
    "Samokształcenie": { yearlyMaxPoints: 20, label: "Samokształcenie (limit roczny)" },
  },
  Inne: {},
};

type AppliedRow = Activity & {
  inPeriod: boolean;
  appliedPoints: number; // ile realnie liczymy do sumy (po limitach i okresie)
  limitWarning?: string | null;
};

export default function CalculatorClient() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const currentYear = new Date().getFullYear();

  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [periodLabel, setPeriodLabel] = useState<PeriodLabel>("2023–2026");
  const [customStart, setCustomStart] = useState<number>(currentYear - 1);
  const [customEnd, setCustomEnd] = useState<number>(currentYear + 2);
  const [requiredPoints, setRequiredPoints] = useState<number>(200);

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: uid(),
      type: "Kurs online / webinar",
      points: DEFAULT_POINTS_BY_TYPE["Kurs online / webinar"],
      year: currentYear,
      organizer: "",
      pointsAuto: true,
    },
    {
      id: uid(),
      type: "Konferencja / kongres",
      points: DEFAULT_POINTS_BY_TYPE["Konferencja / kongres"],
      year: currentYear,
      organizer: "",
      pointsAuto: true,
    },
  ]);

  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function clearMessages() {
    setInfo(null);
    setErr(null);
  }

  /** ---------- localStorage: load (guest) ---------- */
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
      setRequiredPoints(Math.max(0, safeNumber(parsed?.requiredPoints, 200)));

      const nextActivities = parsed?.activities;
      if (Array.isArray(nextActivities)) {
        const cleaned: Activity[] = nextActivities
          .map((a: any) => {
            const type: ActivityType = normalizeActivityType(a?.type);
            const year = safeNumber(a?.year, currentYear);
            const points = Math.max(0, safeNumber(a?.points, DEFAULT_POINTS_BY_TYPE[type]));
            const organizer = safeString(a?.organizer ?? "", "");
            const pointsAuto = typeof a?.pointsAuto === "boolean" ? a.pointsAuto : false;

            return {
              id: safeString(a?.id, uid()) || uid(),
              type,
              year,
              points,
              organizer,
              pointsAuto,
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

  /** ---------- localStorage: save (always, also useful as draft) ---------- */
  useEffect(() => {
    try {
      const payload = { profession, periodLabel, customStart, customEnd, requiredPoints, activities };
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
          .select("profession, required_points")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!alive) return;
        if (error) return;

        if (data?.profession && isProfession(data.profession)) setProfession(data.profession);
        if (typeof data?.required_points === "number") setRequiredPoints(Math.max(0, data.required_points));
      } catch {
        // ignore
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, [user, supabase]);

  function clearCalculator() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    setProfession("Lekarz");
    setPeriodLabel("2023–2026");
    setCustomStart(currentYear - 1);
    setCustomEnd(currentYear + 2);
    setRequiredPoints(200);
    setActivities([
      {
        id: uid(),
        type: "Kurs online / webinar",
        points: DEFAULT_POINTS_BY_TYPE["Kurs online / webinar"],
        year: currentYear,
        organizer: "",
        pointsAuto: true,
      },
    ]);
    clearMessages();
  }

  const rawPeriod = useMemo(() => {
    const found = PERIODS.find((p) => p.label === periodLabel);
    if (!found) return { start: currentYear - 3, end: currentYear };
    if (found.label !== "Inny") return { start: found.start, end: found.end };
    return { start: customStart, end: customEnd };
  }, [periodLabel, customStart, customEnd, currentYear]);

  const period = useMemo(() => normalizePeriod(rawPeriod), [rawPeriod]);

  /**
   * Zastosowanie limitów kategorii:
   * - Poza okresem → 0 pkt
   * - W okresie → liczymy wg limitu rocznego (jeśli jest)
   *
   * To wyliczenie jest deterministyczne, działa w UI i daje ostrzeżenia na wierszach.
   */
  const appliedActivities: AppliedRow[] = useMemo(() => {
    const limits = CATEGORY_LIMITS[profession] ?? {};

    // grupujemy po (type, year) dla limitów rocznych
    const usedByTypeYear = new Map<string, number>();

    return activities.map((a) => {
      const inPeriod = a.year >= period.start && a.year <= period.end;
      if (!inPeriod) {
        return { ...a, inPeriod, appliedPoints: 0, limitWarning: null };
      }

      const rule = limits[a.type];
      const yearlyMax = rule?.yearlyMaxPoints;

      if (!yearlyMax || yearlyMax <= 0) {
        // brak limitu
        return { ...a, inPeriod, appliedPoints: Math.max(0, a.points), limitWarning: null };
      }

      const key = `${a.type}__${a.year}`;
      const used = usedByTypeYear.get(key) ?? 0;
      const remaining = Math.max(0, yearlyMax - used);

      const original = Math.max(0, a.points);
      const applied = Math.min(original, remaining);

      usedByTypeYear.set(key, used + applied);

      const over = original - applied;
      const warning =
        over > 0
          ? `Limit roczny dla „${a.type}”: ${yearlyMax} pkt. Ta pozycja zaliczy ${applied} pkt (nadwyżka ${over} pkt nie zwiększy sumy).`
          : null;

      return { ...a, inPeriod, appliedPoints: applied, limitWarning: warning };
    });
  }, [activities, period.start, period.end, profession]);

  const totalPoints = useMemo(() => {
    return appliedActivities.reduce((sum, a) => sum + (a.appliedPoints || 0), 0);
  }, [appliedActivities]);

  const missing = useMemo(() => calcMissing(totalPoints, requiredPoints), [totalPoints, requiredPoints]);

  // progress z calc.ts może dać >100 albo <0 — clampujemy pod pasek i %.
  const progressRaw = useMemo(() => calcProgress(totalPoints, requiredPoints), [totalPoints, requiredPoints]);
  const progress = useMemo(() => clamp(progressRaw, 0, 100), [progressRaw]);

  const status = useMemo(() => getStatus(totalPoints, requiredPoints), [totalPoints, requiredPoints]);
  const recommendations = useMemo(() => getQuickRecommendations(missing), [missing]);

  // Plan (Tempo)
  const plan = useMemo(() => {
    const yearsTotal = Math.max(1, period.end - period.start + 1);
    const yearsLeft = Math.max(1, period.end - currentYear + 1);
    const perYear = missing > 0 ? Math.ceil(missing / yearsLeft) : 0;
    const perMonth = missing > 0 ? Math.ceil(perYear / 12) : 0;
    const perQuarter = missing > 0 ? Math.ceil(perYear / 4) : 0;

    return {
      yearsTotal,
      yearsLeft,
      perYear,
      perQuarter,
      perMonth,
    };
  }, [missing, period.end, period.start, currentYear]);

  function addActivity() {
    setActivities((prev) => [
      ...prev,
      {
        id: uid(),
        type: "Kurs online / webinar",
        points: DEFAULT_POINTS_BY_TYPE["Kurs online / webinar"],
        year: currentYear,
        organizer: "",
        pointsAuto: true,
      },
    ]);
  }

  function updateActivity(id: string, patch: Partial<Activity>) {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeActivity(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }

  function handleTypeChange(id: string, nextType: ActivityType) {
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next: Activity = { ...a, type: nextType };
        if (a.pointsAuto) next.points = DEFAULT_POINTS_BY_TYPE[nextType];
        return next;
      }),
    );
  }

  function handlePointsChange(id: string, points: number) {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, points: Math.max(0, points), pointsAuto: false } : a)),
    );
  }

  const toneStyles =
    status.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : status.tone === "risk"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-slate-200 bg-slate-50 text-slate-900";

  // Progress bar kolor
  const progressBarClass =
    progress >= 100 ? "bg-emerald-600" : progress >= 60 ? "bg-blue-600" : "bg-rose-600";

  async function saveAllToPortfolio() {
    if (!user) {
      setErr("Zaloguj się, aby zapisać aktywności do Portfolio.");
      return;
    }
    if (busy) return;

    clearMessages();

    // Walidacja — zapisujemy oryginalne punkty użytkownika (nie applied)
    const cleaned = activities
      .map((a) => ({
        type: String(a.type),
        points: Math.max(0, Number(a.points) || 0),
        year: Number(a.year) || currentYear,
        organizer: (a.organizer ?? "").trim() ? (a.organizer ?? "").trim() : null,
      }))
      .filter((a) => a.type && a.year >= 1900 && a.year <= 2100);

    if (cleaned.length === 0) {
      setErr("Nie ma nic do zapisania.");
      return;
    }

    const payload = cleaned.map((a) => ({
      user_id: user.id,
      type: a.type,
      points: a.points,
      year: a.year,
      organizer: a.organizer,
    }));

    setBusy(true);
    try {
      const { error } = await supabase.from("activities").insert(payload);
      if (error) {
        setErr(error.message);
        return;
      }
      setInfo(`Zapisano ${payload.length} aktywności do Portfolio ✅`);
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zapisać aktywności.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* LEFT */}
      <section className="lg:col-span-4">
        {/* status */}
        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          {authLoading ? (
            <div className="text-sm text-slate-600">Status: sprawdzam sesję…</div>
          ) : user ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-slate-800">
                Status: <span className="font-semibold text-emerald-700">✅ Zalogowany</span>
                <span className="text-slate-500"> • </span>
                <span className="font-medium">{user.email}</span>
              </div>
              <Link
                href="/portfolio"
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Portfolio
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-slate-800">
                Status: <span className="font-semibold text-rose-700">❌ Niezalogowany</span>
                <span className="text-slate-500"> • </span>
                Tryb gościa (zapis lokalny)
              </div>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Zaloguj się
              </Link>
            </div>
          )}
        </div>

        {/* messages */}
        {(info || err) && (
          <div className="mb-6 rounded-2xl border bg-white p-4 text-sm">
            {info ? <div className="text-emerald-700">{info}</div> : null}
            {err ? <div className="text-rose-700">{err}</div> : null}
            {info ? (
              <div className="mt-2 flex flex-wrap gap-3">
                <Link href="/activities" className="text-blue-700 hover:underline">
                  Zobacz w Aktywnościach →
                </Link>
                <Link href="/portfolio" className="text-blue-700 hover:underline">
                  Przejdź do Portfolio →
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {/* settings */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ustawienia</h2>
              <p className="mt-1 text-sm text-slate-600">
                {user ? "Po zalogowaniu ustawienia bierzemy z profilu (DB)." : "W trybie gościa zapis lokalny."}
              </p>
            </div>

            <button
              onClick={clearCalculator}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Czyści zapis lokalny kalkulatora"
              type="button"
            >
              Wyczyść
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Zawód / status</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                value={profession}
                onChange={(e) => setProfession(e.target.value as Profession)}
              >
                <option>Lekarz</option>
                <option>Lekarz dentysta</option>
                <option>Inne</option>
              </select>

              {profession !== "Inne" && (
                <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="font-semibold">Limity (MVP)</div>
                  <div className="mt-1">
                    Dla <span className="font-medium">{profession}</span> aktywność{" "}
                    <span className="font-medium">Samokształcenie</span> ma limit{" "}
                    <span className="font-medium">20 pkt / rok</span> (mechanizm demonstracyjny — do rozbudowy).
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Okres rozliczeniowy</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
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
                    <label className="text-xs font-medium text-slate-600">Start</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                      value={customStart}
                      onChange={(e) => setCustomStart(Number(e.target.value || 0))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Koniec</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(Number(e.target.value || 0))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Wymagane punkty (łącznie)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                value={requiredPoints}
                onChange={(e) => setRequiredPoints(Math.max(0, Number(e.target.value || 0)))}
                min={0}
              />
              <p className="mt-1 text-xs text-slate-500">
                Wartość z profilu (DB) po zalogowaniu. W trybie gościa — lokalnie.
              </p>
            </div>
          </div>
        </div>

        {/* result */}
        <div className={`mt-6 rounded-2xl border p-5 ${toneStyles}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold">{status.title}</h3>
              {status.desc && <p className="mt-1 text-sm opacity-90">{status.desc}</p>}
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80">Okres</div>
              <div className="text-sm font-semibold">
                {period.start}–{period.end}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/60 p-3">
              <div className="text-xs text-slate-600">Masz</div>
              <div className="text-lg font-bold text-slate-900">{formatInt(totalPoints)}</div>
            </div>
            <div className="rounded-xl bg-white/60 p-3">
              <div className="text-xs text-slate-600">Wymagane</div>
              <div className="text-lg font-bold text-slate-900">{formatInt(requiredPoints)}</div>
            </div>
            <div className="rounded-xl bg-white/60 p-3">
              <div className="text-xs text-slate-600">Brakuje</div>
              <div className="text-lg font-bold text-slate-900">{formatInt(missing)}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Postęp</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/60">
              <div className={`h-full ${progressBarClass}`} style={{ width: `${progress}%` }} />
            </div>
            {progress >= 100 ? (
              <div className="mt-2 text-xs text-emerald-800">✅ Cel osiągnięty — jesteś na 100% lub więcej.</div>
            ) : null}
          </div>

          {/* TEMPO / PLAN */}
          {missing > 0 ? (
            <div className="mt-5 rounded-xl bg-white/60 p-4">
              <div className="text-sm font-semibold text-slate-900">Tempo, żeby zdążyć</div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-600">Średnio na rok</div>
                  <div className="font-bold text-slate-900">{plan.perYear} pkt</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Średnio na kwartał</div>
                  <div className="font-bold text-slate-900">{plan.perQuarter} pkt</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Średnio na miesiąc</div>
                  <div className="font-bold text-slate-900">{plan.perMonth} pkt</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Liczone wg lat do końca okresu (do {period.end}). W kolejnej iteracji dodamy dokładne terminy rozliczeń.
              </div>
            </div>
          ) : null}

          {recommendations.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-semibold text-slate-900">Szybkie propozycje uzupełnienia</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                {recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-slate-600">
                *Przykładowe scenariusze na bazie domyślnych punktów dla typów aktywności.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT */}
      <section className="lg:col-span-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Twoje aktywności (kalkulator)</h2>
              <p className="mt-1 text-sm text-slate-600">
                {user
                  ? "Zalogowany: możesz zapisać poniższe wpisy do bazy (Portfolio)."
                  : "Tryb gościa: to tylko szkic lokalny. Zaloguj się, aby zapisać do bazy."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={addActivity}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                type="button"
              >
                + Dodaj aktywność
              </button>

              <button
                onClick={saveAllToPortfolio}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={!user || busy}
                type="button"
                title={!user ? "Zaloguj się, żeby zapisać." : "Zapisze wszystkie wiersze do Portfolio."}
              >
                {busy ? "Zapisuję…" : "Zapisz do Portfolio"}
              </button>

              {user ? (
                <Link
                  href="/activities"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Aktywności
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Zaloguj i zapisz
                </Link>
              )}
            </div>
          </div>

          <div className="mt-5">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-600">
                  <th className="border-b px-3 py-3">Rodzaj</th>
                  <th className="border-b px-3 py-3">Punkty</th>
                  <th className="border-b px-3 py-3">Rok</th>
                  <th className="border-b px-3 py-3">Organizator</th>
                  <th className="border-b px-3 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {appliedActivities.map((a) => {
                  const rowDisabled = !a.inPeriod;

                  return (
                    <tr
                      key={a.id}
                      className={`text-sm ${rowDisabled ? "opacity-50" : ""}`}
                      title={rowDisabled ? "Ten rok nie należy do wybranego okresu – punkty nie zostaną zaliczone." : ""}
                    >
                      <td className="border-b px-3 py-3 align-top">
                        <select
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50"
                          value={a.type}
                          onChange={(e) => handleTypeChange(a.id, e.target.value as ActivityType)}
                          disabled={rowDisabled}
                        >
                          {TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>

                        {!a.inPeriod && (
                          <div className="mt-1 text-xs text-amber-700">
                            Ten rok nie należy do wybranego okresu – punkty nie zostaną zaliczone.
                          </div>
                        )}

                        {a.limitWarning && (
                          <div className="mt-1 text-xs text-rose-700">{a.limitWarning}</div>
                        )}

                        {/* mała podpowiedź: ile zaliczamy */}
                        {a.inPeriod && a.appliedPoints !== Math.max(0, a.points) ? (
                          <div className="mt-1 text-[11px] text-slate-600">
                            Zaliczone do sumy: <span className="font-semibold">{a.appliedPoints}</span> pkt
                          </div>
                        ) : null}
                      </td>

                      <td className="border-b px-3 py-3 align-top">
                        <input
                          type="number"
                          min={0}
                          className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50"
                          value={a.points}
                          onChange={(e) => handlePointsChange(a.id, Number(e.target.value || 0))}
                          disabled={rowDisabled}
                        />
                        <div className="mt-1 text-[11px] text-slate-500">
                          {a.pointsAuto ? "Auto (wg rodzaju)" : "Ręcznie (z certyfikatu)"}
                        </div>
                      </td>

                      <td className="border-b px-3 py-3 align-top">
                        <input
                          type="number"
                          className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2"
                          value={a.year}
                          onChange={(e) => updateActivity(a.id, { year: Number(e.target.value || currentYear) })}
                        />
                      </td>

                      <td className="border-b px-3 py-3 align-top">
                        <input
                          type="text"
                          placeholder="np. OIL / towarzystwo"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50"
                          value={a.organizer ?? ""}
                          onChange={(e) => updateActivity(a.id, { organizer: e.target.value })}
                          disabled={rowDisabled}
                        />
                      </td>

                      <td className="border-b px-3 py-3 align-top text-right">
                        <button
                          onClick={() => removeActivity(a.id)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
                          type="button"
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* drugi przycisk na dole */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={addActivity}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                type="button"
              >
                + Dodaj aktywność
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Podsumowanie</div>
                <div className="text-sm text-slate-600">
                  Liczymy tylko aktywności z okresu:{" "}
                  <span className="font-medium text-slate-900">
                    {period.start}–{period.end}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-600">Suma punktów w okresie</div>
                <div className="text-2xl font-extrabold text-slate-900">{formatInt(totalPoints)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Następny krok</h3>
          <p className="mt-1 text-sm text-slate-600">
            {user
              ? "Możesz zapisać wpisy do Portfolio albo przejść do Aktywności i dodać certyfikaty."
              : "Zaloguj się, żeby zapisać wpisy do bazy i potem podpinać certyfikaty w Aktywnościach."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link
                  href="/activities"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Przejdź do Aktywności
                </Link>
                <Link
                  href="/portfolio"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Portfolio
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Zaloguj się
              </Link>
            )}

            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Wróć na stronę główną
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
