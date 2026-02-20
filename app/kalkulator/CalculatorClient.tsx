// app/kalkulator/CalculatorClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

import {
  type Profession,
  PROFESSION_OPTIONS,
  DEFAULT_REQUIRED_POINTS_BY_PROFESSION,
  rulesForProfession,
} from "@/lib/cpd/professions";

import {
  sumPointsWithRules,
  summarizeLimits,
  type Period,
  calcMissing,
  calcProgress,
} from "@/lib/cpd/calc";

type ActivityStatus = "planned" | "done" | null;

type ActivityRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;

  status?: ActivityStatus;
  planned_start_date?: string | null; // YYYY-MM-DD
  training_id?: string | null;

  certificate_path?: string | null;
  certificate_name?: string | null;
  certificate_mime?: string | null;
  certificate_size?: number | null;
  certificate_uploaded_at?: string | null;
};

type ProfileRow = {
  user_id: string;
  profession: Profession | null;
  period_start: number | null;
  period_end: number | null;
  required_points: number | null;
};

function fmtPct(n: number) {
  const p = Math.round(n);
  return `${p}%`;
}

// Delikatna "miękka mięta" (bardziej pastel, mniej „miętowa miętowa”)
const SOFT_MINT_BG = "bg-teal-50/60";
const SOFT_MINT_BORDER = "border-teal-100";
const SOFT_MINT_TEXT = "text-teal-900";
const SOFT_MINT_MUTED = "text-teal-700";

