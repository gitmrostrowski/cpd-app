// app/baza-szkolen/TrainingHubClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];

type TrainingType = "online" | "stacjonarne" | "hybrydowe";
type TrainingCategory =
  | "kurs"
  | "konferencja"
  | "warsztaty"
  | "publikacja"
  | "szkolenie"
  | "inne";

type Training = {
  id: string;
  title: string;
  organizer: string | null;
  points: number | null;
  type: TrainingType | null;
  start_date: string | null;
  end_date: string | null;
  category: TrainingCategory | null;
  profession: string | null;
  voivodeship: string | null;
  external_url: string | null;
  is_partner: boolean | null;
  created_at: string;
};

const TYPE_OPTIONS: { value: "all" | TrainingType; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "online", label: "Online / webinar" },
  { value: "stacjonarne", label: "Stacjonarne" },
  { value: "hybrydowe", label: "Hybrydowe" },
];

const CATEGORY_OPTIONS: { value: "all" | TrainingCategory; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "kurs", label: "Kurs" },
  { value: "szkolenie", label: "Szkolenie" },
  { value: "konferencja", label: "Konferencja / kongres" },
  { value: "warsztaty", label: "Warsztaty" },
  { value: "publikacja", label: "Publikacja" },
  { value: "inne", label: "Inne" },
];

const ORGANIZER_QUICK: { value: string; label: string }[] = [
  { value: "all", label: "Wszyscy" },
  { value: "NIL", label: "NIL" },
  { value: "OIL", label: "OIL" },
];

