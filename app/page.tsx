"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  LockKeyhole,
  Mail,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UploadCloud,
  UserCog,
  UserRoundCheck,
  Users,
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

/* ─── data ──────────────────────────────────────────────────────────────── */

const heroBullets = [
  { t: "Wpisy i certyfikaty w jednym miejscu",       icon: FolderOpen,  color: "text-blue-600"   },
  { t: "Jasny status punktów w aktualnym okresie",   icon: BarChart3,   color: "text-amber-500"  },
  { t: "Dane bezpieczne, przechowywane w UE",        icon: ShieldCheck, color: "text-teal-600"   },
  { t: "Podstawowe funkcje całkowicie bezpłatne",    icon: Sparkles,    color: "text-indigo-500" },
];

const problemCards = [
  { t: "Certyfikaty w mailach",  d: "Trudno je znaleźć, gdy są potrzebne.",             icon: Mail,          iconBg: "bg-blue-50",   color: "text-blue-600"   },
  { t: "Zdjęcia w telefonie",    d: "Nie wiesz, co było do czego i z którego roku.",    icon: Camera,        iconBg: "bg-amber-50",  color: "text-amber-500"  },
  { t: "Excel i notatki",        d: "Wymaga pilnowania i łatwo o braki.",               icon: FileText,      iconBg: "bg-indigo-50", color: "text-indigo-500" },
  { t: "Brak pewności",          d: "Czy na pewno masz komplet punktów i dokumentów?",  icon: ClipboardCheck,iconBg: "bg-teal-50",   color: "text-teal-600"   },
];

const steps = [
  { n: "1", t: "Wybierz zawód",    d: "System ustawi odpowiednie wymagania i pomoże śledzić postęp w aktualnym okresie.",  icon: UserRoundCheck, iconBg: "bg-blue-50",  color: "text-blue-600"  },
  { n: "2", t: "Dodaj aktywność",  d: "Wpisz nazwę szkolenia i dołącz certyfikat — nawet zdjęcie z telefonu.",            icon: UploadCloud,   iconBg: "bg-amber-50", color: "text-amber-500" },
  { n: "3", t: "Sprawdzaj postęp", d: "Zawsze wiesz, ile punktów masz i czego brakuje.",                                  icon: TrendingUp,    iconBg: "bg-teal-50",  color: "text-teal-600"  },
];

const benefits = [
  { t: "Historia wszystkich aktywności w jednym miejscu", icon: BookOpen,      iconBg: "bg-blue-50",   color: "text-blue-600"   },
  { t: "Certyfikaty zawsze pod ręką (PDF / zdjęcia)",     icon: Award,         iconBg: "bg-amber-50",  color: "text-amber-500"  },
  { t: "Przejrzysty podgląd zdobytych punktów",           icon: BarChart3,     iconBg: "bg-teal-50",   color: "text-teal-600"   },
  { t: "Gotowość do przygotowania raportu",               icon: CalendarCheck, iconBg: "bg-indigo-50", color: "text-indigo-500" },
];

const professions = [
  { t: "Lekarze i lekarze dentyści",  icon: Stethoscope,  iconBg: "bg-blue-50",   color: "text-blue-600"   },
  { t: "Pielęgniarki i położne",      icon: HeartPulse,   iconBg: "bg-teal-50",   color: "text-teal-600"   },
  { t: "Fizjoterapeuci",              icon: UserCog,      iconBg: "bg-amber-50",  color: "text-amber-500"  },
  { t: "Farmaceuci",                  icon: Pill,         iconBg: "bg-indigo-50", color: "text-indigo-500" },
  { t: "Diagności laboratoryjni",     icon: FlaskConical, iconBg: "bg-teal-50",   color: "text-teal-600"   },
  { t: "Nowe zawody medyczne",        icon: Users,        iconBg: "bg-blue-50",   color: "text-blue-600"   },
];

