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
  ChevronDown,
  ClipboardCheck,
  FileText,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  HeartPulse,
  LockKeyhole,
  Mail,
  Minus,
  Pill,
  Plus,
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

/* ─── rozmiary ikon ──────────────────────────────────────────────────────
   Duże (karty kroków, problem cards): kontener 48px, ikona 24px
   Średnie (listy benefitów, zawodów, hero bullets): kontener 40px, ikona 20px
   ──────────────────────────────────────────────────────────────────────── */
const ICON_LG   = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl";
const ICON_LG_I = "h-6 w-6";
const ICON_MD   = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl";
const ICON_MD_I = "h-5 w-5";

/* ─── data ──────────────────────────────────────────────────────────────── */

const heroBullets = [
  { t: "Wpisy i certyfikaty w jednym miejscu",     icon: FolderOpen,  iconBg: "bg-blue-50",   color: "text-blue-600"   },
  { t: "Jasny status punktów w aktualnym okresie", icon: BarChart3,   iconBg: "bg-amber-50",  color: "text-amber-500"  },
  { t: "Dane bezpieczne, przechowywane w UE",      icon: ShieldCheck, iconBg: "bg-slate-100", color: "text-slate-500"  },
  { t: "Podstawowe funkcje całkowicie bezpłatne",  icon: Sparkles,    iconBg: "bg-indigo-50", color: "text-indigo-500" },
];

const problemCards = [
  { t: "Certyfikaty w mailach",  d: "Trudno je znaleźć, gdy są potrzebne.",             icon: Mail,           iconBg: "bg-blue-50",   color: "text-blue-600"  },
  { t: "Zdjęcia w telefonie",    d: "Nie wiesz, co było do czego i z którego roku.",    icon: Camera,         iconBg: "bg-amber-50",  color: "text-amber-500" },
  { t: "Excel i notatki",        d: "Wymaga pilnowania i łatwo o braki.",               icon: FileText,       iconBg: "bg-indigo-50", color: "text-indigo-500"},
  { t: "Brak pewności",          d: "Czy na pewno masz komplet punktów i dokumentów?",  icon: ClipboardCheck, iconBg: "bg-slate-100", color: "text-slate-500" },
];

const steps = [
  { n: "1", t: "Wybierz zawód",    d: "System ustawi odpowiednie wymagania i pomoże śledzić postęp w aktualnym okresie.", icon: UserRoundCheck, iconBg: "bg-blue-50",   color: "text-blue-600"  },
  { n: "2", t: "Dodaj aktywność",  d: "Wpisz nazwę szkolenia i dołącz certyfikat — nawet zdjęcie z telefonu.",           icon: UploadCloud,    iconBg: "bg-amber-50",  color: "text-amber-500" },
  { n: "3", t: "Sprawdzaj postęp", d: "Zawsze wiesz, ile punktów masz i czego brakuje.",                                 icon: TrendingUp,     iconBg: "bg-slate-100", color: "text-slate-500" },
];

const benefits = [
  { t: "Historia wszystkich aktywności w jednym miejscu", icon: BookOpen,      iconBg: "bg-blue-50",   color: "text-blue-600"   },
  { t: "Certyfikaty zawsze pod ręką (PDF / zdjęcia)",     icon: Award,         iconBg: "bg-amber-50",  color: "text-amber-500"  },
  { t: "Przejrzysty podgląd zdobytych punktów",           icon: BarChart3,     iconBg: "bg-slate-100", color: "text-slate-500"  },
  { t: "Gotowość do przygotowania raportu",               icon: CalendarCheck, iconBg: "bg-indigo-50", color: "text-indigo-500" },
];

const professions = [
  { t: "Lekarze i lekarze dentyści",  icon: Stethoscope,  iconBg: "bg-blue-50",   color: "text-blue-600"   },
  { t: "Pielęgniarki i położne",      icon: HeartPulse,   iconBg: "bg-slate-100", color: "text-slate-500"  },
  { t: "Fizjoterapeuci",              icon: UserCog,      iconBg: "bg-amber-50",  color: "text-amber-500"  },
  { t: "Farmaceuci",                  icon: Pill,         iconBg: "bg-indigo-50", color: "text-indigo-500" },
  { t: "Diagności laboratoryjni",     icon: FlaskConical, iconBg: "bg-slate-100", color: "text-slate-500"  },
  { t: "Nowe zawody medyczne",        icon: Users,        iconBg: "bg-blue-50",   color: "text-blue-600"   },
];

