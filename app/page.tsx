"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";
import {
  BarChart3,
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  LockKeyhole,
  Mail,
  Camera,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRoundCheck,
  ArrowRight,
  Award,
  CalendarCheck,
  TrendingUp,
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
            <div className="pb-4 pt-0 text-sm leading-relaxed text-slate-700">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

/* ─── Icon accent colours ───────────────────────────────────────────────────
   Primary brand:       blue-600  (#2563eb)
   Warm complementary:  amber-500 (#f59e0b)
   Supporting:          teal-600, indigo-500
   ────────────────────────────────────────────────────────────────────────── */

const heroCards = [
  {
    t: "Porządek bez wysiłku",
    d: "Wpisy i certyfikaty masz w jednym miejscu — zawsze pod ręką.",
    icon: FolderOpen,
    iconBg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    t: "Jasny status punktów",
    d: "Wiesz, ile masz i czego brakuje w aktualnym okresie.",
    icon: BarChart3,
    iconBg: "bg-amber-50",
    color: "text-amber-500",
  },
  {
    t: "Bezpieczne dane",
    d: "Dostęp masz tylko Ty. Dane są przechowywane w UE.",
    icon: ShieldCheck,
    iconBg: "bg-teal-50",
    color: "text-teal-600",
  },
  {
    t: "Start za darmo",
    d: "Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO: eksport PDF i przypomnienia.",
    icon: Sparkles,
    iconBg: "bg-indigo-50",
    color: "text-indigo-500",
  },
];

const problemCards = [
  {
    t: "Certyfikaty w mailach",
    d: "Trudno je znaleźć, gdy są potrzebne.",
    icon: Mail,
    iconBg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    t: "Zdjęcia w telefonie",
    d: "Nie wiesz, co było do czego i z którego roku.",
    icon: Camera,
    iconBg: "bg-amber-50",
    color: "text-amber-500",
  },
  {
    t: "Excel i notatki",
    d: "Wymaga pilnowania i łatwo o braki.",
    icon: FileText,
    iconBg: "bg-indigo-50",
    color: "text-indigo-500",
  },
  {
    t: "Brak pewności",
    d: "Czy na pewno masz komplet punktów i dokumentów?",
    icon: ClipboardCheck,
    iconBg: "bg-teal-50",
    color: "text-teal-600",
  },
];

const steps = [
  {
    n: "1",
    t: "Wybierz zawód",
    d: "System ustawi odpowiednie wymagania i pomoże śledzić postęp w aktualnym okresie.",
    icon: UserRoundCheck,
    iconBg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    n: "2",
    t: "Dodaj aktywność",
    d: "Wpisz nazwę szkolenia i dołącz certyfikat — nawet zdjęcie z telefonu.",
    icon: UploadCloud,
    iconBg: "bg-amber-50",
    color: "text-amber-500",
  },
  {
    n: "3",
    t: "Sprawdzaj postęp",
    d: "Zawsze wiesz, ile punktów masz i czego brakuje.",
    icon: TrendingUp,
    iconBg: "bg-teal-50",
    color: "text-teal-600",
  },
];

const benefits = [
  { t: "Historia wszystkich aktywności w jednym miejscu", icon: BookOpen },
  { t: "Certyfikaty zawsze pod ręką (PDF / zdjęcia)", icon: Award },
  { t: "Przejrzysty podgląd zdobytych punktów", icon: BarChart3 },
  { t: "Gotowość do przygotowania raportu", icon: CalendarCheck },
];

const demoEntries = [
  {
    name: "Konferencja kardiologiczna",
    pts: 20,
    cat: "Konferencja",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700",
  },
  {
    name: "Kurs e-learning EKG",
    pts: 15,
    cat: "E-learning",
    dot: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700",
  },
  {
    name: "Szkolenie wewnętrzne",
    pts: 10,
    cat: "Szkolenie",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700",
  },
];

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
        .maybeSingle<ProfileRow>();

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
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white" />
        <div className="pointer-events-none absolute left-[-8%] top-[-20%] h-[32rem] w-[32rem] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute right-[-10%] top-[10%] h-[24rem] w-[24rem] rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 md:pt-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">

            {/* LEFT */}
            <div className="lg:col-span-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Platforma dla zawodów medycznych
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
                Twój rozwój i kwalifikacje
                <br />
                <span className="text-blue-600">w jednym miejscu.</span>
              </h1>

              <p className="mt-4 max-w-prose text-lg leading-relaxed text-slate-700">
                Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w
                aktualnym okresie rozliczeniowym.{" "}
                <span className="font-semibold text-slate-900">
                  Prosto. Spokojnie. Bez Excela.
                </span>
              </p>

              <p className="mt-3 max-w-prose text-base leading-relaxed text-blue-600">
                Platforma umożliwia monitorowanie aktywności edukacyjnej i postępów
                uczestników oraz wspiera organizacje w zarządzaniu procesem
                edukacyjnym i obowiązkami regulacyjnymi.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Załóż darmowe konto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#jak-to-dziala"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 transition hover:bg-blue-50/50"
                >
                  Zobacz jak to działa
                </a>
              </div>

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {heroCards.map((x) => {
                  const Icon = x.icon;
                  return (
                    <div
                      key={x.t}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${x.iconBg}`}>
                        <Icon className={`h-5 w-5 ${x.color}`} strokeWidth={1.75} />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                        <div className="mt-0.5 text-sm leading-relaxed text-slate-600">{x.d}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
                <Sparkles className="h-4 w-4 text-indigo-500" strokeWidth={1.75} />
                Wkrótce: Inteligentny asystent AI do tworzenia i zarządzania Twoim rozwojem zawodowym
              </div>
            </div>

            {/* RIGHT — status card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-[480px]">
                <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-b from-blue-100/40 to-white blur-2xl" />

                <div className="relative rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-lg">
                  <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Podgląd statusu
                  </div>
                  <div className="text-base font-semibold text-slate-900">{demoPeriod}</div>
                  <div className="mb-4 mt-0.5 text-sm text-slate-500">
                    To przykład. Po zalogowaniu zobaczysz swoje realne dane.
                  </div>

                  {/* progress */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                      <span>Postęp w okresie</span>
                      <span className="font-bold text-slate-800">{Math.round(demoPct)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                        style={{ width: `${demoPct}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-3 text-center text-sm">
                      <div>
                        <div className="font-bold text-slate-900">{demoHave} pkt</div>
                        <div className="text-slate-500">Masz</div>
                      </div>
                      <div className="border-x border-slate-200">
                        <div className="font-bold text-slate-900">{demoRequired} pkt</div>
                        <div className="text-slate-500">Cel</div>
                      </div>
                      <div>
                        <div className="font-bold text-red-500">{demoMissing} pkt</div>
                        <div className="text-slate-500">Brakuje</div>
                      </div>
                    </div>
                  </div>

                  {/* entries */}
                  <div className="mt-4">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Ostatnie wpisy
                    </div>
                    <div className="space-y-2">
                      {demoEntries.map((e) => (
                        <div
                          key={e.name}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                        >
                          <span className={`h-2 w-2 shrink-0 rounded-full ${e.dot}`} />
                          <span className="flex-1 text-sm font-medium text-slate-800">{e.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.badge}`}>
                            {e.cat}
                          </span>
                          <span className="text-sm font-bold text-blue-600">+{e.pts} pkt</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* screenshot */}
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                    <div className="relative aspect-[16/10] w-full">
                      <Image
                        src="/crpe_home.jpg"
                        alt="CRPE — podgląd aplikacji"
                        fill
                        className="object-contain p-4"
                        priority
                      />
                    </div>
                  </div>

                  {/* PRO */}
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      <FileText className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
                    </span>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                        Wkrótce — PRO
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-slate-900">
                        Raport PDF i przypomnienia
                      </div>
                      <div className="mt-0.5 text-sm text-slate-600">
                        Eksport raportu do PDF oraz automatyczne przypomnienia o brakujących punktach.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── PROBLEM ─────────────────────────────────────────────────────── */}
          <div className="mt-14 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm md:p-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
              <div className="lg:col-span-5">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Rozwiązanie
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Z czym się dziś mierzysz?
                </h2>
                <p className="mt-2 text-base leading-relaxed text-slate-600">
                  Jeśli zbierasz punkty edukacyjne, łatwo o chaos — szczególnie
                  gdy wszystko jest porozrzucane po wielu miejscach.
                </p>

                <div className="mt-5 space-y-2.5">
                  {[
                    "Wiesz, co masz — i gdzie to jest.",
                    "Widzisz postęp bez liczenia w Excelu.",
                    "Masz certyfikaty przypięte do aktywności.",
                  ].map((t) => (
                    <div
                      key={t}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                        <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                      </span>
                      <span className="text-sm font-medium text-slate-800">{t}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
                    Najczęstszy scenariusz
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">
                    „Dodam to później." A potem brakuje certyfikatu albo nie
                    wiadomo, z którego roku był kurs.
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    CRPE pomaga to ogarnąć spokojnie.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="relative h-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-5 md:p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {problemCards.map((x) => {
                      const Icon = x.icon;
                      return (
                        <div
                          key={x.t}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${x.iconBg}`}>
                            <Icon className={`h-5 w-5 ${x.color}`} strokeWidth={1.75} />
                          </span>
                          <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                          <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                      <GraduationCap className="h-4 w-4 text-teal-600" strokeWidth={1.75} />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        CRPE porządkuje to za Ciebie
                      </div>
                      <div className="mt-0.5 text-sm leading-relaxed text-slate-600">
                        Wpisy, certyfikaty i status punktów masz w jednym miejscu — spokojnie i czytelnie.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── JAK TO DZIAŁA ───────────────────────────────────────────────────── */}
      <section
        id="jak-to-dziala"
        className="mx-auto max-w-6xl px-4 py-12 md:py-16"
      >
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-10">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Proces
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Jak to działa</h2>
          <p className="mt-1 text-base text-slate-600">
            Trzy proste kroki. Bez długiego wdrożenia.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {steps.map((x) => {
              const Icon = x.icon;
              return (
                <div
                  key={x.t}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                      {x.n}
                    </span>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${x.iconBg}`}>
                      <Icon className={`h-5 w-5 ${x.color}`} strokeWidth={1.75} />
                    </span>
                  </div>
                  <div className="text-base font-semibold text-slate-900">{x.t}</div>
                  <div className="mt-1.5 text-sm leading-relaxed text-slate-600">{x.d}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Zacznij za darmo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/rejestracja"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-50/50"
            >
              Utwórz konto
            </Link>
          </div>
        </div>
      </section>

      {/* ── KORZYŚCI + DLA KOGO + FAQ ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="grid gap-6 lg:grid-cols-12">

          {/* KORZYŚCI */}
          <div className="lg:col-span-6">
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Wartość
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Co zyskujesz</h2>
              <p className="mt-1 text-base text-slate-600">
                Bez komplikacji — po prostu porządek i jasny status.
              </p>

              <ul className="mt-6 space-y-2.5">
                {benefits.map(({ t, icon: Icon }) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <Icon className="h-4 w-4 text-blue-600" strokeWidth={1.75} />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <FileText className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    Wkrótce — PRO
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-900">
                    Eksport PDF i przypomnienia
                  </div>
                  <div className="mt-0.5 text-sm text-slate-600">
                    Raport PDF gotowy do wydruku oraz automatyczne przypomnienia o brakach.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DLA KOGO */}
          <div className="lg:col-span-6">
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Odbiorcy
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Dla kogo jest CRPE
              </h2>
              <p className="mt-1 text-base text-slate-600">
                Dla wszystkich zawodów medycznych, które zbierają punkty
                edukacyjne i chcą mieć porządek w dokumentach.
              </p>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
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
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <GraduationCap className="h-4 w-4 text-blue-600" strokeWidth={1.75} />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{t}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                  <LockKeyhole className="h-4 w-4 text-teal-600" strokeWidth={1.75} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Jeśli musisz zbierać punkty — CRPE jest dla Ciebie.
                  </div>
                  <div className="mt-0.5 text-sm leading-relaxed text-slate-600">
                    Zacznij od kilku wpisów. Resztę możesz uzupełniać stopniowo.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="lg:col-span-12">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                FAQ
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Najczęstsze pytania
              </h2>
              <p className="mt-1 text-base text-slate-600">
                Kliknij, aby rozwinąć odpowiedź.
              </p>

              <div className="mt-6">
                <FaqAccordion items={FAQ_ITEMS} />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Załóż darmowe konto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/rejestracja"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 transition hover:bg-blue-50/50"
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
