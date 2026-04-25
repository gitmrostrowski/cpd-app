"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
   XL  (karty kroków):               kontener 64px, ikona 32px
   LG  (problem cards, listy):       kontener 48px, ikona 24px
   MD  (hero bullets, small items):  kontener 40px, ikona 20px
   ──────────────────────────────────────────────────────────────────────── */
const ICON_XL   = "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl";
const ICON_XL_I = "h-8 w-8";
const ICON_LG   = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl";
const ICON_LG_I = "h-6 w-6";

/* ─── data ──────────────────────────────────────────────────────────────── */

const heroBullets = [
  { t: "Wpisy i certyfikaty w jednym miejscu",     icon: FolderOpen,  iconBg: "bg-blue-50",   color: "text-blue-600"   },
  { t: "Jasny status punktów w aktualnym okresie", icon: BarChart3,   iconBg: "bg-amber-50",  color: "text-amber-500"  },
  { t: "Dane bezpieczne, przechowywane w UE",      icon: ShieldCheck, iconBg: "bg-slate-100", color: "text-slate-500"  },
  { t: "Podstawowe funkcje całkowicie bezpłatne",  icon: Sparkles,    iconBg: "bg-indigo-50", color: "text-indigo-500" },
];

const problemCards = [
  { t: "Certyfikaty w mailach",  d: "Trudno je znaleźć, gdy są potrzebne.",             icon: Mail,           iconBg: "bg-blue-50",   color: "text-blue-600"   },
  { t: "Zdjęcia w telefonie",    d: "Nie wiesz, co było do czego i z którego roku.",    icon: Camera,         iconBg: "bg-amber-50",  color: "text-amber-500"  },
  { t: "Excel i notatki",        d: "Wymaga pilnowania i łatwo o braki.",               icon: FileText,       iconBg: "bg-indigo-50", color: "text-indigo-500" },
  { t: "Brak pewności",          d: "Czy na pewno masz komplet punktów i dokumentów?",  icon: ClipboardCheck, iconBg: "bg-slate-100", color: "text-slate-500"  },
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
  { t: "Lekarze i lekarze dentyści",  icon: Stethoscope  },
  { t: "Pielęgniarki i położne",      icon: HeartPulse   },
  { t: "Fizjoterapeuci",              icon: UserCog      },
  { t: "Farmaceuci",                  icon: Pill         },
  { t: "Diagności laboratoryjni",     icon: FlaskConical },
  { t: "Nowe zawody medyczne",        icon: Users        },
];

