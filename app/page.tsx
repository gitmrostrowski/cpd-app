"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";
import {
  ArrowRight, Award, BarChart3, BookOpen, CalendarCheck,
  Camera, Check, ClipboardCheck, FileText, FlaskConical,
  FolderOpen, GraduationCap, HeartPulse, Mail, Minus,
  Pill, Plus, Quote, ShieldCheck, Sparkles, Star,
  Stethoscope, TrendingUp, UploadCloud, UserCog,
  UserRoundCheck, Users,
} from "lucide-react";

import FeatureGrid from "@/components/FeatureGrid";
import BottomCTA from "@/components/BottomCTA";

type ProfileRow = {
  user_id: string; profession: string | null;
  period_start: number | null; period_end: number | null;
  required_points: number | null;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/* ─── shared card style ──────────────────────────────────────────────────── */
const cardCls = "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">{children}</p>;
}

/* ─── FAQ ─────────────────────────────────────────────────────────────────── */
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

/* ─── Animated counter ───────────────────────────────────────────────────── */
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
        const p = Math.min((now - start) / duration, 1);
        setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { value, ref };
}

function AnimCount({ n, suffix = "" }: { n: number; suffix?: string }) {
  const { value, ref } = useCounter(n);
  return <span ref={ref}>{value}{suffix}</span>;
}

