"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BookmarkPlus,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  GraduationCap,
  Info,
  MapPin,
  MonitorPlay,
  Plus,
  RotateCcw,
  SearchCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";
import {
  createActivity,
  fetchProfessionCatalog,
  fetchPublicTrainings,
  type LegacyTraining,
  type PointVerificationStatus,
  type TrainingProfessionRule,
} from "@/lib/data/crpe";
import {
  FALLBACK_PROFESSION_OPTIONS,
  type ProfessionOption,
} from "@/lib/cpd/professions";
import TrainingAudienceField, {
  hasTrainingAudience,
  trainingAudienceSelection,
  trainingAudienceSummary,
} from "@/components/TrainingAudienceField";

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
  organizer_logo_url?: string | null;
  points: number | null;

  format: TrainingType | null;

  start_date: string | null;
  end_date: string | null;

  category: TrainingCategory | null;
  profession: string | null;
  audience_scope: "unknown" | "specific" | "all_medical";
  profession_rules: TrainingProfessionRule[];
  points_verification_status: PointVerificationStatus;
  points_source_url: string | null;
  points_verified_on: string | null;
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
  description?: string | null;

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

type SortBy =
  | "date_asc"
  | "date_desc"
  | "points_desc"
  | "points_asc"
  | "newest";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "date_asc", label: "Najbliższe terminy" },
  { value: "date_desc", label: "Najpóźniejsze terminy" },
  { value: "points_desc", label: "Najwięcej punktów" },
  { value: "points_asc", label: "Najmniej punktów" },
  { value: "newest", label: "Nowo dodane" },
];

type PriceMode = "all" | "free" | "paid";

type TrainingFilterOverrides = Partial<{
  q: string;
  sortBy: SortBy;
  organizer: string;
  format: "all" | TrainingType;
  category: "all" | TrainingCategory;
  minPoints: string;
  timeWindow: TimeWindow;
  place: string;
  professionFilter: string;
  priceMode: PriceMode;
  topic: string;
  enrollment: "all" | EnrollmentStatus;
  onlyUpcoming: boolean;
}>;

const TRAININGS_PAGE_SIZE = 10;

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

function trainingCountLabel(count: number) {
  if (count === 1) return "1 szkolenie";
  const lastTwo = count % 100;
  const last = count % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
    return `${count} szkolenia`;
  }
  return `${count} szkoleń`;
}

function matchedTrainingCountLabel(count: number) {
  if (count === 1) return "Znaleziono 1 dopasowane szkolenie";
  const lastTwo = count % 100;
  const last = count % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
    return `Znaleziono ${count} dopasowane szkolenia`;
  }
  return `Znaleziono ${count} dopasowanych szkoleń`;
}

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
      stripe: "bg-amber-300",
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      dateTop: "bg-amber-300",
    };
  }

  if (format === "hybrydowe") {
    return {
      stripe: "bg-indigo-300",
      badge: "border-indigo-200 bg-indigo-50 text-indigo-800",
      dateTop: "bg-indigo-300",
    };
  }

  return {
    stripe: "bg-blue-300",
    badge: "border-blue-200 bg-blue-50 text-blue-800",
    dateTop: "bg-blue-300",
  };
}

function FormatIcon({
  format,
  className = "h-4 w-4",
}: {
  format: TrainingType | null;
  className?: string;
}) {
  if (format === "stacjonarne") {
    return <MapPin className={className} strokeWidth={2.2} />;
  }

  if (format === "hybrydowe") {
    return <Building2 className={className} strokeWidth={2.2} />;
  }

  return <MonitorPlay className={className} strokeWidth={2.2} />;
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
  if (!p) return "Adresaci do weryfikacji";
  return p;
}

function pointsDetailsLabel(status: PointVerificationStatus) {
  if (status === "verified") return "Punkty potwierdzone przez CRPE";
  if (status === "organizer_declared") return "Punkty podane przez organizatora";
  return "Punkty wymagają sprawdzenia dla Twojego zawodu";
}

