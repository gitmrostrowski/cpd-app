"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

const ICON_LG   = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg";
const ICON_LG_I = "h-5 w-5";

const problemCards = [
  { t: "Certyfikaty w mailach",  d: "Trudno je znaleźć, gdy są potrzebne.",             icon: Mail,           iconBg: "bg-blue-50",   color: "text-blue-600"   },
  { t: "Zdjęcia w telefonie",    d: "Nie wiesz, co było do czego i z którego roku.",    icon: Camera,         iconBg: "bg-amber-50",  color: "text-amber-500"  },
  { t: "Excel i notatki",        d: "Wymaga pilnowania i łatwo o braki.",               icon: FileText,       iconBg: "bg-indigo-50", color: "text-indigo-500" },
  { t: "Brak pewności",          d: "Czy na pewno masz komplet punktów i dokumentów?",  icon: ClipboardCheck, iconBg: "bg-slate-100", color: "text-slate-500"  },
];

const professions = [
  { t: "Lekarze i lekarze dentyści",  icon: Stethoscope  },
  { t: "Pielęgniarki i położne",      icon: HeartPulse   },
  { t: "Fizjoterapeuci",              icon: UserCog      },
  { t: "Farmaceuci",                  icon: Pill         },
  { t: "Diagności laboratoryjni",     icon: FlaskConical },
  { t: "Nowe zawody medyczne",        icon: Users        },
];

const izby = [
  "Naczelna Izba Lekarska",
  "Naczelna Izba Pielęgniarek i Położnych",
  "Krajowa Izba Fizjoterapeutów",
  "Naczelna Izba Aptekarska",
  "Krajowa Izba Diagnostów Laboratoryjnych",
];