/* ─── HowItWorks — animated 3 steps ─────────────────────────────────────── */
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
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
      desc: "Powiedz nam kim jesteś. System dobierze odpowiedni okres i liczbę wymaganych punktów.",
      preview: (
        <div className="space-y-1.5">
          {[{ l: "Lekarz", p: "200 pkt / 4 lata", active: true }, { l: "Pielęgniarka", p: "100 pkt / 5 lat", active: false }, { l: "Fizjoterapeuta", p: "100 pkt / 5 lat", active: false }].map((p) => (
            <div key={p.l} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${p.active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <span className="font-medium">{p.l}</span>
              <span className={`text-xs ${p.active ? "text-blue-100" : "text-slate-400"}`}>{p.p}</span>
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
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50"><FileText className="h-4 w-4 text-amber-500" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">Konferencja kardiologiczna</p>
              <p className="text-xs text-slate-400">certyfikat.pdf · 2026</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-emerald-600">+20 pkt</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-400">
            <UploadCloud className="h-3.5 w-3.5 shrink-0" />Przeciągnij certyfikat lub kliknij
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
          <div className="mb-1.5 flex justify-between text-xs text-slate-500"><span>Postęp 2025–2028</span><span className="font-bold text-slate-900">55%</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-blue-600 transition-all duration-1000" style={{ width: visible ? "55%" : "0%" }} />
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {[{ v: "110", l: "masz", c: "text-slate-900" }, { v: "200", l: "cel", c: "text-slate-900" }, { v: "90", l: "brak", c: "text-red-500" }].map((s) => (
              <div key={s.l} className="rounded-lg border border-slate-100 bg-slate-50 py-1.5 text-center">
                <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
                <div className="text-[10px] text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Następny krok: Uzupełnij dokumenty
          </div>
        </div>
      ),
    },
  ];

  const cm: Record<string, { bg: string; text: string; ring: string; num: string }> = {
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
            {steps.map((_, i) => <button key={i} onClick={() => setActiveStep(i)} className={`h-2 rounded-full transition-all duration-300 ${activeStep === i ? "w-6 bg-blue-600" : "w-2 bg-slate-200 hover:bg-slate-300"}`} />)}
          </div>
        </div>
      </div>
      <div className="hidden gap-0 md:grid md:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = step.icon; const c = cm[step.color]; const isActive = activeStep === i;
          return (
            <button key={step.n} type="button" onClick={() => setActiveStep(i)}
              className={`group flex flex-col gap-3 border-r border-slate-100 p-6 text-left transition-all duration-300 last:border-r-0 ${isActive ? "bg-slate-50" : "hover:bg-slate-50/50"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-all ${c.num} ${isActive ? "scale-110 shadow-md" : ""}`}>{step.n}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-all ${c.bg} ${c.ring} ${isActive ? "scale-105" : ""}`}>
                  <Icon className={`h-5 w-5 ${c.text}`} strokeWidth={1.75} />
                </span>
              </div>
              <div>
                <p className={`text-sm font-bold ${isActive ? "text-slate-900" : "text-slate-700"}`}>{step.title}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-400">{step.subtitle}</p>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">{step.desc}</p>
              <div className={`mt-auto transition-all duration-500 ${isActive ? "opacity-100" : "opacity-60"}`}>{step.preview}</div>
            </button>
          );
        })}
      </div>
      <div className="md:hidden">
        {steps.map((step, i) => {
          const Icon = step.icon; const c = cm[step.color];
          if (activeStep !== i) return null;
          return (
            <div key={step.n} className="p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${c.num}`}>{step.n}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${c.bg} ${c.ring}`}><Icon className={`h-5 w-5 ${c.text}`} strokeWidth={1.75} /></span>
                <div><p className="text-sm font-bold text-slate-900">{step.title}</p><p className="text-xs text-slate-400">{step.subtitle}</p></div>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-slate-500">{step.desc}</p>
              {step.preview}
            </div>
          );
        })}
        <div className="flex justify-center gap-2 border-t border-slate-100 py-3">
          {steps.map((_, i) => <button key={i} onClick={() => setActiveStep(i)} className={`h-2 rounded-full transition-all ${activeStep === i ? "w-8 bg-blue-600" : "w-2 bg-slate-200"}`} />)}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function Page() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router   = useRouter();
  const [checking,   setChecking]   = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    let alive = true;
    async function run() {
      setChecking(true);
      const { data: auth, error } = await supabase.auth.getUser();
      if (!alive) return;
      if (error || !auth?.user) { setIsLoggedIn(false); setChecking(false); return; }
      setIsLoggedIn(true);
      const { data: profile } = await supabase.from("profiles").select("user_id, profession, period_start, period_end, required_points").eq("user_id", auth.user.id).maybeSingle<ProfileRow>();
      if (!alive) return;
      router.replace(profile ? "/kalkulator" : "/start");
    }
    run();
    return () => { alive = false; };
  }, [router, supabase]);

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveSection(id);
    const top = el.getBoundingClientRect().top + window.scrollY - 136;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }

  if (checking)   return <div className="mx-auto max-w-6xl px-4 py-10"><div className={`${cardCls} p-6 text-slate-500`}>Sprawdzam sesję…</div></div>;
  if (isLoggedIn) return <div className="mx-auto max-w-6xl px-4 py-10"><div className={`${cardCls} p-6 text-slate-500`}>Przenoszę…</div></div>;

  const FAQ = [
    { q: "Czy CRPE jest połączone z systemami państwowymi?", a: "Nie. CRPE to narzędzie do Twojej własnej kontroli i organizacji danych. Systemy państwowe są zamknięte." },
    { q: "Czy moje certyfikaty są bezpieczne?", a: "Tak. Dane są szyfrowane, a dostęp masz tylko Ty. Przechowujemy je w UE." },
    { q: "Czy mogę korzystać z telefonu?", a: "Tak. Certyfikat możesz dodać od razu po szkoleniu — nawet jako zdjęcie z telefonu." },
    { q: "Czy korzystanie jest darmowe?", a: "Tak. Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO: eksport PDF i przypomnienia." },
  ];

  return (
    <div className="bg-slate-100 pb-4">
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-2">

        {/* ── SUBNAV — jeden przycisk CTA ──────────────────────────────── */}
        <nav className="sticky top-[76px] z-30 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
          <div className="flex min-w-max items-center justify-between">
            <div className="flex">
              {([
                { id: "hero",          label: "O produkcie" },
                { id: "dla-kogo",      label: "Dla kogo"    },
                { id: "jak-to-dziala", label: "Jak to działa" },
                { id: "faq",           label: "FAQ"          },
              ] as const).map(({ id, label }) => (
                <button key={id} type="button" onClick={() => scrollToId(id)}
                  className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none ${activeSection === id ? "border-blue-600 font-semibold text-blue-700" : "border-transparent text-slate-500 hover:border-blue-300 hover:text-blue-700"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="shrink-0 pr-3">
              <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95">
                Zacznij za darmo →
              </Link>
            </div>
          </div>
        </nav>

        {/* ══════════════════════════════════════════════════════════════
            HERO — przestronny, lekki, z grafiką
        ══════════════════════════════════════════════════════════════ */}
        <div id="hero" className={`${cardCls} scroll-mt-32`}>
          <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-[280px_1fr_380px]">

            {/* FAR LEFT — zdjecie lekarki z tabletem */}
            <div className="relative hidden overflow-hidden lg:block" style={{ minHeight: "580px" }}>
              <Image
                src="/hero-medical.png"
                alt="Lekarka z tabletem CRPE"
                fill
                className="object-cover object-left"
                style={{ objectPosition: "0% center" }}
                priority
              />
              {/* subtelny gradient po prawej stronie zdjecia — plynne przejscie */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/90" />
            </div>

            {/* MIDDLE — copy */}
            <div className="flex flex-col justify-center border-l border-slate-100 px-8 py-10 lg:py-12">
              {/* Eyebrow badge */}
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                Bezpłatne dla zawodów medycznych
              </div>

              <h1 className="max-w-lg text-[38px] font-bold leading-[1.08] tracking-tight text-slate-900 md:text-[48px]">
                Punkty CPD<br />pod kontrolą.<br />
                <span className="text-blue-600">Bez stresu.</span>
              </h1>

              <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-500">
                Dodawaj szkolenia, przechowuj certyfikaty i sprawdzaj postęp — wszystko w jednym miejscu. Prosto. Spokojnie.
              </p>

              {/* Social proof */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">{[1,2,3,4,5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
                  <span className="font-medium text-slate-700">4.9 / 5</span>
                </div>
                <span className="text-slate-300">·</span>
                <span><AnimCount n={1200} />+ użytkowników</span>
                <span className="text-slate-300">·</span>
                <span>Bezpłatne · Bez karty</span>
              </div>

              {/* Checklist — zwarta */}
              <div className="mt-6 space-y-2">
                {[
                  "Certyfikaty w jednym miejscu — zawsze pod ręką",
                  "Jasny status punktów w aktualnym okresie",
                  "Dane bezpieczne, przechowywane w UE",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                      <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                    </span>
                    <span className="text-sm text-slate-700">{t}</span>
                  </div>
                ))}
              </div>

              {/* Jeden główny CTA */}
              <div className="mt-8">
                <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
                  Zacznij za darmo <ArrowRight className="h-5 w-5" />
                </Link>
                <p className="mt-2 text-xs text-slate-400">Bez karty kredytowej · Rejestracja zajmuje 30 sekund</p>
              </div>
            </div>

            {/* RIGHT — mockup Panelu CPD */}
            <div className="flex items-stretch border-l border-slate-100 bg-slate-50/60">
              <div className="flex w-full flex-col gap-0 p-5">

                {/* Mini header — jak Panel CPD */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Twój Panel CPD</div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">Zsynchronizowany</span>
                </div>

                {/* KPI box */}
                <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Do celu brakuje</div>
                    <div className="text-3xl font-bold leading-none text-red-500">90 pkt</div>
                    <div className="mt-1 text-xs text-slate-400">Masz 110 / 200 pkt · okres 2025–2028</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Czas</div>
                    <div className="text-xl font-bold text-slate-900">976 dni</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">do końca okresu</div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Postęp punktów</span><span className="font-semibold">55%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-2.5 rounded-full bg-blue-600" style={{ width: "55%" }} />
                </div>

                {/* Co teraz zrobic */}
                <div className="mt-3 overflow-hidden rounded-lg border border-blue-200 bg-blue-600 px-4 py-3">
                  <div className="text-xs font-bold text-white">Co teraz zrobić</div>
                  <div className="mt-0.5 text-xs text-blue-100">Uzupełnij dokumenty — 6 wpisów bez certyfikatu</div>
                </div>

                {/* Ostatnie wpisy — z colored stripes jak w Panelu */}
                <div className="mt-3">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ostatnie aktywności</div>
                  <div className="space-y-1.5">
                    {[
                      { name: "Konferencja kardiologiczna", cat: "Konferencja", pts: 20, stripe: "bg-amber-400" },
                      { name: "Kurs online / webinar", cat: "E-learning", pts: 15, stripe: "bg-blue-400"  },
                      { name: "Kurs stacjonarny NIL", cat: "Kurs", pts: 6, stripe: "bg-emerald-400" },
                    ].map((e) => (
                      <div key={e.name} className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-slate-100 bg-white py-2 pl-4 pr-3">
                        <div className={`absolute inset-y-1.5 left-0 w-1.5 rounded-r-full ${e.stripe}`} />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">{e.name}</span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{e.cat}</span>
                        <span className="shrink-0 text-xs font-bold text-blue-600">+{e.pts}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Limity mini */}
                <div className="mt-3">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Twoje limity</div>
                  {[
                    { l: "Szkolenie wewnętrzne", pct: 0  },
                    { l: "Prenumerata",           pct: 50 },
                    { l: "Towarzystwo/Kolegium",  pct: 25 },
                  ].map((r) => (
                    <div key={r.l} className="mb-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{r.l}</span><span>{r.pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${r.pct >= 50 ? "bg-blue-500" : "bg-slate-300"}`} style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ── PASEK IZB ──────────────────────────────────────────────── */}
        <div className={cardCls}>
          <div className="px-6 py-4">
            <p className="mb-3 text-center text-[11px] font-semibold text-slate-600">
              CRPE wspiera zawody regulowane przez samorządy zawodowe
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["Naczelna Izba Lekarska", "Naczelna Izba Pielęgniarek i Położnych", "Krajowa Izba Fizjoterapeutów", "Naczelna Izba Aptekarska", "Krajowa Izba Diagnostów Laboratoryjnych"].map((n) => (
                <span key={n} className="text-xs font-medium text-slate-500">{n}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── DLA KOGO + CO ZYSKUJESZ ────────────────────────────────── */}
        {/* Zdjecie zespolu medycznego — miedzy sekcjami */}
        <div className="overflow-hidden rounded-xl shadow-sm" style={{ height: "200px" }}>
          <div className="relative h-full w-full">
            <Image
              src="/hero-medical.png"
              alt="Zespol medyczny na szkoleniu"
              fill
              className="object-cover"
              style={{ objectPosition: "33% center" }}
            />
            {/* Dark overlay z tekstem */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-8">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Dla profesjonalistów</p>
              <p className="mt-1 text-2xl font-bold text-white">Zarządzaj swoim rozwojem zawodowym</p>
              <p className="mt-1 text-sm text-white/70">Dla lekarzy, pielęgniarek, fizjoterapeutów i wszystkich zbierających punkty CPD</p>
            </div>
          </div>
        </div>

        <div id="dla-kogo" className="grid scroll-mt-32 gap-4 lg:grid-cols-2">
          <div className={cardCls}>
            <div className="border-b border-slate-100 px-6 py-4">
              <Eyebrow>Odbiorcy</Eyebrow>
              <h2 className="text-base font-bold text-slate-900">Dla kogo jest CRPE</h2>
              <p className="mt-0.5 text-sm text-slate-500">Dla zawodów medycznych zbierających punkty edukacyjne.</p>
            </div>
            <div className="p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { t: "Lekarze i lekarze dentyści",  icon: Stethoscope  },
                  { t: "Pielęgniarki i położne",      icon: HeartPulse   },
                  { t: "Fizjoterapeuci",              icon: UserCog      },
                  { t: "Farmaceuci",                  icon: Pill         },
                  { t: "Diagności laboratoryjni",     icon: FlaskConical },
                  { t: "Nowe zawody medyczne",        icon: Users        },
                ].map(({ t, icon: Icon }) => (
                  <div key={t} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                      <Icon className="h-4 w-4 text-teal-600" strokeWidth={1.75} />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Jeśli musisz zbierać punkty — CRPE jest dla Ciebie.</p>
                <p className="mt-0.5 text-xs text-slate-500">Zacznij od kilku wpisów. Resztę uzupełniaj stopniowo.</p>
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <div className="border-b border-slate-100 px-6 py-4">
              <Eyebrow>Wartość</Eyebrow>
              <h2 className="text-base font-bold text-slate-900">Co zyskujesz</h2>
              <p className="mt-0.5 text-sm text-slate-500">Porządek i jasny status. Bez komplikacji.</p>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {[
                  { t: "Historia wszystkich aktywności w jednym miejscu", icon: BookOpen      },
                  { t: "Certyfikaty zawsze pod ręką (PDF / zdjęcia)",     icon: Award         },
                  { t: "Przejrzysty podgląd zdobytych punktów",           icon: BarChart3     },
                  { t: "Gotowość do przygotowania raportu",               icon: CalendarCheck },
                ].map(({ t, icon: Icon }) => (
                  <div key={t} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <Icon className="h-4 w-4 text-blue-600" strokeWidth={1.75} />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <FileText className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Wkrótce — PRO</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">Eksport PDF i przypomnienia</p>
                  <p className="mt-0.5 text-xs text-slate-500">Raport gotowy do wydruku + automatyczne przypomnienia o brakach.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── JAK TO DZIAŁA ──────────────────────────────────────────── */}
        <HowItWorks />

        {/* ── TESTIMONIAL z certyfikatem ──────────────────────────────── */}
        <div className={cardCls}>
          <div className="grid grid-cols-1 gap-0 md:grid-cols-[240px_1fr]">
            {/* Zdjecie certyfikatu */}
            <div className="relative hidden overflow-hidden rounded-l-xl md:block" style={{ minHeight: "200px" }}>
              <Image
                src="/hero-medical.png"
                alt="Certyfikat CRPE na tablecie"
                fill
                className="object-cover"
                style={{ objectPosition: "100% center" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/60" />
            </div>
            <div className="p-6">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-start md:text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">AK</div>
              <div>
                <Quote className="mb-2 h-5 w-5 text-blue-200" strokeWidth={1.5} />
                <p className="text-sm leading-relaxed text-slate-700">
                  "Wcześniej trzymałam wszystko w Excelu. Teraz dodaję wpis od razu po szkoleniu — z telefonu.
                  Przed audytem mam wszystko gotowe w kilka minut, a nie w kilka godzin."
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <div className="flex gap-0.5">{[1,2,3,4,5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
                  <span className="text-sm font-semibold text-slate-900">Anna K.</span>
                  <span className="text-xs text-slate-400">Pielęgniarka, Kraków</span>
                </div>
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
            <FaqAccordion items={FAQ} />
          </div>
        </div>

      </div>

      <FeatureGrid />
      <BottomCTA />
    </div>
  );
}