const POINTS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Dowolnie" },
  { value: "5", label: "≥ 5 pkt" },
  { value: "10", label: "≥ 10 pkt" },
  { value: "20", label: "≥ 20 pkt" },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}.${m}.${y}`;
}

function todayYYYYMMDD() {
  const dt = new Date();
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysDiffFromToday(yyyyMmDd: string | null) {
  if (!yyyyMmDd) return null;
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffMs = start.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function labelType(t: TrainingType | null) {
  if (!t) return "—";
  if (t === "online") return "Online";
  if (t === "stacjonarne") return "Stacjonarne";
  if (t === "hybrydowe") return "Hybrydowe";
  return t;
}

function labelCategory(c: TrainingCategory | null) {
  if (!c) return "—";
  if (c === "kurs") return "Kurs";
  if (c === "szkolenie") return "Szkolenie";
  if (c === "konferencja") return "Konferencja / kongres";
  if (c === "warsztaty") return "Warsztaty";
  if (c === "publikacja") return "Publikacja";
  if (c === "inne") return "Inne";
  return c;
}

function mapToActivityType(
  category: TrainingCategory | null,
  delivery: TrainingType | null
):
  | "Kurs stacjonarny"
  | "Kurs online / webinar"
  | "Konferencja / kongres"
  | "Warsztaty praktyczne"
  | "Publikacja naukowa"
  | "Samokształcenie" {
  if (category === "konferencja") return "Konferencja / kongres";
  if (category === "warsztaty") return "Warsztaty praktyczne";
  if (category === "publikacja") return "Publikacja naukowa";
  if (delivery === "stacjonarne") return "Kurs stacjonarny";
  return "Kurs online / webinar";
}

function termLabel(start: string | null, end: string | null) {
  if (!start && !end) return "Termin: —";
  if (start && end && start !== end)
    return `Termin: ${formatDate(start)} – ${formatDate(end)}`;
  return `Termin: ${formatDate(start ?? end)}`;
}

export default function TrainingHubClient() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [items, setItems] = useState<Training[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | TrainingType>("all");
  const [category, setCategory] = useState<"all" | TrainingCategory>("all");
  const [organizer, setOrganizer] = useState("all");
  const [minPoints, setMinPoints] = useState("all");
  const [onlyPartner, setOnlyPartner] = useState(false);
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);

  const load = async () => {
    setFetching(true);
    setError(null);

    const todayStr = todayYYYYMMDD();

    let query = supabase
      .from("trainings")
      .select("*")
      .order("start_date", { ascending: true })
      .limit(200);

    if (type !== "all") query = query.eq("type", type);
    if (category !== "all") query = query.eq("category", category);
    if (organizer !== "all") query = query.ilike("organizer", `%${organizer}%`);
    if (minPoints !== "all") query = query.gte("points", Number(minPoints));
    if (onlyPartner) query = query.eq("is_partner", true);
    if (onlyUpcoming) query = query.gte("start_date", todayStr);

    if (q.trim()) {
      const qq = q.trim();
      query = query.or(
        `title.ilike.%${qq}%,organizer.ilike.%${qq}%,category.ilike.%${qq}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setItems([]);
    } else {
      setItems((data as Training[]) ?? []);
    }

    setFetching(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => items, [items]);

  const chooseTraining = async (t: Training) => {
    if (!user) {
      alert("Zaloguj się, żeby wybrać szkolenie.");
      return;
    }

    const year = t.start_date
      ? Number(t.start_date.slice(0, 4))
      : new Date().getFullYear();

    const payload: ActivityInsert = {
      user_id: user.id,
      type: mapToActivityType(t.category, t.type),
      points: typeof t.points === "number" ? t.points : 0,
      year,
      organizer: t.organizer ?? null,
      status: "planned",
      planned_start_date: t.start_date ?? null,
      training_id: t.id,
      certificate_path: null,
      certificate_name: null,
      certificate_mime: null,
      certificate_size: null,
      certificate_uploaded_at: null,
    };

    const { error } = await supabase.from("activities").insert(payload);

    if (error) {
      alert(`Nie udało się wybrać szkolenia: ${error.message}`);
      return;
    }

    alert(
      "Dodano do planu. Przejdź do Aktywności, aby oznaczyć jako odbyte i dodać certyfikat."
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-sm text-slate-600">Sprawdzam sesję…</div>
      </div>
    );
  }

  const fieldBase =
    "mt-1 h-10 w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 shadow-inner shadow-slate-900/5 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  // ✅ Stałe szerokości prawej strony (punkt: równe przyciski od prawej)
  const RIGHT_W = "md:w-[360px]"; // jedna stała kolumna po prawej
  const BTN_SECONDARY_W = "md:w-[120px]";
  const BTN_PRIMARY_W = "md:w-[200px]";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Baza szkoleń
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Znajdź kursy i webinary z punktami edukacyjnymi. Wybierz szkolenie,
              a trafi do planu (nie zalicza się automatycznie).
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/aktywnosci"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Aktywności
            </Link>

            <button
              onClick={load}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              disabled={fetching}
              type="button"
            >
              {fetching ? "Odświeżam…" : "Odśwież"}
            </button>
          </div>
        </div>

        {/* Filtry */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="text-xs font-extrabold text-slate-800">
                Szukaj
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="np. kongres, NIL, ból, 10 pkt…"
                className={fieldBase}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Forma
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className={fieldBase}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Kategoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className={fieldBase}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Organizator
              </label>
              <select
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className={fieldBase}
              >
                {ORGANIZER_QUICK.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Punkty
              </label>
              <select
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
                className={fieldBase}
              >
                {POINTS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 md:flex md:items-end">
              <button
                onClick={load}
                className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                disabled={fetching}
                type="button"
              >
                Filtruj
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyUpcoming}
                  onChange={(e) => setOnlyUpcoming(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100"
                />
                Tylko nadchodzące
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyPartner}
                  onChange={(e) => setOnlyPartner(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100"
                />
                Tylko partnerzy
              </label>
            </div>

            <div className="text-sm text-slate-600">
              Wynik:{" "}
              <span className="font-semibold text-slate-900">
                {visible.length}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="mt-5 space-y-3">
          {visible.map((t) => {
            const dd = daysDiffFromToday(t.start_date);
            const soon = typeof dd === "number" && dd >= 0 && dd <= 7;

            return (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* LEFT */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-extrabold text-slate-900">
                        {t.title}
                      </h3>

                      {soon ? (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                          Wkrótce
                        </span>
                      ) : null}

                      {t.is_partner ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          Partner
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                      {t.organizer ? (
                        <>
                          <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-extrabold tracking-wide text-slate-900">
                            {t.organizer}
                          </span>
                          <span className="text-slate-300">•</span>
                        </>
                      ) : null}

                      <span>{labelType(t.type)}</span>

                      {t.category ? (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{labelCategory(t.category)}</span>
                        </>
                      ) : null}

                      {t.start_date || t.end_date ? (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{termLabel(t.start_date, t.end_date)}</span>
                        </>
                      ) : null}

                      {t.voivodeship ? (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{t.voivodeship}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* RIGHT – stała szerokość + stałe szerokości przycisków */}
                  <div className={`shrink-0 ${RIGHT_W}`}>
                    {/* rząd 1: punkty zawsze wyrównane do prawej */}
                    <div className="flex items-center justify-between md:justify-end">
                      <div className="inline-flex items-center gap-2 md:justify-end">
                        <span className="text-sm text-slate-500">Punkty</span>
                        <span className="text-lg font-extrabold text-blue-700">
                          {typeof t.points === "number" ? t.points : "—"}
                        </span>
                        <span className="text-sm font-semibold text-blue-700">
                          pkt
                        </span>
                      </div>
                    </div>

                    {/* rząd 2: przyciski zawsze tej samej szerokości */}
                    <div className="mt-2 flex gap-2 justify-end">
                      {t.external_url ? (
                        <a
                          href={t.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 ${BTN_SECONDARY_W}`}
                        >
                          Zobacz
                        </a>
                      ) : (
                        <button
                          className={`inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400 shadow-sm ${BTN_SECONDARY_W}`}
                          disabled
                          type="button"
                        >
                          Brak linku
                        </button>
                      )}

                      <button
                        onClick={() => chooseTraining(t)}
                        className={`inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 ${BTN_PRIMARY_W}`}
                        type="button"
                      >
                        + Dodaj do planu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!fetching && visible.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Brak wyników. Zmień filtry albo wyłącz „Tylko nadchodzące”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
