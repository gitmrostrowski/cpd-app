// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";
import {
  FolderCheck,
  SquareCheck,
  ShieldCheck,
  Rocket,
  BriefcaseMedical,
  FilePlus2,
  BarChart3,
  Stethoscope,
  Building2,
  FileText,
  Clock3,
} from "lucide-react";

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

const HERO_FEATURES = [
  {
    Icon: FolderCheck,
    t: "Porządek bez wysiłku",
    d: "Wpisy i certyfikaty masz w jednym miejscu — zawsze pod ręką.",
    iconBox: "bg-teal-50 text-teal-600 ring-teal-100",
  },
  {
    Icon: SquareCheck,
    t: "Jasny status punktów",
    d: "Wiesz, ile masz i czego brakuje w aktualnym okresie.",
    iconBox: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    Icon: ShieldCheck,
    t: "Bezpieczne dane",
    d: "Dostęp masz tylko Ty. Dane są przechowywane w UE.",
    iconBox: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    Icon: Rocket,
    t: "Start za darmo",
    d: "Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO: eksport PDF i przypomnienia.",
    iconBox: "bg-blue-50 text-blue-600 ring-blue-100",
  },
];

const TRUST_ITEMS = [
  {
    Icon: Stethoscope,
    t: "Dla zawodów medycznych",
    d: "Lekarze, pielęgniarki, fizjoterapeuci i inne profesje.",
  },
  {
    Icon: FileText,
    t: "Certyfikaty pod ręką",
    d: "Dokumenty przypięte do aktywności, nie porozrzucane po mailach.",
  },
  {
    Icon: Clock3,
    t: "Mniej ręcznej pracy",
    d: "Koniec z Excelem i liczeniem punktów na ostatnią chwilę.",
  },
  {
    Icon: Building2,
    t: "Także dla organizacji",
    d: "Przestrzeń pod szkolenia, uczestników i raportowanie.",
  },
];

const HOW_IT_WORKS = [
  {
    Icon: BriefcaseMedical,
    n: "1",
    t: "Wybierz zawód",
    d: "System ustawi odpowiednie wymagania i pomoże śledzić postęp w aktualnym okresie.",
  },
  {
    Icon: FilePlus2,
    n: "2",
    t: "Dodaj aktywność",
    d: "Wpisz nazwę szkolenia i dołącz certyfikat — nawet zdjęcie z telefonu.",
  },
  {
    Icon: BarChart3,
    n: "3",
    t: "Sprawdzaj postęp",
    d: "Zawsze wiesz, ile punktów masz i czego brakuje.",
  },
];

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 md:p-3">
      <div className="space-y-2">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition-shadow hover:shadow-md md:px-5"
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
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Twoja ścieżka. Twoje punkty. Twój rozwój.
              </div>

              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">
                Twój rozwój i kwalifikacje
                <br />
                <span className="font-bold text-blue-700">
                  w jednym miejscu.
                </span>
              </h1>

              <p className="mt-5 max-w-prose text-lg leading-relaxed text-slate-600">
                Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w
                aktualnym okresie rozliczeniowym. Prosto. Spokojnie. Bez Excela.
              </p>

              <div className="mt-5 flex max-w-prose gap-3 rounded-3xl border border-blue-100 bg-white/80 p-4 text-slate-700 shadow-sm">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-base leading-relaxed">
                  Platforma umożliwia monitorowanie aktywności edukacyjnej i
                  postępów uczestników oraz wspiera organizacje w zarządzaniu
                  procesem edukacyjnym i obowiązkami regulacyjnymi.
                </p>
              </div>

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
                {HERO_FEATURES.map(({ Icon, iconBox, ...x }) => (
                  <div
                    key={x.t}
                    className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-md transition-shadow hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${iconBox}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <div>
                        <div className="text-base font-semibold text-slate-900">
                          {x.t}
                        </div>
                        <div className="mt-1 text-sm leading-relaxed text-slate-600">
                          {x.d}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-slate-500" />
                Wkrótce: Inteligentny asystent AI do tworzenia i zarządzania
                Twoim rozwojem zawodowym
              </div>
            </div>

            {/* PRAWA */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-[520px]">
                <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-b from-blue-100/50 to-white blur-2xl" />

                <div className="relative rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-xl shadow-blue-950/5 backdrop-blur transition-shadow hover:shadow-2xl">
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
                    <div className="text-xs font-semibold text-blue-600">
                      Wkrótce (PRO)
                    </div>
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

          {/* TRUST STRIP */}
          <div className="mt-10 rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-md">
            <div className="grid gap-3 md:grid-cols-4">
              {TRUST_ITEMS.map(({ Icon, t, d }) => (
                <div key={t} className="flex gap-3 rounded-2xl p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {t}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-600">
                      {d}
                    </div>
                  </div>
                </div>
              ))}
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
      <section
        id="jak-to-dziala"
        className="mx-auto max-w-6xl px-4 py-12 md:py-16"
      >
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
            {HOW_IT_WORKS.map(({ Icon, ...x }) => (
              <div
                key={x.t}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {x.n}
                  </div>
                </div>

                <div className="mt-4 text-base font-semibold text-slate-900">
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
                <div className="text-xs font-semibold text-blue-600">
                  Wkrótce (PRO)
                </div>
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
