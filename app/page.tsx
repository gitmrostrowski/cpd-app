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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Page() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      setChecking(true);

      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!alive) return;

      if (authError) {
        console.error(authError);
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }

      const user = auth?.user ?? null;

      // niezalogowany -> landing
      if (!user) {
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }

      setIsLoggedIn(true);

      // sprawdź profil (bramka do onboardingu)
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, profession, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (profErr) console.warn("profiles error:", profErr.message);

      // brak profilu -> onboarding
      if (!profile) {
        router.replace("/start");
        return;
      }

      // profil jest -> centrum
      router.replace("/kalkulator");
    }

    run();

    return () => {
      alive = false;
    };
  }, [router, supabase]);

  // =========================
  // W TRAKCIE SPRAWDZANIA SESJI
  // =========================
  // (opcjonalny stan – żeby nie "mignęło" UI)
  if (checking) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-slate-700">Sprawdzam sesję…</div>
      </div>
    );
  }

  // =========================
  // ZALOGOWANY -> i tak redirect
  // =========================
  // Ten return jest tylko awaryjny (np. gdy router jeszcze nie zdążył zrobić replace)
  if (isLoggedIn) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-slate-700">Przenoszę do Kalkulatora…</div>
      </div>
    );
  }

  // =========================
  // LANDING (NIEZALOGOWANY)
  // =========================
  const demoPeriod = "2023–2026";
  const demoRequired = 200;
  const demoHave = 110;
  const demoPct = clamp((demoHave / demoRequired) * 100, 0, 100);
  const demoMissing = Math.max(0, demoRequired - demoHave);

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
                Dodajesz aktywność, podpinasz dowód i widzisz status w okresie rozliczeniowym. Prosto, czytelnie i “do
                obrony” w razie audytu.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Załóż konto / Zaloguj się
                </Link>

                {/* Zostawiamy: “kalkulator” jako centrum (po zalogowaniu) */}
                <Link
                  href="/kalkulator"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
                >
                  Zobacz Kalkulator (centrum)
                </Link>
              </div>

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

            {/* PRAWA */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-[520px]">
                <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-b from-blue-100/50 to-white blur-2xl" />

                <div className="relative rounded-[28px] border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
                  <div className="text-sm font-semibold text-slate-900">Status w okresie</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Tak wygląda podgląd. Po zalogowaniu zobaczysz swoje realne punkty.
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-slate-700">
                        Okres: <span className="font-semibold text-slate-900">{demoPeriod}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Cel: <span className="font-semibold text-slate-700">{demoRequired} pkt</span>
                      </div>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${demoPct}%` }} />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                      <span>
                        Masz: <span className="font-semibold text-slate-900">{demoHave} pkt</span>
                      </span>
                      <span>
                        Brakuje: <span className="font-semibold text-slate-900">{demoMissing} pkt</span>
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">Zaloguj się, aby zobaczyć swój realny status.</div>
                  </div>

                  <div className="mt-4 relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <Image
                      src="/illustration.svg"
                      alt="Ilustracja CRPE"
                      fill
                      className="object-contain p-4"
                      priority
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs text-slate-500">Wkrótce</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Webinary / baza szkoleń</div>
                    <div className="mt-1 text-sm text-slate-600">Możliwość dodania modułu z ofertami i zapisami.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                  { t: "Zobacz status", d: "Kalkulator (centrum) liczy punkty w Twoim okresie i pokazuje braki." },
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
                  Zobacz Kalkulator (centrum)
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Podgląd widoku</div>
                    <div className="text-xs text-slate-500">Kalkulator (centrum) / status w okresie</div>
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
