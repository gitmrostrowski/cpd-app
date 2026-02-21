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
  type: TrainingType | null; // forma: online/stacjonarne/hybrydowe
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;
  category: TrainingCategory | null; // rodzaj: kurs/konferencja/...
  profession: string | null;
  voivodeship: string | null;
  external_url: string | null;
  is_partner: boolean | null;
  created_at: string;
};

// --- Opcje filtrów ---
// Forma (type)
const TYPE_OPTIONS: { value: "all" | TrainingType; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "online", label: "Online / webinar" },
  { value: "stacjonarne", label: "Stacjonarne" },
  { value: "hybrydowe", label: "Hybrydowe" },
];

// Rodzaj (category)
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

// Etykiety do UI
function labelType(t: TrainingType | null) {
  if (!t) return "—";
  if (t === "online") return "Online / webinar";
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

// UI kolory pilli
function pillToneForType(type: TrainingType | null) {
  if (type === "online")
    return "bg-violet-100 text-violet-800 border-violet-200";
  if (type === "stacjonarne")
    return "bg-amber-100 text-amber-900 border-amber-200";
  if (type === "hybrydowe") return "bg-teal-100 text-teal-900 border-teal-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function pillToneForCategory(category: TrainingCategory | null) {
  if (category === "konferencja")
    return "bg-indigo-100 text-indigo-900 border-indigo-200";
  if (category === "warsztaty")
    return "bg-orange-100 text-orange-900 border-orange-200";
  if (category === "publikacja")
    return "bg-slate-100 text-slate-900 border-slate-200";
  if (category === "kurs") return "bg-sky-100 text-sky-900 border-sky-200";
  if (category === "szkolenie")
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function pointsTone(points: number | null) {
  if (typeof points !== "number") return "bg-slate-100 text-slate-700";
  if (points >= 11) return "bg-emerald-600 text-white";
  if (points >= 6) return "bg-blue-600 text-white";
  return "bg-slate-900 text-white";
}

// Mapowanie (category + type) -> activities.type
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

export default function TrainingHubClient() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [items, setItems] = useState<Training[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtry
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | TrainingType>("all"); // forma
  const [category, setCategory] = useState<"all" | TrainingCategory>("all"); // rodzaj
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

  // Tworzymy aktywność jako "planned" (zaplanowane), a nie zaliczone
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

      // ✅ literal union (nie string)
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
        <div className="text-sm text-gray-600">Sprawdzam sesję…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Baza szkoleń
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Znajdź kursy i webinary z punktami edukacyjnymi. Wybierz szkolenie,
            a trafi do planu (nie zalicza się automatycznie).
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/aktywnosci"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
          >
            Aktywności
          </Link>
          <button
            onClick={load}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
            disabled={fetching}
            type="button"
          >
            {fetching ? "Odświeżam…" : "Odśwież"}
          </button>
        </div>
      </div>

      {/* Filtry */}
      <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="text-xs text-slate-600">Szukaj</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="np. kongres, NIL, ból, 10 pkt…"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Forma</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Kategoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Organizator</label>
            <select
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              {ORGANIZER_QUICK.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="text-xs text-slate-600">Punkty</label>
            <select
              value={minPoints}
              onChange={(e) => setMinPoints(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              {POINTS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              onClick={load}
              className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              disabled={fetching}
              type="button"
            >
              Filtruj
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={onlyUpcoming}
              onChange={(e) => setOnlyUpcoming(e.target.checked)}
            />
            Tylko nadchodzące
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={onlyPartner}
              onChange={(e) => setOnlyPartner(e.target.checked)}
            />
            Tylko partnerzy
          </label>

          <div className="ml-auto text-sm text-slate-600">
            Wynik:{" "}
            <span className="font-medium text-slate-900">{visible.length}</span>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="mt-6 space-y-3">
        {visible.map((t) => {
          const dd = daysDiffFromToday(t.start_date);
          const soon = typeof dd === "number" && dd >= 0 && dd <= 7;

          return (
            <div
              key={t.id}
              className="rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-slate-900">
                          {t.title}
                        </h3>

                        {soon ? (
                          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                            Wkrótce
                          </span>
                        ) : null}

                        {t.is_partner ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            Partner
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {t.organizer ? (
                          <span className="rounded-full border bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                            {t.organizer}
                          </span>
                        ) : null}

                        <span
                          className={[
                            "rounded-full border px-2 py-0.5 text-xs",
                            pillToneForType(t.type),
                          ].join(" ")}
                        >
                          {labelType(t.type)}
                        </span>

                        {t.category ? (
                          <span
                            className={[
                              "rounded-full border px-2 py-0.5 text-xs",
                              pillToneForCategory(t.category),
                            ].join(" ")}
                          >
                            {labelCategory(t.category)}
                          </span>
                        ) : null}

                        <span className="text-xs text-slate-600">
                          Termin: {formatDate(t.start_date)}
                          {t.end_date ? ` – ${formatDate(t.end_date)}` : ""}
                          {t.voivodeship ? ` • ${t.voivodeship}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-3 py-1 text-sm font-bold",
                          pointsTone(t.points),
                        ].join(" ")}
                        title="Punkty edukacyjne"
                      >
                        {typeof t.points === "number" ? `${t.points} pkt` : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                  {/* Secondary */}
                  {t.external_url ? (
                    <a
                      href={t.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Zobacz szkolenie
                    </a>
                  ) : (
                    <button
                      className="cursor-not-allowed rounded-xl border px-3 py-2 text-sm text-slate-400"
                      disabled
                      type="button"
                    >
                      Brak linku
                    </button>
                  )}

                  {/* Primary */}
                  <button
                    onClick={() => chooseTraining(t)}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    type="button"
                  >
                    Wybierz szkolenie
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!fetching && visible.length === 0 && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">
            Brak wyników. Zmień filtry albo wyłącz „Tylko nadchodzące”.
          </div>
        )}
      </div>
    </div>
  );
}
