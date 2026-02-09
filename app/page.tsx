"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";
import BottomCTA from "@/components/BottomCTA";

type ProfileRow = {
  user_id: string;
  profession: string | null;
  period_start: number | null;
  period_end: number | null;
  required_points: number | null;
};

type ActivityRow = {
  points: number;
  year: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Page() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // skrót CPD
  const [periodLabel, setPeriodLabel] = useState<string>("—");
  const [requiredPoints, setRequiredPoints] = useState<number | null>(null);
  const [pointsInPeriod, setPointsInPeriod] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setChecking(true);

      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!alive) return;

      if (authError) {
        console.error(authError);
        setChecking(false);
        return;
      }

      const user = auth?.user ?? null;
      setUserEmail(user?.email ?? null);

      // niezalogowany → landing
      if (!user) {
        setChecking(false);
        return;
      }

      // 1) profil (bramka do onboardingu)
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, profession, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (profErr) console.warn("profiles error:", profErr.message);

      if (!profile) {
        router.replace("/start");
        return;
      }

      const p = profile as ProfileRow;
      const start = Number(p.period_start ?? 2023);
      const end = Number(p.period_end ?? 2026);
      const req = Number(p.required_points ?? 200);

      setPeriodLabel(`${start}–${end}`);
      setRequiredPoints(req);

      // 2) punkty w okresie (po year)
      const { data: acts, error: actErr } = await supabase
        .from("activities")
        .select("points, year")
        .eq("user_id", user.id)
        .gte("year", start)
        .lte("year", end);

      if (!alive) return;

      if (actErr) {
        console.error(actErr);
        setPointsInPeriod(null);
        setChecking(false);
        return;
      }

      const list = (acts ?? []) as ActivityRow[];
      const sum = list.reduce((acc, r) => acc + (Number(r.points) || 0), 0);
      setPointsInPeriod(sum);

      setChecking(false);
    }

    run();
    return () => {
      alive = false;
    };
  }, [router, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const progressPct = useMemo(() => {
    if (pointsInPeriod == null || requiredPoints == null || requiredPoints <= 0) return 0;
    return clamp((pointsInPeriod / requiredPoints) * 100, 0, 100);
  }, [pointsInPeriod, requiredPoints]);

  const missing = useMemo(() => {
    if (pointsInPeriod == null || requiredPoints == null) return null;
    return Math.max(0, requiredPoints - pointsInPeriod);
  }, [pointsInPeriod, requiredPoints]);

  // ✅ Landing tylko dla niezalogowanych
  if (!userEmail) {
    return (
      <>
        <Hero />
        <FeatureGrid />
        <BottomCTA />
      </>
    );
  }

  // ✅ Zalogowany: jedno, spójne “centrum”
  return (
    <>
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-sky-50 via-white to-white" />

        <div className="mx-auto max-w-6xl px-4 pt-10 pb-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600 shadow-sm backdrop-blur">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Zalogowany
              </div>

              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Twoje centrum CRPE
              </h1>
              <p className="mt-2 text-slate-600">
                Szybki podgląd statusu i skróty do dziennika, portfolio oraz ustawień.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">{userEmail}</span>
              </div>

              <button
                onClick={handleSignOut}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Wyloguj
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">Okres rozliczeniowy</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {checking ? "…" : periodLabel}
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/profil"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Ustawienia okresu
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">Punkty w okresie</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {checking ? "…" : pointsInPeriod ?? "—"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Cel: <span className="font-medium text-slate-700">{requiredPoints ?? "—"}</span>
              </div>

              <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-sky-600" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {missing == null ? "—" : missing > 0 ? `Do celu brakuje: ${missing} pkt` : "Cel osiągnięty ✅"}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">Szybkie akcje</div>

              <div className="mt-4 grid gap-3">
                <Link
                  href="/activities"
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-sky-700"
                >
                  + Dodaj aktywność
                </Link>

                <Link
                  href="/portfolio"
                  className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Otwórz portfolio
                </Link>

                <Link
                  href="/activities"
                  className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Dziennik wpisów
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link href="/activities" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:bg-slate-50 transition">
              <div className="text-sm text-slate-500">Dziennik</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">Aktywności + certyfikaty</div>
              <div className="mt-2 text-sm text-slate-600">Dodawaj wpisy i porządkuj dokumenty.</div>
            </Link>

            <Link href="/portfolio" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:bg-slate-50 transition">
              <div className="text-sm text-slate-500">Portfolio</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">Status i podsumowanie</div>
              <div className="mt-2 text-sm text-slate-600">Punkty w okresie + ostatnie wpisy.</div>
            </Link>

            <Link href="/kalkulator" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:bg-slate-50 transition">
              <div className="text-sm text-slate-500">Planowanie</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">Kalkulator punktów</div>
              <div className="mt-2 text-sm text-slate-600">Symulacje i szybkie “ile brakuje”.</div>
            </Link>
          </div>
        </div>
      </section>

      <FeatureGrid />
      <BottomCTA />
    </>
  );
}