function formatPrice(pricePln: number | null) {
  if (typeof pricePln !== "number") return null;
  if (pricePln === 0) return "Bezpłatne";

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

function normalizeLogoUrl(raw: string | null | undefined) {
  const value = String(raw ?? "").trim();
  if (!value || !/^https:\/\//i.test(value)) return null;
  return value;
}

function OrganizerLogo({
  name,
  src,
  large = false,
  card = false,
}: {
  name: string | null;
  src: string | null | undefined;
  large?: boolean;
  card?: boolean;
}) {
  const logoUrl = normalizeLogoUrl(src);
  if (!logoUrl) return null;
  const size = large
    ? "h-16 w-16 rounded-2xl"
    : card
      ? "h-8 w-[76px]"
      : "h-7 w-7 rounded-lg";
  const frame = card
    ? "justify-end"
    : "overflow-hidden border border-slate-200 bg-white text-slate-400 shadow-sm";

  return (
    <span
      className={`inline-flex shrink-0 items-center ${frame} ${size}`}
      role="img"
      aria-label={name ? `Logo organizatora ${name}` : "Logo organizatora"}
    >
      {/* Logo jest moderowane przez operatora CRPE i renderowane jako obraz. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        className={card ? "max-h-8 max-w-full object-contain" : "h-full w-full object-contain p-1.5"}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </span>
  );
}

function normalizeTrainingRow(r: LegacyTraining): Training {
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
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    organizer: r.organizer ?? null,
    organizer_logo_url: normalizeLogoUrl(r.organizer_logo_url),
    points: typeof r.points === "number" ? r.points : r.points ?? null,

    format: (r.format ?? null) as TrainingType | null,

    start_date: r.start_date ?? null,
    end_date: r.end_date ?? null,

    category: (r.category ?? null) as TrainingCategory | null,
    profession: r.profession ?? null,
    audience_scope: r.audience_scope ?? "unknown",
    profession_rules: r.profession_rules ?? [],
    points_verification_status:
      r.points_verification_status ?? "unverified",
    points_source_url: r.points_source_url ?? null,
    points_verified_on: r.points_verified_on ?? null,
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
    description: r.description ?? null,

    created_at: String(r.created_at ?? ""),
    updated_at: r.updated_at ?? null,
  };
}

export default function TrainingHubClient() {
  const { user } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);
  const calendarMonthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [items, setItems] = useState<Training[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [professionOptions, setProfessionOptions] =
    useState<ProfessionOption[]>([...FALLBACK_PROFESSION_OPTIONS]);

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
  const [visibleCount, setVisibleCount] = useState(TRAININGS_PAGE_SIZE);

  const [addOpen, setAddOpen] = useState(false);
  const [detailsTraining, setDetailsTraining] = useState<Training | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [selectedCalendarTrainingId, setSelectedCalendarTrainingId] = useState<
    string | null
  >(null);
  const [selectedCalendarDateKey, setSelectedCalendarDateKey] = useState<
    string | null
  >(null);

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
  const [fDescription, setFDescription] = useState("");
  const [fProfession, setFProfession] = useState("");
  const [fLogo, setFLogo] = useState<File | null>(null);
  const [fLogoPreview, setFLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!fLogo) {
      setFLogoPreview(null);
      return;
    }
    const preview = URL.createObjectURL(fLogo);
    setFLogoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [fLogo]);

  const load = async (overrides: TrainingFilterOverrides = {}) => {
    setFetching(true);
    setError(null);

    const todayStr = todayYYYYMMDD();
    const activeFilters = {
      q: overrides.q ?? q,
      sortBy: overrides.sortBy ?? sortBy,
      organizer: overrides.organizer ?? organizer,
      format: overrides.format ?? format,
      category: overrides.category ?? category,
      minPoints: overrides.minPoints ?? minPoints,
      timeWindow: overrides.timeWindow ?? timeWindow,
      place: overrides.place ?? place,
      professionFilter: overrides.professionFilter ?? professionFilter,
      priceMode: overrides.priceMode ?? priceMode,
      topic: overrides.topic ?? topic,
      enrollment: overrides.enrollment ?? enrollment,
      onlyUpcoming: overrides.onlyUpcoming ?? onlyUpcoming,
    };

    try {
      let rows = (await fetchPublicTrainings(supabase))
        .map(normalizeTrainingRow)
        .filter((row) => row.approval_status === "approved");
      const includes = (value: string | null | undefined, phrase: string) =>
        String(value ?? "").toLocaleLowerCase("pl-PL").includes(
          phrase.toLocaleLowerCase("pl-PL"),
        );

      if (activeFilters.organizer !== "all")
        rows = rows.filter((row) =>
          includes(row.organizer, activeFilters.organizer),
        );
      if (activeFilters.format !== "all")
        rows = rows.filter((row) => row.format === activeFilters.format);
      if (activeFilters.category !== "all")
        rows = rows.filter((row) => row.category === activeFilters.category);
      if (activeFilters.timeWindow !== "all") {
        const maxDate = addDaysYYYYMMDD(Number(activeFilters.timeWindow));
        rows = rows.filter(
          (row) =>
            Boolean(row.start_date) &&
            row.start_date! >= todayStr &&
            row.start_date! <= maxDate,
        );
      } else if (activeFilters.onlyUpcoming) {
        rows = rows.filter(
          (row) => Boolean(row.start_date) && row.start_date! >= todayStr,
        );
      }
      if (activeFilters.place !== "all")
        rows = rows.filter((row) =>
          includes(row.voivodeship, activeFilters.place),
        );
      if (activeFilters.professionFilter !== "all") {
        if (activeFilters.professionFilter === "general") {
          rows = rows.filter((row) => row.audience_scope === "all_medical");
        } else if (activeFilters.professionFilter === "unknown") {
          rows = rows.filter((row) => row.audience_scope === "unknown");
        } else {
          rows = rows
            .filter(
              (row) =>
                row.audience_scope === "all_medical" ||
                row.profession_rules.some(
                  (rule) =>
                    rule.profession_code === activeFilters.professionFilter,
                ),
            )
            .map((row) => {
              const rule = row.profession_rules.find(
                (item) =>
                  item.profession_code === activeFilters.professionFilter,
              );
              if (!rule) return row;
              return {
                ...row,
                points: rule.points ?? row.points,
                points_verification_status: rule.verification_status,
                points_source_url: rule.source_url ?? row.points_source_url,
                points_verified_on: rule.verified_on ?? row.points_verified_on,
              };
            });
        }
      }
      if (activeFilters.minPoints !== "all")
        rows = rows.filter(
          (row) =>
            Number(row.points ?? 0) >= Number(activeFilters.minPoints),
        );
      if (activeFilters.topic !== "all")
        rows = rows.filter((row) =>
          row.topics?.includes(activeFilters.topic),
        );
      if (activeFilters.priceMode === "free")
        rows = rows.filter((row) => Number(row.price_pln ?? 0) === 0);
      if (activeFilters.priceMode === "paid")
        rows = rows.filter((row) => Number(row.price_pln ?? 0) > 0);
      if (activeFilters.enrollment !== "all")
        rows = rows.filter(
          (row) => row.enrollment_status === activeFilters.enrollment,
        );
      if (activeFilters.q.trim()) {
        const phrase = activeFilters.q.trim();
        rows = rows.filter((row) =>
          [
            row.title,
            row.organizer,
            row.category,
            row.voivodeship,
            row.profession,
          ].some((value) => includes(value, phrase)),
        );
      }

      rows.sort((a, b) => {
        if (activeFilters.sortBy === "points_desc")
          return Number(b.points ?? 0) - Number(a.points ?? 0);
        if (activeFilters.sortBy === "points_asc")
          return Number(a.points ?? 0) - Number(b.points ?? 0);
        if (activeFilters.sortBy === "newest")
          return String(b.created_at).localeCompare(String(a.created_at));
        const direction = activeFilters.sortBy === "date_desc" ? -1 : 1;
        return (
          direction *
          String(a.start_date ?? "9999-12-31").localeCompare(
            String(b.start_date ?? "9999-12-31"),
          )
        );
      });

      setItems(rows.slice(0, 200));
      setVisibleCount(TRAININGS_PAGE_SIZE);
      setSelectedCalendarDateKey(null);
      setSelectedCalendarTrainingId(null);
    } catch (caught) {
      console.error("Public training directory load failed", caught);
      setError("Nie udało się pobrać szkoleń. Spróbuj ponownie za chwilę.");
      setItems([]);
    }

    setFetching(false);
  };

  const resetFilters = () => {
    const defaults: Required<TrainingFilterOverrides> = {
      q: "",
      sortBy: "date_asc",
      organizer: "all",
      format: "all",
      category: "all",
      minPoints: "all",
      timeWindow: "90",
      place: "all",
      professionFilter: "all",
      priceMode: "all",
      topic: "all",
      enrollment: "all",
      onlyUpcoming: true,
    };

    setQ(defaults.q);
    setSortBy(defaults.sortBy);
    setOrganizer(defaults.organizer);
    setFormat(defaults.format);
    setCategory(defaults.category);
    setMinPoints(defaults.minPoints);
    setTimeWindow(defaults.timeWindow);
    setPlace(defaults.place);
    setProfessionFilter(defaults.professionFilter);
    setPriceMode(defaults.priceMode);
    setTopic(defaults.topic);
    setEnrollment(defaults.enrollment);
    setOnlyUpcoming(defaults.onlyUpcoming);
    setShowMoreFilters(false);
    void load(defaults);
  };

  useEffect(() => {
    load();
    void fetchProfessionCatalog(supabase)
      .then(setProfessionOptions)
      .catch(() => undefined);
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

  const nextTrainings = useMemo(() => items.slice(0, 4), [items]);

  const calendarMonths = useMemo(() => {
    const dated = items
      .filter((t) => t.start_date)
      .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));

    const firstDate = dated[0]?.start_date
      ? new Date(`${dated[0].start_date}T00:00:00`)
      : new Date();

    const startMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const eventMap = new Map<string, Training[]>();

    for (const item of dated) {
      if (!item.start_date) continue;
      const arr = eventMap.get(item.start_date) ?? [];
      arr.push(item);
      eventMap.set(item.start_date, arr);
    }

    return Array.from({ length: 4 }, (_, monthOffset) => {
      const cursor = new Date(
        startMonth.getFullYear(),
        startMonth.getMonth() + monthOffset,
        1
      );

      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

      const monthLabel = new Intl.DateTimeFormat("pl-PL", {
        month: "long",
        year: "numeric",
      }).format(cursor);

      const blanks = Array.from({ length: firstWeekday }, () => null);

      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
        const events = eventMap.get(dateKey) ?? [];

        return {
          day,
          dateKey,
          events,
          primary: events[0] ?? null,
        };
      });

      return {
        monthLabel,
        monthKey: `${year}-${String(month + 1).padStart(2, "0")}`,
        days: [...blanks, ...days],
      };
    });
  }, [items]);

  const visibleItems = useMemo(() => {
    if (!selectedCalendarDateKey) return items;
    return items.filter((item) => item.start_date === selectedCalendarDateKey);
  }, [items, selectedCalendarDateKey]);

  const displayedItems = useMemo(
    () => visibleItems.slice(0, visibleCount),
    [visibleCount, visibleItems],
  );

  const clearCalendarSelection = () => {
    if (!selectedCalendarDateKey && !selectedCalendarTrainingId) return;
    setVisibleCount(TRAININGS_PAGE_SIZE);
    setSelectedCalendarDateKey(null);
    setSelectedCalendarTrainingId(null);
  };

  const scrollCalendarMonthIntoView = (dateKey: string) => {
    window.setTimeout(() => {
      const monthKey = dateKey.slice(0, 7);
      const el = calendarMonthRefs.current[monthKey];
      if (!el) return;

      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({
        top: Math.max(top, 0),
        behavior: "smooth",
      });
    }, 0);
  };

  const selectCalendarDay = (trainingId: string, dateKey: string) => {
    setVisibleCount(TRAININGS_PAGE_SIZE);
    setSelectedCalendarTrainingId(trainingId);
    setSelectedCalendarDateKey(dateKey);
    scrollCalendarMonthIntoView(dateKey);
  };

  const chooseTraining = async (t: Training) => {
    if (!user) {
      window.location.href = "/login?next=/baza-szkolen";
      return;
    }

    const year = t.start_date
      ? Number(t.start_date.slice(0, 4))
      : new Date().getFullYear();

    const payload = {
      type: mapToActivityType(t.category, t.format),
      points: typeof t.points === "number" ? t.points : 0,
      year,
      organizer: t.organizer ?? null,
      status: "planned" as const,
      planned_start_date: t.start_date ?? null,
      training_id: t.id,
      title: t.title,
    };

    try {
      await createActivity(supabase, user.id, payload);
    } catch (caught) {
      alert(
        `Nie udało się dodać szkolenia do planu: ${
          caught instanceof Error ? caught.message : "nieznany błąd"
        }`,
      );
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

    if (!hasTrainingAudience(fProfession)) {
      alert("Wybierz adresatów szkolenia.");
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
      description: fDescription.trim() || null,
      profession: fProfession,

      approval_status: "pending" as ApprovalStatus,
      submitted_by: user.id,
      submitted_email: user.email ?? null,
    };

    const audienceSelection = trainingAudienceSelection(
      fProfession,
      professionOptions,
    );

    const submissionPayload = {
      ...payload,
      audience_scope: audienceSelection.scope,
      profession_codes: audienceSelection.professionCodes,
    };

    const formData = new FormData();
    formData.set("submission", JSON.stringify(submissionPayload));
    if (fLogo) formData.set("organizer_logo", fLogo);

    const response = await fetch("/api/trainings/submissions", {
      method: "POST",
      body: formData,
    });

    setAddSubmitting(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      const logoErrors: Record<string, string> = {
        invalid_logo_type: "Logo musi być plikiem PNG, JPG lub WebP.",
        invalid_logo_size: "Logo musi mieć maksymalnie 2 MB.",
        invalid_logo_dimensions: "Logo ma nieprawidłowe lub zbyt duże wymiary.",
        invalid_logo_image: "Nie udało się odczytać pliku logo jako obrazu.",
      };
      alert(
        (result?.error && logoErrors[result.error]) ||
          "Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę.",
      );
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
    setFDescription("");
    setFProfession("");
    setFLogo(null);

    alert("Wysłano do akceptacji. Po zatwierdzeniu pojawi się w bazie.");
  };

  const fieldBase =
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 shadow-sm shadow-slate-900/5 transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/80";

  const labelBase =
    "mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500";

  const pillBase =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#eaf1f8]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.35rem] border border-slate-300/80 bg-white px-5 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)] sm:px-6">
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

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                onClick={() => {
                  if (user) {
                    setAddOpen(true);
                    return;
                  }
                  window.location.href = "/login";
                }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 shadow-sm transition hover:border-amber-400 hover:bg-amber-100 active:scale-[0.98] sm:w-auto"
                type="button"
              >
                <Plus className="h-4 w-4" strokeWidth={2.2} />
                Zgłoś szkolenie
              </button>
            </div>
          </div>
        </div>

        <form
          className="mt-5 rounded-[1.35rem] border border-slate-300/80 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.075)]"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Znajdź szkolenie
              </div>
              <div className="text-xs text-slate-500">
                Wybierz zawód, miejsce i termin, żeby zawęzić listę.
              </div>
            </div>

            <div className="grid w-full grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 sm:flex sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={resetFilters}
                disabled={fetching}
                aria-label="Wyczyść filtry"
                title="Wyczyść filtry"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={() => setShowMoreFilters((value) => !value)}
                aria-expanded={showMoreFilters}
                aria-controls="advanced-training-filters"
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 sm:w-[198px] sm:px-4"
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
                <span className="sm:hidden">Filtry</span>
                <span className="hidden sm:inline">
                  {showMoreFilters ? "Mniej filtrów" : "Więcej filtrów"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showMoreFilters ? "rotate-180" : ""
                  }`}
                />
              </button>

              <button
                className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_5px_12px_rgba(37,99,235,0.20)] transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 sm:w-[198px] sm:px-5"
                disabled={fetching}
                type="submit"
              >
                {fetching ? "Szukam…" : "Pokaż wyniki"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <label htmlFor="training-search" className={labelBase}>
                Szukaj
              </label>
              <input
                id="training-search"
                name="training-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="np. kongres, NIL, radiologia..."
                className={fieldBase}
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="training-profession" className={labelBase}>
                Zawód / specjalizacja
              </label>
              <select
                id="training-profession"
                name="training-profession"
                value={professionFilter}
                onChange={(e) => setProfessionFilter(e.target.value)}
                className={fieldBase}
              >
                {[
                  { value: "all", label: "Wszystkie" },
                  { value: "general", label: "Ogólne / dla wszystkich" },
                  { value: "unknown", label: "Adresaci do weryfikacji" },
                  ...professionOptions.map((option) => ({
                    value: option.code,
                    label: option.name_pl,
                  })),
                ].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="training-place" className={labelBase}>
                Miejsce
              </label>
              <select
                id="training-place"
                name="training-place"
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
              <label htmlFor="training-time" className={labelBase}>
                Termin
              </label>
              <select
                id="training-time"
                name="training-time"
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

            <div className="lg:col-span-2">
              <label htmlFor="training-format" className={labelBase}>
                Forma
              </label>
              <select
                id="training-format"
                name="training-format"
                value={format}
                onChange={(e) =>
                  setFormat(e.target.value as "all" | TrainingType)
                }
                className={fieldBase}
              >
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="training-points" className={labelBase}>
                Punkty
              </label>
              <select
                id="training-points"
                name="training-points"
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
          </div>

          {showMoreFilters ? (
            <div
              id="advanced-training-filters"
              className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 md:grid-cols-2 lg:grid-cols-6"
            >
              <div>
                <label htmlFor="training-organizer" className={labelBase}>
                  Organizator
                </label>
                <select
                  id="training-organizer"
                  name="training-organizer"
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
                <label htmlFor="training-category" className={labelBase}>
                  Kategoria
                </label>
                <select
                  id="training-category"
                  name="training-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as "all" | TrainingCategory)
                  }
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
                <label htmlFor="training-price" className={labelBase}>
                  Cena
                </label>
                <select
                  id="training-price"
                  name="training-price"
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
                <label htmlFor="training-topic" className={labelBase}>
                  Temat
                </label>
                <select
                  id="training-topic"
                  name="training-topic"
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
                <label htmlFor="training-enrollment" className={labelBase}>
                  Zapisy
                </label>
                <select
                  id="training-enrollment"
                  name="training-enrollment"
                  value={enrollment}
                  onChange={(e) =>
                    setEnrollment(
                      e.target.value as "all" | EnrollmentStatus,
                    )
                  }
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
                <span className={labelBase}>Zakres</span>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm shadow-slate-900/5">
                  <input
                    name="training-upcoming"
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

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </form>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
              <SearchCheck className="h-5 w-5" strokeWidth={2.1} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                Wyniki wyszukiwania
              </p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                {fetching
                  ? "Szukamy dopasowanych szkoleń…"
                  : matchedTrainingCountLabel(visibleItems.length)}
              </h2>
            </div>
          </div>

          <div className="w-full sm:w-[230px]">
            <label htmlFor="training-sort" className={labelBase}>
              Sortuj
            </label>
            <select
              id="training-sort"
              name="training-sort"
              value={sortBy}
              onChange={(event) => {
                const nextSort = event.target.value as SortBy;
                setSortBy(nextSort);
                void load({ sortBy: nextSort });
              }}
              disabled={fetching}
              className={fieldBase}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          onClick={clearCalendarSelection}
        >
          <div
            className={
              selectedCalendarDateKey
                ? "space-y-2 lg:sticky lg:top-24 lg:self-start"
                : "space-y-2"
            }
          >
            {selectedCalendarDateKey ? (
              <div
                className="flex flex-col gap-3 rounded-[1.35rem] border border-blue-200 bg-blue-50/80 p-4 text-sm text-slate-700 shadow-[0_6px_14px_rgba(37,99,235,0.10)] sm:flex-row sm:items-center sm:justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-500">
                    Wybrany dzień z kalendarza
                  </div>
                  <div className="mt-1 font-semibold text-slate-950">
                    {formatDate(selectedCalendarDateKey)} ·{" "}
                    {visibleItems.length} szkolenie
                    {visibleItems.length === 1 ? "" : "ń"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearCalendarSelection}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  Pokaż wszystkie
                </button>
              </div>
            ) : null}

            {displayedItems.map((t) => {
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
              const showRange = Boolean(
                t.start_date && t.end_date && t.start_date !== t.end_date,
              );
              const audience = trainingAudienceSummary(t.profession);
              const audienceLabel =
                audience === "Nie wskazano"
                  ? labelProfession(t.profession)
                  : audience;
              const showAudience = audienceLabel !== "Wszyscy medycy";

              return (
                <article
                  key={t.id}
                  onClick={(e) => e.stopPropagation()}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.055)] transition-all duration-200 hover:border-blue-200 hover:shadow-[0_5px_14px_rgba(37,99,235,0.09)] sm:p-3.5"
                >
                  <div
                    className={`absolute bottom-3 left-0 top-3 w-0.5 rounded-r-full ${tone.stripe}`}
                  />

                  <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 pl-0.5 sm:grid-cols-[52px_minmax(0,1fr)_220px] sm:items-center sm:gap-3.5">
                    <div className="flex h-[58px] w-[52px] flex-col items-center self-start rounded-xl bg-slate-50 px-1.5 py-2 ring-1 ring-slate-200 sm:self-center">
                      <span
                        className={`mb-1.5 h-0.5 w-6 rounded-full ${tone.dateTop}`}
                      />
                      <span className="text-xl font-black leading-none tracking-[-0.06em] text-slate-950">
                        {date.day}
                      </span>
                      <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {date.month}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1">
                          <span className={`${pillBase} ${tone.badge}`}>
                            <FormatIcon format={t.format} className="h-3 w-3" />
                            {labelType(t.format)}
                          </span>
                          {enr ? (
                            <span className={`${pillBase} ${statusTone(t.enrollment_status)}`}>
                              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                              {enr}
                            </span>
                          ) : null}
                          {soon ? (
                            <span className={`${pillBase} border-amber-200 bg-amber-50 text-amber-700`}>
                              <Clock3 className="h-3 w-3" strokeWidth={2} />
                              Wkrótce
                            </span>
                          ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => setDetailsTraining(t)}
                        className="mt-1.5 block w-full text-left"
                        aria-label={`Pokaż szczegóły szkolenia: ${t.title}`}
                      >
                        <h3 className="line-clamp-2 text-[15px] font-extrabold leading-[1.3] tracking-[-0.018em] text-slate-950 transition group-hover:text-blue-800 sm:text-[16px]">
                          {t.title}
                        </h3>
                      </button>

                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-600 sm:text-xs">
                        {t.organizer ? (
                          <span className="min-w-0 max-w-full truncate font-semibold text-slate-700 sm:max-w-[48%]">
                            {t.organizer}
                          </span>
                        ) : null}
                        {showRange && range ? (
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3 w-3 text-slate-400" strokeWidth={2} />
                            {range}
                          </span>
                        ) : null}
                        {t.voivodeship ? (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2} />
                            <span className="truncate">{t.voivodeship}</span>
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5">
                          <Award className="h-3 w-3 text-slate-400" strokeWidth={2} />
                          {labelCategory(t.category)}
                          {price ? ` · ${price}` : ""}
                        </span>
                        {showAudience ? (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Users className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2} />
                            <span className="truncate">{audienceLabel}</span>
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setDetailsTraining(t)}
                          className="inline-flex items-center gap-0.5 font-bold text-blue-700 transition hover:text-blue-800"
                          aria-label={`Pokaż pełne szczegóły szkolenia: ${t.title}`}
                        >
                          Szczegóły
                          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2 mt-0.5 grid grid-cols-[minmax(0,1fr)_76px] gap-2 border-t border-slate-100 pt-2.5 sm:col-span-1 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-3.5 sm:pt-0">
                      <button
                        onClick={() => chooseTraining(t)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-[11px] font-bold text-white shadow-sm shadow-blue-600/15 transition hover:bg-blue-700 active:scale-[0.98] sm:h-9"
                        type="button"
                        title="Dodaje szkolenie do planu CPD, ale nie zapisuje u organizatora"
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        Dodaj do planu
                      </button>

                      <span
                        className="inline-flex h-10 items-center justify-end gap-1.5 whitespace-nowrap text-blue-700 sm:h-9"
                        title={pointsDetailsLabel(t.points_verification_status)}
                        aria-label={`${typeof t.points === "number" ? t.points : "Brak danych"} punktów. ${pointsDetailsLabel(t.points_verification_status)}`}
                      >
                        <GraduationCap className="h-[18px] w-[18px] shrink-0" strokeWidth={2.1} />
                        <span className="text-lg font-black leading-none tracking-[-0.04em]">
                          {typeof t.points === "number" ? t.points : "—"}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">pkt</span>
                      </span>

                      {t.url ? (
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`${t.organizer_logo_url ? "" : "col-span-2"} inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-2 text-[10.5px] font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] sm:h-9`}
                        >
                          <span className="sm:hidden">Zapisy</span>
                          <span className="hidden sm:inline">Przejdź do zapisów</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <button
                          className={`${t.organizer_logo_url ? "" : "col-span-2"} inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 px-2 text-[10.5px] font-bold text-slate-400 sm:h-9`}
                          disabled
                          type="button"
                        >
                          Brak linku do zapisów
                        </button>
                      )}

                      {t.organizer_logo_url ? (
                        <OrganizerLogo
                          name={t.organizer}
                          src={t.organizer_logo_url}
                          card
                        />
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}

            {visibleCount < visibleItems.length ? (
              <div className="flex justify-center py-3" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) => count + TRAININGS_PAGE_SIZE)
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Pokaż kolejne {Math.min(TRAININGS_PAGE_SIZE, visibleItems.length - visibleCount)}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {!fetching && visibleItems.length === 0 && (
              <div className="rounded-[1.35rem] border border-slate-300/80 bg-white p-6 text-sm text-slate-600 shadow-[0_7px_16px_rgba(15,23,42,0.10)]">
                Brak wyników. Zmień filtry albo wybierz „Dowolnie” w Terminie.
              </div>
            )}
          </div>

          <aside
            className="space-y-4 lg:sticky lg:top-24 lg:self-start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-[1.45rem] border border-slate-300/80 bg-white p-4 shadow-[0_7px_16px_rgba(15,23,42,0.10)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Kalendarz szkoleń
                  </div>
                  <div className="text-xs text-slate-500">
                    4 miesiące z aktualnych filtrów
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="inline-flex h-2 w-2 rounded-full bg-blue-50 ring-1 ring-blue-200" />
                  online
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-50 ring-1 ring-amber-200" />
                  stacj.
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {calendarMonths.map((month) => (
                  <div
                    key={month.monthLabel}
                    ref={(el) => {
                      calendarMonthRefs.current[month.monthKey] = el;
                    }}
                  >
                    <div className="mb-2 text-xs font-semibold capitalize text-slate-700">
                      {month.monthLabel}
                    </div>

                    <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                      {["P", "W", "Ś", "C", "P", "S", "N"].map((d, idx) => (
                        <div key={`${month.monthLabel}-${d}-${idx}`}>{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {month.days.map((day, index) => {
                        if (!day) {
                          return (
                            <div
                              key={`${month.monthLabel}-empty-${index}`}
                              className="aspect-square"
                            />
                          );
                        }

                        const format = day.primary?.format ?? null;
                        const hasEvent = day.events.length > 0;
                        const isSelected =
                          selectedCalendarDateKey === day.dateKey;

                        const dayTone =
                          format === "stacjonarne"
                            ? "bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100"
                            : format === "hybrydowe"
                            ? "bg-indigo-50 text-indigo-800 ring-indigo-200 hover:bg-indigo-100"
                            : hasEvent
                            ? "bg-blue-50 text-blue-800 ring-blue-200 hover:bg-blue-100"
                            : "bg-slate-50 text-slate-400 ring-slate-100";

                        return (
                          <button
                            key={day.dateKey}
                            type="button"
                            disabled={!hasEvent}
                            onClick={() => {
                              if (!day.primary) return;
                              selectCalendarDay(day.primary.id, day.dateKey);
                            }}
                            className={`relative flex aspect-square items-center justify-center rounded-xl text-[11px] font-semibold ring-1 transition disabled:cursor-default ${dayTone} ${
                              isSelected
                                ? "outline outline-2 outline-blue-300"
                                : ""
                            }`}
                            title={
                              day.primary
                                ? `${day.primary.title} (${
                                    day.events.length
                                  } wydarzenie${
                                    day.events.length > 1 ? "a" : ""
                                  })`
                                : undefined
                            }
                          >
                            {day.day}
                            {day.events.length > 1 ? (
                              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
                                {day.events.length}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!selectedCalendarDateKey ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-500">
                  Kliknij oznaczony dzień, aby ustawić go pod menu i pokazać
                  odpowiadające szkolenia po lewej.
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.45rem] border border-slate-300/80 bg-white p-4 shadow-[0_7px_16px_rgba(15,23,42,0.10)]">
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
                      className="flex gap-3 rounded-2xl bg-slate-50 p-2.5 ring-1 ring-slate-300/70 transition hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-white py-1.5 ring-1 ring-slate-200">
                        <span
                          className={`mb-1 h-1 w-5 rounded-full ${tone.dateTop}`}
                        />
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

          <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[1.45rem] border border-slate-300/80 bg-white p-5 shadow-xl shadow-slate-950/10">
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
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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

              <div className="md:col-span-6">
                <label className={labelBase}>Logo organizatora (opcjonalnie)</label>
                <div className="flex min-h-10 items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm shadow-slate-900/5">
                  {fLogoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fLogoPreview}
                      alt="Podgląd logo organizatora"
                      className="h-12 w-16 shrink-0 rounded-lg border border-slate-200 object-contain p-1"
                    />
                  ) : null}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="min-w-0 flex-1 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] ?? null;
                      if (!file) {
                        setFLogo(null);
                        return;
                      }
                      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                        alert("Wybierz plik PNG, JPG lub WebP.");
                        event.currentTarget.value = "";
                        setFLogo(null);
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        alert("Logo może mieć maksymalnie 2 MB.");
                        event.currentTarget.value = "";
                        setFLogo(null);
                        return;
                      }
                      setFLogo(file);
                    }}
                  />
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  PNG, JPG lub WebP, maks. 2 MB. Plik zostanie bezpiecznie zmniejszony.
                </div>
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

              <div className="md:col-span-12">
                <TrainingAudienceField
                  value={fProfession}
                  onChange={setFProfession}
                  options={professionOptions}
                  disabled={addSubmitting}
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

              <div className="md:col-span-12">
                <label className={labelBase}>Opis szkolenia</label>
                <textarea
                  value={fDescription}
                  onChange={(e) => setFDescription(e.target.value)}
                  className={`${fieldBase} min-h-24 py-2`}
                  placeholder="Program, grupa docelowa i najważniejsze informacje dla uczestnika"
                  maxLength={5000}
                />
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
                  onChange={(e) =>
                    setFEnroll(e.target.value as EnrollmentStatus | "")
                  }
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
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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

      {detailsTraining ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setDetailsTraining(null)}
            aria-label="Zamknij szczegóły szkolenia"
          />

          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="training-details-title"
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
          >
            <button
              type="button"
              onClick={() => setDetailsTraining(null)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              aria-label="Zamknij"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4 pr-11">
              {detailsTraining.organizer_logo_url ? (
                <OrganizerLogo
                  name={detailsTraining.organizer}
                  src={detailsTraining.organizer_logo_url}
                  large
                />
              ) : null}
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                  {labelCategory(detailsTraining.category)} · {labelType(detailsTraining.format)}
                </div>
                <h2
                  id="training-details-title"
                  className="mt-2 text-2xl font-bold tracking-tight text-slate-950"
                >
                  {detailsTraining.title}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {detailsTraining.organizer || "Organizator niepodany"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Termin", dateRangeShort(detailsTraining.start_date, detailsTraining.end_date) || "—"],
                ["Miejsce", detailsTraining.voivodeship || (detailsTraining.format === "online" ? "Online" : "—")],
                ["Punkty", typeof detailsTraining.points === "number" ? `${detailsTraining.points} pkt edukacyjnych` : "Do potwierdzenia"],
                ["Adresaci", labelProfession(detailsTraining.profession)],
                ["Cena", formatPrice(detailsTraining.price_pln ?? null) || "Nie podano"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {label}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
                </div>
              ))}
            </div>

            {detailsTraining.points_verification_status !== "verified" ? (
              <div className="mt-4 flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <span className="font-semibold text-slate-800">
                    {pointsDetailsLabel(detailsTraining.points_verification_status)}.
                  </span>{" "}
                  Przed zapisem upewnij się, że wskazana liczba punktów dotyczy
                  Twojego zawodu.
                  {detailsTraining.points_source_url ? (
                    <a
                      href={detailsTraining.points_source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 font-semibold text-blue-700 underline"
                    >
                      Zobacz źródło
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900">O szkoleniu</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                {detailsTraining.description ||
                  "Organizator nie przekazał jeszcze szerszego opisu wydarzenia. Szczegóły sprawdzisz na stronie zapisów."}
              </p>
            </div>

            {detailsTraining.topics?.length ? (
              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900">Tematy szkolenia</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detailsTraining.topics.map((topicLabel) => (
                    <span
                      key={topicLabel}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      {topicLabel}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Dodanie do planu CRPE nie jest zapisem na szkolenie. Rejestrację uczestnika prowadzi organizator.
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {detailsTraining.url ? (
                <a
                  href={detailsTraining.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Zapisy u organizatora <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    void chooseTraining(detailsTraining);
                    return;
                  }
                  window.location.href = "/login";
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {user ? "Dodaj do planu CPD" : "Zaloguj, aby dodać do planu"}
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}
