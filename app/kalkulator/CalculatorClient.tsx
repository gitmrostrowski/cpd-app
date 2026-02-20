"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  normalizePeriod,
  calcMissing,
  calcProgress,
  getStatus,
  getQuickRecommendations,
  applyRules,
  sumPointsWithRules,
  type CpdRules,
} from "@/lib/cpd/calc";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";
import {
  type Profession,
  PROFESSION_OPTIONS,
  DEFAULT_REQUIRED_POINTS_BY_PROFESSION,
  isProfession,
} from "@/lib/cpd/professions";

type ActivityType =
  | "Kurs stacjonarny"
  | "Kurs online / webinar"
  | "Konferencja / kongres"
  | "Warsztaty praktyczne"
  | "Publikacja naukowa"
  | "Prowadzenie szkolenia"
  | "Samokształcenie"
  | "Staż / praktyka";

type Activity = {
  id: string;
  type: ActivityType;
  points: number;
  year: number;
  organizer?: string;
  pointsAuto?: boolean;

  // nowe pola pod edycję
  comment?: string;
  certificate_name?: string | null; // nazwa pliku (sam plik nie jest trzymany w localStorage)
};

type EditDraft = {
  type: ActivityType;
  points: number;
  year: number;
  organizer: string;
  comment: string;
  certificate_name: string | null;
  certificate_file?: File | null; // tylko w RAM (nie zapisujemy do localStorage)
};

const TYPES: ActivityType[] = [
  "Kurs stacjonarny",
  "Kurs online / webinar",
  "Konferencja / kongres",
  "Warsztaty praktyczne",
  "Publikacja naukowa",
  "Prowadzenie szkolenia",
  "Samokształcenie",
  "Staż / praktyka",
];

const DEFAULT_POINTS_BY_TYPE: Record<ActivityType, number> = {
  "Kurs stacjonarny": 15,
  "Kurs online / webinar": 10,
  "Konferencja / kongres": 20,
  "Warsztaty praktyczne": 15,
  "Publikacja naukowa": 25,
  "Prowadzenie szkolenia": 20,
  "Samokształcenie": 5,
  "Staż / praktyka": 10,
};

const PERIODS = [
  { label: "2023–2026", start: 2023, end: 2026 },
  { label: "2022–2025", start: 2022, end: 2025 },
  { label: "2021–2024", start: 2021, end: 2024 },
  { label: "Inny", start: 0, end: 0 },
] as const;

