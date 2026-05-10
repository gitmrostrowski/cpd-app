"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MonitorPlay,
} from "lucide-react";
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

const PROFESSION_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "general", label: "Ogólne / dla wszystkich" },
  { value: "lekarz", label: "Lekarz" },
  { value: "lekarz dentysta", label: "Lekarz dentysta" },
  { value: "pielęgniarka", label: "Pielęgniarka / położna" },
  { value: "farmaceuta", label: "Farmaceuta" },
  { value: "fizjoterapeuta", label: "Fizjoterapeuta" },
  { value: "diagnosta", label: "Diagnosta laboratoryjny" },
  { value: "ratownik", label: "Ratownik medyczny" },
  { value: "technik", label: "Technik medyczny" },
];

const VOIVODESHIP_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Cała Polska / online" },
  { value: "dolnośląskie", label: "Dolnośląskie" },
  { value: "kujawsko-pomorskie", label: "Kujawsko-pomorskie" },
  { value: "lubelskie", label: "Lubelskie" },
  { value: "lubuskie", label: "Lubuskie" },
  { value: "łódzkie", label: "Łódzkie" },
  { value: "małopolskie", label: "Małopolskie" },
  { value: "mazowieckie", label: "Mazowieckie" },
  { value: "opolskie", label: "Opolskie" },
  { value: "podkarpackie", label: "Podkarpackie" },
  { value: "podlaskie", label: "Podlaskie" },
  { value: "pomorskie", label: "Pomorskie" },
  { value: "śląskie", label: "Śląskie" },
  { value: "świętokrzyskie", label: "Świętokrzyskie" },
  { value: "warmińsko-mazurskie", label: "Warmińsko-mazurskie" },
  { value: "wielkopolskie", label: "Wielkopolskie" },
  { value: "zachodniopomorskie", label: "Zachodniopomorskie" },
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

function formatTone(format: TrainingType | null) {
  if (format === "stacjonarne") {
    return {
      stripe: "bg-amber-400",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      iconBox: "border-amber-200 bg-amber-50 text-amber-700",
      dateTop: "bg-amber-400",
    };
  }

  if (format === "hybrydowe") {
    return {
      stripe: "bg-indigo-500",
      badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
      iconBox: "border-indigo-200 bg-indigo-50 text-indigo-700",
      dateTop: "bg-indigo-500",
    };
  }

  return {
    stripe: "bg-blue-500",
    badge: "border-blue-100 bg-blue-50 text-blue-700",
    iconBox: "border-blue-100 bg-blue-50 text-blue-700",
    dateTop: "bg-blue-500",
  };
}