/* Izby / samorządy zawodowe */
const izby = [
  "Naczelna Izba Lekarska",
  "Naczelna Izba Pielęgniarek i Położnych",
  "Krajowa Izba Fizjoterapeutów",
  "Naczelna Izba Aptekarska",
  "Krajowa Izba Diagnostów Laboratoryjnych",
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

/* ─── animowany licznik ──────────────────────────────────────────────────── */
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
          // ease-out cubic
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
      <div className="overflow-hidden rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-12 md:py-12">
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

/* FAQ — React state, Plus/Minus, każde pytanie osobna karta */
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
              isOpen ? "border-blue-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50"
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-slate-900">{item.q}</span>
              <span className={`ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isOpen ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
              }`}>
                {isOpen
                  ? <Minus className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.5} />
                  : <Plus  className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />
                }
              </span>
            </button>
            {isOpen && (
              /* FIX: pt-2 zamiast pt-3 — więcej oddechu */
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

/* ─── stat card z animowanym licznikiem ─────────────────────────────────── */
function StatCard({ target, label, color = "text-slate-900" }: { target: number; label: string; color?: string }) {
  const { value, ref } = useCounter(target);
  return (
    <div className="py-3 text-center">
      <span ref={ref} className={`text-xl font-extrabold tabular-nums ${color}`}>{value}</span>
      <div className="text-xs text-slate-500">{label}</div>
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
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">

          {/* LEFT */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Platforma dla zawodów medycznych
            </div>

            {/* Ilustracja B — chaos → CRPE, przed H1 */}
            <div className="mb-5 flex items-center gap-4">
              {/* PRZED: rozsypane dokumenty */}
              <div className="relative h-16 w-14 shrink-0">
                <div className="absolute left-1 top-2 h-12 w-9 rotate-[-8deg] rounded-lg border border-red-200 bg-red-50 p-1.5">
                  <div className="mb-1 h-1 w-full rounded bg-red-200" />
                  <div className="h-1 w-3/4 rounded bg-red-200" />
                </div>
                <div className="absolute left-2 top-0 h-12 w-9 rotate-[5deg] rounded-lg border border-amber-200 bg-amber-50 p-1.5">
                  <div className="mb-1 h-1 w-full rounded bg-amber-200" />
                  <div className="h-1 w-1/2 rounded bg-amber-200" />
                </div>
                <div className="absolute left-3 top-1 h-12 w-9 rotate-[-1deg] rounded-lg border border-violet-200 bg-violet-50 p-1.5">
                  <div className="mb-1 h-1 w-full rounded bg-violet-200" />
                  <div className="h-1 w-2/3 rounded bg-violet-200" />
                </div>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-400">CHAOS</span>
              </div>

              {/* strzałka */}
              <svg className="h-5 w-5 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {/* PO: ułożony dokument CRPE */}
              <div className="relative h-16 w-14 shrink-0">
                <div className="absolute left-2 top-1 h-12 w-10 rounded-lg border border-blue-200 bg-blue-50 p-1.5">
                  <div className="mb-1 h-1 w-full rounded bg-blue-300" />
                  <div className="mb-1 h-1 w-3/4 rounded bg-blue-200" />
                  <div className="mb-1.5 h-1 w-1/2 rounded bg-blue-200" />
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <div className="h-1 flex-1 rounded bg-emerald-200" />
                  </div>
                </div>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-500">CRPE</span>
              </div>

              <p className="text-sm text-slate-500">
                Zamieniamy rozrzucone certyfikaty i notatki w jeden przejrzysty rejestr.
              </p>
            </div>

            {/* H1 — md:text-4xl zapobiega łamaniu na 3 linie */}
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              Twój rozwój i kwalifikacje
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

            {/* 4 bullet — ICON_LG (48px) w układzie 2×2 */}
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {heroBullets.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.t} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className={`${ICON_LG} ${b.iconBg}`}>
                      <Icon className={`${ICON_LG_I} ${b.color}`} strokeWidth={1.75} />
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

            {/* Social proof — bez liczb, ogólne */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex -space-x-1">
                {["MK", "AT", "JP"].map((i) => (
                  <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[10px] font-bold text-blue-700">
                    {i}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm text-slate-600">
                  Używają specjaliści medyczni z całej Polski
                </span>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-sm font-medium text-indigo-700">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-500" strokeWidth={1.75} />
              Wkrótce: Asystent AI do zarządzania rozwojem zawodowym
            </div>
          </div>

          {/* RIGHT — status card z animowanymi licznikami */}
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

              {/* animowane liczniki */}
              <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50">
                <StatCard target={demoHave}     label="Masz (pkt)"    />
                <StatCard target={demoRequired} label="Cel (pkt)"     />
                <StatCard target={demoMissing}  label="Brakuje (pkt)" color="text-red-500" />
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
          PASEK IZB ZAWODOWYCH
      ══════════════════════════════════════════════════════════════ */}
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="overflow-hidden rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200/60">
          <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Platforma wspiera zawody regulowane przez
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {izby.map((nazwa) => (
              <span key={nazwa} className="text-sm font-medium text-slate-500 transition hover:text-slate-700">
                {nazwa}
              </span>
            ))}
          </div>
        </div>
      </div>

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
              {[
                "Wiesz, co masz — i gdzie to jest.",
                "Widzisz postęp bez liczenia w Excelu.",
                "Masz certyfikaty przypięte do aktywności.",
              ].map((t) => (
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
          JAK TO DZIAŁA — ikony XL (64px)
      ══════════════════════════════════════════════════════════════ */}
      <SectionCard className="mt-4">
        <div id="jak-to-dziala">
          <Eyebrow>Proces</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-900">Jak to działa</h2>
          <p className="mt-1 text-base text-slate-600">Trzy proste kroki. Bez długiego wdrożenia.</p>

          {/* kroki z dekoracyjnymi numerami w tle + strzałki między */}
          <div className="mt-8 grid items-start gap-0 md:grid-cols-[1fr_32px_1fr_32px_1fr]">
            {steps.map((x, i) => {
              const Icon = x.icon;
              const numBgColor = ["#dbeafe", "#fef3c7", "#f1f5f9"][i];
              return (
                <React.Fragment key={x.n}>
                  <div
                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    {/* duży dekoracyjny numer w tle prawego dolnego rogu */}
                    <span
                      className="pointer-events-none absolute -bottom-3 -right-2 select-none text-[80px] font-black leading-none"
                      style={{ color: numBgColor }}
                    >
                      {x.n}
                    </span>

                    {/* mały badge numeru + ikona XL */}
                    <div className="relative mb-5 flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                        {x.n}
                      </span>
                    </div>

                    <div className="relative mb-4 flex justify-center">
                      <span className={`${ICON_XL} ${x.iconBg}`}>
                        <Icon className={`${ICON_XL_I} ${x.color}`} strokeWidth={1.5} />
                      </span>
                    </div>

                    <div className="relative text-base font-semibold text-slate-900">{x.t}</div>
                    <div className="relative mt-1.5 text-sm leading-relaxed text-slate-600">{x.d}</div>
                  </div>

                  {/* strzałka między krokami — tylko między 1→2 i 2→3 */}
                  {i < steps.length - 1 && (
                    <div key={`arrow-${i}`} className="hidden items-center justify-center md:flex">
                      <svg className="h-6 w-6 text-slate-300" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
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
          TESTIMONIAL
      ══════════════════════════════════════════════════════════════ */}
      <SectionCard className="mt-4">
        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:gap-8 md:text-left">
          <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 md:mb-0">
            AK
          </div>
          <div>
            <Quote className="mb-2 h-6 w-6 text-blue-200" strokeWidth={1.5} />
            <p className="text-base leading-relaxed text-slate-700 md:text-lg">
              „Wcześniej trzymałam wszystko w Excelu i modliłam się żeby nie zgubić certyfikatów.
              Teraz dodaję wpis od razu po szkoleniu — z telefonem. Przed audytem mam wszystko gotowe
              w kilka minut, a nie w kilka godzin."
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-900">Anna K.</span>
              <span className="text-sm text-slate-500">Pielęgniarka, Kraków</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════
          CO ZYSKUJESZ + DLA KOGO
      ══════════════════════════════════════════════════════════════ */}
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Co zyskujesz */}
          <div className="overflow-hidden rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-10">
            <Eyebrow>Wartość</Eyebrow>
            <h2 className="text-2xl font-bold text-slate-900">Co zyskujesz</h2>
            <p className="mt-1 text-base text-slate-600">Bez komplikacji — po prostu porządek i jasny status.</p>

            <ul className="mt-6 space-y-2">
              {benefits.map(({ t, icon: Icon, iconBg, color }) => (
                <li key={t} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                  <span className={`${ICON_LG} ${iconBg}`}>
                    <Icon className={`${ICON_LG_I} ${color}`} strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <span className={`${ICON_LG} bg-amber-100 shrink-0`}>
                <FileText className={`${ICON_LG_I} text-amber-600`} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Wkrótce — PRO</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">Eksport PDF i przypomnienia</p>
                <p className="mt-0.5 text-sm text-slate-600">Raport PDF gotowy do wydruku oraz automatyczne przypomnienia o brakach punktowych.</p>
              </div>
            </div>
          </div>

          {/* Dla kogo */}
          <div className="overflow-hidden rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-10">
            <Eyebrow>Odbiorcy</Eyebrow>
            <h2 className="text-2xl font-bold text-slate-900">Dla kogo jest CRPE</h2>
            <p className="mt-1 text-base text-slate-600">
              Dla wszystkich zawodów medycznych zbierających punkty edukacyjne.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {professions.map(({ t, icon: Icon }) => (
                <div key={t} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                  <span className={`${ICON_LG} shrink-0`} style={{ background: "#f0fdfa" }}>
                    <Icon className={ICON_LG_I} style={{ color: "#14b8a6" }} strokeWidth={1.75} />
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
          FAQ
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