type PeriodLabel = (typeof PERIODS)[number]["label"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function formatInt(n: number) {
  return Number.isFinite(n) ? Math.round(n).toString() : "0";
}
const STORAGE_KEY = "crpe_calculator_v1";

function safeNumber(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function safeString(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function isActivityType(v: unknown): v is ActivityType {
  return typeof v === "string" && (TYPES as readonly string[]).includes(v);
}
function normalizeActivityType(v: unknown): ActivityType {
  return isActivityType(v) ? v : "Kurs online / webinar";
}
function isPeriodLabel(v: unknown): v is PeriodLabel {
  return typeof v === "string" && PERIODS.some((p) => p.label === v);
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * Reguły na bazie zawodu (MVP).
 */
function rulesForProfession(prof: Profession): CpdRules | undefined {
  if (prof === "Lekarz" || prof === "Lekarz dentysta") {
    return {
      yearlyMaxByType: {
        Samokształcenie: 20,
      },
    };
  }
  return undefined;
}

function isValueDefaultForSomeOtherProfession(value: number, current: Profession) {
  const currentDefault = DEFAULT_REQUIRED_POINTS_BY_PROFESSION[current] ?? 0;
  if (value === currentDefault) return false;

  const defaults = Object.entries(DEFAULT_REQUIRED_POINTS_BY_PROFESSION) as Array<[Profession, number]>;
  return defaults.some(([prof, def]) => prof !== current && def === value);
}

export default function CalculatorClient() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const currentYear = new Date().getFullYear();

  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [periodLabel, setPeriodLabel] = useState<PeriodLabel>("2023–2026");
  const [customStart, setCustomStart] = useState<number>(currentYear - 1);
  const [customEnd, setCustomEnd] = useState<number>(currentYear + 2);

  const [requiredPoints, setRequiredPoints] = useState<number>(
    DEFAULT_REQUIRED_POINTS_BY_PROFESSION["Lekarz"],
  );

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: uid(),
      type: "Kurs online / webinar",
      points: DEFAULT_POINTS_BY_TYPE["Kurs online / webinar"],
      year: currentYear,
      organizer: "",
      pointsAuto: true,
      comment: "",
      certificate_name: null,
    },
    {
      id: uid(),
      type: "Konferencja / kongres",
      points: DEFAULT_POINTS_BY_TYPE["Konferencja / kongres"],
      year: currentYear,
      organizer: "",
      pointsAuto: true,
      comment: "",
      certificate_name: null,
    },
  ]);

  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const profileLoadedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const requiredDirtyRef = useRef(false);

  // --- NOWE: tryb edycji wiersza + draft ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  // --- NOWE: proste menu akcji (jedno otwarte naraz) ---
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function clearMessages() {
    setInfo(null);
    setErr(null);
  }

  async function saveProfilePrefs(patch: {
    profession?: Profession;
    required_points?: number;
    period_start?: number;
    period_end?: number;
  }) {
    if (!user) return;

    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          ...patch,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zapisać ustawień profilu.");
    }
  }

  /** ---------- localStorage: load (guest draft) ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed: any = JSON.parse(raw);

      const nextProfession = parsed?.profession;
      const nextPeriodLabel = parsed?.periodLabel;

      if (isProfession(nextProfession)) setProfession(nextProfession);
      if (isPeriodLabel(nextPeriodLabel)) setPeriodLabel(nextPeriodLabel);

      setCustomStart(safeNumber(parsed?.customStart, currentYear - 1));
      setCustomEnd(safeNumber(parsed?.customEnd, currentYear + 2));

      requiredDirtyRef.current = typeof parsed?.requiredDirty === "boolean" ? parsed.requiredDirty : false;

      const rpFallback = DEFAULT_REQUIRED_POINTS_BY_PROFESSION["Lekarz"];
      const rp = safeNumber(parsed?.requiredPoints, rpFallback);
      setRequiredPoints(Math.max(0, rp));

      const nextActivities = parsed?.activities;
      if (Array.isArray(nextActivities)) {
        const cleaned: Activity[] = nextActivities
          .map((a: any) => {
            const type: ActivityType = normalizeActivityType(a?.type);
            const year = safeNumber(a?.year, currentYear);
            const points = Math.max(0, safeNumber(a?.points, DEFAULT_POINTS_BY_TYPE[type]));
            const organizer = safeString(a?.organizer ?? "", "");
            const pointsAuto = typeof a?.pointsAuto === "boolean" ? a.pointsAuto : false;

            const comment = safeString(a?.comment ?? "", "");
            const certificate_name =
              typeof a?.certificate_name === "string" ? a.certificate_name : null;

            return {
              id: safeString(a?.id, uid()) || uid(),
              type,
              year,
              points,
              organizer,
              pointsAuto,
              comment,
              certificate_name,
            };
          })
          .filter((a: Activity) => !!a.id);

        if (cleaned.length) setActivities(cleaned);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ---------- localStorage: save draft ---------- */
  useEffect(() => {
    try {
      const payload = {
        profession,
        periodLabel,
        customStart,
        customEnd,
        requiredPoints,
        requiredDirty: requiredDirtyRef.current,
        activities,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [profession, periodLabel, customStart, customEnd, requiredPoints, activities]);

  /** ---------- DB profile: load on login ---------- */
  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("profession, required_points, period_start, period_end")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!alive) return;
        if (error) return;

        const dbProfession =
          data?.profession && isProfession(data.profession) ? (data.profession as Profession) : null;

        if (dbProfession) {
          setProfession(dbProfession);
        }

        if (typeof data?.required_points === "number") {
          const prof = dbProfession ?? profession;
          const def = DEFAULT_REQUIRED_POINTS_BY_PROFESSION[prof] ?? 0;

          if (isValueDefaultForSomeOtherProfession(data.required_points, prof)) {
            requiredDirtyRef.current = false;
            setRequiredPoints(def);

            await saveProfilePrefs({
              profession: prof,
              required_points: def,
            });
          } else {
            setRequiredPoints(Math.max(0, data.required_points));
            requiredDirtyRef.current = true;
          }
        } else {
          const prof = dbProfession ?? profession;
          requiredDirtyRef.current = false;
          setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION[prof] ?? 0);
        }
      } finally {
        if (alive) profileLoadedRef.current = true;
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase]);

  /** ---------- Period ---------- */
  const rawPeriod = useMemo(() => {
    const found = PERIODS.find((p) => p.label === periodLabel);
    if (!found) return { start: currentYear - 3, end: currentYear };
    if (found.label !== "Inny") return { start: found.start, end: found.end };
    return { start: customStart, end: customEnd };
  }, [periodLabel, customStart, customEnd, currentYear]);

  const period = useMemo(() => normalizePeriod(rawPeriod), [rawPeriod]);

  /** ---------- Auto-save profile prefs (debounced) ---------- */
  useEffect(() => {
    if (!user) return;
    if (!profileLoadedRef.current) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      saveProfilePrefs({
        profession,
        required_points: requiredPoints,
        period_start: period.start,
        period_end: period.end,
      });
    }, 450);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profession, requiredPoints, period.start, period.end, user]);

  function clearCalculator() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    setProfession("Lekarz");
    setPeriodLabel("2023–2026");
    setCustomStart(currentYear - 1);
    setCustomEnd(currentYear + 2);

    requiredDirtyRef.current = false;
    setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION["Lekarz"]);

    setEditingId(null);
    setEditDraft(null);
    setOpenMenuId(null);

    setActivities([
      {
        id: uid(),
        type: "Kurs online / webinar",
        points: DEFAULT_POINTS_BY_TYPE["Kurs online / webinar"],
        year: currentYear,
        organizer: "",
        pointsAuto: true,
        comment: "",
        certificate_name: null,
      },
    ]);
    clearMessages();
  }

  const rules = useMemo(() => rulesForProfession(profession), [profession]);
  const applied = useMemo(() => applyRules(activities, { period, rules }), [activities, period, rules]);
  const totalPoints = useMemo(() => sumPointsWithRules(activities, { period, rules }), [activities, period, rules]);
  const missing = useMemo(() => calcMissing(totalPoints, requiredPoints), [totalPoints, requiredPoints]);

  const progressRaw = useMemo(() => calcProgress(totalPoints, requiredPoints), [totalPoints, requiredPoints]);
  const progress = useMemo(() => clamp(progressRaw, 0, 100), [progressRaw]);

  const status = useMemo(() => getStatus(totalPoints, requiredPoints), [totalPoints, requiredPoints]);
  const recommendations = useMemo(() => getQuickRecommendations(missing), [missing]);

  const plan = useMemo(() => {
    const yearsLeft = Math.max(1, period.end - currentYear + 1);
    const perYear = missing > 0 ? Math.ceil(missing / yearsLeft) : 0;
    const perMonth = missing > 0 ? Math.ceil(perYear / 12) : 0;
    const perQuarter = missing > 0 ? Math.ceil(perYear / 4) : 0;

    return { yearsLeft, perYear, perQuarter, perMonth };
  }, [missing, period.end, currentYear]);

  function addActivity() {
    setActivities((prev) => [
      ...prev,
      {
        id: uid(),
        type: "Kurs online / webinar",
        points: DEFAULT_POINTS_BY_TYPE["Kurs online / webinar"],
        year: currentYear,
        organizer: "",
        pointsAuto: true,
        comment: "",
        certificate_name: null,
      },
    ]);
  }

  function updateActivity(id: string, patch: Partial<Activity>) {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeActivity(id: string) {
    // jeśli usuwamy edytowany wiersz -> wyjdź z edycji
    if (editingId === id) {
      setEditingId(null);
      setEditDraft(null);
    }
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }

  function handleTypeChange(id: string, nextType: ActivityType) {
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next: Activity = { ...a, type: nextType };
        if (a.pointsAuto) next.points = DEFAULT_POINTS_BY_TYPE[nextType];
        return next;
      }),
    );
  }

  function handlePointsChange(id: string, points: number) {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, points: Math.max(0, points), pointsAuto: false } : a)),
    );
  }

  function handleProfessionChange(next: Profession) {
    setProfession(next);
    requiredDirtyRef.current = false;
    setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION[next] ?? 0);
  }

  function handleRequiredPointsChange(nextValue: number) {
    requiredDirtyRef.current = true;
    setRequiredPoints(Math.max(0, nextValue));
  }

  // --- EDYCJA WIERSZA ---
  function startEdit(rowId: string) {
    const src = activities.find((a) => a.id === rowId);
    if (!src) return;

    setEditingId(rowId);
    setEditDraft({
      type: src.type,
      points: src.points,
      year: src.year,
      organizer: src.organizer ?? "",
      comment: src.comment ?? "",
      certificate_name: src.certificate_name ?? null,
      certificate_file: null,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function saveEdit() {
    if (!editingId || !editDraft) return;

    updateActivity(editingId, {
      type: editDraft.type,
      points: Math.max(0, editDraft.points),
      year: editDraft.year,
      organizer: editDraft.organizer,
      comment: editDraft.comment,
      certificate_name: editDraft.certificate_name,
      // certificate_file nie trzymamy w activities (nie serializuje się do localStorage)
    });

    setEditingId(null);
    setEditDraft(null);
  }

  const toneStyles =
    status.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : status.tone === "risk"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-slate-200 bg-slate-50 text-slate-900";

  const progressBarClass =
    progress >= 100 ? "bg-emerald-600" : progress >= 60 ? "bg-blue-600" : "bg-rose-600";

  async function saveAllToPortfolio() {
    if (!user) {
      setErr("Zaloguj się, aby zapisać aktywności do Portfolio.");
      return;
    }
    if (busy) return;

    clearMessages();

    const cleaned = activities
      .map((a) => ({
        type: String(a.type),
        points: Math.max(0, Number(a.points) || 0),
        year: Number(a.year) || currentYear,
        organizer: (a.organizer ?? "").trim() ? (a.organizer ?? "").trim() : null,
        // comment/certificate_name w MVP nie wysyłamy do tabeli activities (chyba że masz kolumny)
      }))
      .filter((a) => a.type && a.year >= 1900 && a.year <= 2100);

    if (cleaned.length === 0) {
      setErr("Nie ma nic do zapisania.");
      return;
    }

    const payload = cleaned.map((a) => ({
      user_id: user.id,
      type: a.type,
      points: a.points,
      year: a.year,
      organizer: a.organizer,
    }));

    setBusy(true);
    try {
      const { error } = await supabase.from("activities").insert(payload);
      if (error) {
        setErr(error.message);
        return;
      }
      setInfo(`Zapisano ${payload.length} aktywności do Portfolio ✅`);
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zapisać aktywności.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* LEFT */}
      <section className="lg:col-span-4">
        {/* Konto + Ustawienia (połączone) */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          {/* STATUS — POZIOMO */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {authLoading ? (
                <span className="text-slate-600">Status: sprawdzam sesję…</span>
              ) : user ? (
                <>
                  <span className="text-slate-700">
                    Status: <span className="font-semibold text-emerald-700">✅ Zalogowany</span>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-700">{user.email}</span>
                  <span className="text-slate-500">•</span>
                  <Link href="/profil" className="text-blue-700 hover:underline">
                    Ustawienia profilu
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-slate-700">
                    Status: <span className="font-semibold text-rose-700">❌ Niezalogowany</span>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-600">Tryb gościa (zapis lokalny)</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <Link
                  href="/portfolio"
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Portfolio
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Zaloguj się
                </Link>
              )}

              <button
                onClick={clearCalculator}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                title="Czyści zapis lokalny kalkulatora"
                type="button"
              >
                Wyczyść
              </button>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <h2 className="text-base font-semibold text-slate-900">Ustawienia</h2>
            <p className="mt-1 text-sm text-slate-600">
              {user ? "Po zalogowaniu ustawienia bierzemy z profilu (DB)." : "W trybie gościa — zapis lokalny."}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Zawód / status</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  value={profession}
                  onChange={(e) => handleProfessionChange(e.target.value as Profession)}
                >
                  {PROFESSION_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Okres rozliczeniowy</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value as PeriodLabel)}
                >
                  {PERIODS.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>

                {periodLabel === "Inny" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Start</label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                        value={customStart}
                        onChange={(e) => setCustomStart(Number(e.target.value || 0))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Koniec</label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(Number(e.target.value || 0))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Wymagane punkty (łącznie)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  value={requiredPoints}
                  onChange={(e) => handleRequiredPointsChange(Number(e.target.value || 0))}
                  min={0}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Domyślne dla <span className="font-medium">{profession}</span>:{" "}
                  {DEFAULT_REQUIRED_POINTS_BY_PROFESSION[profession] ?? 0}
                </p>
              </div>
            </div>

            {(profession === "Lekarz" || profession === "Lekarz dentysta") && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                <div className="font-semibold">Limity (MVP)</div>
                <div className="mt-1">
                  Dla <span className="font-medium">{profession}</span> aktywność{" "}
                  <span className="font-medium">Samokształcenie</span> ma limit{" "}
                  <span className="font-medium">20 pkt / rok</span>.
                </div>
              </div>
            )}
          </div>
        </div>

        {(info || err) && (
          <div className="mt-6 rounded-2xl border bg-white p-4 text-sm">
            {info ? <div className="text-emerald-700">{info}</div> : null}
            {err ? <div className="text-rose-700">{err}</div> : null}
            {info ? (
              <div className="mt-2 flex flex-wrap gap-3">
                <Link href="/activities" className="text-blue-700 hover:underline">
                  Zobacz w Aktywnościach →
                </Link>
                <Link href="/portfolio" className="text-blue-700 hover:underline">
                  Przejdź do Portfolio →
                </Link>
              </div>
            ) : null}
          </div>
        )}

        <div className={`mt-6 rounded-2xl border p-5 ${toneStyles}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold">{status.title}</h3>
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
              <div className="text-lg font-bold text-slate-900">{formatInt(totalPoints)}</div>
            </div>
            <div className="rounded-xl bg-white/60 p-3">
              <div className="text-xs text-slate-600">Wymagane</div>
              <div className="text-lg font-bold text-slate-900">{formatInt(requiredPoints)}</div>
            </div>
            <div className="rounded-xl bg-white/60 p-3">
              <div className="text-xs text-slate-600">Brakuje</div>
              <div className="text-lg font-bold text-slate-900">{formatInt(missing)}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Postęp</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/60">
              <div className={`h-full ${progressBarClass}`} style={{ width: `${progress}%` }} />
            </div>
            {progress >= 100 ? (
              <div className="mt-2 text-xs text-emerald-800">✅ Cel osiągnięty — jesteś na 100% lub więcej.</div>
            ) : null}
          </div>

          {missing > 0 ? (
            <div className="mt-5 rounded-xl bg-white/60 p-4">
              <div className="text-sm font-semibold text-slate-900">Tempo, żeby zdążyć</div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-600">Średnio na rok</div>
                  <div className="font-bold text-slate-900">{plan.perYear} pkt</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Średnio na kwartał</div>
                  <div className="font-bold text-slate-900">{plan.perQuarter} pkt</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Średnio na miesiąc</div>
                  <div className="font-bold text-slate-900">{plan.perMonth} pkt</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-600">Liczone wg lat do końca okresu (do {period.end}).</div>
            </div>
          ) : null}

          {recommendations.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-semibold text-slate-900">Szybkie propozycje uzupełnienia</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                {recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-slate-600">
                *Przykładowe scenariusze na bazie domyślnych punktów dla typów aktywności.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT */}
      <section className="lg:col-span-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Twoje aktywności (kalkulator)</h2>
              <p className="mt-1 text-sm text-slate-600">
                {user
                  ? "Zalogowany: możesz zapisać poniższe wpisy do bazy (Portfolio)."
                  : "Tryb gościa: to tylko szkic lokalny. Zaloguj się, aby zapisać do bazy."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={addActivity}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                type="button"
              >
                + Dodaj aktywność
              </button>

              <button
                onClick={saveAllToPortfolio}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={!user || busy}
                type="button"
                title={!user ? "Zaloguj się, żeby zapisać." : "Zapisze wszystkie wiersze do Portfolio."}
              >
                {busy ? "Zapisuję…" : "Zapisz do Portfolio"}
              </button>

              {user ? (
                <Link
                  href="/activities"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Aktywności
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Zaloguj i zapisz
                </Link>
              )}
            </div>
          </div>

          <div className="mt-5">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-600">
                  <th className="border-b px-3 py-3">Rodzaj</th>
                  <th className="border-b px-3 py-3">Punkty</th>
                  <th className="border-b px-3 py-3">Rok</th>
                  <th className="border-b px-3 py-3">Organizator</th>
                  <th className="border-b px-3 py-3 text-right">Akcje</th>
                </tr>
              </thead>

              <tbody>
                {applied.map((row) => {
                  const rowDisabled = !row.in_period;
                  const src = activities.find((a) => a.id === row.id);

                  const isEditing = editingId === row.id;

                  const pointsValue = isEditing ? editDraft?.points ?? 0 : src ? src.points : Math.max(0, Number(row.points) || 0);
                  const yearValue = isEditing ? editDraft?.year ?? currentYear : src ? src.year : Number(row.year) || currentYear;
                  const organizerValue = isEditing ? editDraft?.organizer ?? "" : src?.organizer ?? "";
                  const typeValue = isEditing ? (editDraft?.type ?? (src?.type ?? row.type)) : (src?.type ?? row.type);

                  return (
                    <>
                      <tr
                        key={row.id}
                        className={`text-sm ${rowDisabled ? "opacity-50" : ""}`}
                        title={rowDisabled ? "Ten rok nie należy do wybranego okresu – punkty nie zostaną zaliczone." : ""}
                      >
                        <td className="border-b px-3 py-3 align-top">
                          <select
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50"
                            value={typeValue as ActivityType}
                            onChange={(e) => {
                              if (!isEditing) return;
                              const nextType = e.target.value as ActivityType;
                              setEditDraft((d) => {
                                if (!d) return d;
                                const next = { ...d, type: nextType };
                                // jeśli punkty były auto (w edycji traktujemy jak auto dopóki user nie zmieni ręcznie)
                                next.points = DEFAULT_POINTS_BY_TYPE[nextType];
                                return next;
                              });
                            }}
                            disabled={rowDisabled || !isEditing}
                          >
                            {TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          {!row.in_period && (
                            <div className="mt-1 text-xs text-amber-700">
                              Ten rok nie należy do wybranego okresu – punkty nie zostaną zaliczone.
                            </div>
                          )}

                          {row.warning ? <div className="mt-1 text-xs text-rose-700">{row.warning}</div> : null}

                          {row.in_period && row.applied_points !== Math.max(0, Number(src?.points ?? row.points) || 0) ? (
                            <div className="mt-1 text-[11px] text-slate-600">
                              Zaliczone do sumy: <span className="font-semibold">{row.applied_points}</span> pkt
                            </div>
                          ) : null}
                        </td>

                        <td className="border-b px-3 py-3 align-top">
                          <input
                            type="number"
                            min={0}
                            className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50"
                            value={pointsValue}
                            onChange={(e) => {
                              if (!isEditing) return;
                              const val = Number(e.target.value || 0);
                              setEditDraft((d) => (d ? { ...d, points: Math.max(0, val) } : d));
                            }}
                            disabled={rowDisabled || !isEditing}
                          />
                          <div className="mt-1 text-[11px] text-slate-500">
                            {isEditing ? "Edycja" : (src?.pointsAuto ? "Auto (wg rodzaju)" : "Ręcznie (z certyfikatu)")}
                          </div>
                        </td>

                        <td className="border-b px-3 py-3 align-top">
                          <input
                            type="number"
                            className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50"
                            value={yearValue}
                            onChange={(e) => {
                              if (!isEditing) return;
                              setEditDraft((d) => (d ? { ...d, year: Number(e.target.value || currentYear) } : d));
                            }}
                            disabled={rowDisabled || !isEditing}
                          />
                        </td>

                        <td className="border-b px-3 py-3 align-top">
                          <input
                            type="text"
                            placeholder="np. OIL / towarzystwo"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50"
                            value={organizerValue}
                            onChange={(e) => {
                              if (!isEditing) return;
                              setEditDraft((d) => (d ? { ...d, organizer: e.target.value } : d));
                            }}
                            disabled={rowDisabled || !isEditing}
                          />
                        </td>

                        {/* MENU AKCJI */}
                        <td className="border-b px-3 py-3 align-top text-right">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              className="rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
                              onClick={() => setOpenMenuId((prev) => (prev === row.id ? null : row.id))}
                            >
                              ⋯
                            </button>

                            {openMenuId === row.id && (
                              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border bg-white shadow-lg">
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    startEdit(row.id);
                                  }}
                                  disabled={rowDisabled}
                                  title={rowDisabled ? "Poza okresem — edycja zablokowana." : "Edytuj"}
                                >
                                  Edytuj
                                </button>

                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    saveEdit();
                                  }}
                                  disabled={!isEditing}
                                  title={!isEditing ? "Najpierw kliknij Edytuj" : "Zapisz zmiany"}
                                >
                                  Zapisz
                                </button>

                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    removeActivity(row.id);
                                  }}
                                >
                                  Usuń
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* PANEL EDYCJI POD WIERSZEM */}
                      {isEditing && (
                        <tr key={`${row.id}-edit`}>
                          <td className="border-b px-3 py-3" colSpan={5}>
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Komentarz</label>
                                  <textarea
                                    className="mt-1 min-h-[88px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                                    value={editDraft?.comment ?? ""}
                                    onChange={(e) => setEditDraft((d) => (d ? { ...d, comment: e.target.value } : d))}
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-slate-700">Certyfikat</label>
                                  <input
                                    type="file"
                                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0] ?? null;
                                      setEditDraft((d) => {
                                        if (!d) return d;
                                        return {
                                          ...d,
                                          certificate_file: f,
                                          certificate_name: f ? f.name : null,
                                        };
                                      });
                                    }}
                                  />
                                  <div className="mt-2 text-xs text-slate-600">
                                    {editDraft?.certificate_name ? (
                                      <>
                                        Wybrano: <span className="font-medium">{editDraft.certificate_name}</span>
                                      </>
                                    ) : (
                                      "Opcjonalnie. (W kalkulatorze nazwa pliku zapisze się lokalnie — upload dodamy w Aktywnościach)."
                                    )}
                                  </div>

                                  {user ? (
                                    <div className="mt-2 text-xs">
                                      Jeśli chcesz realnie podpiąć plik do bazy:{" "}
                                      <Link className="text-blue-700 hover:underline" href="/activities">
                                        przejdź do Aktywności
                                      </Link>
                                      .
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  onClick={cancelEdit}
                                >
                                  Anuluj
                                </button>
                                <button
                                  type="button"
                                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                  onClick={saveEdit}
                                >
                                  Zapisz zmiany
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end">
              <button
                onClick={addActivity}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                type="button"
              >
                + Dodaj aktywność
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Podsumowanie</div>
                <div className="text-sm text-slate-600">
                  Liczymy tylko aktywności z okresu:{" "}
                  <span className="font-medium text-slate-900">
                    {period.start}–{period.end}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-600">Suma punktów w okresie</div>
                <div className="text-2xl font-extrabold text-slate-900">{formatInt(totalPoints)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Następny krok</h3>
          <p className="mt-1 text-sm text-slate-600">
            {user
              ? "Możesz zapisać wpisy do Portfolio albo przejść do Aktywności i dodać certyfikaty."
              : "Zaloguj się, żeby zapisać wpisy do bazy i potem podpinać certyfikaty w Aktywnościach."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link
                  href="/activities"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Przejdź do Aktywności
                </Link>
                <Link
                  href="/portfolio"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Portfolio
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Zaloguj się
              </Link>
            )}

            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Wróć na stronę główną
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
