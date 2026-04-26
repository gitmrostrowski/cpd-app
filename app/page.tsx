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
            className="group rounded-2xl border border-slate-200 bg-white px-4 md:px-5 shadow-sm transition-shadow hover:shadow-md"
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

      if (!user) {
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }

      setIsLoggedIn(true);

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

      router.replace("/kalkulator");
    }

    run();

    return () => {
      alive = false;
    };
  }, [router, supabase]);

  if (checking) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-slate-700">
          Sprawdzam sesję…
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-slate-700">
          Przenoszę do Centrum…
        </div>
      </div>
    );
  }

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

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 md:pt-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
            {/* LEWA */}
            <div className="lg:col-span-7">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
                Twój rozwój i kwalifikacje
                <br />
                <span className="font-bold text-blue-700">w jednym miejscu.</span>
              </h1>

              <p className="mt-5 max-w-prose text-lg leading-relaxed text-slate-600">
                Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w
                aktualnym okresie rozliczeniowym. Prosto. Spokojnie. Bez Excela.
                <span className="mt-2 block text-blue-600">
                  Platforma umożliwia monitorowanie aktywności edukacyjnej i
                  postępów uczestników oraz wspiera organizacje w zarządzaniu
                  procesem edukacyjnym i obowiązkami regulacyjnymi
                </span>
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
                  {
                    t: "Porządek bez wysiłku",
                    d: "Wpisy i certyfikaty masz w jednym miejscu — zawsze pod ręką.",
                  },
                  {
                    t: "Jasny status punktów",
                    d: "Wiesz, ile masz i czego brakuje w aktualnym okresie.",
                  },
                  {
                    t: "Bezpieczne dane",
                    d: "Dostęp masz tylko Ty. Dane są przechowywane w UE.",
                  },
                  {
                    t: "Start za darmo",
                    d: "Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO: eksport PDF i przypomnienia.",
                  },
                ].map((x) => (
                  <div
                    key={x.t}
                    className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-md transition-shadow hover:shadow-lg"
                  >
                    <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      {x.t}
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-600">
                      {x.d}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Wkrótce: Inteligentny asystent AI do tworzenia i zarządzania
                Twoim rozwojem zawodowym
              </div>
            </div>

            {/* PRAWA */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-[520px]">
                <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-b from-blue-100/50 to-white blur-2xl" />

                <div className="relative rounded-[28px] border border-slate-200/80 bg-white/70 p-5 shadow-md backdrop-blur transition-shadow hover:shadow-lg">
                  <div className="text-sm font-semibold text-slate-900">
                    Podgląd statusu
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    To przykład. Po zalogowaniu zobaczysz swoje realne punkty i
                    wpisy.
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-slate-700">
                        Okres:{" "}
                        <span className="font-semibold text-slate-900">
                          {demoPeriod}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Cel:{" "}
                        <span className="font-semibold text-slate-700">
                          {demoRequired} pkt
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${demoPct}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                      <span>
                        Masz:{" "}
                        <span className="font-semibold text-slate-900">
                          {demoHave} pkt
                        </span>
                      </span>
                      <span>
                        Brakuje:{" "}
                        <span className="font-semibold text-slate-900">
                          {demoMissing} pkt
                        </span>
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      Zaloguj się, aby zobaczyć swój realny status.
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
                    <div className="relative aspect-[16/10] w-full">
                      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-200/40 blur-2xl" />
                      <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-200/35 blur-2xl" />

                      <Image
                        src="/crpe_home.jpg"
                        alt="CRPE — podgląd aplikacji"
                        fill
                        className="object-contain p-4"
                        priority
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs text-slate-500">Wkrótce (PRO)</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      Raport PDF i przypomnienia
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Eksport raportu do PDF oraz automatyczne przypomnienia o
                      brakujących punktach.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PROBLEM */}
          <div className="mt-12 rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-md md:p-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
              {/* LEWA */}
              <div className="lg:col-span-5">
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Z czym się dziś mierzysz?
                </h2>
                <p className="mt-2 text-slate-600">
                  Jeśli zbierasz punkty edukacyjne, łatwo o chaos — szczególnie
                  gdy wszystko jest porozrzucane po wielu miejscach.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "Wiesz, co masz — i gdzie to jest.",
                    "Widzisz postęp bez liczenia w Excelu.",
                    "Masz certyfikaty przypięte do aktywności.",
                  ].map((t) => (
                    <div
                      key={t}
                      className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        ✓
                      </span>
                      <span className="text-sm text-slate-700">{t}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50/70 to-white p-5 shadow-sm">
                  <div className="text-xs font-medium text-blue-800">
                    Najczęstszy scenariusz
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    „Dodam to później”. A potem brakuje certyfikatu albo nie
                    wiadomo, z którego roku był kurs.
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    CRPE pomaga to ogarnąć spokojnie.
                  </div>
                </div>
              </div>

              {/* PRAWA */}
              <div className="lg:col-span-7">
                <div className="relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm md:p-6">
                  <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
                  <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl" />

                  <div className="relative grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        t: "Certyfikaty w mailach",
                        d: "Trudno je znaleźć, gdy są potrzebne.",
                      },
                      {
                        t: "Zdjęcia w telefonie",
                        d: "Nie wiesz, co było do czego i z którego roku.",
                      },
                      {
                        t: "Excel i notatki",
                        d: "Wymaga pilnowania i łatwo o braki.",
                      },
                      {
                        t: "Brak pewności",
                        d: "Czy na pewno masz komplet punktów i dokumentów?",
                      },
                    ].map((x) => (
                      <div
                        key={x.t}
                        className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          {x.t}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {x.d}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-4 rounded-3xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">
                      CRPE porządkuje to za Ciebie
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Wpisy, certyfikaty i status punktów masz w jednym miejscu
                      — spokojnie i czytelnie.
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
        <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Jak to działa
            </h2>
            <p className="mt-2 text-slate-600">
              Trzy proste kroki. Bez długiego wdrożenia.
            </p>
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
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {x.n}
                </div>
                <div className="mt-3 text-base font-semibold text-slate-900">
                  {x.t}
                </div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">
                  {x.d}
                </div>
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
            <div className="h-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-md md:p-10">
              <h2 className="text-3xl font-extrabold text-slate-900">
                Co zyskujesz
              </h2>
              <p className="mt-2 text-slate-600">
                Bez komplikacji — po prostu porządek i jasny status.
              </p>

              <ul className="mt-6 space-y-3 text-slate-700">
                {[
                  "Historia wszystkich aktywności w jednym miejscu",
                  "Certyfikaty zawsze pod ręką (PDF / zdjęcia)",
                  "Przejrzysty podgląd zdobytych punktów",
                  "Gotowość do przygotowania raportu",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      ✓
                    </span>
                    <span className="text-sm leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-xs text-slate-500">Wkrótce (PRO)</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Eksport PDF i przypomnienia
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Raport PDF gotowy do wydruku oraz automatyczne przypomnienia o
                  brakach.
                </div>
              </div>
            </div>
          </div>

          {/* DLA KOGO */}
          <div className="lg:col-span-6">
            <div className="h-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-md md:p-10">
              <h2 className="text-3xl font-extrabold text-slate-900">
                Dla kogo jest CRPE
              </h2>
              <p className="mt-2 text-slate-600">
                Dla wszystkich zawodów medycznych, które zbierają punkty
                edukacyjne i chcą mieć porządek w dokumentach.
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
                  <div
                    key={t}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
                  >
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

          {/* FAQ */}
          <div className="lg:col-span-12">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-md md:p-10">
              <h2 className="text-3xl font-extrabold text-slate-900">FAQ</h2>
              <p className="mt-2 text-slate-600">
                Najczęstsze pytania. Kliknij, aby rozwinąć odpowiedź.
              </p>

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
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Camera,
  Check,
  ClipboardCheck,
  FileText,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  HeartPulse,
  Mail,
  Minus,
  Pill,
  Plus,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  UploadCloud,
  UserCog,
  UserRoundCheck,
  Users,
} from "lucide-react";

import FeatureGrid from "@/components/FeatureGrid";
import BottomCTA from "@/components/BottomCTA";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

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

const ICON_XL = "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl";
const ICON_XL_I = "h-8 w-8";
const ICON_LG = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl";
const ICON_LG_I = "h-6 w-6";

const heroBullets = [
  { t: "Wpisy i certyfikaty w jednym miejscu", icon: FolderOpen, iconBg: "bg-blue-50", color: "text-blue-600" },
  { t: "Jasny status punktów w aktualnym okresie", icon: BarChart3, iconBg: "bg-amber-50", color: "text-amber-500" },
  { t: "Dane bezpieczne, przechowywane w UE", icon: ShieldCheck, iconBg: "bg-slate-100", color: "text-slate-500" },
  { t: "Podstawowe funkcje całkowicie bezpłatne", icon: Sparkles, iconBg: "bg-indigo-50", color: "text-indigo-500" },
];

const problemCards = [
  { t: "Certyfikaty w mailach", d: "Trudno je znaleźć, gdy są potrzebne.", icon: Mail, iconBg: "bg-blue-50", color: "text-blue-600" },
  { t: "Zdjęcia w telefonie", d: "Nie wiesz, co było do czego i z którego roku.", icon: Camera, iconBg: "bg-amber-50", color: "text-amber-500" },
  { t: "Excel i notatki", d: "Wymaga pilnowania i łatwo o braki.", icon: FileText, iconBg: "bg-indigo-50", color: "text-indigo-500" },
  { t: "Brak pewności", d: "Czy na pewno masz komplet punktów i dokumentów?", icon: ClipboardCheck, iconBg: "bg-slate-100", color: "text-slate-500" },
];

const benefits = [
  { t: "Historia wszystkich aktywności w jednym miejscu", icon: BookOpen, iconBg: "bg-blue-50", color: "text-blue-600" },
  { t: "Certyfikaty zawsze pod ręką (PDF / zdjęcia)", icon: Award, iconBg: "bg-amber-50", color: "text-amber-500" },
  { t: "Przejrzysty podgląd zdobytych punktów", icon: BarChart3, iconBg: "bg-slate-100", color: "text-slate-500" },
  { t: "Gotowość do przygotowania raportu", icon: CalendarCheck, iconBg: "bg-indigo-50", color: "text-indigo-500" },
];

const professions = [
  { t: "Lekarze i lekarze dentyści", icon: Stethoscope },
  { t: "Pielęgniarki i położne", icon: HeartPulse },
  { t: "Fizjoterapeuci", icon: UserCog },
  { t: "Farmaceuci", icon: Pill },
  { t: "Diagności laboratoryjni", icon: FlaskConical },
  { t: "Nowe zawody medyczne", icon: Users },
];

const izby = [
  "Naczelna Izba Lekarska",
  "Naczelna Izba Pielęgniarek i Położnych",
  "Krajowa Izba Fizjoterapeutów",
  "Naczelna Izba Aptekarska",
  "Krajowa Izba Diagnostów Laboratoryjnych",
];

const demoEntries = [
  { name: "Konferencja kardiologiczna", pts: 20, cat: "Konferencja", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
  { name: "Kurs e-learning EKG", pts: 15, cat: "E-learning", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
];

const FAQ_ITEMS = [
  { q: "Czy CRPE jest połączone z systemami państwowymi?", a: "Nie. CRPE służy do Twojej kontroli i uporządkowania danych. Systemy państwowe są zamknięte." },
  { q: "Czy moje certyfikaty są bezpieczne?", a: "Tak. Dane są zabezpieczone, a dostęp do nich masz tylko Ty. Przechowujemy dane w UE." },
  { q: "Czy mogę korzystać z telefonu?", a: "Tak. Możesz dodać certyfikat od razu po szkoleniu — nawet jako zdjęcie z telefonu." },
  { q: "Czy korzystanie jest darmowe?", a: "Tak. Podstawowe funkcje są bezpłatne. Wkrótce pojawią się opcje PRO (PDF, przypomnienia)." },
];

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (started.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;

        started.current = true;
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);

          setValue(Math.round(eased * target));

          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-6xl px-4 ${className}`}>
      <div className="overflow-hidden rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-12 md:py-12">
        {children}
      </div>
    </div>
  );
}

function BtnPrimary({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
    >
      {children}
    </Link>
  );
}

function BtnSecondary({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
    >
      {children}
    </Link>
  );
}

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const isOpen = open === i;

        return (
          <div
            key={item.q}
            className={`rounded-2xl border transition-all ${
              isOpen
                ? "border-blue-200 bg-white shadow-sm"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-slate-900">
                {item.q}
              </span>

              <span
                className={`ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isOpen
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                {isOpen ? (
                  <Minus className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.5} />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />
                )}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-2 text-sm leading-relaxed text-slate-700">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  target,
  label,
  color = "text-slate-900",
}: {
  target: number;
  label: string;
  color?: string;
}) {
  const { value, ref } = useCounter(target);

  return (
    <div className="py-3 text-center">
      <span
        ref={ref}
        className={`${jakarta.className} text-xl font-extrabold tabular-nums tracking-tight ${color}`}
      >
        {value}
      </span>
      <div className="text-xs text-slate-500">{label}</div>
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
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }

      const user = auth?.user ?? null;

      if (!user) {
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, profession, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle<ProfileRow>();

      if (!alive) return;

      if (profErr) console.warn("profiles error:", profErr.message);

      router.replace(profile ? "/kalkulator" : "/start");
    }

    run();

    return () => {
      alive = false;
    };
  }, [router, supabase]);

  if (checking) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-slate-700">
          Sprawdzam sesję…
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-slate-700">
          Przenoszę do Centrum…
        </div>
      </div>
    );
  }

  const demoRequired = 200;
  const demoHave = 110;
  const demoPct = clamp((demoHave / demoRequired) * 100, 0, 100);
  const demoMissing = Math.max(0, demoRequired - demoHave);

  return (
    <div className="bg-slate-100 pb-6">
      <SectionCard className="pt-3">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Platforma dla zawodów medycznych
            </div>

            <h1
              className={`${jakarta.className} max-w-[560px] text-[44px] font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-950 md:text-[52px] lg:text-[56px]`}
            >
              Punkty CPD pod kontrolą.
              <br />
              <span className="text-blue-700">Prosto i bez stresu.</span>
            </h1>

            <p className="mt-5 max-w-[540px] text-[17px] leading-8 text-slate-700">
              Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp
              w aktualnym okresie rozliczeniowym.{" "}
              <strong className="font-semibold text-slate-900">
                Bez Excela. Spokojnie.
              </strong>
            </p>

            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {heroBullets.map((b) => {
                const Icon = b.icon;

                return (
                  <div
                    key={b.t}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${b.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${b.color}`} strokeWidth={2} />
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {b.t}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Załóż darmowe konto <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#jak-to-dziala"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Zobacz jak to działa
              </a>
            </div>

            <p className="mt-2 text-center text-xs text-slate-400 sm:text-left">
              Bezpłatnie · bez karty kredytowej · 2 minuty
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex -space-x-1">
                {["MK", "AT", "JP"].map((i) => (
                  <span
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[10px] font-bold text-blue-700"
                  >
                    {i}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <span className="text-sm text-slate-600">
                  Używają specjaliści medyczni z całej Polski
                </span>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-sm font-medium text-indigo-700">
              <Sparkles
                className="h-4 w-4 shrink-0 text-indigo-500"
                strokeWidth={1.75}
              />
              Wkrótce: Asystent AI do zarządzania rozwojem zawodowym
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm">
              <Image
                src="/crpe_reka2b.png"
                alt="Mockup panelu CPD"
                width={900}
                height={430}
                priority
                className="w-full object-cover"
                style={{ objectPosition: "center center", height: "270px" }}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Podgląd statusu
              </p>

              <p className="text-base font-bold text-slate-900">
                Aktualny okres rozliczeniowy
              </p>

              <p className="mb-5 mt-0.5 text-sm text-slate-500">
                To przykład. Po zalogowaniu zobaczysz swoje realne dane.
              </p>

              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Postęp w okresie</span>
                <span className="font-bold text-slate-800">
                  {Math.round(demoPct)}%
                </span>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-blue-600"
                  style={{ width: `${demoPct}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50">
                <StatCard target={demoHave} label="Masz (pkt)" />
                <StatCard target={demoRequired} label="Cel (pkt)" />
                <StatCard
                  target={demoMissing}
                  label="Brakuje (pkt)"
                  color="text-red-500"
                />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Ostatnie wpisy
                </p>

                <div className="space-y-2">
                  {demoEntries.map((e) => (
                    <div
                      key={e.name}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${e.dot}`} />
                      <span className="flex-1 text-sm font-medium text-slate-800">
                        {e.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.badge}`}
                      >
                        {e.cat}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        +{e.pts} pkt
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/login"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Zaloguj się, aby zobaczyć swój status{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="overflow-hidden rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200/60">
          <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Platforma wspiera zawody regulowane przez
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {izby.map((nazwa) => (
              <span
                key={nazwa}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                {nazwa}
              </span>
            ))}
          </div>
        </div>
      </div>

      <SectionCard className="mt-4">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <Eyebrow>Rozwiązanie</Eyebrow>

            <h2 className="text-2xl font-bold text-slate-900">
              Z czym się dziś mierzysz?
            </h2>

            <p className="mt-2 text-base leading-relaxed text-slate-600">
              Jeśli zbierasz punkty edukacyjne, łatwo o chaos — szczególnie gdy
              wszystko jest porozrzucane po wielu miejscach.
            </p>

            <div className="mt-5 space-y-2">
              {[
                "Wiesz, co masz — i gdzie to jest.",
                "Widzisz postęp bez liczenia w Excelu.",
                "Masz certyfikaty przypięte do aktywności.",
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{t}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
                Najczęstszy scenariusz
              </p>
              <p className="text-sm leading-relaxed text-slate-700">
                „Dodam to później.” A potem brakuje certyfikatu albo nie wiadomo,
                z którego roku był kurs.
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                CRPE pomaga to ogarnąć spokojnie.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {problemCards.map((x) => {
                const Icon = x.icon;

                return (
                  <div
                    key={x.t}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    <span className={`mb-3 ${ICON_LG} ${x.iconBg}`}>
                      <Icon
                        className={`${ICON_LG_I} ${x.color}`}
                        strokeWidth={1.75}
                      />
                    </span>
                    <div className="text-sm font-semibold text-slate-900">
                      {x.t}
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-600">
                      {x.d}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <span className={`${ICON_LG} shrink-0 bg-blue-100`}>
                <GraduationCap
                  className={`${ICON_LG_I} text-blue-600`}
                  strokeWidth={1.75}
                />
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  CRPE porządkuje to za Ciebie
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Wpisy, certyfikaty i status punktów w jednym miejscu — spokojnie
                  i czytelnie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="mt-4">
        <div id="jak-to-dziala">
          <Eyebrow>Proces</Eyebrow>

          <h2 className="text-2xl font-bold text-slate-900">Jak to działa</h2>

          <p className="mt-1 text-base text-slate-600">
            Trzy proste kroki. Bez długiego wdrożenia.
          </p>

          <div className="mt-8 flex flex-col gap-0">
            <div className="flex gap-5 pb-8">
              <div className="flex shrink-0 flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  1
                </span>
                <div className="mt-1.5 w-px flex-1 bg-slate-200" />
              </div>

              <div className="flex-1 pt-1">
                <p className="text-base font-semibold text-slate-900">
                  Wybierz zawód
                </p>
                <p className="mb-3 mt-1 text-sm leading-relaxed text-slate-600">
                  System ustawi odpowiednie wymagania i pomoże śledzić postęp w
                  aktualnym okresie.
                </p>

                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <svg
                    width="72"
                    height="56"
                    viewBox="0 0 72 56"
                    fill="none"
                    className="shrink-0"
                  >
                    <rect x="4" y="8" width="64" height="40" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <circle cx="22" cy="28" r="10" fill="#bfdbfe" />
                    <circle cx="22" cy="22" r="4" fill="#93c5fd" />
                    <path d="M13 36c0-5 4-8 9-8s9 3 9 8" fill="#93c5fd" />
                    <rect x="37" y="20" width="22" height="3" rx="1.5" fill="#93c5fd" />
                    <rect x="37" y="26" width="16" height="3" rx="1.5" fill="#bfdbfe" />
                    <rect x="37" y="32" width="19" height="3" rx="1.5" fill="#bfdbfe" />
                  </svg>

                  <div className="flex flex-wrap gap-2">
                    {["Lekarz", "Pielęgniarka", "Fizjoterapeuta", "Farmaceuta", "+ więcej"].map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-slate-200 bg-white px-3 py-0.5 text-xs font-medium text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-5 pb-8">
              <div className="flex shrink-0 flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  2
                </span>
                <div className="mt-1.5 w-px flex-1 bg-slate-200" />
              </div>

              <div className="flex-1 pt-1">
                <p className="text-base font-semibold text-slate-900">
                  Dodaj aktywność
                </p>
                <p className="mb-3 mt-1 text-sm leading-relaxed text-slate-600">
                  Wpisz nazwę szkolenia i dołącz certyfikat — nawet zdjęcie z
                  telefonu.
                </p>

                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <svg
                    width="72"
                    height="56"
                    viewBox="0 0 72 56"
                    fill="none"
                    className="shrink-0"
                  >
                    <rect x="4" y="4" width="28" height="38" rx="5" fill="#fefce8" stroke="#fde68a" strokeWidth="1" />
                    <rect x="8" y="10" width="20" height="2.5" rx="1.25" fill="#fde68a" />
                    <rect x="8" y="15" width="15" height="2.5" rx="1.25" fill="#fde68a" />
                    <rect x="8" y="20" width="17" height="2.5" rx="1.25" fill="#fde68a" />
                    <rect x="8" y="30" width="20" height="7" rx="3" fill="#fbbf24" opacity="0.35" />
                    <path d="M13 33.5l2.5 2.5 4-4" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="42" y="8" width="26" height="34" rx="5" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
                    <path d="M55 18v-5" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M52 16l3-3 3 3" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <rect x="47" y="26" width="16" height="2" rx="1" fill="#86efac" />
                    <rect x="47" y="30" width="12" height="2" rx="1" fill="#bbf7d0" />
                    <rect x="47" y="34" width="14" height="2" rx="1" fill="#bbf7d0" />
                  </svg>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Konferencja kardiologiczna
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Certyfikat.pdf dołączony
                    </p>
                    <span className="mt-1.5 inline-block text-sm font-bold text-green-600">
                      +20 pkt
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="flex shrink-0 flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  3
                </span>
              </div>

              <div className="flex-1 pt-1">
                <p className="text-base font-semibold text-slate-900">
                  Sprawdzaj postęp
                </p>
                <p className="mb-3 mt-1 text-sm leading-relaxed text-slate-600">
                  Zawsze wiesz, ile punktów masz i czego brakuje.
                </p>

                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <svg
                    width="72"
                    height="56"
                    viewBox="0 0 72 56"
                    fill="none"
                    className="shrink-0"
                  >
                    <rect x="4" y="4" width="64" height="48" rx="8" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
                    <rect x="10" y="13" width="52" height="7" rx="3.5" fill="#dcfce7" />
                    <rect x="10" y="13" width="32" height="7" rx="3.5" fill="#4ade80" />
                    <text x="58" y="20" fontSize="7" fill="#15803d" fontWeight="600" fontFamily="system-ui">55%</text>
                    <rect x="10" y="26" width="15" height="15" rx="3" fill="#dcfce7" />
                    <text x="17.5" y="36" textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="700" fontFamily="system-ui">110</text>
                    <text x="17.5" y="46" textAnchor="middle" fontSize="6" fill="#64748b" fontFamily="system-ui">masz</text>
                    <rect x="28" y="26" width="15" height="15" rx="3" fill="#dcfce7" />
                    <text x="35.5" y="36" textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="700" fontFamily="system-ui">200</text>
                    <text x="35.5" y="46" textAnchor="middle" fontSize="6" fill="#64748b" fontFamily="system-ui">cel</text>
                    <rect x="46" y="26" width="18" height="15" rx="3" fill="#fee2e2" />
                    <text x="55" y="36" textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="700" fontFamily="system-ui">90</text>
                    <text x="55" y="46" textAnchor="middle" fontSize="6" fill="#64748b" fontFamily="system-ui">brakuje</text>
                  </svg>

                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                      <span>Postęp w okresie</span>
                      <span className="font-semibold text-slate-800">55%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: "55%" }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-xs">
                      <span className="text-slate-500">110 / 200 pkt</span>
                      <span className="font-medium text-red-500">
                        brakuje 90 pkt
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <BtnPrimary href="/login">
              Zacznij za darmo <ArrowRight className="h-4 w-4" />
            </BtnPrimary>
            <BtnSecondary href="/rejestracja">Utwórz konto</BtnSecondary>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="mt-4">
        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:gap-8 md:text-left">
          <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 md:mb-0">
            AK
          </div>

          <div>
            <Quote className="mb-2 h-6 w-6 text-blue-200" strokeWidth={1.5} />

            <p className="text-base leading-relaxed text-slate-700 md:text-lg">
              „Wcześniej trzymałam wszystko w Excelu i modliłam się żeby nie
              zgubić certyfikatów. Teraz dodaję wpis od razu po szkoleniu — z
              telefonem. Przed audytem mam wszystko gotowe w kilka minut, a nie
              w kilka godzin.”
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <span className="text-sm font-semibold text-slate-900">
                Anna K.
              </span>
              <span className="text-sm text-slate-500">
                Pielęgniarka, Kraków
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-10">
            <Eyebrow>Wartość</Eyebrow>

            <h2 className="text-2xl font-bold text-slate-900">Co zyskujesz</h2>

            <p className="mt-1 text-base text-slate-600">
              Bez komplikacji — po prostu porządek i jasny status.
            </p>

            <ul className="mt-6 space-y-2">
              {benefits.map(({ t, icon: Icon, iconBg, color }) => (
                <li
                  key={t}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3"
                >
                  <span className={`${ICON_LG} ${iconBg}`}>
                    <Icon className={`${ICON_LG_I} ${color}`} strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <span className={`${ICON_LG} shrink-0 bg-amber-100`}>
                <FileText
                  className={`${ICON_LG_I} text-amber-600`}
                  strokeWidth={1.75}
                />
              </span>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                  Wkrótce — PRO
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  Eksport PDF i przypomnienia
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Raport PDF gotowy do wydruku oraz automatyczne przypomnienia o
                  brakach punktowych.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-10">
            <Eyebrow>Odbiorcy</Eyebrow>

            <h2 className="text-2xl font-bold text-slate-900">
              Dla kogo jest CRPE
            </h2>

            <p className="mt-1 text-base text-slate-600">
              Dla wszystkich zawodów medycznych zbierających punkty edukacyjne.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {professions.map(({ t, icon: Icon }) => (
                <div
                  key={t}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3"
                >
                  <span
                    className={`${ICON_LG} shrink-0`}
                    style={{ background: "#f0fdfa" }}
                  >
                    <Icon
                      className={ICON_LG_I}
                      style={{ color: "#14b8a6" }}
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{t}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Jeśli musisz zbierać punkty — CRPE jest dla Ciebie.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Zacznij od kilku wpisów. Resztę możesz uzupełniać stopniowo.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SectionCard className="mt-4">
        <div className="mx-auto max-w-2xl">
          <Eyebrow>FAQ</Eyebrow>

          <h2 className="text-2xl font-bold text-slate-900">
            Najczęstsze pytania
          </h2>

          <p className="mt-1 text-base text-slate-600">
            Kliknij pytanie, aby zobaczyć odpowiedź.
          </p>

          <div className="mt-7">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <BtnPrimary href="/login">
              Załóż darmowe konto <ArrowRight className="h-4 w-4" />
            </BtnPrimary>
            <BtnSecondary href="/rejestracja">Utwórz konto</BtnSecondary>
          </div>
        </div>
      </SectionCard>

      <FeatureGrid />
      <BottomCTA />
    </div>
  );
}
