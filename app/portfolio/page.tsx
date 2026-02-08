import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { addActivity, deleteActivity } from "./actions";
import ImportFromCalculator from "./ImportFromCalculator";
import {
  normalizePeriod,
  sumPoints,
  calcMissing,
  calcProgress,
  getStatus,
  type ActivityLike,
} from "@/lib/cpd/calc";

export const dynamic = "force-dynamic";

type DbActivity = {
  id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;
};

const TYPES = [
  "Kurs stacjonarny",
  "Kurs online / webinar",
  "Konferencja / kongres",
  "Warsztaty praktyczne",
  "Publikacja naukowa",
  "Prowadzenie szkolenia",
  "Samokształcenie",
  "Staż / praktyka",
] as const;

export default async function PortfolioPage() {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // MVP: stałe (później przeniesiemy do profilu usera)
  const period = normalizePeriod({ start: 2023, end: 2026 });
  const requiredPoints = 200;

  const { data, error } = await supabase
    .from("activities") // dopasowane do Twojego projektu
    .select("id,type,points,year,organizer,created_at")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
        <p className="mt-2 text-rose-600">Błąd pobierania danych: {error.message}</p>
      </div>
    );
  }

  const activities = (data ?? []) as DbActivity[];

  const total = sumPoints(activities as ActivityLike[], period);
  const missing = calcMissing(total, requiredPoints);
  const progress = calcProgress(total, requiredPoints);
  const status = getStatus(total, requiredPoints);

  const toneStyles =
    status.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : status.tone === "risk"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Portfolio Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Liczymy punkty w okresie{" "}
            <span className="font-medium text-slate-900">
              {period.start}–{period.end}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Import z kalkulatora (localStorage -> Supabase) */}
      <div className="mb-6">
        <ImportFromCalculator />
      </div>

      {/* Status */}
      <div className={`rounded-2xl border p-5 ${toneStyles}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{status.title}</h2>
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
            <div className="text-lg font-bold text-slate-900">{Math.round(total)}</div>
          </div>
          <div className="rounded-xl bg-white/60 p-3">
            <div className="text-xs text-slate-600">Wymagane</div>
            <div className="text-lg font-bold text-slate-900">{Math.round(requiredPoints)}</div>
          </div>
          <div className="rounded-xl bg-white/60 p-3">
            <div className="text-xs text-slate-600">Brakuje</div>
            <div className="text-lg font-bold text-slate-900">{Math.round(missing)}</div>
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
      </div>

      {/* Formularz */}
      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Dodaj aktywność</h2>

        <form action={addActivity} className="mt-4 grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="text-sm font-medium text-slate-700">Rodzaj</label>
            <select
              name="type"
              defaultValue="Kurs online / webinar"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Punkty</label>
            <input
              name="points"
              type="number"
              min={0}
              defaultValue={10}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Rok</label>
            <input
              name="year"
              type="number"
              defaultValue={new Date().getFullYear()}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-medium text-slate-700">Organizator</label>
            <input
              name="organizer"
              placeholder="np. OIL / towarzystwo naukowe"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <button className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Dodaj
            </button>
          </div>
        </form>
      </div>

      {/* Lista */}
      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Twoje wpisy</h2>

        {activities.length === 0 ? (
          <p className="mt-3 text-slate-600">Brak wpisów. Dodaj pierwszą aktywność powyżej.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-600">
                  <th className="border-b px-3 py-3">Rodzaj</th>
                  <th className="border-b px-3 py-3">Punkty</th>
                  <th className="border-b px-3 py-3">Rok</th>
                  <th className="border-b px-3 py-3">Organizator</th>
                  <th className="border-b px-3 py-3">Status</th>
                  <th className="border-b px-3 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => {
                  const inPeriod = a.year >= period.start && a.year <= period.end;

                  return (
                    <tr key={a.id} className="text-sm">
                      <td className="border-b px-3 py-3">{a.type}</td>
                      <td className="border-b px-3 py-3">{a.points}</td>
                      <td className="border-b px-3 py-3">{a.year}</td>
                      <td className="border-b px-3 py-3">{a.organizer ?? "—"}</td>
                      <td className="border-b px-3 py-3">
                        {inPeriod ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                            w okresie
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                            poza okresem
                          </span>
                        )}
                      </td>
                      <td className="border-b px-3 py-3 text-right">
                        <form action={deleteActivity}>
                          <input type="hidden" name="id" value={a.id} />
                          <button className="rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50">
                            Usuń
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
