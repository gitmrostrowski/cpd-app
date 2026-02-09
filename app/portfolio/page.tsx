"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type ActivityRow = {
  id: string;
  user_id: string; // ✅ dodane
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;
};

type Prefs = {
  profession: "Lekarz" | "Lekarz dentysta" | "Inne";
  requiredPoints: number;
  periodLabel: string; // np. "2023–2026"
};

function parsePeriod(periodLabel: string) {
  const clean = periodLabel.replace("–", "-");
  const [a, b] = clean.split("-").map((x) => Number(String(x).trim()));
  const start = Number.isFinite(a) ? a : 2023;
  const end = Number.isFinite(b) ? b : start + 3;
  return { start, end };
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function PortfolioPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [prefs, setPrefs] = useState<Prefs>({
    profession: "Lekarz",
    requiredPoints: 200,
    periodLabel: "2023–2026",
  });

  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1) preferencje z localStorage (MVP)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("crpe_profile_prefs_v1");
      if (!raw) return;
      const p = JSON.parse(raw);
      setPrefs((prev) => ({
        profession: p?.profession ?? prev.profession,
        requiredPoints: typeof p?.requiredPoints === "number" ? p.requiredPoints : prev.requiredPoints,
        periodLabel: typeof p?.periodLabel === "string" ? p.periodLabel : prev.periodLabel,
      }));
    } catch {}
  }, []);

  const period = useMemo(() => parsePeriod(prefs.periodLabel), [prefs.periodLabel]);

  // 2) pobierz aktywności z Supabase (TYLKO usera)
  useEffect(() => {
    let alive = true;

    async function run() {
      if (!user) {
        setActivities([]);
        return;
      }
      setFetching(true);
      setErrorMsg(null);

      try {
        const { data, error } = await supabase
          .from("activities")
          .select("id,user_id,type,points,year,organizer,created_at") // ✅ user_id dodane
          .eq("user_id", user.id) // ✅ kluczowa poprawka
          .order("created_at", { ascending: false });

        if (!alive) return;

        if (error) {
          setErrorMsg(error.message);
          setActivities([]);
          return;
        }

        setActivities((data as ActivityRow[]) ?? []);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message || "Nie udało się pobrać aktywności.");
        setActivities([]);
      } finally {
        if (alive) setFetching(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [user, supabase]);

  // 3) status CPD
  const inPeriod = useMemo(() => {
    return activities.filter((a) => a.year >= period.start && a.year <= period.end);
  }, [activities, period.start, period.end]);

  const totalPoints = useMemo(
    () => inPeriod.reduce((sum, a) => sum + (Number(a.points) || 0), 0),
    [inPeriod]
  );

  const required = Math.max(0, Number(prefs.requiredPoints) || 0);
  const missing = Math.max(0, required - totalPoints);
  const progressPct = required > 0 ? clamp((totalPoints / required) * 100, 0, 100) : 0;

  const latest = useMemo(() => inPeriod.slice(0, 5), [inPeriod]);

  // 4) next actions (MVP)
  const actions = useMemo(() => {
    const list: Array<{ title: string; desc: string; href: string; kind?: "warn" | "ok" }> = [];

    if (missing > 0) {
      list.push({
        title: `Brakuje ${missing} pkt do celu`,
        desc: "Dodaj aktywności z bieżącego okresu rozliczeniowego.",
        href: "/activities",
        kind: "warn",
      });
    } else {
      list.push({
        title: "Cel punktowy osiągnięty ✅",
        desc: "Możesz przygotować raport do rozliczeń (gdy moduł raportów będzie gotowy).",
        href: "/raporty",
        kind: "ok",
      });
    }

    const noOrg = inPeriod.filter((a) => !a.organizer || !String(a.organizer).trim()).length;
    if (noOrg > 0) {
      list.push({
        title: `Uzupełnij organizatora (${noOrg})`,
        desc: "W CPD przydaje się kompletność danych na certyfikatach/raportach.",
        href: "/activities",
        kind: "warn",
      });
    }

    if (inPeriod.length < 3) {
      list.push({
        title: "Dodaj więcej aktywności",
        desc: "Masz mało wpisów w okresie — lepiej uzupełniać na bieżąco.",
        href: "/activities",
      });
    }

    if (list.length === 0) {
      list.push({
        title: "Porządek w portfolio",
        desc: "Sprawdź aktywności i przygotuj raport.",
        href: "/activities",
      });
    }

    return list.slice(0, 3);
  }, [missing, inPeriod]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6">Ładuję portfolio…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-8">
          <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
          <p className="mt-2 text-slate-600">
            Zaloguj się, aby zapisywać aktywności, liczyć punkty w okresie i generować raporty.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Zaloguj się
            </Link>

            <Link
              href="/kalkulator"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Kalkulator (tryb gościa)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Portfolio</h1>
          <p className="mt-2 text-slate-600">
            Status Twojego CPD w okresie{" "}
            <span className="font-semibold text-slate-900">{prefs.periodLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/activities"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Aktywności
          </Link>

          <Link
            href="/activities"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Dodaj aktywność
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Okres: <span className="font-semibold">{period.start}–{period.end}</span>
            </span>

            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Masz: <span className="font-semibold">{totalPoints}</span>
            </span>

            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Wymagane: <span className="font-semibold">{required}</span>
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                missing > 0
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              Brakuje: <span className="font-semibold">{missing}</span>
            </span>
          </div>

          <div className="min-w-[220px]">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Postęp</span>
              <span className="font-semibold text-slate-900">{Math.round(progressPct)}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progressPct}%` }} aria-label="Postęp" />
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            Błąd pobierania aktywności: {errorMsg}
          </div>
        )}

        {fetching && <div className="mt-4 text-sm text-slate-500">Pobieram aktywności…</div>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">Następne kroki</h2>
          <p className="mt-1 text-sm text-slate-600">Szybkie działania, które poprawią kompletność Twojego portfolio.</p>

          <div className="mt-4 space-y-3">
            {actions.map((a, idx) => (
              <Link
                key={idx}
                href={a.href}
                className={`
                  block rounded-2xl border p-4 hover:bg-slate-50 transition
                  ${a.kind === "warn" ? "border-rose-200" : "border-slate-200"}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{a.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{a.desc}</div>
                  </div>
                  <span className="text-slate-400">›</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Ustawienia okresu</div>
            <div className="mt-1 text-sm text-slate-600">
              Zawód: <span className="font-medium text-slate-900">{prefs.profession}</span>
              <br />
              Cel: <span className="font-medium text-slate-900">{required}</span> pkt
            </div>
            <Link
              href="/profil"
              className="mt-3 inline-flex rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Zmień w profilu
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ostatnie aktywności</h2>
              <p className="mt-1 text-sm text-slate-600">
                Pokazujemy wpisy tylko z okresu <span className="font-semibold">{prefs.periodLabel}</span>.
              </p>
            </div>

            <Link
              href="/activities"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Zobacz wszystkie
            </Link>
          </div>

          {inPeriod.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <div className="text-lg font-semibold text-slate-900">Brak aktywności w okresie</div>
              <div className="mt-2 text-sm text-slate-600">
                Dodaj pierwszą aktywność, a portfolio zacznie liczyć punkty i status.
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link
                  href="/activities"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  + Dodaj aktywność
                </Link>
                <Link
                  href="/activities"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Przejdź do Aktywności
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {latest.map((a) => (
                <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{a.type}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {a.organizer ? a.organizer : "Brak organizatora"} • Rok:{" "}
                        <span className="font-medium text-slate-900">{a.year}</span>
                        {a.created_at ? (
                          <>
                            {" "}
                            • Dodano:{" "}
                            <span className="font-medium text-slate-900">{formatDateShort(a.created_at)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-600">Punkty</span>
                      <span className="font-semibold text-slate-900">{a.points}</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link href="/activities" className="text-sm font-medium text-blue-700 hover:underline">
                  Zobacz wszystkie aktywności →
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Raporty</h2>
            <p className="mt-1 text-sm text-slate-600">Eksport PDF/CSV i historia raportów — moduł w przygotowaniu.</p>
          </div>
          <Link
            href="/raporty"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Przejdź do Raportów
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="font-semibold text-slate-900">Eksport CSV</div>
            <div className="mt-1 text-sm text-slate-600">Lista aktywności do analizy i archiwizacji.</div>
            <button
              disabled
              className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 disabled:opacity-70"
            >
              Wkrótce
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="font-semibold text-slate-900">Raport PDF</div>
            <div className="mt-1 text-sm text-slate-600">Gotowy dokument do rozliczeń okresu CPD.</div>
            <button
              disabled
              className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 disabled:opacity-70"
            >
              Wkrótce
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
