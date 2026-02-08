"use client";

import { useEffect, useMemo, useState } from "react";
import {
  normalizePeriod,
  sumPoints,
  calcMissing,
  calcProgress,
  getStatus,
  getQuickRecommendations,
} from "@/lib/cpd/calc";

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
  /** jeśli true → punkty są "auto" i mogą się aktualizować przy zmianie rodzaju */
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

// proste, “startowe” domyślne wartości – możesz je potem podpiąć pod realne reguły
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

function isPeriodLabel(v: unknown): v is (typeof PERIODS)[number]["label"] {
  return typeof v === "string" && PERIODS.some((p) => p.label === v);
}

export default function CalculatorClient() {
  const currentYear = new Date().getFullYear();

  const [profession, setProfession] = useState<"Lekarz" | "Lekarz dentysta" | "Inne">("Lekarz");
  const [periodLabel, setPeriodLabel] = useState<(typeof PERIODS)[number]["label"]>("2023–2026");
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

  /** ---------- localStorage: load ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed: any = JSON.parse(raw);

      const nextProfession = parsed?.profession;
      const nextPeriodLabel = parsed?.periodLabel;

      if (nextProfession === "Lekarz" || nextProfession === "Lekarz dentysta" || nextProfession === "Inne") {
        setProfession(nextProfession);
      }

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
      // jeśli localStorage ma śmieci, po prostu ignorujemy
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ---------- localStorage: save ---------- */
  useEffect(() => {
    try {
      const payload = {
        profession,
        periodLabel,
        customStart,
        customEnd,
        requiredPoints,
        activities,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // brak miejsca / prywatny tryb – ignor
    }
  }, [profession, periodLabel, customStart, customEnd, requiredPoints, activities]);

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
  }

  // okres z UI (może być odwrócony), a potem normalizujemy do start<=end
  const rawPeriod = useMemo(() => {
    const found = PERIODS.find((p) => p.label === periodLabel);
    if (!found) return { start: currentYear - 3, end: currentYear };
    if (found.label !== "Inny") return { start: found.start, end: found.end };
    return { start: customStart, end: customEnd };
  }, [periodLabel, customStart, customEnd, currentYear]);

  const period = useMemo(() => normalizePeriod(rawPeriod), [rawPeriod]);

  // Wspólne obliczenia (te same zasady będą w Portfolio)
  const totalPoints = useMemo(() => sumPoints(activities, period), [activities, period]);
  const missing = useMemo(() => calcMissing(totalPoints, requiredPoints), [totalPoints, requiredPoints]);
  const progress = useMemo(() => calcProgress(totalPoints, requiredPoints), [totalPoints, requiredPoints]);
  const status = useMemo(() => getStatus(totalPoints, requiredPoints), [totalPoints, requiredPoints]);
  const recommendations = useMemo(() => getQuickRecommendations(missing), [missing]);

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
        // jeśli user nie ruszał punktów ręcznie (pointsAuto === true) → aktualizuj punkty wg typu
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

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* LEFT: Ustawienia */}
      <section className="lg:col-span-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ustawienia</h2>
              <p className="mt-1 text-sm text-slate-600">Uzupełnij podstawowe dane, a potem dodaj aktywności.</p>
            </div>

            <button
              onClick={clearCalculator}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Czyści dane zapisane lokalnie (tryb gościa)"
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
                onChange={(e) => setProfession(e.target.value as any)}
              >
                <option>Lekarz</option>
                <option>Lekarz dentysta</option>
                <option>Inne</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Okres rozliczeniowy</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value as any)}
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
                Wpisz wymagania swojej izby/specjalizacji. (W trybie gościa zapisuje się lokalnie.)
              </p>
            </div>
          </div>
        </div>

        {/* Wynik */}
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
              <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-semibold text-slate-900">Szybkie propozycje uzupełnienia</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                {recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-slate-600">
                *To są przykładowe scenariusze na podstawie domyślnych punktów dla typów aktywności.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT: Aktywności */}
      <section className="lg:col-span-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Twoje aktywności</h2>
              <p className="mt-1 text-sm text-slate-600">
                Tryb gościa: dane zapisują się lokalnie na tym urządzeniu. Do portfolio/raportów — zaloguj się.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="/login"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Zaloguj i zapisz
              </a>
              <button
                onClick={addActivity}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Dodaj aktywność
              </button>
            </div>
          </div>

          {/* DESKTOP/TABLET: tabela */}
          <div className="mt-5">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-600">
                  <th className="border-b px-3 py-3">Rodzaj</th>
                  <th className="border-b px-3 py-3">Punkty</th>
                  <th className="border-b px-3 py-3">Rok</th>
                  <th className="border-b px-3 py-3">Organizator (opcjonalnie)</th>
                  <th className="border-b px-3 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => {
                  const inPeriod = a.year >= period.start && a.year <= period.end;

                  return (
                    <tr key={a.id} className="text-sm">
                      <td className="border-b px-3 py-3 align-top">
                        <select
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                          value={a.type}
                          onChange={(e) => handleTypeChange(a.id, e.target.value as ActivityType)}
                        >
                          {TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {!inPeriod && (
                          <div className="mt-1 text-xs text-amber-700">
                            Poza okresem {period.start}–{period.end} (nie liczy się do sumy)
                          </div>
                        )}
                      </td>

                      <td className="border-b px-3 py-3 align-top">
                        <input
                          type="number"
                          min={0}
                          className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2"
                          value={a.points}
                          onChange={(e) => handlePointsChange(a.id, Number(e.target.value || 0))}
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
                          placeholder="np. OIL / towarzystwo naukowe"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                          value={a.organizer ?? ""}
                          onChange={(e) => updateActivity(a.id, { organizer: e.target.value })}
                        />
                      </td>

                      <td className="border-b px-3 py-3 align-top text-right">
                        <button
                          onClick={() => removeActivity(a.id)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Podsumowanie */}
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

        {/* CTA */}
        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Chcesz zapisać wynik w Portfolio?</h3>
          <p className="mt-1 text-sm text-slate-600">
            W trybie gościa dane zapisują się lokalnie na tym urządzeniu. Po zalogowaniu możesz je trzymać na koncie i
            generować raporty/zaświadczenia.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/login"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Zaloguj się
            </a>
            <a
              href="/"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Wróć na stronę główną
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