const demoEntries = [
  { name: "Konferencja kardiologiczna", pts: 20, cat: "Konferencja", dot: "bg-blue-500",  badge: "bg-blue-50 text-blue-700"    },
  { name: "Kurs e-learning EKG",        pts: 15, cat: "E-learning",  dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
];

const FAQ_ITEMS = [
  { q: "Czy CRPE jest połączone z systemami państwowymi?", a: "Nie. CRPE służy do Twojej kontroli i uporządkowania danych. Systemy państwowe są zamknięte."   },
  { q: "Czy moje certyfikaty są bezpieczne?",              a: "Tak. Dane są zabezpieczone, a dostęp do nich masz tylko Ty. Przechowujemy dane w UE."          },
  { q: "Czy mogę korzystać z telefonu?",                   a: "Tak. Możesz dodać certyfikat od razu po szkoleniu — nawet jako zdjęcie z telefonu."            },
  { q: "Czy korzystanie jest darmowe?",                    a: "Tak. Podstawowe funkcje są bezpłatne. Wkrótce pojawią się opcje PRO (PDF, przypomnienia)."     },
];

/* ─── primitives ────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-6xl px-4 ${className}`}>
      <div className="rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-12 md:py-12">
        {children}
      </div>
    </div>
  );
}

function BtnPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
      {children}
    </Link>
  );
}

function BtnSecondary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
      {children}
    </Link>
  );
}

/* FAQ — każde pytanie jako osobna karta, spójna z resztą strony.
   Plus → Minus przy otwieraniu żeby stan był jednoznaczny. */
function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <details key={item.q} className="group rounded-2xl border border-slate-200 bg-slate-50 transition-colors open:bg-white open:shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
            <span className="text-sm font-semibold text-slate-900">{item.q}</span>
            {/* Plus widoczny gdy zamknięte, Minus gdy otwarte */}
            <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white group-open:border-blue-200 group-open:bg-blue-50 transition-colors">
              <Plus  className="h-3.5 w-3.5 text-slate-400 group-open:hidden" strokeWidth={2.5} />
              <Minus className="h-3.5 w-3.5 text-blue-600 hidden group-open:block" strokeWidth={2.5} />
            </span>
          </summary>
          <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-700">
            {item.a}
          </div>
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
    <div className="bg-slate-100 pb-6">

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <SectionCard className="pt-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">

          {/* LEFT */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Platforma dla zawodów medycznych
            </div>

            {/* H1 — whitespace-nowrap na pierwszej linii żeby nie łamało po "i" */}
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
              <span className="whitespace-nowrap">Twój rozwój i kwalifikacje</span>
              <br />
              <span className="text-blue-600">w jednym miejscu.</span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-slate-700">
              Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp
              w aktualnym okresie rozliczeniowym.{" "}
              <strong className="font-semibold text-slate-900">
                Prosto. Spokojnie. Bez Excela.
              </strong>
            </p>

            {/* 4 bullet — ICON_MD (40px) */}
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {heroBullets.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.t} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className={`${ICON_MD} ${b.iconBg}`}>
                      <Icon className={`${ICON_MD_I} ${b.color}`} strokeWidth={1.75} />
                    </span>
                    <span className="text-sm font-medium text-slate-700">{b.t}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <BtnPrimary href="/login">
                Załóż darmowe konto <ArrowRight className="h-4 w-4" />
              </BtnPrimary>
              <a href="#jak-to-dziala" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                Zobacz jak to działa
              </a>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-sm font-medium text-indigo-700">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-500" strokeWidth={1.75} />
              Wkrótce: Asystent AI do zarządzania rozwojem zawodowym
            </div>
          </div>

          {/* RIGHT — status card */}
          <div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Podgląd statusu</p>
              <p className="text-base font-bold text-slate-900">Aktualny okres rozliczeniowy</p>
              <p className="mt-0.5 mb-5 text-sm text-slate-500">To przykład. Po zalogowaniu zobaczysz swoje realne dane.</p>

              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Postęp w okresie</span>
                <span className="font-bold text-slate-800">{Math.round(demoPct)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${demoPct}%` }} />
              </div>

              <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 text-center">
                <div className="py-3">
                  <div className="text-xl font-extrabold text-slate-900">{demoHave}</div>
                  <div className="text-xs text-slate-500">Masz (pkt)</div>
                </div>
                <div className="py-3">
                  <div className="text-xl font-extrabold text-slate-900">{demoRequired}</div>
                  <div className="text-xs text-slate-500">Cel (pkt)</div>
                </div>
                <div className="py-3">
                  <div className="text-xl font-extrabold text-red-500">{demoMissing}</div>
                  <div className="text-xs text-slate-500">Brakuje (pkt)</div>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ostatnie wpisy</p>
                <div className="space-y-2">
                  {demoEntries.map((e) => (
                    <div key={e.name} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${e.dot}`} />
                      <span className="flex-1 text-sm font-medium text-slate-800">{e.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.badge}`}>{e.cat}</span>
                      <span className="text-sm font-bold text-blue-600">+{e.pts} pkt</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/login" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                Zaloguj się, aby zobaczyć swój status <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════
          PROBLEM
      ══════════════════════════════════════════════════════════════ */}
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
            {/* problem cards — ICON_LG (48px) */}
            <div className="grid gap-3 sm:grid-cols-2">
              {problemCards.map((x) => {
                const Icon = x.icon;
                return (
                  <div key={x.t} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                    <span className={`mb-3 ${ICON_LG} ${x.iconBg}`}>
                      <Icon className={`${ICON_LG_I} ${x.color}`} strokeWidth={1.75} />
                    </span>
                    <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <span className={`${ICON_LG} bg-blue-100 shrink-0`}>
                <GraduationCap className={`${ICON_LG_I} text-blue-600`} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">CRPE porządkuje to za Ciebie</p>
                <p className="mt-0.5 text-sm text-slate-600">Wpisy, certyfikaty i status punktów w jednym miejscu — spokojnie i czytelnie.</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════
          JAK TO DZIAŁA — nowa hierarchia: duża ikona + numer jako badge
      ══════════════════════════════════════════════════════════════ */}
      <SectionCard className="mt-4">
        <div id="jak-to-dziala">
          <Eyebrow>Proces</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-900">Jak to działa</h2>
          <p className="mt-1 text-base text-slate-600">Trzy proste kroki. Bez długiego wdrożenia.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((x) => {
              const Icon = x.icon;
              return (
                <div key={x.t} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                  {/* numer jako mały badge w górnym lewym rogu */}
                  <span className="absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                    {x.n}
                  </span>
                  {/* duża ikona centrowana w karcie */}
                  <div className="mb-4 mt-2 flex justify-center">
                    <span className={`${ICON_LG} ${x.iconBg}`}>
                      <Icon className={`${ICON_LG_I} ${x.color}`} strokeWidth={1.75} />
                    </span>
                  </div>
                  <div className="text-base font-semibold text-slate-900">{x.t}</div>
                  <div className="mt-1.5 text-sm leading-relaxed text-slate-600">{x.d}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <BtnPrimary href="/login">Zacznij za darmo <ArrowRight className="h-4 w-4" /></BtnPrimary>
            <BtnSecondary href="/rejestracja">Utwórz konto</BtnSecondary>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════
          CO ZYSKUJESZ + DLA KOGO
      ══════════════════════════════════════════════════════════════ */}
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Co zyskujesz */}
          <div className="rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-10">
            <Eyebrow>Wartość</Eyebrow>
            <h2 className="text-2xl font-bold text-slate-900">Co zyskujesz</h2>
            <p className="mt-1 text-base text-slate-600">Bez komplikacji — po prostu porządek i jasny status.</p>

            <ul className="mt-6 space-y-2">
              {benefits.map(({ t, icon: Icon, iconBg, color }) => (
                <li key={t} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                  <span className={`${ICON_MD} ${iconBg}`}>
                    <Icon className={`${ICON_MD_I} ${color}`} strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <span className={`${ICON_MD} bg-amber-100 shrink-0`}>
                <FileText className={`${ICON_MD_I} text-amber-600`} strokeWidth={1.75} />
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
              Dla wszystkich zawodów medycznych zbierających punkty edukacyjne.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {professions.map(({ t, icon: Icon, iconBg, color }) => (
                <div key={t} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                  <span className={`${ICON_MD} ${iconBg}`}>
                    <Icon className={`${ICON_MD_I} ${color}`} strokeWidth={1.75} />
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

      {/* ══════════════════════════════════════════════════════════════
          FAQ — każde pytanie to osobna karta, Plus/Minus zamiast chevron
      ══════════════════════════════════════════════════════════════ */}
      <SectionCard className="mt-4">
        <div className="mx-auto max-w-2xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-900">Najczęstsze pytania</h2>
          <p className="mt-1 text-base text-slate-600">Kliknij pytanie, aby zobaczyć odpowiedź.</p>

          <div className="mt-7">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <BtnPrimary href="/login">Załóż darmowe konto <ArrowRight className="h-4 w-4" /></BtnPrimary>
            <BtnSecondary href="/rejestracja">Utwórz konto</BtnSecondary>
          </div>
        </div>
      </SectionCard>

      <FeatureGrid />
      <BottomCTA />
    </div>
  );
}
