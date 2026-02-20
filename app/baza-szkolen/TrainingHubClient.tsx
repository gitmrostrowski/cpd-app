"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type TrainingType = "online" | "stacjonarne" | "hybrydowe";

type Training = {
  id: string;
  title: string;
  organizer: string | null;
  points: number | null;
  type: TrainingType | null;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;
  category: string | null;
  profession: string | null;
  voivodeship: string | null;
  external_url: string | null;
  is_partner: boolean | null;
  created_at: string;
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "online", label: "Online" },
  { value: "stacjonarne", label: "Stacjonarne" },
  { value: "hybrydowe", label: "Hybrydowe" },
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
  // prosto: YYYY-MM-DD -> DD.MM.YYYY
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

function guessActivityType(trainingType: TrainingType | null) {
  if (trainingType === "online") return "Kurs online / webinar";
  if (trainingType === "stacjonarne") return "Kurs stacjonarny";
  return "Kurs online / webinar";
}

export default function TrainingHubClient() {
  const { user, loading } = useAuth();

  const [items, setItems] = useState<Training[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtry
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [organizer, setOrganizer] = useState("all");
  const [minPoints, setMinPoints] = useState("all");
  const [onlyPartner, setOnlyPartner] = useState(false);
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);

  const load = async () => {
    setFetching(true);
    setError(null);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // baza query
    let query = supabaseClient
      .from("trainings")
      .select("*")
      .order("start_date", { ascending: true })
      .limit(200);

    if (type !== "all") query = query.eq("type", type);
    if (organizer !== "all") {
      // proste dopasowanie — możesz zmienić na ilike jeśli trzymasz np. "NIL / ...".
      query = query.ilike("organizer", `%${organizer}%`);
    }
    if (minPoints !== "all") query = query.gte("points", Number(minPoints));
    if (onlyPartner) query = query.eq("is_partner", true);
    if (onlyUpcoming) query = query.gte("start_date", todayStr);

    // search
    if (q.trim()) {
      // szukamy po tytule / organizatorze / kategorii
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
    const year = t.start_date ? Number(t.start_date.slice(0, 4)) : new Date().getFullYear();

    const payload = {
      user_id: user.id,
      type: guessActivityType(t.type),
      points: t.points ?? 0,
      year,
      organizer: t.organizer ?? "—",
      // opcjonalnie: możesz dodać pole np. source_training_id jeśli je dodasz w DB
    };

    // Uwaga: dopasuj nazwy kolumn do Twojej tabeli activities (u Ciebie: type/points/year/organizer)
    const { error } = await supabaseClient.from("activities").insert(payload);

    if (error) {
      alert(`Nie udało się dodać aktywności: ${error.message}`);
      return;
    }
    alert("Dodano szkic aktywności. Teraz możesz podpiąć certyfikat w Aktywnościach.");
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
            Znajdź kursy i webinary z punktami edukacyjnymi. Dodaj szkic aktywności jednym kliknięciem.
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
          >
            {fetching ? "Odświeżam…" : "Odśwież"}
          </button>
        </div>
      </div>

      {/* Filtry */}
      <div className="mt-6 rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="text-xs text-gray-600">Szukaj</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="np. kongres, NIL, ból, 10 pkt…"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Typ</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
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

          <div className="md:col-span-2">
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
            Wynik: <span className="font-medium text-gray-900">{visible.length}</span>
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
                      {t.type}
                    </span>
                  ) : null}
                  {typeof t.points === "number" ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {t.points} pkt
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  Termin: {formatDate(t.start_date)}{t.end_date ? ` – ${formatDate(t.end_date)}` : ""}{" "}
                  {t.category ? ` • ${t.category}` : ""}
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
                  >
                    Brak linku
                  </button>
                )}

                <button
                  onClick={() => addDraftActivity(t)}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
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
