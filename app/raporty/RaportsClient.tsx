// app/raporty/RaportsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type PeriodMode = "profile" | "current" | "previous" | "custom";
type ActivityStatus = "planned" | "done" | null;

type ProfileRow = {
  user_id: string;

  profession: string;
  profession_other: string | null;

  period_start: number; // int4
  period_end: number; // int4
  required_points: number; // int4

  pwz_number: string | null;
  pwz_issue_date: string | null; // date

  role: string; // text
};

type TrainingLite = {
  title: string | null;
  organizer: string | null;
  start_date: string | null;
  end_date: string | null;
  external_url: string | null;
};

type ActivityRow = {
  id: string;
  user_id: string;
  type: string;
  points: number; // numeric -> bywa string w Supabase, więc parsujemy
  year: number;
  organizer: string | null;

  created_at: string;

  updated_at: string;
  status: string; // text
  planned_start_date: string | null; // date
  training_id: string | null;

  certificate_path: string | null;
  certificate_name: string | null;
  certificate_mime: string | null;
  certificate_size: number | null;
  certificate_uploaded_at: string | null;

  trainings?: TrainingLite | null; // relacja (jeśli selectujemy)
};

type ActivityDocRow = {
  id: string;
  user_id: string;
  activity_id: string;
  kind: string;
  path: string;
  name: string | null;
  mime: string | null;
  size: number | null;
  uploaded_at: string;
};

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseISODate(s: string) {
  const [y, m, d] = s.split("-").map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function endOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

function formatDatePLFromISO(isoOrDate: string) {
  // obsłuży i timestamptz i date
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function parsePoints(v: any): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function computeStatus(total: number, required: number) {
  const diff = Math.round((total - required) * 100) / 100;
  if (diff >= 0) return { status: "met" as const, diff };
  if (Math.abs(diff) <= Math.ceil(required * 0.1)) return { status: "almost" as const, diff };
  return { status: "not_met" as const, diff };
}

export default function RaportsClient() {
  const { user } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [periodMode, setPeriodMode] = useState<PeriodMode>("profile");
  const [fromDate, setFromDate] = useState<string>(() => {
    const now = new Date();
    return toISODate(new Date(now.getFullYear(), 0, 1));
  });
  const [toDate, setToDate] = useState<string>(() => {
    const now = new Date();
    return toISODate(new Date(now.getFullYear(), 11, 31));
  });

  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});

  const [onlyDone, setOnlyDone] = useState(true);
  const [includePlanned, setIncludePlanned] = useState(false);

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "points_desc" | "points_asc">("date_desc");
  const [onlyWithAnyAttachments, setOnlyWithAnyAttachments] = useState(false);

  // 1) Load profile and set default period (profile period preferred)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setInitialLoading(true);
      setError(null);

      if (!user?.id) {
        setInitialLoading(false);
        return;
      }

      try {
        const { data, error: pErr } = await supabase
          .from("profiles")
          .select(
            "user_id, profession, profession_other, period_start, period_end, required_points, pwz_number, pwz_issue_date, role"
          )
          .eq("user_id", user.id)
          .single();

        if (pErr) throw pErr;
        if (cancelled) return;

        const p = data as ProfileRow;
        setProfile(p);

        // period_start/period_end to lata (int). Przyjmuję: 2025–2029 => 2025-01-01 .. 2029-12-31
        // Jeśli u Ciebie to inne znaczenie, w praniu zmienimy w 1 miejscu.
        if (p?.period_start && p?.period_end && p.period_start <= p.period_end) {
          setPeriodMode("profile");
          setFromDate(`${p.period_start}-01-01`);
          setToDate(`${p.period_end}-12-31`);
        } else {
          const now = new Date();
          setPeriodMode("current");
          setFromDate(toISODate(new Date(now.getFullYear(), 0, 1)));
          setToDate(toISODate(new Date(now.getFullYear(), 11, 31)));
        }
      } catch (e: any) {
        setError(e?.message ?? "Nie udało się pobrać profilu.");
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, supabase]);

  // 2) Update date range when periodMode changes (current/previous/profile)
  useEffect(() => {
    const now = new Date();

    if (periodMode === "current") {
      setFromDate(toISODate(new Date(now.getFullYear(), 0, 1)));
      setToDate(toISODate(new Date(now.getFullYear(), 11, 31)));
      return;
    }

    if (periodMode === "previous") {
      const y = now.getFullYear() - 1;
      setFromDate(toISODate(new Date(y, 0, 1)));
      setToDate(toISODate(new Date(y, 11, 31)));
      return;
    }

    if (periodMode === "profile" && profile?.period_start && profile?.period_end) {
      setFromDate(`${profile.period_start}-01-01`);
      setToDate(`${profile.period_end}-12-31`);
      return;
    }

    // custom -> user controls via inputs
  }, [periodMode, profile?.period_start, profile?.period_end]);

  const requiredPoints = useMemo(() => {
    // w bazie required_points jest NOT NULL, ale trzymamy bezpiecznie
    const v = profile?.required_points;
    return typeof v === "number" && Number.isFinite(v) ? v : 200;
  }, [profile?.required_points]);

  const professionLabel = useMemo(() => {
    if (!profile) return "—";
    return profile.profession_other ? profile.profession_other : profile.profession;
  }, [profile]);

  // 3) Fetch activities for the chosen range
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user?.id) return;
      if (!fromDate || !toDate) return;

      setLoadingActivities(true);
      setError(null);

      try {
        const fromISO = startOfDayISO(parseISODate(fromDate));
        const toISO = endOfDayISO(parseISODate(toDate));

        // Uwaga: w activities masz dwie daty:
        // - created_at (timestamptz) — zawsze jest
        // - planned_start_date (date) — bywa dla planowanych
        // Żeby nie zgubić planowanych, robimy 2 zapytania i scalimy unikatowo po id.

        const selectCols =
          "id,user_id,type,points,year,organizer,created_at,updated_at,status,planned_start_date,training_id,certificate_path,certificate_name,certificate_mime,certificate_size,certificate_uploaded_at,trainings(title,organizer,start_date,end_date,external_url)";

        const q1 = supabase
          .from("activities")
          .select(selectCols)
          .eq("user_id", user.id)
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .order("created_at", { ascending: false });

        const q2 = supabase
          .from("activities")
          .select(selectCols)
          .eq("user_id", user.id)
          .not("planned_start_date", "is", null)
          .gte("planned_start_date", fromDate)
          .lte("planned_start_date", toDate)
          .order("planned_start_date", { ascending: false });

        const [{ data: a1, error: e1 }, { data: a2, error: e2 }] = await Promise.all([q1, q2]);

        if (e1) throw e1;
        if (e2) throw e2;
        if (cancelled) return;

        const map = new Map<string, ActivityRow>();
        for (const row of (a1 as ActivityRow[]) ?? []) map.set(row.id, row);
        for (const row of (a2 as ActivityRow[]) ?? []) map.set(row.id, row);

        const merged = Array.from(map.values());
        setActivities(merged);

        // Pobierz dokumenty (activity_documents) i policz ilość na aktywność
        // (limit 1000, jeśli kiedyś będzie dużo, zrobimy paginację lub widok)
        if (merged.length > 0) {
          const ids = merged.map((x) => x.id);

          const { data: docs, error: dErr } = await supabase
            .from("activity_documents")
            .select("id,user_id,activity_id,kind,path,name,mime,size,uploaded_at")
            .eq("user_id", user.id)
            .in("activity_id", ids);

          if (dErr) throw dErr;

          const counts: Record<string, number> = {};
          for (const d of (docs as ActivityDocRow[]) ?? []) {
            counts[d.activity_id] = (counts[d.activity_id] ?? 0) + 1;
          }
          setDocCounts(counts);
        } else {
          setDocCounts({});
        }
      } catch (e: any) {
        setError(e?.message ?? "Nie udało się pobrać aktywności.");
      } finally {
        if (!cancelled) setLoadingActivities(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, fromDate, toDate, supabase]);

  const activityTypes = useMemo(() => {
    const set = new Set<string>();
    for (const a of activities) if (a.type) set.add(a.type);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activities]);

  function activityDisplayDate(a: ActivityRow) {
    // Dla planowanych lepiej pokazać planned_start_date; dla wykonanych created_at
    if ((a.status ?? "done") === "planned" && a.planned_start_date) return a.planned_start_date;
    return a.created_at;
  }

  function attachmentsTotalForActivity(a: ActivityRow) {
    // cert w activities + dokumenty w activity_documents
    const cert = a.certificate_path ? 1 : 0;
    const docs = docCounts[a.id] ?? 0;
    return cert + docs;
  }

  const included = useMemo(() => {
    let list = [...activities];

    if (onlyDone) list = list.filter((a) => (a.status ?? "done") === "done");
    if (!includePlanned) list = list.filter((a) => (a.status ?? "done") !== "planned");

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((a) => {
        const trainingTitle = a.trainings?.title ?? "";
        const trainingOrg = a.trainings?.organizer ?? "";
        const hay = `${a.type ?? ""} ${a.organizer ?? ""} ${trainingTitle} ${trainingOrg} ${a.certificate_name ?? ""}`.toLowerCase();
        return hay.includes(s);
      });
    }

    if (typeFilter !== "all") list = list.filter((a) => a.type === typeFilter);

    if (onlyWithAnyAttachments) {
      list = list.filter((a) => attachmentsTotalForActivity(a) > 0);
    }

    list.sort((a, b) => {
      const da = new Date(activityDisplayDate(a)).getTime();
      const db = new Date(activityDisplayDate(b)).getTime();
      const pa = parsePoints(a.points);
      const pb = parsePoints(b.points);

      switch (sortBy) {
        case "date_asc":
          return da - db;
        case "date_desc":
          return db - da;
        case "points_asc":
          return pa - pb;
        case "points_desc":
          return pb - pa;
        default:
          return db - da;
      }
    });

    return list;
  }, [activities, onlyDone, includePlanned, q, typeFilter, sortBy, onlyWithAnyAttachments, docCounts]);

  const totals = useMemo(() => {
    // TODO: tutaj podepniemy Wasze limity/reguły z Panelu CPD (po tym jak podeślesz plik/fragment).
    const raw = included.reduce((sum, a) => sum + parsePoints(a.points), 0);
    const afterLimits = raw;

    const s = computeStatus(afterLimits, requiredPoints);

    const attachmentsAll = included.reduce((sum, a) => sum + attachmentsTotalForActivity(a), 0);

    return {
      pointsRaw: Math.round(raw * 100) / 100,
      pointsAfterLimits: Math.round(afterLimits * 100) / 100,
      status: s.status,
      diff: s.diff,
      itemsCount: included.length,
      attachmentsAll,
    };
  }, [included, requiredPoints, docCounts]);

  const progress = useMemo(() => {
    if (requiredPoints <= 0) return 0;
    const p = (totals.pointsAfterLimits / requiredPoints) * 100;
    return Math.max(0, Math.min(100, Math.round(p)));
  }, [totals.pointsAfterLimits, requiredPoints]);

  const statusBadge = useMemo(() => {
    if (totals.status === "met")
      return { label: "Wymogi spełnione", cls: "bg-emerald-600/10 text-emerald-700 border-emerald-200" };
    if (totals.status === "almost")
      return { label: "Prawie spełnione", cls: "bg-amber-600/10 text-amber-700 border-amber-200" };
    return { label: "Wymogi niespełnione", cls: "bg-red-600/10 text-red-700 border-red-200" };
  }, [totals.status]);

  const diffText = useMemo(() => {
    if (totals.diff >= 0) return `Nadwyżka: ${totals.diff} pkt`;
    return `Brakuje: ${Math.abs(totals.diff)} pkt`;
  }, [totals.diff]);

  function resetDefaults() {
    setOnlyDone(true);
    setIncludePlanned(false);
    setOnlyWithAnyAttachments(false);
    setQ("");
    setTypeFilter("all");
    setSortBy("date_desc");
    setPeriodMode(profile?.period_start && profile?.period_end ? "profile" : "current");
  }

  async function onDownloadPdf() {
    alert("Kolejny krok: /api/reports/pdf (serwer generuje PDF + zwraca plik). UI i dane są gotowe.");
  }

  async function onDownloadZip() {
    alert("Kolejny krok: /api/reports/zip (PDF + załączniki: certificate + activity_documents). UI i dane są gotowe.");
  }

  if (!user?.id) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Raporty</h1>
          <p className="mt-2 text-sm text-slate-600">Musisz być zalogowany, aby generować raporty.</p>
          <div className="mt-4">
            <Link className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" href="/logowanie">
              Przejdź do logowania
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Raporty</h1>
          <p className="mt-1 text-sm text-slate-600">
            Wygeneruj zestawienie aktywności i pakiet dokumentów do złożenia w izbie / urzędzie.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/portfolio" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Portfolio
          </Link>
          <Link href="/kalkulator" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            Kalkulator
          </Link>
          <Link href="/activities" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            Aktywności
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Top grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Period */}
        <div className="md:col-span-5">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Okres rozliczeniowy</h2>
                <p className="mt-1 text-xs text-slate-600">Wybierz zakres danych do raportu.</p>
              </div>
              {profile?.pwz_issue_date ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                  Zgodny z PWZ
                </span>
              ) : null}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="period"
                  className="h-4 w-4"
                  checked={periodMode === "profile"}
                  onChange={() => setPeriodMode("profile")}
                  disabled={!profile?.period_start || !profile?.period_end}
                />
                Okres z profilu
              </label>

              <label className="flex items-center gap-2">
                <input type="radio" name="period" className="h-4 w-4" checked={periodMode === "current"} onChange={() => setPeriodMode("current")} />
                Aktualny rok
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="period"
                  className="h-4 w-4"
                  checked={periodMode === "previous"}
                  onChange={() => setPeriodMode("previous")}
                />
                Poprzedni rok
              </label>

              <label className="flex items-center gap-2">
                <input type="radio" name="period" className="h-4 w-4" checked={periodMode === "custom"} onChange={() => setPeriodMode("custom")} />
                Własny zakres
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-700">Od</div>
                <input
                  type="date"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={fromDate}
                  onChange={(e) => {
                    setPeriodMode("custom");
                    setFromDate(e.target.value);
                  }}
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-slate-700">Do</div>
                <input
                  type="date"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={toDate}
                  onChange={(e) => {
                    setPeriodMode("custom");
                    setToDate(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <span className="font-medium">Zawód:</span> {professionLabel}
                </span>
                <span>
                  <span className="font-medium">Wymagane punkty:</span> {requiredPoints}
                </span>
                {profile?.pwz_issue_date ? (
                  <span>
                    <span className="font-medium">PWZ:</span> {profile.pwz_number ?? "—"} (od {profile.pwz_issue_date})
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="md:col-span-7">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Status wymogów</h2>
                <p className="mt-1 text-xs text-slate-600">Podsumowanie dla wybranego okresu (na razie bez limitów).</p>
              </div>
              <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-slate-600">Zebrane (po limitach)</div>
                <div className="mt-1 text-lg font-semibold">{totals.pointsAfterLimits}</div>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-slate-600">Wymagane</div>
                <div className="mt-1 text-lg font-semibold">{requiredPoints}</div>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-slate-600">Różnica</div>
                <div className="mt-1 text-lg font-semibold">{diffText}</div>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-slate-600">Pozycje</div>
                <div className="mt-1 text-lg font-semibold">{totals.itemsCount}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>Postęp</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>
                  Załączniki w raporcie: <span className="font-medium text-slate-800">{totals.attachmentsAll}</span>
                </span>
                <span>
                  Widok: <span className="font-medium text-slate-800">{onlyDone ? "tylko wykonane" : "wszystkie"}</span>
                </span>
              </div>
            </div>

            {loadingActivities ? (
              <div className="mt-4 rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">Ładowanie aktywności…</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold">Zawartość raportu</h2>
            <p className="mt-1 text-xs text-slate-600">Wybierz pozycje do raportu i kontroluj komplet dokumentów.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={resetDefaults}
              className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Przywróć domyślne
            </button>
            <Link href="/kalkulator" className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
              Reguły CPD
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <label className="md:col-span-4 flex items-center justify-between gap-3 rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Tylko „zrobione”</div>
              <div className="text-xs text-slate-600">Najczęstszy tryb raportowania.</div>
            </div>
            <input type="checkbox" className="h-5 w-5" checked={onlyDone} onChange={(e) => setOnlyDone(e.target.checked)} />
          </label>

          <label className="md:col-span-4 flex items-center justify-between gap-3 rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Uwzględnij planowane</div>
              <div className="text-xs text-slate-600">Pokaż także planowane pozycje.</div>
            </div>
            <input type="checkbox" className="h-5 w-5" checked={includePlanned} onChange={(e) => setIncludePlanned(e.target.checked)} />
          </label>

          <label className="md:col-span-4 flex items-center justify-between gap-3 rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Tylko z załącznikami</div>
              <div className="text-xs text-slate-600">Pomaga kompletować dokumenty.</div>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={onlyWithAnyAttachments}
              onChange={(e) => setOnlyWithAnyAttachments(e.target.checked)}
            />
          </label>
        </div>
      </div>

      {/* Items */}
      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold">Pozycje w raporcie</h2>
            <p className="mt-1 text-xs text-slate-600">Podgląd danych, które trafią do raportu.</p>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 md:w-auto md:grid-cols-4">
            <input
              placeholder="Szukaj (typ, organizator, szkolenie)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm md:col-span-2"
            />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
              <option value="all">Wszystkie typy</option>
              {activityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rounded-xl border px-3 py-2 text-sm">
              <option value="date_desc">Data: najnowsze</option>
              <option value="date_asc">Data: najstarsze</option>
              <option value="points_desc">Punkty: malejąco</option>
              <option value="points_asc">Punkty: rosnąco</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs text-slate-600">
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Pozycja</th>
                <th className="px-3 py-2">Typ</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Punkty</th>
                <th className="px-3 py-2 text-right">Załączniki</th>
              </tr>
            </thead>
            <tbody>
              {included.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-600">
                    Brak pozycji w wybranym widoku.
                  </td>
                </tr>
              ) : (
                included.map((a) => {
                  const st = (a.status ?? "done") as any;
                  const dt = activityDisplayDate(a);
                  const pts = parsePoints(a.points);
                  const att = attachmentsTotalForActivity(a);

                  const title = a.trainings?.title ?? null;
                  const org = a.organizer ?? a.trainings?.organizer ?? null;

                  return (
                    <tr key={a.id} className="border-b last:border-b-0">
                      <td className="px-3 py-3">{formatDatePLFromISO(dt)}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{title ?? "Aktywność własna"}</div>
                        <div className="text-xs text-slate-600">{org ?? "—"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full border bg-white px-2 py-1 text-xs">{a.type}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full border bg-white px-2 py-1 text-xs">
                          {st === "done" ? "zrobione" : st === "planned" ? "planowane" : st ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">{pts}</td>
                      <td className="px-3 py-3 text-right">
                        {att > 0 ? (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                            {att} załączn.
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">brak</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            Okres: <span className="font-medium text-slate-800">{fromDate}</span> –{" "}
            <span className="font-medium text-slate-800">{toDate}</span>
          </div>
          <div>
            Suma (po limitach): <span className="font-semibold text-slate-900">{totals.pointsAfterLimits}</span> pkt
          </div>
        </div>
      </div>

      {/* Sticky actions */}
      <div className="sticky bottom-3 mt-6">
        <div className="rounded-2xl border bg-white p-3 shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-600">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>
                  Okres: <span className="font-medium text-slate-900">{fromDate}</span> –{" "}
                  <span className="font-medium text-slate-900">{toDate}</span>
                </span>
                <span>
                  Punkty: <span className="font-medium text-slate-900">{totals.pointsAfterLimits}</span> / {requiredPoints}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${statusBadge.cls}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={onDownloadZip} className="rounded-xl border bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Pobierz ZIP
              </button>
              <button onClick={onDownloadPdf} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                Pobierz PDF
              </button>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Uwaga: Raport jest zestawieniem wygenerowanym na podstawie danych w CRPE. Sprawdź wymagania swojej izby/urzędu.
          </div>
        </div>
      </div>

      {initialLoading ? (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-white/60">
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-700 shadow-sm">Ładowanie…</div>
        </div>
      ) : null}
    </div>
  );
}
