// app/baza-szkolen/TrainingHubClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

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

// Etykiety do UI (żeby nie pokazywać surowych wartości)
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

// Najważniejsze: mapowanie (category + type) -> Activity.type w tabeli activities
// Dopasowane do Twoich wartości z Aktywności (z ukośnikiem i spacjami).
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
  // kategorie „twarde” niezależne od formy
  if (category === "konferencja") return "Konferencja / kongres";
  if (category === "warsztaty") return "Warsztaty praktyczne";
  if (category === "publikacja") return "Publikacja naukowa";

  // kurs/szkolenie/inne -> zależne od formy
  if (delivery === "stacjonarne") return "Kurs stacjonarny";
  // online + hybrydowe najbezpieczniej mapować na webinar/online
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

    // forma
    if (type !== "all") query = query.eq("type", type);

    // rodzaj
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

  const addDraftActivity = async (t: Training) => {
    if (!user) {
      alert("Zaloguj się, żeby dodać aktywność.");
      return;
    }

    const year = t.start_date
      ? Number(t.start_date.slice(0, 4))
      : new Date().getFullYear();

    const payload = {
      user_id: user.id,
      type: mapToActivityType(t.category, t.type),
      points: t.points ?? 0,
      year,
      organizer: t.organizer ?? null,
      // certyfikaty: puste, bo to szkic
      certificate_path: null,
      certificate_name: null,
      certificate_mime: null,
      certificate_size: null,
      certificate_uploaded_at: null,
    };

    const { error } = await supabase.from("activities").insert(payload);

    if (error) {
      alert(`Nie udało się dodać aktywności: ${error.message}`);
      return;
    }

    alert(
      "Dodano szkic aktywności. Przejdź do Aktywności i podepnij certyfikat."
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
          <h1 className="text-3xl font-bold tracking-tight">Baza szkoleń</h1>
          <p className="mt-2 text-sm text-gray-600">
            Znajdź kursy i webinary z punktami edukacyjnymi. Dodaj szkic
            aktywności jednym kliknięciem.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/aktywnosci"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Aktywności
          </Link>
          <button
            onClick={load}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
            disabled={fetching}
            type="button"
          >
            {fetching ? "Odświeżam…" : "Odśwież"}
          </button>
        </div>
      </div>

      {/* Filtry */}
      <div className="mt-6 rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="text-xs text-gray-600">Szukaj</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="np. kongres, NIL, ból, 10 pkt…"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Forma</label>
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
            <label className="text-xs text-gray-600">Kategoria</label>
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
            <label className="text-xs text-gray-600">Organizator</label>
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
            <label className="text-xs text-gray-600">Punkty</label>
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
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyUpcoming}
              onChange={(e) => setOnlyUpcoming(e.target.checked)}
            />
            Tylko nadchodzące
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyPartner}
              onChange={(e) => setOnlyPartner(e.target.checked)}
            />
            Tylko partnerzy
          </label>

          <div className="ml-auto text-sm text-gray-600">
            Wynik:{" "}
            <span className="font-medium text-gray-900">{visible.length}</span>
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
        {visible.map((t) => (
          <div key={t.id} className="rounded-2xl border bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold">{t.title}</h3>

                  {t.is_partner ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      Partner
                    </span>
                  ) : null}

                  {t.organizer ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {t.organizer}
                    </span>
                  ) : null}

                  {t.type ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {labelType(t.type)}
                    </span>
                  ) : null}

                  {t.category ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {labelCategory(t.category)}
                    </span>
                  ) : null}

                  {typeof t.points === "number" ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {t.points} pkt
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  Termin: {formatDate(t.start_date)}
                  {t.end_date ? ` – ${formatDate(t.end_date)}` : ""}
                  {t.voivodeship ? ` • ${t.voivodeship}` : ""}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {t.external_url ? (
                  <a
                    href={t.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Zobacz szkolenie
                  </a>
                ) : (
                  <button
                    className="cursor-not-allowed rounded-xl border px-3 py-2 text-sm text-gray-400"
                    disabled
                    type="button"
                  >
                    Brak linku
                  </button>
                )}

                <button
                  onClick={() => addDraftActivity(t)}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                  type="button"
                >
                  Dodaj szkic do aktywności
                </button>
              </div>
            </div>
          </div>
        ))}

        {!fetching && visible.length === 0 && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
            Brak wyników. Zmień filtry albo wyłącz „Tylko nadchodzące”.
          </div>
        )}
      </div>
    </div>
  );
}
