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

type EnrollmentStatus = "open" | "waiting_list" | "closed";
type ApprovalStatus = "approved" | "pending" | "rejected";

type Training = {
  id: string;
  title: string;
  organizer: string | null;
  points: number | null;

  format: TrainingType | null;

  start_date: string | null;
  end_date: string | null;

  category: TrainingCategory | null;
  profession: string | null;
  voivodeship: string | null;

  // ✅ JEDNO pole w UI: url
  url: string | null;

  // legacy (zostawiamy, żeby stare dane/kolumny nie powodowały problemów)
  external_url?: string | null;

  is_partner: boolean | null;

  topics?: string[] | null;
  price_pln?: number | null;
  has_recording?: boolean | null;
  capacity?: number | null;
  enrollment_status?: EnrollmentStatus | null;

  approval_status?: ApprovalStatus | null;
  submitted_by?: string | null;

  created_at: string;
  updated_at: string | null;
};

// --- Opcje filtrów ---
const FORMAT_OPTIONS: { value: "all" | TrainingType; label: string }[] = [
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

type TimeWindow = "all" | "7" | "30" | "90";
const TIME_WINDOW_OPTIONS: { value: TimeWindow; label: string }[] = [
  { value: "7", label: "Najbliższe 7 dni" },
  { value: "30", label: "Najbliższe 30 dni" },
  { value: "90", label: "Najbliższe 90 dni" },
  { value: "all", label: "Dowolnie" },
];

type SortBy = "date_asc" | "date_desc" | "points_desc" | "points_asc" | "newest";
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "date_asc", label: "Najbliższe terminy" },
  { value: "date_desc", label: "Najpóźniejsze terminy" },
  { value: "points_desc", label: "Najwięcej punktów" },
  { value: "points_asc", label: "Najmniej punktów" },
  { value: "newest", label: "Nowo dodane" },
];

type PriceMode = "all" | "free" | "paid";
const PRICE_OPTIONS: { value: PriceMode; label: string }[] = [
  { value: "all", label: "Dowolnie" },
  { value: "free", label: "Darmowe" },
  { value: "paid", label: "Płatne" },
];

const ENROLLMENT_OPTIONS: { value: "all" | EnrollmentStatus; label: string }[] =
  [
    { value: "all", label: "Dowolnie" },
    { value: "open", label: "Zapisy otwarte" },
    { value: "waiting_list", label: "Lista rezerwowa" },
    { value: "closed", label: "Zapisy zamknięte" },
  ];

function formatDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}.${m}.${y}`;
}

function toYYYYMMDD(dt: Date) {
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayYYYYMMDD() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toYYYYMMDD(d);
}

function addDaysYYYYMMDD(days: number) {
  const dt = new Date();
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + days);
  return toYYYYMMDD(dt);
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

function labelEnrollment(s: EnrollmentStatus | null) {
  if (!s) return null;
  if (s === "open") return "Zapisy otwarte";
  if (s === "waiting_list") return "Lista rezerwowa";
  if (s === "closed") return "Zapisy zamknięte";
  return s;
}

function termLabel(start: string | null, end: string | null) {
  if (!start && !end) return "Termin: —";
  if (start && end && start !== end)
    return `Termin: ${formatDate(start)} – ${formatDate(end)}`;
  return `Termin: ${formatDate(start ?? end)}`;
}

function formatPrice(pricePln: number | null) {
  if (typeof pricePln !== "number") return null;
  if (pricePln === 0) return "0 zł";
  const rounded = Math.round((pricePln + Number.EPSILON) * 100) / 100;
  return `${rounded} zł`;
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

function parseTopics(input: string) {
  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

function normalizeUrl(raw: string | null | undefined) {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  // jeśli ktoś wklei "onet.pl" -> zrób z tego https://onet.pl
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

// ✅ normalizacja wyników z Supabase
function normalizeTrainingRow(r: any): Training {
  const price =
    typeof r.price_pln === "number"
      ? r.price_pln
      : r.price_pln == null
      ? null
      : Number(r.price_pln);

  const capacity =
    typeof r.capacity === "number"
      ? r.capacity
      : r.capacity == null
      ? null
      : Number(r.capacity);

  const legacyExternal = r.external_url ?? null;

  return {
    id: r.id,
    title: r.title,
    organizer: r.organizer ?? null,
    points: typeof r.points === "number" ? r.points : r.points ?? null,

    format: (r.format ?? null) as TrainingType | null,

    start_date: r.start_date ?? null,
    end_date: r.end_date ?? null,

    category: (r.category ?? null) as TrainingCategory | null,
    profession: r.profession ?? null,
    voivodeship: r.voivodeship ?? null,

    // ✅ priorytet: url, fallback: external_url
    url: normalizeUrl(r.url ?? legacyExternal),
    external_url: normalizeUrl(legacyExternal),

    is_partner: r.is_partner ?? null,

    topics: Array.isArray(r.topics) ? (r.topics as string[]) : null,
    price_pln: Number.isNaN(price as number) ? null : (price as number | null),
    has_recording: r.has_recording ?? null,
    capacity: Number.isNaN(capacity as number)
      ? null
      : (capacity as number | null),
    enrollment_status: (r.enrollment_status ?? null) as EnrollmentStatus | null,

    approval_status: (r.approval_status ?? null) as ApprovalStatus | null,
    submitted_by: r.submitted_by ?? null,

    created_at: r.created_at,
    updated_at: r.updated_at ?? null,
  };
}

export default function TrainingHubClient() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [items, setItems] = useState<Training[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtry
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date_asc");
  const [organizer, setOrganizer] = useState("all");
  const [format, setFormat] = useState<"all" | TrainingType>("all");

  const [category, setCategory] = useState<"all" | TrainingCategory>("all");
  const [minPoints, setMinPoints] = useState("all");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("30");
  const [priceMode, setPriceMode] = useState<PriceMode>("all");

  const [topic, setTopic] = useState<string>("all");
  const [enrollment, setEnrollment] = useState<"all" | EnrollmentStatus>("all");

  const [onlyPartner, setOnlyPartner] = useState(false);
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [onlyRecording, setOnlyRecording] = useState(false);

  // modal: dodawanie szkolenia
  const [addOpen, setAddOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [fTitle, setFTitle] = useState("");
  const [fOrganizer, setFOrganizer] = useState("");
  const [fPoints, setFPoints] = useState<string>("0");
  const [fFormat, setFFormat] = useState<TrainingType>("online");
  const [fCategory, setFCategory] = useState<TrainingCategory>("kurs");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fVoiv, setFVoiv] = useState("");
  const [fUrl, setFUrl] = useState("");
  const [fTopics, setFTopics] = useState("");
  const [fPrice, setFPrice] = useState<string>("");
  const [fRec, setFRec] = useState(false);
  const [fCap, setFCap] = useState<string>("");
  const [fEnroll, setFEnroll] = useState<EnrollmentStatus | "">("");

  const load = async () => {
    setFetching(true);
    setError(null);

    const todayStr = todayYYYYMMDD();

    let query = supabase
      .from("trainings")
      .select("*")
      .eq("approval_status", "approved")
      .limit(200);

    // sortowanie
    if (sortBy === "date_asc")
      query = query.order("start_date", { ascending: true });
    if (sortBy === "date_desc")
      query = query.order("start_date", { ascending: false });
    if (sortBy === "points_desc")
      query = query.order("points", { ascending: false, nullsFirst: false });
    if (sortBy === "points_asc")
      query = query.order("points", { ascending: true, nullsFirst: false });
    if (sortBy === "newest")
      query = query.order("created_at", { ascending: false });

    // filtry
    if (organizer !== "all") query = query.ilike("organizer", `%${organizer}%`);
    if (format !== "all") query = query.eq("format", format);
    if (category !== "all") query = query.eq("category", category);

    if (minPoints !== "all") query = query.gte("points", Number(minPoints));

    // okno czasu 7/30/90
    if (timeWindow !== "all") {
      const maxDate = addDaysYYYYMMDD(Number(timeWindow));
      query = query.gte("start_date", todayStr).lte("start_date", maxDate);
    } else if (onlyUpcoming) {
      query = query.gte("start_date", todayStr);
    }

    if (onlyPartner) query = query.eq("is_partner", true);

    if (topic !== "all") query = query.contains("topics", [topic]);

    if (priceMode === "free") query = query.eq("price_pln", 0);
    if (priceMode === "paid") query = query.gt("price_pln", 0);

    if (onlyRecording) query = query.eq("has_recording", true);

    if (enrollment !== "all") query = query.eq("enrollment_status", enrollment);

    if (q.trim()) {
      const qq = q.trim();
      query = query.or(
        [
          `title.ilike.%${qq}%`,
          `organizer.ilike.%${qq}%`,
          `category.ilike.%${qq}%`,
          `voivodeship.ilike.%${qq}%`,
          `profession.ilike.%${qq}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setItems([]);
    } else {
      const rows = ((data ?? []) as any[]).map(normalizeTrainingRow);
      setItems(rows);
    }

    setFetching(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topicOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of items) {
      const arr = Array.isArray(t.topics) ? t.topics : [];
      for (const x of arr) {
        const v = String(x || "").trim();
        if (v) set.add(v);
      }
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "pl"))];
  }, [items]);

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
      type: mapToActivityType(t.category, t.format),
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

  const submitNewTraining = async () => {
    if (!user) {
      alert("Zaloguj się, żeby dodać szkolenie.");
      return;
    }

    const title = fTitle.trim();
    if (!title) {
      alert("Podaj tytuł szkolenia.");
      return;
    }
    if (!fStart) {
      alert("Podaj datę rozpoczęcia.");
      return;
    }

    const pointsNum = Number(fPoints || 0);
    const priceNum =
      fPrice.trim() === "" ? null : Number(String(fPrice).replace(",", "."));
    const capNum = fCap.trim() === "" ? null : Number(fCap);

    if (Number.isNaN(pointsNum) || pointsNum < 0) {
      alert("Nieprawidłowa liczba punktów.");
      return;
    }
    if (priceNum !== null && (Number.isNaN(priceNum) || priceNum < 0)) {
      alert("Nieprawidłowa cena.");
      return;
    }
    if (capNum !== null && (Number.isNaN(capNum) || capNum < 0)) {
      alert("Nieprawidłowy limit miejsc.");
      return;
    }

    setAddSubmitting(true);

    const url = normalizeUrl(fUrl);

    const payload = {
      title,
      organizer: fOrganizer.trim() || null,
      points: pointsNum,
      format: fFormat,
      category: fCategory,
      start_date: fStart,
      end_date: fEnd || null,
      voivodeship: fVoiv.trim() || null,

      // ✅ jedno źródło prawdy dla UI
      url,

      // ✅ legacy – niech stare miejsca też mają wartość
      external_url: url,

      topics: parseTopics(fTopics),
      price_pln: priceNum,
      has_recording: fRec,
      capacity: capNum,
      enrollment_status: fEnroll ? (fEnroll as EnrollmentStatus) : null,

      approval_status: "pending" as ApprovalStatus,
      submitted_by: user.id,
    };

    const { error } = await supabase.from("trainings").insert(payload);

    setAddSubmitting(false);

    if (error) {
      alert(`Nie udało się dodać szkolenia: ${error.message}`);
      return;
    }

    setAddOpen(false);

    // reset
    setFTitle("");
    setFOrganizer("");
    setFPoints("0");
    setFFormat("online");
    setFCategory("kurs");
    setFStart("");
    setFEnd("");
    setFVoiv("");
    setFUrl("");
    setFTopics("");
    setFPrice("");
    setFRec(false);
    setFCap("");
    setFEnroll("");

    alert("Wysłano do akceptacji. Po zatwierdzeniu pojawi się w bazie.");
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

  const RIGHT_W = "md:w-[340px]";
  const BTN_SECONDARY_W = "md:w-[112px]";
  const BTN_PRIMARY_W = "md:w-[168px]"; // = + Dodaj do planu
  const BTN_FILTER_W = "md:w-[168px]"; // = Filtruj
  const BTN_ADD_W = "md:w-[168px]"; // = Dodaj szkolenie

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        {/* Header */}
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
          {/* ✅ 2 linie pól: (Szukaj + 3 krótkie) + (6 krótkich). Przyciski osobno */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* LINIA 1 */}
            <div className="md:col-span-6">
              <label className="text-xs font-extrabold text-slate-800">
                Szukaj
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="np. kongres, NIL, radiologia, Warszawa, 10 pkt…"
                className={fieldBase}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Sortowanie
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className={fieldBase}
              >
                {SORT_OPTIONS.map((o) => (
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
              <label className="text-xs font-semibold text-slate-700">Forma</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className={fieldBase}
              >
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* LINIA 2 (6 równych) */}
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
              <label className="text-xs font-semibold text-slate-700">Punkty</label>
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

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Termin</label>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
                className={fieldBase}
              >
                {TIME_WINDOW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Cena</label>
              <select
                value={priceMode}
                onChange={(e) => setPriceMode(e.target.value as PriceMode)}
                className={fieldBase}
              >
                {PRICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Temat</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={fieldBase}
              >
                {topicOptions.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "Dowolnie" : t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Zapisy</label>
              <select
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value as any)}
                className={fieldBase}
              >
                {ENROLLMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* PRZYCISKI */}
            <div className="md:col-span-12 md:flex md:items-end md:justify-end">
              <div className="mt-1 flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={load}
                  className={`inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 ${BTN_FILTER_W}`}
                  disabled={fetching}
                  type="button"
                >
                  Filtruj
                </button>

                <button
                  onClick={() => setAddOpen(true)}
                  className={`inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 ${BTN_ADD_W}`}
                  type="button"
                >
                  Dodaj szkolenie
                </button>
              </div>
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

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyRecording}
                  onChange={(e) => setOnlyRecording(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100"
                />
                Tylko z nagraniem
              </label>

              {timeWindow !== "all" ? (
                <span className="text-xs text-slate-500">
                  (Termin ogranicza wyniki do okna)
                </span>
              ) : null}
            </div>

            <div className="text-sm text-slate-600">
              Wynik:{" "}
              <span className="font-semibold text-slate-900">{items.length}</span>
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
          {items.map((t) => {
            const dd = daysDiffFromToday(t.start_date);
            const soon = typeof dd === "number" && dd >= 0 && dd <= 7;

            const price = formatPrice(
              typeof t.price_pln === "number" ? t.price_pln : null
            );
            const enr = labelEnrollment(
              (t.enrollment_status ?? null) as EnrollmentStatus | null
            );
            const hasRec =
              t.has_recording === true
                ? "Nagranie: Tak"
                : t.has_recording === false
                ? "Nagranie: Nie"
                : null;

            const capacityText =
              typeof t.capacity === "number" ? `Limit: ${t.capacity}` : null;

            return (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

                      <span>{labelType(t.format)}</span>

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

                    {(price || enr || hasRec || capacityText) && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        {price ? (
                          <span>
                            Cena:{" "}
                            <span className="font-semibold text-slate-700">
                              {price}
                            </span>
                          </span>
                        ) : null}
                        {price && (enr || hasRec || capacityText) ? (
                          <span className="text-slate-300">•</span>
                        ) : null}

                        {enr ? (
                          <span>
                            Zapisy:{" "}
                            <span className="font-semibold text-slate-700">
                              {enr}
                            </span>
                          </span>
                        ) : null}
                        {enr && (hasRec || capacityText) ? (
                          <span className="text-slate-300">•</span>
                        ) : null}

                        {hasRec ? <span>{hasRec}</span> : null}
                        {hasRec && capacityText ? (
                          <span className="text-slate-300">•</span>
                        ) : null}

                        {capacityText ? <span>{capacityText}</span> : null}
                      </div>
                    )}
                  </div>

                  <div className={`shrink-0 ${RIGHT_W}`}>
                    <div className="flex items-center justify-end">
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

                    <div className="mt-2 flex justify-end gap-2">
                      {t.url ? (
                        <a
                          href={t.url}
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
                        className={`inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 ${BTN_PRIMARY_W}`}
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

          {!fetching && items.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Brak wyników. Zmień filtry albo wybierz „Dowolnie” w Terminie.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Dodaj szkolenie */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => (addSubmitting ? null : setAddOpen(false))}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  Dodaj szkolenie do bazy
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Po dodaniu szkolenie trafi do akceptacji operatora i dopiero
                  potem pojawi się w wynikach.
                </div>
              </div>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setAddOpen(false)}
                disabled={addSubmitting}
                type="button"
              >
                Zamknij
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-8">
                <label className="text-xs font-semibold text-slate-700">
                  Tytuł *
                </label>
                <input
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  className={fieldBase}
                  placeholder="np. Diagnostyka sepsy — biomarkery i panel…"
                />
              </div>

              <div className="md:col-span-4">
                <label className="text-xs font-semibold text-slate-700">
                  Punkty *
                </label>
                <input
                  value={fPoints}
                  onChange={(e) => setFPoints(e.target.value)}
                  className={fieldBase}
                  inputMode="numeric"
                />
              </div>

              <div className="md:col-span-6">
                <label className="text-xs font-semibold text-slate-700">
                  Organizator
                </label>
                <input
                  value={fOrganizer}
                  onChange={(e) => setFOrganizer(e.target.value)}
                  className={fieldBase}
                  placeholder="np. NIL / OIL / Towarzystwo…"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-700">
                  Forma *
                </label>
                <select
                  value={fFormat}
                  onChange={(e) => setFFormat(e.target.value as TrainingType)}
                  className={fieldBase}
                >
                  <option value="online">Online / webinar</option>
                  <option value="stacjonarne">Stacjonarne</option>
                  <option value="hybrydowe">Hybrydowe</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-700">
                  Kategoria *
                </label>
                <select
                  value={fCategory}
                  onChange={(e) =>
                    setFCategory(e.target.value as TrainingCategory)
                  }
                  className={fieldBase}
                >
                  <option value="kurs">Kurs</option>
                  <option value="szkolenie">Szkolenie</option>
                  <option value="konferencja">Konferencja / kongres</option>
                  <option value="warsztaty">Warsztaty</option>
                  <option value="publikacja">Publikacja</option>
                  <option value="inne">Inne</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-700">
                  Start *
                </label>
                <input
                  type="date"
                  value={fStart}
                  onChange={(e) => setFStart(e.target.value)}
                  className={fieldBase}
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-700">
                  Koniec
                </label>
                <input
                  type="date"
                  value={fEnd}
                  onChange={(e) => setFEnd(e.target.value)}
                  className={fieldBase}
                />
              </div>

              <div className="md:col-span-6">
                <label className="text-xs font-semibold text-slate-700">
                  Województwo / miejsce
                </label>
                <input
                  value={fVoiv}
                  onChange={(e) => setFVoiv(e.target.value)}
                  className={fieldBase}
                  placeholder="np. mazowieckie / Warszawa"
                />
              </div>

              <div className="md:col-span-12">
                <label className="text-xs font-semibold text-slate-700">Link</label>
                <input
                  value={fUrl}
                  onChange={(e) => setFUrl(e.target.value)}
                  className={fieldBase}
                  placeholder="https://…"
                />
              </div>

              <div className="md:col-span-12">
                <label className="text-xs font-semibold text-slate-700">
                  Tematy (topics)
                </label>
                <input
                  value={fTopics}
                  onChange={(e) => setFTopics(e.target.value)}
                  className={fieldBase}
                  placeholder="np. radiologia, POZ, kardiologia"
                />
                <div className="mt-1 text-xs text-slate-500">
                  Wpisz po przecinku. To pomoże w filtrowaniu.
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-700">
                  Cena (PLN)
                </label>
                <input
                  value={fPrice}
                  onChange={(e) => setFPrice(e.target.value)}
                  className={fieldBase}
                  placeholder="np. 0 lub 199"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-700">
                  Limit miejsc
                </label>
                <input
                  value={fCap}
                  onChange={(e) => setFCap(e.target.value)}
                  className={fieldBase}
                  placeholder="np. 50"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-700">
                  Zapisy
                </label>
                <select
                  value={fEnroll}
                  onChange={(e) => setFEnroll(e.target.value as any)}
                  className={fieldBase}
                >
                  <option value="">—</option>
                  <option value="open">Zapisy otwarte</option>
                  <option value="waiting_list">Lista rezerwowa</option>
                  <option value="closed">Zapisy zamknięte</option>
                </select>
              </div>

              <div className="md:col-span-3 flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={fRec}
                    onChange={(e) => setFRec(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100"
                  />
                  Nagranie dostępne
                </label>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setAddOpen(false)}
                disabled={addSubmitting}
                type="button"
              >
                Anuluj
              </button>

              <button
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={submitNewTraining}
                disabled={addSubmitting}
                type="button"
              >
                {addSubmitting ? "Wysyłam…" : "Wyślij do akceptacji"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}