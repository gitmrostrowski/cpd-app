// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

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

  const progressPct = useMemo(() => {
    if (pointsInPeriod == null || requiredPoints == null || requiredPoints <= 0) return 0;
    return clamp((pointsInPeriod / requiredPoints) * 100, 0, 100);
  }, [pointsInPeriod, requiredPoints]);

  const missing = useMemo(() => {
    if (pointsInPeriod == null || requiredPoints == null) return null;
    return Math.max(0, requiredPoints - pointsInPeriod);
  }, [pointsInPeriod, requiredPoints]);

  // =========================
  // LANDING (NIEZALOGOWANY)
  // =========================
  if (!userEmail) {
    return (
      <>
        <section className="relative overflow-hidden">
          {/* lekka tinata (nie za ciemna) */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-white" />
          <div className="pointer-events-none absolute left-[-10%] top-[-25%] h-[34rem] w-[34rem] rounded-full bg-blue-200/35 blur-3xl" />
          <div className="pointer-events-none absolute right-[-12%] top-[5%] h-[28rem] w-[28rem] rounded-full bg-indigo-200/25 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-10 md:pt-14">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
              {/* LEWA */}
              <div className="lg:col-span-7">
                {/* zamiast „cienkiej pastylki” – prosta, czytelna etykieta */}
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  CRPE — dziennik aktywności i certyfikatów
                </div>

                <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
                  Porządek w punktach edukacyjnych.
                  <br />
                  <span className="text-blue-700">Bez chaosu w certyfikatach.</span>
                </h1>

                <p className="mt-5 max-w-prose text-lg leading-relaxed text-slate-600">
                  Dodajesz aktywność, podpinasz dowód i widzisz status w okresie rozliczeniowym.
                  Prosto, czytelnie i “do obrony” w razie audytu.
                </p>

                {/* CTA — w kolorze kalkulatora */}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Załóż konto / Zaloguj się
                  </Link>

                  <Link
                    href="/kalkulator"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
                  >
                    Sprawdź kalkulator
                  </Link>

                  <Link
                    href="/portfolio"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
                  >
                    Podgląd portfolio
                  </Link>
                </div>

                {/* Moduły */}
                <div className="mt-9 grid gap-4 sm:grid-cols-3">
                  {[
                    { k: "Moduł 01", t: "Dziennik", d: "Aktywności, organizator, rok — w jednym miejscu." },
                    { k: "Moduł 02", t: "Dowody", d: "PDF/zdjęcia certyfikatów przypięte do wpisów." },
                    { k: "Moduł 03", t: "Raporty", d: "Wkrótce: eksport PDF/CSV i historia raportów." },
                  ].map((x) => (
                    <div key={x.t} className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs text-slate-500">{x.k}</div>
                      <div className="mt-1 text-base font-semibold text-slate-900">{x.t}</div>
                      <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PRAWA — rysunek (niezasłonięty) */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto w-full max-w-[520px]">
                  <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-b from-blue-100/50 to-white blur-2xl" />
                  <div className="relative rounded-[28px] border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
                    <div className="text-sm font-semibold text-slate-900">Wizualny skrót</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Wpis → dowód → status w okresie. To wszystko.
                    </div>

                    <div className="mt-5 relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      {/* Przywrócony rysunek dwóch osób – trzymamy /public/illustration.svg */}
                      <Image
                        src="/illustration.svg"
                        alt="Ilustracja CRPE"
                        fill
                        className="object-contain p-4"
                        priority
                      />
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs text-slate-500">Przykład</div>
                        <div className="mt-1 text-sm text-slate-700">
                          Okres: <span className="font-semibold text-slate-900">2023–2026</span> • Cel:{" "}
                          <span className="font-semibold text-slate-900">200 pkt</span>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                          <div className="h-2 w-[55%] rounded-full bg-blue-600" />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                          <span>Masz: 110 pkt</span>
                          <span>Brakuje: 90 pkt</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs text-slate-500">Wkrótce</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          Webinary / baza szkoleń
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Możliwość dodania modułu z ofertami i zapisami.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sekcja poniżej na szarym tle (Twoje dane / workflow / raporty) */}
            <div className="mt-10 rounded-[32px] border border-slate-200 bg-slate-50 p-5 md:p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { t: "Twoje dane", d: "Wpisy i pliki są powiązane z kontem. RLS pilnuje dostępu." },
                  { t: "Prosty workflow", d: "Dodajesz aktywność → (opcjonalnie) certyfikat → status." },
                  { t: "Raporty", d: "Kolejny etap: PDF/CSV + kontrola jakości danych." },
                ].map((x) => (
                  <div key={x.t} className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
                    <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* „Jak to działa” — preview niżej, a nie w hero */}
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <h2 className="text-2xl font-extrabold text-slate-900">Jak to działa w praktyce</h2>
                <p className="mt-2 text-slate-600">
                  Nie musisz od razu wszystkiego uzupełniać. Na start liczy się: wpis, punkty, rok.
                </p>

                <ol className="mt-6 space-y-3">
                  {[
                    { t: "Dodaj aktywność", d: "Kurs / konferencja / webinar — wpis w 20–30 sekund." },
                    { t: "Podepnij dowód", d: "PDF lub zdjęcie certyfikatu do aktywności." },
                    { t: "Zobacz status", d: "Portfolio liczy punkty w Twoim okresie i pokazuje braki." },
                  ].map((x, i) => (
                    <li key={x.t} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{x.t}</div>
                        <div className="text-sm text-slate-600">{x.d}</div>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Zacznij teraz
                  </Link>
                  <Link
                    href="/kalkulator"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50/50"
                  >
                    Zobacz kalkulator
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7">
                {/* „Preview” jako karta/screen – ale w osobnej sekcji */}
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Podgląd widoku</div>
                      <div className="text-xs text-slate-500">Portfolio / status w okresie</div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                      MVP
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">Okres: 2023–2026</div>
                        <div className="text-xs text-slate-500">postęp</div>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-white">
                        <div className="h-2 w-[55%] rounded-full bg-blue-600" />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                        <span>Masz: 110 pkt</span>
                        <span>Brakuje: 90 pkt</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        { t: "Konferencja / kongres", m: "Organizator: PT… • Rok: 2025", p: 20, cert: true },
                        { t: "Kurs online / webinar", m: "Organizator: OIL • Rok: 2024", p: 10, cert: false },
                      ].map((a) => (
                        <div key={a.t} className="rounded-3xl border border-slate-200 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">{a.t}</div>
                              <div className="mt-1 text-sm text-slate-600">{a.m}</div>
                              <div className="mt-2 text-xs text-slate-500">
                                {a.cert ? "📎 certyfikat podpięty" : "brak certyfikatu"}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                              <span className="text-slate-600">pkt</span>{" "}
                              <span className="font-semibold text-slate-900">{a.p}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Link
                        href="/activities"
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Dodaj aktywność
                      </Link>
                      <Link
                        href="/portfolio"
                        className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50/50"
                      >
                        Otwórz portfolio
                      </Link>
                    </div>

                    <div className="mt-4 text-xs text-slate-500">
                      To jest podgląd UI. Realne dane zobaczysz po zalogowaniu.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FeatureGrid />
        <BottomCTA />
      </>
    );
  }

  // =========================
  // ZALOGOWANY: CENTRUM
  // =========================
  return (
    <>
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/60 via-white to-white" />

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
                Status w okresie + szybkie przejścia do dziennika i portfolio.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium">{userEmail}</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">Okres rozliczeniowy</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{checking ? "…" : periodLabel}</div>
              <div className="mt-4">
                <Link
                  href="/profil"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
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
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progressPct}%` }} />
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
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  + Dodaj aktywność
                </Link>

                <Link
                  href="/portfolio"
                  className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
                >
                  Otwórz portfolio
                </Link>

                <Link
                  href="/kalkulator"
                  className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
                >
                  Kalkulator
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
