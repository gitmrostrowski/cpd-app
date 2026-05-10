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

  url: string | null;
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

function dateParts(d: string | null) {
  if (!d) {
    return {
      day: "—",
      month: "",
      weekday: "",
      year: "",
    };
  }

  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) {
    return {
      day: "—",
      month: "",
      weekday: "",
      year: "",
    };
  }

  const date = new Date(y, m - 1, day);

  const month = new Intl.DateTimeFormat("pl-PL", {
    month: "short",
  })
    .format(date)
    .replace(".", "")
    .toUpperCase();

  const weekday = new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
  })
    .format(date)
    .replace(".", "");

  return {
    day: String(day).padStart(2, "0"),
    month,
    weekday,
    year: String(y),
  };
}

function dateRangeShort(start: string | null, end: string | null) {
  if (!start && !end) return null;
  if (start && end && start !== end) {
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  return formatDate(start ?? end);
}

function statusTone(status: EnrollmentStatus | null | undefined) {
  if (status === "open") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "waiting_list") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "closed") {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }
  return "border-slate-200 bg-slate-50 text-slate-500";
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
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

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

    approval_status: (r.apval_status ?? r.approval_status ?? null) as ApprovalStatus | null,
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

    if (organizer !== "all") query = query.ilike("organizer", `%${organizer}%`);
    if (format !== "all") query = query.eq("format", format);
    if (category !== "all") query = query.eq("category", category);

    if (minPoints !== "all") query = query.gte("points", Number(minPoints));

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

      url,
      external_url: url,

      topics: parseTopics(fTopics),
      price_pln: priceNum,
      has_recording: fRec,
      capacity: capNum,
      enrollment_status: fEnroll ? (fEnroll as EnrollmentStatus) : null,

      approval_status: "pending" as ApprovalStatus,
      submitted_by: user.id,
      submitted_email: user.email ?? null,
    };

    const { error } = await supabase.from("trainings").insert(payload);

    setAddSubmitting(false);

    if (error) {
      alert(`Nie udało się dodać szkolenia: ${error.message}`);
      return;
    }

    setAddOpen(false);

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
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[1.45rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm shadow-slate-900/5">
          Sprawdzam sesję…
        </div>
      </div>
    );
  }

  const fieldBase =
    "mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 shadow-inner shadow-slate-900/5 transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

  const labelBase =
    "text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500";

  const pillBase =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
                Baza CRPE
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Baza szkoleń
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Znajdź kursy, webinary i wydarzenia z punktami edukacyjnymi.
                Wybierz szkolenie, a trafi do Twojego planu CPD.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/aktywnosci"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                Aktywności
              </Link>

              <button
                onClick={load}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
                disabled={fetching}
                type="button"
              >
                {fetching ? "Odświeżam…" : "Odśwież"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[1.45rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className={labelBase}>Szukaj</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="np. kongres, NIL, radiologia, Warszawa, 10 pkt…"
                className={fieldBase}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelBase}>Sortowanie</label>
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
              <label className={labelBase}>Organizator</label>
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
              <label className={labelBase}>Forma</label>
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

            <div className="md:col-span-2">
              <label className={labelBase}>Kategoria</label>
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
              <label className={labelBase}>Punkty</label>
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
              <label className={labelBase}>Termin</label>
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
              <label className={labelBase}>Cena</label>
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
              <label className={labelBase}>Temat</label>
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
              <label className={labelBase}>Zapisy</label>
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

            <div className="md:col-span-12 md:flex md:items-end md:justify-end">
              <div className="mt-1 flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={load}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 disabled:opacity-60 sm:w-auto sm:min-w-[150px]"
                  disabled={fetching}
                  type="button"
                >
                  Filtruj
                </button>

                <button
                  onClick={() => setAddOpen(true)}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95 sm:w-auto sm:min-w-[150px]"
                  type="button"
                >
                  Dodaj szkolenie
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-white">
                <input
                  type="checkbox"
                  checked={onlyUpcoming}
                  onChange={(e) => setOnlyUpcoming(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-100"
                />
                Tylko nadchodzące
              </label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-white">
                <input
                  type="checkbox"
                  checked={onlyPartner}
                  onChange={(e) => setOnlyPartner(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-100"
                />
                Tylko partnerzy
              </label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-white">
                <input
                  type="checkbox"
                  checked={onlyRecording}
                  onChange={(e) => setOnlyRecording(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-100"
                />
                Tylko z nagraniem
              </label>
            </div>

            <div className="text-sm text-slate-600">
              Wynik:{" "}
              <span className="font-black text-slate-950">{items.length}</span>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

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

            const date = dateParts(t.start_date);
            const range = dateRangeShort(t.start_date, t.end_date);

            const hasRec = t.has_recording === true ? "Nagranie" : null;

            const capacityText =
              typeof t.capacity === "number" ? `Limit ${t.capacity}` : null;

            return (
              <article
                key={t.id}
                className="group overflow-hidden rounded-[1.45rem] border border-slate-200/90 bg-white shadow-sm shadow-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5"
              >
                <div className="grid gap-0 md:grid-cols-[1fr_250px]">
                  <div className="min-w-0 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.organizer ? (
                        <span
                          className={`${pillBase} border-slate-200 bg-slate-50 text-slate-700`}
                        >
                          {t.organizer}
                        </span>
                      ) : null}

                      <span
                        className={`${pillBase} border-blue-100 bg-blue-50 text-blue-700`}
                      >
                        {labelType(t.format)}
                      </span>

                      {t.category ? (
                        <span
                          className={`${pillBase} border-slate-200 bg-white text-slate-600`}
                        >
                          {labelCategory(t.category)}
                        </span>
                      ) : null}

                      {enr ? (
                        <span
                          className={`${pillBase} ${statusTone(
                            t.enrollment_status
                          )}`}
                        >
                          {enr}
                        </span>
                      ) : null}

                      {soon ? (
                        <span
                          className={`${pillBase} border-rose-200 bg-rose-50 text-rose-700`}
                        >
                          Wkrótce
                        </span>
                      ) : null}

                      {t.is_partner ? (
                        <span
                          className={`${pillBase} border-emerald-200 bg-emerald-50 text-emerald-700`}
                        >
                          Partner
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-[15px] font-black leading-snug tracking-tight text-slate-950 sm:text-base">
                      {t.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-500">
                      {range ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          Termin:{" "}
                          <span className="font-bold text-slate-700">
                            {range}
                          </span>
                        </span>
                      ) : null}

                      {t.voivodeship ? (
                        <span>
                          Miejsce:{" "}
                          <span className="font-bold text-slate-700">
                            {t.voivodeship}
                          </span>
                        </span>
                      ) : null}

                      {price ? (
                        <span>
                          Cena:{" "}
                          <span className="font-bold text-slate-700">
                            {price}
                          </span>
                        </span>
                      ) : null}

                      {hasRec ? (
                        <span>
                          <span className="font-bold text-slate-700">
                            {hasRec}
                          </span>
                        </span>
                      ) : null}

                      {capacityText ? (
                        <span>
                          <span className="font-bold text-slate-700">
                            {capacityText}
                          </span>
                        </span>
                      ) : null}
                    </div>

                    {Array.isArray(t.topics) && t.topics.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {t.topics.slice(0, 4).map((x) => (
                          <span
                            key={x}
                            className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200"
                          >
                            {x}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 md:border-l md:border-t-0">
                    <div className="flex items-center justify-between gap-4 md:block">
                      <div className="flex items-center gap-3 md:block md:text-center">
                        <div className="inline-flex min-w-[78px] flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white px-3 py-2 shadow-sm shadow-slate-900/5">
                          <span className="text-3xl font-black leading-none tracking-tight text-slate-950">
                            {date.day}
                          </span>
                          <span className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                            {date.month}
                          </span>
                        </div>

                        <div className="md:mt-2">
                          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                            {date.weekday || "Termin"}
                          </div>
                          {date.year ? (
                            <div className="mt-0.5 text-xs font-semibold text-slate-500">
                              {date.year}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-right md:mt-4 md:text-center">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Punkty
                        </div>
                        <div className="mt-0.5 text-2xl font-black leading-none text-blue-700">
                          {typeof t.points === "number" ? t.points : "—"}
                          <span className="ml-1 text-sm font-black">pkt</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-1">
                      <button
                        onClick={() => chooseTraining(t)}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
                        type="button"
                      >
                        + Dodaj do planu
                      </button>

                      {t.url ? (
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                        >
                          Szczegóły
                        </a>
                      ) : (
                        <button
                          className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-400 shadow-sm"
                          disabled
                          type="button"
                        >
                          Brak linku
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {!fetching && items.length === 0 && (
            <div className="rounded-[1.45rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm shadow-slate-900/5">
              Brak wyników. Zmień filtry albo wybierz „Dowolnie” w Terminie.
            </div>
          )}
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => (addSubmitting ? null : setAddOpen(false))}
          />
          <div className="relative w-full max-w-2xl rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-slate-950">
                  Dodaj szkolenie do bazy
                </div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">
                  Po dodaniu szkolenie trafi do akceptacji operatora i dopiero
                  potem pojawi się w wynikach.
                </div>
              </div>

              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setAddOpen(false)}
                disabled={addSubmitting}
                type="button"
              >
                Zamknij
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-8">
                <label className={labelBase}>Tytuł *</label>
                <input
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  className={fieldBase}
                  placeholder="np. Diagnostyka sepsy — biomarkery i panel…"
                />
              </div>

              <div className="md:col-span-4">
                <label className={labelBase}>Punkty *</label>
                <input
                  value={fPoints}
                  onChange={(e) => setFPoints(e.target.value)}
                  className={fieldBase}
                  inputMode="numeric"
                />
              </div>

              <div className="md:col-span-6">
                <label className={labelBase}>Organizator</label>
                <input
                  value={fOrganizer}
                  onChange={(e) => setFOrganizer(e.target.value)}
                  className={fieldBase}
                  placeholder="np. NIL / OIL / Towarzystwo…"
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelBase}>Forma *</label>
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
                <label className={labelBase}>Kategoria *</label>
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
                <label className={labelBase}>Start *</label>
                <input
                  type="date"
                  value={fStart}
                  onChange={(e) => setFStart(e.target.value)}
                  className={fieldBase}
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelBase}>Koniec</label>
                <input
                  type="date"
                  value={fEnd}
                  onChange={(e) => setFEnd(e.target.value)}
                  className={fieldBase}
                />
              </div>

              <div className="md:col-span-6">
                <label className={labelBase}>Województwo / miejsce</label>
                <input
                  value={fVoiv}
                  onChange={(e) => setFVoiv(e.target.value)}
                  className={fieldBase}
                  placeholder="np. mazowieckie / Warszawa"
                />
              </div>

              <div className="md:col-span-12">
                <label className={labelBase}>Link</label>
                <input
                  value={fUrl}
                  onChange={(e) => setFUrl(e.target.value)}
                  className={fieldBase}
                  placeholder="https://…"
                />
              </div>

              <div className="md:col-span-12">
                <label className={labelBase}>Tematy</label>
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
                <label className={labelBase}>Cena PLN</label>
                <input
                  value={fPrice}
                  onChange={(e) => setFPrice(e.target.value)}
                  className={fieldBase}
                  placeholder="np. 0 lub 199"
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelBase}>Limit miejsc</label>
                <input
                  value={fCap}
                  onChange={(e) => setFCap(e.target.value)}
                  className={fieldBase}
                  placeholder="np. 50"
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelBase}>Zapisy</label>
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

              <div className="flex items-end md:col-span-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
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
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setAddOpen(false)}
                disabled={addSubmitting}
                type="button"
              >
                Anuluj
              </button>

              <button
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
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