const benefits = [
  { t: "Historia wszystkich aktywności w jednym miejscu", icon: BookOpen      },
  { t: "Certyfikaty zawsze pod ręką (PDF / zdjęcia)",     icon: Award         },
  { t: "Przejrzysty podgląd zdobytych punktów",           icon: BarChart3     },
  { t: "Gotowość do przygotowania raportu",               icon: CalendarCheck },
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

/* ─── animated counter ──────────────────────────────────────────────────── */
function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (started.current) return;
    const observer = new IntersectionObserver(([entry]) => {
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
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { value, ref };
}

/* ─── shared card style — matches Panel CPD ────────────────────────────── */
const cardCls = "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">{children}</p>;
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={`rounded-xl border transition-all ${isOpen ? "border-blue-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50"}`}>
            <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between px-5 py-3.5 text-left">
              <span className="text-sm font-semibold text-slate-900">{item.q}</span>
              <span className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${isOpen ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
                {isOpen ? <Minus className="h-3 w-3 text-blue-600" strokeWidth={2.5} /> : <Plus className="h-3 w-3 text-slate-400" strokeWidth={2.5} />}
              </span>
            </button>
            {isOpen && <div className="border-t border-slate-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-slate-600">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ target, label, color = "text-slate-900" }: { target: number; label: string; color?: string }) {
  const { value, ref } = useCounter(target);
  return (
    <div className="py-2 text-center">
      <span ref={ref} className={`text-xl font-extrabold tabular-nums ${color}`}>{value}</span>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

/* ─── HowItWorks — animowane 3 kroki ───────────────────────────────────── */
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 3), 2800);
    return () => clearInterval(t);
  }, [visible]);

  const steps = [
    {
      n: "1", icon: UserRoundCheck, color: "blue",
      title: "Wybierz zawód",
      subtitle: "System sam ustawi wymagania",
      desc: "Powiedz nam kim jesteś. System dobierze odpowiedni okres rozliczeniowy i liczbę wymaganych punktów.",
      preview: (
        <div className="space-y-2">
          {[
            { label: "Lekarz",        pts: "200 pkt / 4 lata", active: true  },
            { label: "Pielęgniarka",  pts: "100 pkt / 5 lat",  active: false },
            { label: "Fizjoterapeuta",pts: "100 pkt / 5 lat",  active: false },
          ].map((p) => (
            <div key={p.label} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${p.active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <span className="font-medium">{p.label}</span>
              <span className={`text-xs ${p.active ? "text-blue-100" : "text-slate-400"}`}>{p.pts}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      n: "2", icon: UploadCloud, color: "amber",
      title: "Dodaj aktywność",
      subtitle: "Zdjęcie z telefonu wystarczy",
      desc: "Wpisz nazwę szkolenia i dołącz certyfikat. Punkty są naliczane automatycznie.",
      preview: (
        <div>
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">Konferencja kardiologiczna</p>
              <p className="text-xs text-slate-400">certyfikat.pdf · 2026</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-emerald-600">+20 pkt</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-400">
            <UploadCloud className="h-4 w-4 shrink-0" />
            Przeciągnij certyfikat lub kliknij
          </div>
        </div>
      ),
    },
    {
      n: "3", icon: TrendingUp, color: "emerald",
      title: "Masz pełny obraz",
      subtitle: "Zawsze wiesz co robić dalej",
      desc: "Ile punktów masz, ile brakuje i co zrobić jako następne. Jeden ekran, zero zgadywania.",
      preview: (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Postęp 2025–2028</span>
            <span className="text-sm font-bold text-slate-900">55%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-blue-600 transition-all duration-1000" style={{ width: visible ? "55%" : "0%" }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { v: "110", l: "masz", c: "text-slate-900"  },
              { v: "200", l: "cel",  c: "text-slate-900"  },
              { v: "90",  l: "brak", c: "text-red-500"    },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-slate-100 bg-slate-50 py-2 text-center">
                <div className={`text-base font-bold ${s.c}`}>{s.v}</div>
                <div className="text-[10px] text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Następny krok: Uzupełnij dokumenty
          </div>
        </div>
      ),
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; ring: string; num: string }> = {
    blue:    { bg: "bg-blue-50",    text: "text-blue-600",    ring: "ring-blue-200",    num: "bg-blue-600"    },
    amber:   { bg: "bg-amber-50",   text: "text-amber-600",   ring: "ring-amber-200",   num: "bg-amber-500"   },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200", num: "bg-emerald-600" },
  };

  return (
    <div id="jak-to-dziala" ref={ref} className={`${cardCls} scroll-mt-32`}>
      <div className="border-b border-slate-100 px-6 py-4">
        <Eyebrow>Proces</Eyebrow>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Jak to działa</h2>
            <p className="mt-0.5 text-sm text-slate-500">Trzy kroki. Bez wdrożenia. Pierwsze wpisy w 2 minuty.</p>
          </div>
          <div className="flex gap-1.5 pb-1">
            {steps.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)} className={`h-2 rounded-full transition-all duration-300 ${activeStep === i ? "w-6 bg-blue-600" : "w-2 bg-slate-200 hover:bg-slate-300"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* desktop — 3 karty obok */}
      <div className="hidden gap-0 md:grid md:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const c = colorMap[step.color];
          const isActive = activeStep === i;
          return (
            <button key={step.n} type="button" onClick={() => setActiveStep(i)}
              className={`group flex flex-col gap-4 border-r border-slate-100 p-6 text-left transition-all duration-300 last:border-r-0 ${isActive ? "bg-slate-50" : "hover:bg-slate-50/50"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-all ${c.num} ${isActive ? "scale-110 shadow-md" : ""}`}>{step.n}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-all ${c.bg} ${c.ring} ${isActive ? "scale-105" : ""}`}>
                  <Icon className={`h-5 w-5 ${c.text}`} strokeWidth={1.75} />
                </span>
              </div>
              <div>
                <p className={`text-sm font-bold transition-colors ${isActive ? "text-slate-900" : "text-slate-700"}`}>{step.title}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-400">{step.subtitle}</p>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">{step.desc}</p>
              <div className={`mt-auto transition-all duration-500 ${isActive ? "opacity-100" : "opacity-35"}`}>
                {step.preview}
              </div>
            </button>
          );
        })}
      </div>

      {/* mobile — jeden krok na raz */}
      <div className="md:hidden">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const c = colorMap[step.color];
          if (activeStep !== i) return null;
          return (
            <div key={step.n} className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${c.num}`}>{step.n}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${c.bg} ${c.ring}`}><Icon className={`h-5 w-5 ${c.text}`} strokeWidth={1.75} /></span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-400">{step.subtitle}</p>
                </div>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-500">{step.desc}</p>
              {step.preview}
            </div>
          );
        })}
        <div className="flex justify-center gap-2 border-t border-slate-100 py-3">
          {steps.map((_, i) => <button key={i} onClick={() => setActiveStep(i)} className={`h-2 rounded-full transition-all ${activeStep === i ? "w-8 bg-blue-600" : "w-2 bg-slate-200"}`} />)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-4">
        <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
          Zacznij za darmo <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/rejestracja" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">
          Utwórz konto
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router   = useRouter();
  const [checking,   setChecking]   = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveSection(id);
    const offset = 136;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }

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
      const { data: profile, error: profErr } = await supabase.from("profiles").select("user_id, profession, period_start, period_end, required_points").eq("user_id", user.id).maybeSingle<ProfileRow>();
      if (!alive) return;
      if (profErr) console.warn("profiles error:", profErr.message);
      router.replace(profile ? "/kalkulator" : "/start");
    }
    run();
    return () => { alive = false; };
  }, [router, supabase]);

  if (checking)   return <div className="mx-auto max-w-6xl px-4 py-10"><div className={`${cardCls} p-6 text-slate-700`}>Sprawdzam sesję…</div></div>;
  if (isLoggedIn) return <div className="mx-auto max-w-6xl px-4 py-10"><div className={`${cardCls} p-6 text-slate-700`}>Przenoszę do Centrum…</div></div>;

  const demoRequired = 200;
  const demoHave     = 110;
  const demoPct      = clamp((demoHave / demoRequired) * 100, 0, 100);
  const demoMissing  = Math.max(0, demoRequired - demoHave);

  return (
    <div className="bg-slate-100 pb-4">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-2">

        {/* ── STICKY SUBNAV — jak w Panelu CPD ─────────────────────── */}
        <nav className="sticky top-[76px] z-30 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
          <div className="flex min-w-max items-center justify-between">
            <div className="flex">
              {([
                { id: "hero",      label: "O produkcie"   },
                { id: "dla-kogo",  label: "Dla kogo"      },
                { id: "jak-to-dziala", label: "Jak to dziala" },
                { id: "faq",       label: "FAQ"           },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToId(id)}
                  className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none ${
                    activeSection === id
                      ? "border-blue-600 text-blue-700 font-semibold"
                      : "border-transparent text-slate-500 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="shrink-0 pr-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
              >
                Zaloz konto →
              </Link>
            </div>
          </div>
        </nav>

        <div id="hero" className={`${cardCls} scroll-mt-32`}>
          <div className="relative grid grid-cols-1 gap-8 p-6 lg:grid-cols-2 lg:items-start lg:p-8">
          {/* blue left accent — jak w panelu */}
          <div className="pointer-events-none absolute left-0 top-5 h-20 w-1 rounded-r-full bg-slate-300" />

            {/* LEFT */}
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                <Sparkles className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                Wkrótce: Asystent AI do zarządzania rozwojem zawodowym
              </div>

              <h1 className="text-[36px] font-bold leading-[1.1] tracking-tight text-slate-950 md:text-[44px]">
                Twój rozwój
                <br />i kwalifikacje
                <br /><span className="text-slate-900">w jednym miejscu.</span>
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp
                w aktualnym okresie rozliczeniowym. Prosto. Spokojnie. Bez Excela.
              </p>

              {/* 4 bullets — jak stat cards w panelu */}
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { t: "Porządek bez wysiłku",  d: "Wpisy i certyfikaty zawsze pod ręką.", dot: "bg-blue-500"  },
                  { t: "Jasny status punktów",  d: "Wiesz ile masz i czego brakuje.",       dot: "bg-amber-400" },
                  { t: "Bezpieczne dane",        d: "Tylko Ty masz dostęp. Dane w UE.",     dot: "bg-slate-400" },
                  { t: "Start za darmo",         d: "Podstawowe funkcje bezpłatnie.",        dot: "bg-blue-400"  },
                ].map((b) => (
                  <div key={b.t} className="rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${b.dot}`} />
                      {b.t}
                    </div>
                    <p className="mt-0.5 pl-4 text-xs text-slate-500">{b.d}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
                  Załóż darmowe konto <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#jak-to-dziala" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">
                  Jak to działa
                </a>
              </div>
            </div>

            {/* RIGHT — demo panel */}
            <div className="flex flex-col gap-3">
              {/* Zdjecie — placeholder z gradientem i ikoną do czasu dodania zdjecia */}
              <div className="relative overflow-hidden rounded-xl bg-slate-100" style={{ minHeight: "180px" }}>
                <Image src="/crpe_reka2b.png" alt="Mockup panelu CPD" width={800} height={280} className="w-full object-cover opacity-90" style={{ objectPosition: "left center", height: "180px" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Twoje dane, Twoja kontrola
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Podgląd statusu</div>
                <div className="text-sm font-bold text-slate-900">Aktualny okres rozliczeniowy</div>
                <p className="mt-0.5 mb-4 text-xs text-slate-500">Przykład — po zalogowaniu zobaczysz swoje dane.</p>

                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Postęp w okresie</span>
                  <span className="font-bold text-slate-700">{Math.round(demoPct)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${demoPct}%` }} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { target: demoHave,     label: "Masz (pkt)"    },
                    { target: demoRequired, label: "Cel (pkt)"     },
                    { target: demoMissing,  label: "Brakuje (pkt)", color: "text-red-500" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50">
                      <StatCard target={s.target} label={s.label} color={s.color} />
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ostatnie wpisy</p>
                  <div className="space-y-1.5">
                    {demoEntries.map((e) => (
                      <div key={e.name} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${e.dot}`} />
                        <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-800">{e.name}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${e.badge}`}>{e.cat}</span>
                        <span className="shrink-0 text-sm font-bold text-blue-600">+{e.pts} pkt</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/login" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95">
                  Zaloguj się, aby zobaczyć swój status <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── PASEK IZB ──────────────────────────────────────────────── */}
        <div id="izby" className={cardCls}>
          <div className="px-6 py-4">
            <p className="mb-3 text-center text-[11px] font-semibold text-slate-700">
              CRPE wspiera zawody regulowane przez samorządy zawodowe
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {izby.map((nazwa) => (
                <span key={nazwa} className="text-xs font-medium text-slate-600">{nazwa}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── DLA KOGO + CO ZYSKUJESZ ────────────────────────────────── */}
        <div id="dla-kogo" className="grid gap-4 lg:grid-cols-2 scroll-mt-32">
          {/* Dla kogo */}
          <div className={cardCls}>
            <div className="border-b border-slate-100 px-6 py-4">
              <Eyebrow>Odbiorcy</Eyebrow>
              <h2 className="text-base font-bold text-slate-900">Dla kogo jest CRPE</h2>
              <p className="mt-0.5 text-sm text-slate-500">Dla zawodów medycznych zbierających punkty edukacyjne.</p>
            </div>
            <div className="p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {professions.map(({ t, icon: Icon }) => (
                  <div key={t} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <span className={`${ICON_LG} bg-teal-50 shrink-0`}>
                      <Icon className={`${ICON_LG_I} text-teal-600`} strokeWidth={1.75} />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Jeśli musisz zbierać punkty — CRPE jest dla Ciebie.</p>
                <p className="mt-0.5 text-xs text-slate-600">Zacznij od kilku wpisów. Resztę uzupełniaj stopniowo.</p>
              </div>
            </div>
          </div>

          {/* Co zyskujesz */}
          <div className={cardCls}>
            <div className="border-b border-slate-100 px-6 py-4">
              <Eyebrow>Wartość</Eyebrow>
              <h2 className="text-base font-bold text-slate-900">Co zyskujesz</h2>
              <p className="mt-0.5 text-sm text-slate-500">Bez komplikacji — porządek i jasny status.</p>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {benefits.map(({ t, icon: Icon }) => (
                  <div key={t} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <span className={`${ICON_LG} bg-blue-50 shrink-0`}>
                      <Icon className={`${ICON_LG_I} text-blue-600`} strokeWidth={1.75} />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <span className={`${ICON_LG} bg-amber-100 shrink-0`}>
                  <FileText className={`${ICON_LG_I} text-amber-600`} strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Wkrótce — PRO</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">Eksport PDF i przypomnienia</p>
                  <p className="mt-0.5 text-xs text-slate-600">Raport PDF gotowy do wydruku oraz automatyczne przypomnienia o brakach.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PROBLEM ────────────────────────────────────────────────── */}
        <div id="problem" className={`${cardCls} scroll-mt-32`}>
          <div className="border-b border-slate-100 px-6 py-4">
            <Eyebrow>Rozwiązanie</Eyebrow>
            <h2 className="text-base font-bold text-slate-900">Z czym się dziś mierzysz?</h2>
            <p className="mt-0.5 text-sm text-slate-500">Jeśli zbierasz punkty edukacyjne, łatwo o chaos — szczególnie gdy wszystko jest porozrzucane.</p>
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            {/* Lewa: checklisty */}
            <div>
              <div className="space-y-2">
                {[
                  "Wiesz, co masz — i gdzie to jest.",
                  "Widzisz postęp bez liczenia w Excelu.",
                  "Masz certyfikaty przypięte do aktywności.",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                      <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-600">Najczęstszy scenariusz</p>
                <p className="text-sm text-slate-700">"Dodam to później." A potem brakuje certyfikatu albo nie wiadomo, z którego roku był kurs.</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">CRPE pomaga to ogarnąć spokojnie.</p>
              </div>
            </div>
            {/* Prawa: problem cards */}
            <div className="grid grid-cols-2 gap-2">
              {problemCards.map((x) => {
                const Icon = x.icon;
                return (
                  <div key={x.t} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                    <span className={`mb-2 ${ICON_LG} ${x.iconBg}`}>
                      <Icon className={`${ICON_LG_I} ${x.color}`} strokeWidth={1.75} />
                    </span>
                    <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-600">{x.d}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── JAK TO DZIAŁA ──────────────────────────────────────────── */}
        <HowItWorks />

        {/* ── TESTIMONIAL ────────────────────────────────────────────── */}
        <div id="opinia" className={cardCls}>
          <div className="p-6">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-start md:text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">AK</div>
              <div>
                <Quote className="mb-2 h-5 w-5 text-blue-200" strokeWidth={1.5} />
                <p className="text-sm leading-relaxed text-slate-700">
                  "Wcześniej trzymałam wszystko w Excelu i modliłam się żeby nie zgubić certyfikatów.
                  Teraz dodaję wpis od razu po szkoleniu — z telefonu. Przed audytem mam wszystko gotowe
                  w kilka minut, a nie w kilka godzin."
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">Anna K.</span>
                  <span className="text-xs text-slate-500">Pielęgniarka, Kraków</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <div id="faq" className={`${cardCls} scroll-mt-32`}>
          <div className="border-b border-slate-100 px-6 py-4">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-base font-bold text-slate-900">Najczęstsze pytania</h2>
            <p className="mt-0.5 text-sm text-slate-500">Kliknij pytanie, aby zobaczyć odpowiedź.</p>
          </div>
          <div className="p-5">
            <FaqAccordion items={FAQ_ITEMS} />
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
                Załóż darmowe konto <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/rejestracja" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">
                Utwórz konto
              </Link>
            </div>
          </div>
        </div>

      </div>

      <FeatureGrid />
      <BottomCTA />
    </div>
  );
}
