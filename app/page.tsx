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

      // niezalogowany → landing jak jest
      if (!user) {
        setChecking(false);
        return;
      }

      // 1) sprawdź profil (bramka do onboardingu)
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, profession, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (profErr) {
        // nie blokujemy wejścia, ale pokażemy fallback w dashboardzie
        console.warn("profiles error:", profErr.message);
      }

      // jeśli brak profilu → onboarding (/start)
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

      // 2) policz punkty w okresie (po polu year)
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

  return (
    <>
      <Hero />
      <FeatureGrid />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold">Centrum</h2>
            <p className="mt-1 text-sm text-slate-600">
              Szybki skrót Twojego CPD + nawigacja do dziennika i portfolio.
            </p>
          </div>

          {userEmail ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-slate-600">{userEmail}</span>
              <button onClick={handleSignOut} className="rounded-xl border px-4 py-2 hover:bg-black/5">
                Wyloguj
              </button>
            </div>
          ) : (
            <Link href="/login" className="rounded-xl border px-4 py-2 hover:bg-black/5">
              Zaloguj
            </Link>
          )}
        </div>

        {/* Jeśli user niezalogowany */}
        {!userEmail ? (
          <div className="rounded-2xl border bg-white p-6">
            <div className="text-sm text-slate-600">
              Zaloguj się, aby tworzyć dziennik aktywności, dodawać certyfikaty i liczyć punkty w okresie.
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Zaloguj się
              </Link>
              <Link href="/kalkulator" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Kalkulator (gość)
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-sm text-slate-500">Okres rozliczeniowy</div>
                <div className="mt-2 text-2xl font-semibold">{checking ? "…" : periodLabel}</div>
                <div className="mt-3 flex gap-2">
                  <Link href="/profil" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Ustawienia
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-sm text-slate-500">Punkty w okresie</div>
                <div className="mt-2 text-2xl font-semibold">{checking ? "…" : pointsInPeriod ?? "—"}</div>
                <div className="mt-1 text-sm text-slate-500">
                  Cel: <span className="font-medium text-slate-700">{requiredPoints ?? "—"}</span>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Postęp</span>
                  <span className="font-semibold text-slate-900">{checking ? "…" : `${Math.round(progressPct)}%`}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {missing == null ? "—" : missing > 0 ? `Do celu brakuje: ${missing} pkt` : "Cel osiągnięty ✅"}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Link href="/activities" className="rounded-2xl border bg-white p-5 hover:bg-slate-50 transition">
                <div className="text-sm text-slate-500">Dziennik</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">Aktywności + certyfikaty</div>
                <div className="mt-2 text-sm text-slate-600">Dodawaj wpisy, porządkuj brakujące pola.</div>
              </Link>

              <Link href="/portfolio" className="rounded-2xl border bg-white p-5 hover:bg-slate-50 transition">
                <div className="text-sm text-slate-500">Portfolio</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">Status i podsumowanie</div>
                <div className="mt-2 text-sm text-slate-600">Szybki obraz okresu + ostatnie wpisy.</div>
              </Link>

              <Link href="/kalkulator" className="rounded-2xl border bg-white p-5 hover:bg-slate-50 transition">
                <div className="text-sm text-slate-500">Planowanie</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">Kalkulator punktów</div>
                <div className="mt-2 text-sm text-slate-600">Symulacje i „ile mi brakuje”.</div>
              </Link>
            </div>
          </>
        )}
      </section>

      <BottomCTA />
    </>
  );
}

