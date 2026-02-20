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

const FAQ_ITEMS = [
  {
    q: "Czy CRPE jest połączone z systemami państwowymi?",
    a: "Nie. CRPE służy do Twojej kontroli i uporządkowania danych. Systemy państwowe są zamknięte.",
  },
  {
    q: "Czy moje certyfikaty są bezpieczne?",
    a: "Tak. Dane są zabezpieczone, a dostęp do nich masz tylko Ty. Przechowujemy dane w UE.",
  },
  {
    q: "Czy mogę korzystać z telefonu?",
    a: "Tak. Możesz dodać certyfikat od razu po szkoleniu — nawet jako zdjęcie z telefonu.",
  },
  {
    q: "Czy korzystanie jest darmowe?",
    a: "Tak. Podstawowe funkcje są bezpłatne. Wkrótce pojawią się opcje PRO (PDF, przypomnienia).",
  },
];

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 md:p-3">
      <div className="space-y-2">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-slate-200 bg-white px-4 md:px-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-left text-sm font-semibold text-slate-900">
              <span>{item.q}</span>

              <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                <svg
                  className="h-4 w-4 text-slate-500 transition-transform duration-200 group-open:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </summary>

            <div className="pb-4 pt-0 text-sm leading-relaxed text-slate-600">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
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
  if (checking) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-slate-700">
          Sprawdzam sesję…
        </div>
      </div>
    );
  }

  // =========================
  // ZALOGOWANY -> i tak redirect
  // =========================
  if (isLoggedIn) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-slate-700">
          Przenoszę do Centrum…
        </div>
      </div>
    );
  }

  // =========================
  // LANDING (NIEZALOGOWANY)
  // =========================
  const demoPeriod = "Aktualny okres rozliczeniowy";
  const demoRequired = 200;
  const demoHave = 110;
  const demoPct = clamp((demoHave / demoRequired) * 100, 0, 100);
  const demoMissing = Math.max(0, demoRequired - demoHave);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-white" />
        <div className="pointer-events-none absolute left-[-10%] top-[-25%] h-[34rem] w-[34rem] rounded-full bg-blue-200/35 blur-3xl" />
        <div className="pointer-events-none absolute right-[-12%] top-[5%] h-[28rem] w-[28rem] rounded-full bg-indigo-200/25 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* LEWA */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                CRPE — Twoje punkty i certyfikaty w jednym miejscu
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
                Twoje punkty edukacyjne
                <br />
                <span className="text-blue-700">w jednym miejscu.</span>
              </h1>

              <p className="mt-5 max-w-prose text-lg leading-relaxed text-slate-600">
                Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w aktualnym okresie rozliczeniowym.
                Prosto. Spokojnie. Bez Excela.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Załóż darmowe konto
                </Link>

                <a
                  href="#jak-to-dziala"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
                >
                  Zobacz jak to działa
                </a>
              </div>

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {[
                  { t: "Porządek bez wysiłku", d: "Wpisy i certyfikaty masz w jednym miejscu — zawsze pod ręką." },
                  { t: "Jasny status punktów", d: "Wiesz, ile masz i czego brakuje w aktualnym okresie." },
                  { t: "Bezpieczne dane", d: "Dostęp masz tylko Ty. Dane są przechowywane w UE." },
                  {
                    t: "Start za darmo",
                    d: "Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO: eksport PDF i przypomnienia.",
                  },
                ].map((x) => (
                  <div
                    key={x.t}
                    className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      {x.t}
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRAWA */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-[520px]">
                <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-b from-blue-100/50 to-white blur-2xl" />

                <div className="relative rounded-[28px] border border-slate-200/80 bg-white/70 p-5 shadow-md backdrop-blur hover:shadow-lg transition-shadow">
                  <div className="text-sm font-semibold text-slate-900">Podgląd statusu</div>
                  <div className="mt-1 text-sm text-slate-600">
                    To przykład. Po zalogowaniu zobaczysz swoje realne punkty i wpisy.
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
                    <div className="text-xs text-slate-500">Wkrótce (PRO)</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Raport PDF i przypomnienia</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Eksport raportu do PDF oraz automatyczne przypomnienia o brakujących punktach.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PROBLEM */}
          <div className="mt-12 rounded-[32px] border border-slate-200/80 bg-white p-6 md:p-10 shadow-md">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
              {/* LEWA */}
              <div className="lg:col-span-5">
                <h2 className="text-2xl font-extrabold text-slate-900">Z czym się dziś mierzysz?</h2>
                <p className="mt-2 text-slate-600">
                  Jeśli zbierasz punkty edukacyjne, łatwo o chaos — szczególnie gdy wszystko jest porozrzucane po wielu
                  miejscach.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "Wiesz, co masz — i gdzie to jest.",
                    "Widzisz postęp bez liczenia w Excelu.",
                    "Masz certyfikaty przypięte do aktywności.",
                  ].map((t) => (
                    <div key={t} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        ✓
                      </span>
                      <span className="text-sm text-slate-700">{t}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50/70 to-white p-5 shadow-sm">
                  <div className="text-xs font-medium text-blue-800">Najczęstszy scenariusz</div>
                  <div className="mt-2 text-sm text-slate-700">
                    „Dodam to później”. A potem brakuje certyfikatu albo nie wiadomo, z którego roku był kurs.
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">CRPE pomaga to ogarnąć spokojnie.</div>
                </div>
              </div>

              {/* PRAWA */}
              <div className="lg:col-span-7">
                <div className="relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-5 md:p-6 shadow-sm">
                  <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
                  <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl" />

                  <div className="relative grid gap-3 sm:grid-cols-2">
                    {[
                      { t: "Certyfikaty w mailach", d: "Trudno je znaleźć, gdy są potrzebne." },
                      { t: "Zdjęcia w telefonie", d: "Nie wiesz, co było do czego i z którego roku." },
                      { t: "Excel i notatki", d: "Wymaga pilnowania i łatwo o braki." },
                      { t: "Brak pewności", d: "Czy na pewno masz komplet punktów i dokumentów?" },
                    ].map((x) => (
                      <div
                        key={x.t}
                        className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                        <div className="mt-1 text-sm text-slate-600">{x.d}</div>
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-4 rounded-3xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">CRPE porządkuje to za Ciebie</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Wpisy, certyfikaty i status punktów masz w jednym miejscu — spokojnie i czytelnie.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JAK TO DZIAŁA */}
      <section id="jak-to-dziala" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 md:p-10 shadow-sm">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold text-slate-900">Jak to działa</h2>
            <p className="mt-2 text-slate-600">Trzy proste kroki. Bez długiego wdrożenia.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "1",
                t: "Wybierz zawód",
                d: "System ustawi odpowiednie wymagania i pomoże śledzić postęp w aktualnym okresie.",
              },
              {
                n: "2",
                t: "Dodaj aktywność",
                d: "Wpisz nazwę szkolenia i dołącz certyfikat — nawet zdjęcie z telefonu.",
              },
              {
                n: "3",
                t: "Sprawdzaj postęp",
                d: "Zawsze wiesz, ile punktów masz i czego brakuje.",
              },
            ].map((x) => (
              <div
                key={x.t}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {x.n}
                </div>
                <div className="mt-3 text-base font-semibold text-slate-900">{x.t}</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Zacznij za darmo
            </Link>
            <Link
              href="/rejestracja"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50/50"
            >
              Utwórz konto
            </Link>
          </div>
        </div>
      </section>

      {/* KORZYŚCI + DLA KOGO + FAQ */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* KORZYŚCI */}
          <div className="lg:col-span-6">
            <div className="h-full rounded-[32px] border border-slate-200 bg-white p-6 md:p-10 shadow-md">
              <h2 className="text-3xl font-extrabold text-slate-900">Co zyskujesz</h2>
              <p className="mt-2 text-slate-600">Bez komplikacji — po prostu porządek i jasny status.</p>

              <ul className="mt-6 space-y-3 text-slate-700">
                {[
                  "Historia wszystkich aktywności w jednym miejscu",
                  "Certyfikaty zawsze pod ręką (PDF / zdjęcia)",
                  "Przejrzysty podgląd zdobytych punktów",
                  "Gotowość do przygotowania raportu",
                ].map((t) => (
                  <li key={t} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      ✓
                    </span>
                    <span className="text-sm leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-xs text-slate-500">Wkrótce (PRO)</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Eksport PDF i przypomnienia</div>
                <div className="mt-1 text-sm text-slate-600">
                  Raport PDF gotowy do wydruku oraz automatyczne przypomnienia o brakach.
                </div>
              </div>
            </div>
          </div>

          {/* DLA KOGO */}
          <div className="lg:col-span-6">
            <div className="h-full rounded-[32px] border border-slate-200 bg-white p-6 md:p-10 shadow-md">
              <h2 className="text-3xl font-extrabold text-slate-900">Dla kogo jest CRPE</h2>
              <p className="mt-2 text-slate-600">
                Dla wszystkich zawodów medycznych, które zbierają punkty edukacyjne i chcą mieć porządek w dokumentach.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Lekarze i lekarze dentyści",
                  "Pielęgniarki i położne",
                  "Fizjoterapeuci",
                  "Farmaceuci",
                  "Diagności laboratoryjni",
                  "Nowe zawody medyczne",
                ].map((t) => (
                  <div key={t} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {t}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50/60 p-5">
                <div className="text-sm font-semibold text-slate-900">
                  Jeśli musisz zbierać punkty — CRPE jest dla Ciebie.
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Zacznij od kilku wpisów. Resztę możesz uzupełniać stopniowo.
                </div>
              </div>
            </div>
          </div>

          {/* FAQ (bez Radix) */}
          <div className="lg:col-span-12">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 md:p-10 shadow-md">
              <h2 className="text-3xl font-extrabold text-slate-900">FAQ</h2>
              <p className="mt-2 text-slate-600">Najczęstsze pytania. Kliknij, aby rozwinąć odpowiedź.</p>

              <div className="mt-6">
                <FaqAccordion items={FAQ_ITEMS} />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Załóż darmowe konto
                </Link>
                <Link
                  href="/rejestracja"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
                >
                  Utwórz konto
                </Link>
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