const demoEntries = [
  { name: "Konferencja kardiologiczna", pts: 20, cat: "Konferencja", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700"  },
  { name: "Kurs e-learning EKG",        pts: 15, cat: "E-learning",  dot: "bg-teal-500", badge: "bg-teal-50 text-teal-700"  },
];

const FAQ_ITEMS = [
  { q: "Czy CRPE jest połączone z systemami państwowymi?", a: "Nie. CRPE służy do Twojej kontroli i uporządkowania danych. Systemy państwowe są zamknięte."              },
  { q: "Czy moje certyfikaty są bezpieczne?",              a: "Tak. Dane są zabezpieczone, a dostęp do nich masz tylko Ty. Przechowujemy dane w UE."                     },
  { q: "Czy mogę korzystać z telefonu?",                   a: "Tak. Możesz dodać certyfikat od razu po szkoleniu — nawet jako zdjęcie z telefonu."                       },
  { q: "Czy korzystanie jest darmowe?",                    a: "Tak. Podstawowe funkcje są bezpłatne. Wkrótce pojawią się opcje PRO (PDF, przypomnienia)."                },
];

/* ─── shared primitives ─────────────────────────────────────────────────── */

/** Szara etykieta nad nagłówkiem sekcji */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

/** Biała karta-sekcja z cieniem — podstawowy kontener każdej sekcji */
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-6xl px-4 ${className}`}>
      <div className="rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-12 md:py-12">
        {children}
      </div>
    </div>
  );
}

/** FAQ accordion */
function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <details key={item.q} className="group rounded-xl border border-slate-200 bg-slate-50 px-5 transition-colors hover:bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold text-slate-900">
            <span>{item.q}</span>
            <span className="ml-4 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
              <svg className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </summary>
          <div className="pb-4 pt-1 text-sm leading-relaxed text-slate-700">{item.a}</div>
        </details>
      ))}
    </div>
  );
}

/* ─── page ──────────────────────────────────────────────────────────────── */
export default function Page() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router   = useRouter();

  const [checking,   setChecking]   = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let alive = true;
    async function run() {
      setChecking(true);
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!alive) return;
      if (authError) { setIsLoggedIn(false); setChecking(false); return; }
      const user = auth?.user ?? null;
      if (!user)    { setIsLoggedIn(false); setChecking(false); return; }
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
    return () => { alive = false; };
  }, [router, supabase]);

  if (checking)   return <div className="mx-auto max-w-6xl px-4 py-10"><div className="rounded-2xl border bg-white p-6 text-slate-700">Sprawdzam sesję…</div></div>;
  if (isLoggedIn) return <div className="mx-auto max-w-6xl px-4 py-10"><div className="rounded-2xl border bg-white p-6 text-slate-700">Przenoszę do Centrum…</div></div>;

  const demoRequired = 200;
  const demoHave     = 110;
  const demoPct      = clamp((demoHave / demoRequired) * 100, 0, 100);
  const demoMissing  = Math.max(0, demoRequired - demoHave);

  return (
    /* Szare tło strony — daje wszystkim kartom "uniesiony" wygląd */
    <div className="bg-slate-100 pb-6">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <SectionCard className="pt-6">
        {/* wewnętrzny gradient tylko w tej karcie */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-indigo-100/40 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">

            {/* left */}
            <div className="lg:col-span-6">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Platforma dla zawodów medycznych
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-[46px]">
                Twój rozwój<br />i kwalifikacje<br />
                <span className="text-blue-600">w jednym miejscu.</span>
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-slate-700">
                Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w aktualnym
                okresie rozliczeniowym.{" "}
                <strong className="font-semibold text-slate-900">Prosto. Spokojnie. Bez Excela.</strong>
              </p>

              <p className="mt-3 text-base leading-relaxed text-blue-600">
                Platforma umożliwia monitorowanie aktywności edukacyjnej i postępów uczestników
                oraz wspiera organizacje w zarządzaniu procesem edukacyjnym i obowiązkami regulacyjnymi.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                  Załóż darmowe konto <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#jak-to-dziala" className="inline-flex items-center rounded-xl bg-slate-100 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                  Zobacz jak to działa
                </a>
              </div>

              {/* bullet list — bez kart, sama linia */}
              <ul className="mt-7 space-y-3 border-t border-slate-100 pt-7">
                {heroBullets.map((b) => {
                  const Icon = b.icon;
                  return (
                    <li key={b.t} className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 ${b.color}`} strokeWidth={1.75} />
                      <span className="text-sm font-medium text-slate-700">{b.t}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                <Sparkles className="h-4 w-4 text-indigo-500" strokeWidth={1.75} />
                Wkrótce: Inteligentny asystent AI do zarządzania rozwojem zawodowym
              </div>
            </div>

            {/* right — karta statusu */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">

                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Podgląd statusu</p>
                <p className="text-base font-bold text-slate-900">Aktualny okres rozliczeniowy</p>
                <p className="mt-0.5 mb-5 text-sm text-slate-500">To przykład. Po zalogowaniu zobaczysz swoje realne dane.</p>

                {/* progress */}
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Postęp w okresie</span>
                  <span className="font-bold text-slate-800">{Math.round(demoPct)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${demoPct}%` }} />
                </div>

                <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white text-center">
                  <div className="py-3">
                    <div className="text-lg font-extrabold text-slate-900">{demoHave}</div>
                    <div className="text-xs text-slate-500">Masz (pkt)</div>
                  </div>
                  <div className="py-3">
                    <div className="text-lg font-extrabold text-slate-900">{demoRequired}</div>
                    <div className="text-xs text-slate-500">Cel (pkt)</div>
                  </div>
                  <div className="py-3">
                    <div className="text-lg font-extrabold text-red-500">{demoMissing}</div>
                    <div className="text-xs text-slate-500">Brakuje (pkt)</div>
                  </div>
                </div>

                {/* wpisy */}
                <div className="mt-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ostatnie wpisy</p>
                  <div className="space-y-2">
                    {demoEntries.map((e) => (
                      <div key={e.name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${e.dot}`} />
                        <span className="flex-1 text-sm font-medium text-slate-800">{e.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.badge}`}>{e.cat}</span>
                        <span className="text-sm font-bold text-blue-600">+{e.pts} pkt</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/login" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Zaloguj się, aby zobaczyć swój status <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── PROBLEM ──────────────────────────────────────────────────── */}
      <SectionCard className="mt-4">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">

          <div className="lg:col-span-5">
            <Eyebrow>Rozwiązanie</Eyebrow>
            <h2 className="text-2xl font-bold text-slate-900">Z czym się dziś mierzysz?</h2>
            <p className="mt-2 text-base leading-relaxed text-slate-600">
              Jeśli zbierasz punkty edukacyjne, łatwo o chaos — szczególnie gdy wszystko
              jest porozrzucane po wielu miejscach.
            </p>

            <div className="mt-5 space-y-2">
              {["Wiesz, co masz — i gdzie to jest.", "Widzisz postęp bez liczenia w Excelu.", "Masz certyfikaty przypięte do aktywności."].map((t) => (
                <div key={t} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{t}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">Najczęstszy scenariusz</p>
              <p className="text-sm leading-relaxed text-slate-700">
                „Dodam to później." A potem brakuje certyfikatu albo nie wiadomo, z którego roku był kurs.
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">CRPE pomaga to ogarnąć spokojnie.</p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {problemCards.map((x) => {
                const Icon = x.icon;
                return (
                  <div key={x.t} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                    <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${x.iconBg}`}>
                      <Icon className={`h-5 w-5 ${x.color}`} strokeWidth={1.75} />
                    </span>
                    <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                <GraduationCap className="h-4 w-4 text-teal-600" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">CRPE porządkuje to za Ciebie</p>
                <p className="mt-0.5 text-sm text-slate-600">Wpisy, certyfikaty i status punktów w jednym miejscu — spokojnie i czytelnie.</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── JAK TO DZIAŁA ────────────────────────────────────────────── */}
      <SectionCard className="mt-4" >
        <div id="jak-to-dziala">
          <Eyebrow>Proces</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-900">Jak to działa</h2>
          <p className="mt-1 text-base text-slate-600">Trzy proste kroki. Bez długiego wdrożenia.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((x) => {
              const Icon = x.icon;
              return (
                <div key={x.t} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">{x.n}</span>
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
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700">
              Zacznij za darmo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/rejestracja" className="inline-flex items-center rounded-xl bg-slate-100 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              Utwórz konto
            </Link>
          </div>
        </div>
      </SectionCard>

      {/* ── KORZYŚCI + DLA KOGO ──────────────────────────────────────── */}
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Co zyskujesz */}
          <div className="rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-10">
            <Eyebrow>Wartość</Eyebrow>
            <h2 className="text-2xl font-bold text-slate-900">Co zyskujesz</h2>
            <p className="mt-1 text-base text-slate-600">Bez komplikacji — po prostu porządek i jasny status.</p>

            <ul className="mt-6 space-y-2">
              {benefits.map(({ t, icon: Icon, iconBg, color }) => (
                <li key={t} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <FileText className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Wkrótce — PRO</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">Eksport PDF i przypomnienia</p>
                <p className="mt-0.5 text-sm text-slate-600">Raport PDF gotowy do wydruku oraz automatyczne przypomnienia o brakach punktowych.</p>
              </div>
            </div>
          </div>

          {/* Dla kogo */}
          <div className="rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-10">
            <Eyebrow>Odbiorcy</Eyebrow>
            <h2 className="text-2xl font-bold text-slate-900">Dla kogo jest CRPE</h2>
            <p className="mt-1 text-base text-slate-600">
              Dla wszystkich zawodów medycznych, które zbierają punkty edukacyjne
              i chcą mieć porządek w dokumentach.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {professions.map(({ t, icon: Icon, iconBg, color }) => (
                <div key={t} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{t}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                <LockKeyhole className="h-4 w-4 text-teal-600" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Jeśli musisz zbierać punkty — CRPE jest dla Ciebie.</p>
                <p className="mt-0.5 text-sm text-slate-600">Zacznij od kilku wpisów. Resztę możesz uzupełniać stopniowo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <SectionCard className="mt-4">
        <div className="mx-auto max-w-2xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-900">Najczęstsze pytania</h2>
          <p className="mt-1 text-base text-slate-600">Kliknij, aby rozwinąć odpowiedź.</p>

          <div className="mt-7">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Załóż darmowe konto <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/rejestracja" className="inline-flex items-center rounded-xl bg-slate-100 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              Utwórz konto
            </Link>
          </div>
        </div>
      </SectionCard>

      <FeatureGrid />
      <BottomCTA />
    </div>
  );
}