function FormatIcon({
  format,
  className = "h-3 w-3",
}: {
  format: TrainingType | null;
  className?: string;
}) {
  if (format === "stacjonarne") {
    return <MapPin className={className} strokeWidth={2} />;
  }

  if (format === "hybrydowe") {
    return <Building2 className={className} strokeWidth={2} />;
  }

  return <MonitorPlay className={className} strokeWidth={2} />;
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

function labelProfession(p: string | null) {
  if (!p) return "Dla wszystkich";
  return p;
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

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date_asc");
  const [organizer, setOrganizer] = useState("all");
  const [format, setFormat] = useState<"all" | TrainingType>("all");

  const [category, setCategory] = useState<"all" | TrainingCategory>("all");
  const [minPoints, setMinPoints] = useState("all");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("90");
  const [place, setPlace] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");
  const [priceMode, setPriceMode] = useState<PriceMode>("all");

  const [topic, setTopic] = useState<string>("all");
  const [enrollment, setEnrollment] = useState<"all" | EnrollmentStatus>("all");

  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

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

    if (place !== "all") query = query.ilike("voivodeship", `%${place}%`);

    if (professionFilter === "general") {
      query = query.or(
        "profession.is.null,profession.ilike.%ogól%,profession.ilike.%wszys%"
      );
    } else if (professionFilter !== "all") {
      query = query.or(
        `profession.is.null,profession.ilike.%ogól%,profession.ilike.%wszys%,profession.ilike.%${professionFilter}%`
      );
    }

    if (topic !== "all") query = query.contains("topics", [topic]);
    if (priceMode === "free") query = query.eq("price_pln", 0);
    if (priceMode === "paid") query = query.gt("price_pln", 0);
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

  const sidebarStats = useMemo(() => {
    const totalPoints = items.reduce(
      (sum, t) => sum + (typeof t.points === "number" ? t.points : 0),
      0
    );

    return {
      totalPoints,
      online: items.filter((t) => t.format === "online").length,
      stationary: items.filter((t) => t.format === "stacjonarne").length,
      open: items.filter((t) => t.enrollment_status === "open").length,
    };
  }, [items]);

  const nextTrainings = useMemo(() => items.slice(0, 4), [items]);

  const calendarPreview = useMemo(() => {
    const dated = items
      .filter((t) => t.start_date)
      .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));

    const baseDate = dated[0]?.start_date
      ? new Date(`${dated[0].start_date}T00:00:00`)
      : new Date();

    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const eventMap = new Map<number, TrainingType | null>();

    for (const item of dated) {
      if (!item.start_date) continue;

      const d = new Date(`${item.start_date}T00:00:00`);
      if (d.getFullYear() === year && d.getMonth() === month) {
        eventMap.set(d.getDate(), item.format);
      }
    }

    const monthLabel = new Intl.DateTimeFormat("pl-PL", {
      month: "long",
      year: "numeric",
    }).format(baseDate);

    return {
      monthLabel,
      days: Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
          day,
          format: eventMap.get(day) ?? null,
          hasEvent: eventMap.has(day),
        };
      }),
    };
  }, [items]);

  const chooseTraining = async (t: Training) => {
    if (!user) {
      alert("Zaloguj się, żeby dodać szkolenie do planu.");
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
      alert(`Nie udało się dodać szkolenia do planu: ${error.message}`);
      return;
    }

    if (t.url) {
      const goToOrganizer = window.confirm(
        "Dodano do planu CPD.\n\nTo nie oznacza zapisu u organizatora. Aby wziąć udział w szkoleniu, musisz zapisać się bezpośrednio na stronie organizatora.\n\nCzy chcesz teraz przejść do strony organizatora?"
      );

      if (goToOrganizer) {
        window.open(t.url, "_blank", "noopener,noreferrer");
      }

      return;
    }

    alert(
      "Dodano do planu CPD.\n\nTo nie oznacza zapisu u organizatora. Aby wziąć udział w szkoleniu, musisz zapisać się bezpośrednio u organizatora."
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm shadow-slate-900/5">
          Sprawdzam sesję…
        </div>
      </div>
    );
  }

  const fieldBase =
    "h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 shadow-inner shadow-slate-900/5 transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

  const labelBase =
    "mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500";

  const pillBase =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none";

  const metaIconBase =
    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border bg-white";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[linear-gradient(180deg,#f3f6fb_0%,#f8fafc_45%,#f4f6f8_100%)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-900/5 sm:px-6">
          <div className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-amber-400" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
                <BookOpen className="h-5 w-5" strokeWidth={2} />
              </span>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Baza szkoleń
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Kursy, webinary i wydarzenia z punktami edukacyjnymi. Dodanie
                  do planu nie oznacza zapisu u organizatora.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/aktywnosci"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                Aktywności
              </Link>

              <button
                onClick={load}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
                disabled={fetching}
                type="button"
              >
                {fetching ? "Odświeżam…" : "Odśwież"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Znajdź szkolenie
              </div>
              <div className="text-xs text-slate-500">
                Wybierz zawód, miejsce i termin, żeby zawęzić listę.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label className={labelBase}>Szukaj</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="np. kongres, NIL, radiologia..."
                className={fieldBase}
              />
            </div>

            <div className="lg:col-span-2">
              <label className={labelBase}>Zawód / specjalizacja</label>
              <select
                value={professionFilter}
                onChange={(e) => setProfessionFilter(e.target.value)}
                className={fieldBase}
              >
                {PROFESSION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className={labelBase}>Miejsce</label>
              <select
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className={fieldBase}
              >
                {VOIVODESHIP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
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

            <div className="lg:col-span-1">
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

            <div className="lg:col-span-1">
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

            <div className="flex items-end lg:col-span-1">
              <button
                onClick={load}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
                disabled={fetching}
                type="button"
              >
                Filtruj
              </button>
            </div>
          </div>

          {showMoreFilters ? (
            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 md:grid-cols-2 lg:grid-cols-7">
              <div>
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

              <div>
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

              <div>
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

              <div>
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

              <div>
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

              <div>
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

              <div>
                <label className={labelBase}>Zakres</label>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={onlyUpcoming}
                    onChange={(e) => setOnlyUpcoming(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-100"
                  />
                  Nadchodzące
                </label>
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Wynik:{" "}
              <span className="font-semibold text-slate-900">
                {items.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMoreFilters((v) => !v)}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {showMoreFilters ? "Mniej filtrów" : "Więcej filtrów"}
              </button>

              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3.5 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 active:scale-95"
                type="button"
              >
                Dodaj szkolenie
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-3">
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
              const tone = formatTone(t.format);

              const capacityText =
                typeof t.capacity === "number" ? `Limit ${t.capacity}` : null;

              return (
                <article
                  key={t.id}
                  className="group rounded-[1.35rem] border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-900/5 transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/6"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex w-[74px] flex-col items-center rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200/90">
                        <span className={`mb-2 h-1.5 w-8 rounded-full ${tone.dateTop}`} />
                        <span className="text-3xl font-semibold leading-none tracking-[-0.05em] text-slate-950">
                          {date.day}
                        </span>
                        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {date.month}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`${pillBase} ${tone.badge}`}>
                              <FormatIcon
                                format={t.format}
                                className="mr-1 h-3 w-3"
                              />
                              {labelType(t.format)}
                            </span>

                            {enr ? (
                              <span
                                className={`${pillBase} ${statusTone(
                                  t.enrollment_status
                                )}`}
                              >
                                <CheckCircle2
                                  className="mr-1 h-3 w-3"
                                  strokeWidth={2}
                                />
                                {enr}
                              </span>
                            ) : null}

                            {soon ? (
                              <span
                                className={`${pillBase} border-amber-200 bg-amber-50 text-amber-700`}
                              >
                                <Clock3
                                  className="mr-1 h-3 w-3"
                                  strokeWidth={2}
                                />
                                Wkrótce
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-2 line-clamp-2 text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-slate-950">
                            {t.title}
                          </h3>
                        </div>

                        <div className="hidden shrink-0 rounded-2xl bg-blue-50/70 px-3 py-2 text-right ring-1 ring-blue-100 md:block">
                          <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-500">
                            CPD
                          </div>
                          <div className="mt-0.5 whitespace-nowrap text-lg font-semibold leading-none tracking-[-0.03em] text-blue-700">
                            {typeof t.points === "number" ? t.points : "—"}
                            <span className="ml-1 text-xs font-semibold">
                              pkt
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                        {range ? (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span
                              className={`${metaIconBase} border-slate-200 text-slate-500`}
                            >
                              <CalendarDays
                                className="h-3 w-3"
                                strokeWidth={2}
                              />
                            </span>
                            <span className="truncate font-semibold text-slate-700">
                              {range}
                            </span>
                          </span>
                        ) : null}

                        {t.organizer ? (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span
                              className={`${metaIconBase} border-slate-200 text-slate-500`}
                            >
                              <Building2 className="h-3 w-3" strokeWidth={2} />
                            </span>
                            <span className="truncate font-semibold text-slate-700">
                              {t.organizer}
                            </span>
                          </span>
                        ) : null}

                        {t.voivodeship ? (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span
                              className={`${metaIconBase} border-slate-200 text-slate-500`}
                            >
                              <MapPin className="h-3 w-3" strokeWidth={2} />
                            </span>
                            <span className="truncate font-semibold text-slate-700">
                              {t.voivodeship}
                            </span>
                          </span>
                        ) : null}

                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <span
                            className={`${metaIconBase} border-slate-200 text-slate-500`}
                          >
                            <Award className="h-3 w-3" strokeWidth={2} />
                          </span>
                          <span className="truncate">
                            {labelCategory(t.category)}
                            {price ? (
                              <>
                                {" · "}
                                <span className="font-semibold text-slate-700">
                                  {price}
                                </span>
                              </>
                            ) : null}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-50/80 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/80">
                          {labelProfession(t.profession)}
                        </span>

                        {capacityText ? (
                          <span className="rounded-full bg-slate-50/80 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/80">
                            {capacityText}
                          </span>
                        ) : null}

                        {Array.isArray(t.topics)
                          ? t.topics.slice(0, 3).map((x) => (
                              <span
                                key={x}
                                className="rounded-full bg-slate-50/80 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/80"
                              >
                                {x}
                              </span>
                            ))
                          : null}
                      </div>

                      <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-[11px] leading-snug text-slate-400">
                          Plan CPD ≠ zapis u organizatora.
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          {t.url ? (
                            <a
                              href={t.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                            >
                              Organizator
                            </a>
                          ) : (
                            <button
                              className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-400 shadow-sm"
                              disabled
                              type="button"
                            >
                              Brak linku
                            </button>
                          )}

                          <button
                            onClick={() => chooseTraining(t)}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                            type="button"
                            title="Dodaje szkolenie do planu CPD, ale nie zapisuje u organizatora"
                          >
                            Do planu
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {!fetching && items.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm shadow-slate-900/5">
                Brak wyników. Zmień filtry albo wybierz „Dowolnie” w Terminie.
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-[1.35rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-4 shadow-sm shadow-blue-950/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500">
                    Planowanie
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-950">
                    Najbliższe terminy
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Szybki podgląd wydarzeń z aktualnych filtrów.
                  </p>
                </div>

                <div className="rounded-2xl bg-white px-3 py-2 text-right ring-1 ring-blue-100">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-500">
                    Wynik
                  </div>
                  <div className="text-2xl font-semibold leading-none text-blue-700">
                    {items.length}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/80">
                  <div className="text-lg font-semibold text-slate-950">
                    {sidebarStats.totalPoints}
                  </div>
                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    pkt
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/80">
                  <div className="text-lg font-semibold text-slate-950">
                    {sidebarStats.online}
                  </div>
                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    online
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/80">
                  <div className="text-lg font-semibold text-slate-950">
                    {sidebarStats.open}
                  </div>
                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    zapisy
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Kalendarz
                  </div>
                  <div className="text-xs capitalize text-slate-500">
                    {calendarPreview.monthLabel}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  online
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
                  stacj.
                </div>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1">
                {calendarPreview.days.map((day) => {
                  const dayTone =
                    day.format === "stacjonarne"
                      ? "bg-amber-100 text-amber-800 ring-amber-200"
                      : day.format === "hybrydowe"
                      ? "bg-indigo-100 text-indigo-800 ring-indigo-200"
                      : day.hasEvent
                      ? "bg-blue-100 text-blue-800 ring-blue-200"
                      : "bg-slate-50 text-slate-400 ring-slate-100";

                  return (
                    <div
                      key={day.day}
                      className={`flex aspect-square items-center justify-center rounded-xl text-[11px] font-semibold ring-1 ${dayTone}`}
                    >
                      {day.day}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
              <div className="text-sm font-semibold text-slate-950">
                Najbliżej w planie
              </div>

              <div className="mt-3 space-y-2.5">
                {nextTrainings.map((t) => {
                  const d = dateParts(t.start_date);
                  const tone = formatTone(t.format);

                  return (
                    <div
                      key={t.id}
                      className="flex gap-3 rounded-2xl bg-slate-50/80 p-2.5 ring-1 ring-slate-200/80"
                    >
                      <div className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-white py-1.5 ring-1 ring-slate-200">
                        <span className={`mb-1 h-1 w-5 rounded-full ${tone.dateTop}`} />
                        <span className="text-sm font-semibold leading-none text-slate-950">
                          {d.day}
                        </span>
                        <span className="mt-0.5 text-[9px] font-semibold uppercase text-slate-400">
                          {d.month}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="line-clamp-2 text-xs font-semibold leading-snug text-slate-800">
                          {t.title}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {typeof t.points === "number" ? t.points : "—"} pkt ·{" "}
                          {labelType(t.format)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {nextTrainings.length === 0 ? (
                  <div className="text-xs text-slate-500">
                    Brak szkoleń w aktualnych filtrach.
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => (addSubmitting ? null : setAddOpen(false))}
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-950">
                  Dodaj szkolenie do bazy
                </div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">
                  Po dodaniu szkolenie trafi do akceptacji operatora i dopiero
                  potem pojawi się w wynikach.
                </div>
              </div>

              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
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
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setAddOpen(false)}
                disabled={addSubmitting}
                type="button"
              >
                Anuluj
              </button>

              <button
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
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
