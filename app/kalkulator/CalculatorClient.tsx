"use client";

import { useMemo, useState } from "react";

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

const PERIODS = [
  { label: "2023–2026", start: 2023, end: 2026 },
  { label: "2022–2025", start: 2022, end: 2025 },
  { label: "2021–2024", start: 2021, end: 2024 },
  { label: "Inny", start: 0, end: 0 },
] as const;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatInt(n: number) {
  return Number.isFinite(n) ? Math.round(n).toString() : "0";
}

export default function CalculatorClient() {
  const currentYear = new Date().getFullYear();

  const [profession, setProfession] = useState<"Lekarz" | "Lekarz dentysta" | "Inne">("Lekarz");
  const [periodLabel, setPeriodLabel] = useState<(typeof PERIODS)[number]["label"]>("2023–2026");
  const [customStart, setCustomStart] = useState<number>(currentYear - 1);
  const [customEnd, setCustomEnd] = useState<number>(currentYear + 2);

  const [requiredPoints, setRequiredPoints] = useState<number>(200);

  const [activities, setActivities] = useState<Activity[]>([
    { id: uid(), type: "Kurs online / webinar", points: 10, year: currentYear, organizer: "" },
    { id: uid(), type: "Konferencja / kongres", points: 20, year: currentYear, organizer: "" },
  ]);

  const period = useMemo(() => {
    const found = PERIODS.find((p) => p.label === periodLabel);
    if (!found) return { start: currentYear - 3, end: currentYear };
    if (found.label !== "Inny") return { start: found.start, end: found.end };
    return { start: customStart, end: customEnd };
  }, [periodLabel, customStart, customEnd, currentYear]);

  const filteredActivities = useMemo(() => {
    const start = Math.min(period.start, period.end);
    const end = Math.max(period.start, period.end);
    return activities.filter((a) => a.year >= start && a.year <= end);
  }, [activities, period.start, period.end]);

  const totalPoints = useMemo(() => {
    return filteredActivities.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
  }, [filteredActivities]);

  const missing = Math.max(0, (Number(requiredPoints) || 0) - totalPoints);
  const progress = requiredPoints > 0 ? clamp((totalPoints / requiredPoints) * 100, 0, 100) : 0;

  const status = useMemo(() => {
    if (requiredPoints <= 0) return { tone: "neutral", title: "Ustaw wymagane punkty", desc: "" };
    if (totalPoints >= requiredPoints)
      return {
        tone: "ok",
        title: "Wygląda dobrze ✅",
        desc: "Masz wystarczającą liczbę punktów na ten okres.",
      };
    if (missing <= 20)
      return {
        tone: "warn",
        title: "Prawie! 🟡",
        desc: "Brakuje niewiele — warto zaplanować 1–2 aktywności.",
      };
    return {
      tone: "risk",
      title: "Do nadrobienia 🔴",
      desc: "Brakuje sporo punktów — rozważ plan uzupełnień na najbliższe miesiące.",
    };
  }, [missing, requiredPoints, totalPoints]);

  function addActivity() {
    setActivities((prev) => [
      ...prev,
      { id: uid(), type: "Kurs online / webinar", points: 10, year: currentYear, organizer: "" },
    ]);
  }

  function updateActivity(id: string, patch: Partial<Activity>) {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeActivity(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }

  const recommendations = useMemo(() => {
    if (missing <= 0) return [];
    // Proste, sensowne „koszyki” uzupełnień
    const items = [
      { label: "Kurs online / webinar", pts: 10 },
      { label: "Konferencja / kongres", pts: 20 },
      { label: "Warsztaty praktyczne", pts: 15 },
    ];
    // generujemy 2-3 propozycje
    const combos: string[] = [];
    const m = missing;

    const nWebinars = Math.ceil(m / 10);
    combos.push(`${nWebinars}× webinar/kurs online (po 10 pkt) ≈ ${nWebinars * 10} pkt`);

    const nConfs = Math.ceil(m / 20);
    combos.push(`${nConfs}× konferencja (po 20 pkt) ≈ ${nConfs * 20} pkt`);

    const mix = Math.max(1, Math.floor(m / 20));
    const rest = Math.max(0, m - mix * 20);
    const restWebinars = Math.ceil(rest / 10);
    combos.push(
      `${mix}× konferencja (20 pkt) + ${restWebinars}× webinar (10 pkt) ≈ ${mix * 20 + restWebinars * 10} pkt`
    );

    // unikamy duplikatów
    return Array.from(new Set(combos)).slice(0, 3);
  }, [missing]);

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
          <h2 className="text-lg font-semibold text-slate-900">Ustawienia</h2>
          <p className="mt-1 text-sm text-slate-600">
            Uzupełnij podstawowe dane, a potem dodaj aktywności.
          </p>

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
                onChange={(e) => setRequiredPoints(Number(e.target.value || 0))}
                min={0}
              />
              <p className="mt-1 text-xs text-slate-500">
                Tip: zostaw edytowalne — różne izby/specjalizacje mogą mieć inne wartości.
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
                {Math.min(period.start, period.end)}–{Math.max(period.start, period.end)}
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
                Dodawaj pozycje i licz punkty automatycznie (filtrowane po wybranym okresie).
              </p>
            </div>
            <button
              onClick={addActivity}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Dodaj aktywność
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[780px] border-separate border-spacing-0">
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
                  const inPeriod =
                    a.year >= Math.min(period.start, period.end) &&
                    a.year <= Math.max(period.start, period.end);

                  return (
                    <tr key={a.id} className="text-sm">
                      <td className="border-b px-3 py-3 align-top">
                        <select
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                          value={a.type}
                          onChange={(e) => updateActivity(a.id, { type: e.target.value as ActivityType })}
                        >
                          {TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {!inPeriod && (
                          <div className="mt-1 text-xs text-amber-700">
                            Poza okresem {Math.min(period.start, period.end)}–{Math.max(period.start, period.end)}
                          </div>
                        )}
                      </td>
                      <td className="border-b px-3 py-3 align-top">
                        <input
                          type="number"
                          min={0}
                          className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2"
                          value={a.points}
                          onChange={(e) => updateActivity(a.id, { points: Number(e.target.value || 0) })}
                        />
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
                    {Math.min(period.start, period.end)}–{Math.max(period.start, period.end)}
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
          <h3 className="text-lg font-semibold text-slate-900">Chcesz zapisać wynik?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Zaloguj się, żeby prowadzić pełne portfolio i generować raporty/zaświadczenia.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/login"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Przejdź do Portfolio Dashboard
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