export default function CalculatorClient() {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [periodStart, setPeriodStart] = useState<number>(2023);
  const [periodEnd, setPeriodEnd] = useState<number>(2026);
  const [requiredPoints, setRequiredPoints] = useState<number>(
    DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.Lekarz ?? 200
  );

  // --- LOAD PROFILE + ACTIVITIES ---
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user?.id) return;
      setLoading(true);

      const { data: p, error: pErr } = await supabaseClient
        .from("profiles")
        .select("user_id, profession, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (!pErr && p) {
          setProfile(p as ProfileRow);

          const prof = (p.profession ?? "Lekarz") as Profession;
          setProfession(prof);

          const ps = p.period_start ?? 2023;
          const pe = p.period_end ?? 2026;
          setPeriodStart(ps);
          setPeriodEnd(pe);

          const rp =
            p.required_points ??
            DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ??
            200;
          setRequiredPoints(rp);
        } else {
          const prof: Profession = "Lekarz";
          setProfession(prof);
          setPeriodStart(2023);
          setPeriodEnd(2026);
          setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200);
        }
      }

      const { data: a, error: aErr } = await supabaseClient
        .from("activities")
        .select(
          "id, user_id, type, points, year, organizer, created_at, status, planned_start_date, training_id, certificate_path, certificate_name, certificate_mime, certificate_size, certificate_uploaded_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (!aErr && a) setActivities(a as ActivityRow[]);
        else setActivities([]);
        setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // --- DERIVED ---
  const periodLabel = `${periodStart}-${periodEnd}`;
  const period: Period = useMemo(
    () => ({ start: periodStart, end: periodEnd }),
    [periodStart, periodEnd]
  );

  const rules = useMemo(() => rulesForProfession(profession), [profession]);

  const inPeriodDone = useMemo(() => {
    return activities.filter((x) => {
      const st = x.status ?? "done"; // kompatybilność wstecz
      return st === "done" && x.year >= periodStart && x.year <= periodEnd;
    });
  }, [activities, periodStart, periodEnd]);

  const inPeriodPlanned = useMemo(() => {
    return activities.filter((x) => {
      const st = x.status ?? null;
      const isPlanned = st === "planned" || (!!x.planned_start_date && st !== "done");
      const y = x.planned_start_date
        ? Number(String(x.planned_start_date).slice(0, 4))
        : x.year;
      return isPlanned && y >= periodStart && y <= periodEnd;
    });
  }, [activities, periodStart, periodEnd]);

  // Suma „realnie zaliczona” (po limitach) — to jest jedyna suma do postępu.
  const doneAppliedPoints = useMemo(() => {
    return sumPointsWithRules(inPeriodDone, { period, rules });
  }, [inPeriodDone, period, rules]);

  const missingPoints = useMemo(() => {
    return calcMissing(doneAppliedPoints, requiredPoints);
  }, [doneAppliedPoints, requiredPoints]);

  const progress = useMemo(() => {
    return calcProgress(doneAppliedPoints, requiredPoints);
  }, [doneAppliedPoints, requiredPoints]);

  // Limity i breakdown (realnie: raw/applied/over)
  const limitsSummary = useMemo(() => {
    return summarizeLimits(inPeriodDone, { period, rules });
  }, [inPeriodDone, period, rules]);

  // Punkty wg kategorii — pokaż zaliczone (applied), a jeśli jest nadwyżka, pokaż ją też.
  const pointsByTypeApplied = useMemo(() => {
    return limitsSummary.perType
      .filter((x) => x.applied > 0 || x.raw > 0)
      .map((x) => ({
        type: x.type || "Inne",
        applied: Math.round(x.applied),
        raw: Math.round(x.raw),
        over: Math.round(x.over),
        capInPeriod: x.capInPeriod,
        usedPct: x.usedPct,
      }));
  }, [limitsSummary]);

  // --- UI STATES ---
  const isBusy = authLoading || loading;

  // --- ACTIONS ---
  async function saveProfilePatch(patch: Partial<ProfileRow>) {
    if (!user?.id) return;
    await supabaseClient.from("profiles").upsert({
      user_id: user.id,
      profession,
      period_start: periodStart,
      period_end: periodEnd,
      required_points: requiredPoints,
      ...patch,
    });
  }

  // --- RENDER ---
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16">
      {/* 1) JEDEN tytuł */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Panel CPD
        </h1>
        <p className="mt-2 text-slate-600">
          Podgląd postępu w okresie rozliczeniowym. Dodawanie, edycja i certyfikaty są w{" "}
          <Link
            href="/aktywnosci"
            className="font-semibold text-slate-900 underline underline-offset-2"
          >
            Aktywnościach
          </Link>
          .
        </p>
      </div>

      {/* 2) STATUS KONTA */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Status konta</span>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Zalogowany
              </span>

              {isBusy ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Synchronizacja…
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Zsynchronizowane z bazą
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">
                Panel pokazuje podsumowanie uzyskanych punktów edukacyjnych.
              </span>{" "}
              Ukończone liczy się do punktów, Plan jest planem.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                {user?.email ?? "—"}
              </span>
              {profile?.profession ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  Profil: {profile.profession}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <Link
              href="/aktywnosci?new=1"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Dodaj aktywność
            </Link>

            <Link
              href="/aktywnosci"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Zobacz aktywności
            </Link>

            <button
              type="button"
              onClick={async () => {
                const prof: Profession = "Lekarz";
                setProfession(prof);
                setPeriodStart(2023);
                setPeriodEnd(2026);
                setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200);
                await saveProfilePatch({
                  profession: prof,
                  period_start: 2023,
                  period_end: 2026,
                  required_points: DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200,
                });
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Wyczyść
            </button>
          </div>
        </div>
      </div>

      {/* 3) USTAWIENIA */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Zawód</label>
              <select
                value={profession}
                onChange={async (e) => {
                  const v = e.target.value as Profession;
                  setProfession(v);
                  const rp = DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[v] ?? 200;
                  setRequiredPoints(rp);
                  await saveProfilePatch({ profession: v, required_points: rp });
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {PROFESSION_OPTIONS?.map((p: Profession) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Okres rozliczeniowy
              </label>
              <select
                value={periodLabel}
                onChange={async (e) => {
                  const [a, b] = e.target.value.split("-").map((x) => Number(x));
                  setPeriodStart(a);
                  setPeriodEnd(b);
                  await saveProfilePatch({ period_start: a, period_end: b });
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="2019-2022">2019-2022</option>
                <option value="2023-2026">2023-2026</option>
                <option value="2027-2030">2027-2030</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Wymagane punkty (łącznie)
              </label>
              <input
                value={requiredPoints}
                onChange={(e) => setRequiredPoints(Number(e.target.value || 0))}
                onBlur={async () => {
                  await saveProfilePatch({ required_points: requiredPoints });
                }}
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Domyślnie dla {profession}:{" "}
                {DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[profession] ?? 200}
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold text-slate-700">Informacja</div>
              <div className="mt-1 text-sm text-slate-700">
                W części kategorii obowiązują limity cząstkowe — do postępu liczą się
                punkty zaliczone (po limitach).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4) GŁÓWNY KAFEL – połączone: zdobyte / wymagane / brakuje */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div
          className={`rounded-2xl border ${SOFT_MINT_BORDER} ${SOFT_MINT_BG} p-5 shadow-sm lg:col-span-2`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className={`text-xs font-semibold ${SOFT_MINT_MUTED}`}>
                Podsumowanie w okresie {periodLabel}
              </div>

              <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
                <div className="text-3xl font-extrabold text-slate-900">
                  {Math.round(doneAppliedPoints)}/{requiredPoints}
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  brakuje{" "}
                  <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700">
                    {Math.round(missingPoints)} pkt
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm text-slate-700">
                Ukończone:{" "}
                <span className="font-semibold text-slate-900">
                  {inPeriodDone.length}
                </span>{" "}
                • Plan:{" "}
                <span className="font-semibold text-slate-900">
                  {inPeriodPlanned.length}
                </span>
              </div>

              {/* Jeśli są nadwyżki przez limity, pokaż krótką info */}
              {limitsSummary.perType.some((x) => (x.over || 0) > 0) ? (
                <div className="mt-2 text-xs text-slate-700">
                  <span className="font-semibold">Uwaga:</span> część punktów może nie
                  zwiększać sumy (nadwyżki ponad limity cząstkowe).
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/aktywnosci?new=1"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Znajdź szkolenie
              </Link>
              <Link
                href="/aktywnosci?new=1"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Dodaj ręcznie
              </Link>
            </div>
          </div>

          {/* Pasek postępu */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className={`text-xs font-semibold ${SOFT_MINT_TEXT}`}>Postęp</div>
              <div className="text-xs font-semibold text-slate-700">
                {fmtPct(progress)}
              </div>
            </div>

            <div className="mt-2 rounded-full bg-white/70 p-1">
              <div className="h-3 rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-blue-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700">
              <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800">
                Okres: {periodLabel}
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 font-medium">
                Zaliczone: {Math.round(doneAppliedPoints)} pkt
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 font-medium">
                Wymagane: {requiredPoints} pkt
              </span>
            </div>
          </div>
        </div>

        {/* Ostatnie ukończone */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold text-slate-900">Ostatnie aktywności</div>
            <Link href="/aktywnosci" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Przejdź →
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {isBusy ? (
              <div className="text-sm text-slate-600">Wczytuję…</div>
            ) : inPeriodDone.slice(0, 5).length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                Brak ukończonych aktywności w okresie {periodLabel}.
              </div>
            ) : (
              inPeriodDone.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {a.type}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {a.organizer ? `${a.organizer} • ` : ""}
                        {a.year}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700">
                      ukończone
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5) LIMITY CZĄSTKOWE + kategorie */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Limity cząstkowe (kategorie)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Jeśli dana kategoria ma limit, pokażemy: wpisane / zaliczone / nadwyżkę.
            </p>
          </div>

          <div className="text-sm text-slate-700">
            Zaliczone w okresie:{" "}
            <span className="font-extrabold text-slate-900">
              {Math.round(doneAppliedPoints)} pkt
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Kategorie z limitami */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">Kategorie z limitami</div>

            {limitsSummary.perType.filter((x) => !!x.capInPeriod).length === 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                Dla zawodu <span className="font-semibold">{profession}</span> nie ma ustawionych limitów (MVP).
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {limitsSummary.perType
                  .filter((x) => !!x.capInPeriod)
                  .map((r) => {
                    const cap = r.capInPeriod ?? 0;
                    const usedPct = r.usedPct ?? 0;

                    return (
                      <div key={r.type} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {r.type || "Inne"}
                            </div>
                            <div className="mt-1 text-xs text-slate-600">
                              Limit: {r.yearlyCap} pkt/rok (≈ {cap} pkt/okres)
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-sm font-extrabold text-slate-900">
                              {Math.round(r.applied)}/{cap}
                            </div>
                            <div className="text-xs font-semibold text-slate-600">
                              {Math.max(0, cap - r.applied) > 0
                                ? `zostało ${Math.round(Math.max(0, cap - r.applied))} pkt`
                                : "limit wykorzystany"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="h-2 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-blue-600"
                              style={{ width: `${usedPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Wpisane vs zaliczone vs nadwyżka */}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                            wpisane: {Math.round(r.raw)} pkt
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                            zaliczone: {Math.round(r.applied)} pkt
                          </span>
                          {r.over > 0 ? (
                            <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">
                              nadwyżka: {Math.round(r.over)} pkt
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Punkty wg kategorii (zaliczone) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">Punkty wg kategorii (ukończone)</div>

            <div className="mt-3 space-y-2">
              {pointsByTypeApplied.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  Brak danych w okresie {periodLabel}.
                </div>
              ) : (
                pointsByTypeApplied.slice(0, 10).map((row) => {
                  const hasLimit = !!row.capInPeriod;

                  return (
                    <div
                      key={row.type}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {row.type}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {hasLimit
                            ? `Limit w okresie: ${row.capInPeriod} pkt`
                            : "Bez limitu w aplikacji"}
                          {row.over > 0 ? ` • nadwyżka: ${row.over} pkt` : ""}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-extrabold text-slate-900">
                          {row.applied} pkt
                        </div>
                        {hasLimit ? (
                          <div className="mt-1 text-xs font-semibold text-slate-600">
                            {fmtPct(row.usedPct ?? 0)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {pointsByTypeApplied.length > 10 ? (
              <div className="mt-3 text-sm">
                <Link href="/aktywnosci" className="font-semibold text-blue-700 hover:text-blue-800">
                  Zobacz wszystkie w Aktywnościach →
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
