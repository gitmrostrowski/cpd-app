// app/page.tsx
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
  Check,
  FileText,
  FlaskConical,
  FolderOpen,
  HeartPulse,
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

const cardCls = "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";
const TEAM_IMAGE = "/lekrze_konsyl_pion.png";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </p>
  );
}

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = open === i;

        return (
          <div
            key={item.q}
            className={`rounded-xl border transition-all ${
              isOpen ? "border-blue-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-left"
            >
              <span className="text-sm font-semibold text-slate-900">{item.q}</span>
              <span
                className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isOpen ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
                }`}
              >
                {isOpen ? (
                  <Minus className="h-3 w-3 text-blue-600" strokeWidth={2.5} />
                ) : (
                  <Plus className="h-3 w-3 text-slate-400" strokeWidth={2.5} />
                )}
              </span>
            </button>

            {isOpen ? (
              <div className="border-t border-slate-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-slate-600">
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-100 blur-3xl" />

      <div className="relative rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-blue-100 bg-blue-50">
              <BarChart3 className="h-4 w-4 text-blue-600" strokeWidth={1.8} />
            </span>
            <div>
              <div className="text-sm font-bold text-slate-950">Twój Panel CPD</div>
              <div className="text-xs text-slate-400">Przykład statusu użytkownika</div>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 px-3 py-2 text-right ring-1 ring-amber-100">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
              Do celu brakuje
            </div>
            <div className="text-2xl font-bold leading-none text-amber-700">90 pkt</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
            <span>Postęp punktów</span>
            <span>110 / 200 pkt</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[55%] rounded-full bg-blue-600" />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            ["110", "masz pkt", "text-slate-950"],
            ["200", "wymagane", "text-slate-950"],
            ["90", "brakuje", "text-amber-700"],
          ].map(([value, label, color]) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-xl bg-blue-600 p-4 text-white shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-100">Co teraz zrobić</div>
          <div className="mt-1 text-sm font-bold">Uzupełnij dokumenty</div>
          <div className="mt-0.5 text-xs text-blue-100">Masz 6 wpisów bez certyfikatu</div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Ostatnie aktywności
          </div>
          <div className="space-y-2">
            {[
              { name: "Konferencja kardiologiczna", cat: "Konferencja", pts: 20, stripe: "bg-amber-400" },
              { name: "Kurs online / webinar", cat: "E-learning", pts: 15, stripe: "bg-slate-500" },
              { name: "Kurs stacjonarny NIL", cat: "Kurs", pts: 6, stripe: "bg-emerald-400" },
            ].map((e) => (
              <div
                key={e.name}
                className="relative flex items-center gap-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-4 pr-3"
              >
                <div className={`absolute inset-y-2 left-0 w-1.5 rounded-r-full ${e.stripe}`} />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{e.name}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200">
                  {e.cat}
                </span>
                <span className="text-xs font-bold text-blue-600">+{e.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 3), 2800);
    return () => clearInterval(t);
  }, [visible]);

  const steps = [
    {
      n: "1",
      icon: UserRoundCheck,
      color: "blue",
      title: "Wybierz zawód",
      subtitle: "System sam ustawi wymagania",
      desc: "Powiedz nam kim jesteś. System dobierze odpowiedni okres i liczbę wymaganych punktów.",
      preview: (
        <div className="space-y-1.5">
          {[
            { l: "Lekarz", p: "200 pkt / 4 lata", a: true },
            { l: "Pielęgniarka", p: "100 pkt / 5 lat", a: false },
            { l: "Fizjoterapeuta", p: "100 pkt / 5 lat", a: false },
          ].map((x) => (
            <div
              key={x.l}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                x.a ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <span className="font-medium">{x.l}</span>
              <span className={`text-xs ${x.a ? "text-blue-100" : "text-slate-400"}`}>{x.p}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      n: "2",
      icon: UploadCloud,
      color: "amber",
      title: "Dodaj aktywność",
      subtitle: "Zdjęcie z telefonu wystarczy",
      desc: "Wpisz nazwę szkolenia i dołącz certyfikat. Punkty są naliczane automatycznie.",
      preview: (
        <div>
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <FileText className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">Konferencja kardiologiczna</p>
              <p className="text-xs text-slate-400">certyfikat.pdf · 2026</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-emerald-600">+20 pkt</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-400">
            <UploadCloud className="h-3.5 w-3.5 shrink-0" />
            Przeciągnij certyfikat lub kliknij
          </div>
        </div>
      ),
    },
    {
      n: "3",
      icon: TrendingUp,
      color: "emerald",
      title: "Masz pełny obraz",
      subtitle: "Zawsze wiesz co robić dalej",
      desc: "Ile punktów masz, ile brakuje i co zrobić jako następne. Jeden ekran, zero zgadywania.",
      preview: (
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>Postęp 2025–2028</span>
            <span className="font-bold text-slate-900">55%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-blue-600 transition-all duration-1000"
              style={{ width: visible ? "55%" : "0%" }}
            />
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {[
              { v: "110", l: "masz", c: "text-slate-900" },
              { v: "200", l: "cel", c: "text-slate-900" },
              { v: "90", l: "brak", c: "text-amber-700" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-slate-100 bg-slate-50 py-1.5 text-center">
                <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
                <div className="text-[10px] text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Następny krok: Uzupełnij dokumenty
          </div>
        </div>
      ),
    },
  ];

  const cm: Record<string, { bg: string; text: string; ring: string; num: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200", num: "bg-blue-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200", num: "bg-amber-500" },
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
              <button
                key={i}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeStep === i ? "w-6 bg-blue-600" : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hidden gap-0 md:grid md:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const c = cm[step.color];
          const isActive = activeStep === i;

          return (
            <button
              key={step.n}
              type="button"
              onClick={() => setActiveStep(i)}
              className={`group flex flex-col gap-3 border-r border-slate-100 p-6 text-left transition-all duration-300 last:border-r-0 ${
                isActive ? "bg-slate-50" : "hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-all ${
                    c.num
                  } ${isActive ? "scale-110 shadow-md" : ""}`}
                >
                  {step.n}
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-all ${
                    c.bg
                  } ${c.ring} ${isActive ? "scale-105" : ""}`}
                >
                  <Icon className={`h-5 w-5 ${c.text}`} strokeWidth={1.75} />
                </span>
              </div>

              <div>
                <p className={`text-sm font-bold ${isActive ? "text-slate-900" : "text-slate-700"}`}>
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-400">{step.subtitle}</p>
              </div>

              <p className="text-xs leading-relaxed text-slate-500">{step.desc}</p>
              <div className={`mt-auto transition-all duration-500 ${isActive ? "opacity-100" : "opacity-60"}`}>
                {step.preview}
              </div>
            </button>
          );
        })}
      </div>

      <div className="md:hidden">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const c = cm[step.color];
          if (activeStep !== i) return null;

          return (
            <div key={step.n} className="p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${c.num}`}>
                  {step.n}
                </span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${c.bg} ${c.ring}`}>
                  <Icon className={`h-5 w-5 ${c.text}`} strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-400">{step.subtitle}</p>
                </div>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-slate-500">{step.desc}</p>
              {step.preview}
            </div>
          );
        })}

        <div className="flex justify-center gap-2 border-t border-slate-100 py-3">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveStep(i)}
              className={`h-2 rounded-full transition-all ${activeStep === i ? "w-8 bg-blue-600" : "w-2 bg-slate-200"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, profession, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle<ProfileRow>();

      if (!alive) return;
      router.replace(profile ? "/kalkulator" : "/start");
    }

    run();

    return () => {
      alive = false;
    };
  }, [router, supabase]);

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    setActiveSection(id);

    const top = el.getBoundingClientRect().top + window.scrollY - 136;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className={`${cardCls} p-6 text-slate-500`}>Sprawdzam sesję…</div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className={`${cardCls} p-6 text-slate-500`}>Przenoszę…</div>
      </div>
    );
  }

  const navBase =
    "shrink-0 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none";
  const navActive =
    "shrink-0 border-b-2 border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-700 focus:outline-none";

  const FAQ = [
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
      a: "Tak. Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO: eksport PDF i przypomnienia.",
    },
  ];

  return (
    <div className="bg-slate-100 pb-4">
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-2">
        <nav className="sticky top-[76px] z-30 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
          <div className="flex min-w-max items-center justify-between">
            <div className="flex">
              {[
                { id: "hero", label: "O produkcie" },
                { id: "dla-kogo", label: "Dla kogo" },
                { id: "jak-to-dziala", label: "Jak to działa" },
                { id: "faq", label: "FAQ" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToId(id)}
                  className={activeSection === id ? navActive : navBase}
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
                Zacznij za darmo →
              </Link>
            </div>
          </div>
        </nav>

        <section id="hero" className={`${cardCls} scroll-mt-32`}>
          <div className="relative grid grid-cols-1 gap-8 p-6 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div className="pointer-events-none absolute left-0 top-5 h-16 w-1 rounded-r-full bg-blue-500" />

            <div className="relative z-10">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                Wkrótce: Asystent AI do zarządzania rozwojem zawodowym
              </div>

              <h1 className="text-[36px] font-bold leading-[1.08] tracking-tight text-slate-900 md:text-[50px]">
                Punkty CPD<br />
                pod kontrolą.<br />
                <span className="text-blue-600">Bez stresu.</span>
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500">
                Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w aktualnym
                okresie rozliczeniowym. Prosto. Spokojnie. Bez Excela.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { icon: FolderOpen, t: "Porządek bez wysiłku", d: "Wpisy i certyfikaty zawsze pod ręką.", bg: "bg-blue-50", ic: "text-blue-500" },
                  { icon: BarChart3, t: "Jasny status punktów", d: "Wiesz ile masz i czego brakuje.", bg: "bg-amber-50", ic: "text-amber-500" },
                  { icon: ShieldCheck, t: "Bezpieczne dane", d: "Tylko Ty masz dostęp. Dane w UE.", bg: "bg-slate-100", ic: "text-slate-500" },
                  { icon: Sparkles, t: "Start za darmo", d: "Podstawowe funkcje bezpłatnie. Bez karty.", bg: "bg-indigo-50", ic: "text-indigo-500" },
                ].map((b) => {
                  const Icon = b.icon;

                  return (
                    <div
                      key={b.t}
                      className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3 transition hover:bg-white hover:shadow-sm"
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${b.bg}`}>
                        <Icon className={`h-4 w-4 ${b.ic}`} strokeWidth={1.75} />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{b.t}</div>
                        <p className="mt-0.5 text-xs text-slate-500">{b.d}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                >
                  Załóż darmowe konto <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToId("jak-to-dziala")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                >
                  Jak to działa
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <ProductPreview />
            </div>
          </div>
        </section>

        <div className={cardCls}>
          <div className="px-6 py-4">
            <p className="mb-3 text-center text-[11px] font-semibold text-slate-600">
              CRPE wspiera zawody regulowane przez samorządy zawodowe
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                "Naczelna Izba Lekarska",
                "Naczelna Izba Pielęgniarek i Położnych",
                "Krajowa Izba Fizjoterapeutów",
                "Naczelna Izba Aptekarska",
                "Krajowa Izba Diagnostów Laboratoryjnych",
              ].map((n) => (
                <span key={n} className="text-xs font-medium text-slate-500">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className={`${cardCls} relative min-h-[310px]`}>
          <Image
            src={TEAM_IMAGE}
            alt="Zespół medyczny omawiający rozwój zawodowy"
            fill
            className="object-cover object-[50%_38%]"
            sizes="(max-width: 1024px) 100vw, 1120px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/45 to-slate-950/16" />
          <div className="relative max-w-2xl p-7 text-white">
            <Eyebrow>Dla profesjonalistów</Eyebrow>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Zarządzaj swoim rozwojem zawodowym bez chaosu.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
              Lekarz, pielęgniarka, fizjoterapeuta czy farmaceuta — CRPE pomaga zebrać szkolenia,
              punkty i dokumenty w jednym miejscu.
            </p>
            <button
              type="button"
              onClick={() => scrollToId("jak-to-dziala")}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Zobacz jak działa <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

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
                  { t: "Lekarze i lekarze dentyści", icon: Stethoscope },
                  { t: "Pielęgniarki i położne", icon: HeartPulse },
                  { t: "Fizjoterapeuci", icon: UserCog },
                  { t: "Farmaceuci", icon: Pill },
                  { t: "Diagności laboratoryjni", icon: FlaskConical },
                  { t: "Nowe zawody medyczne", icon: Users },
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
                  { t: "Historia wszystkich aktywności w jednym miejscu", icon: BookOpen },
                  { t: "Certyfikaty zawsze pod ręką (PDF / zdjęcia)", icon: Award },
                  { t: "Przejrzysty podgląd zdobytych punktów", icon: BarChart3 },
                  { t: "Gotowość do przygotowania raportu", icon: CalendarCheck },
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
                  <p className="mt-0.5 text-xs text-slate-500">Raport gotowy do wydruku + automatyczne przypomnienia.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <HowItWorks />

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className={cardCls}>
            <div className="p-6">
              <Eyebrow>Co mówią użytkownicy</Eyebrow>
              <Quote className="mb-2 h-5 w-5 text-blue-200" strokeWidth={1.5} />
              <p className="text-sm leading-relaxed text-slate-700">
                "Wcześniej trzymałam wszystko w Excelu i modliłam się żeby nie zgubić certyfikatów.
                Teraz dodaję wpis od razu po szkoleniu — z telefonu. Przed audytem mam wszystko gotowe
                w kilka minut, a nie w kilka godzin."
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-900">Anna K.</span>
                <span className="text-xs text-slate-400">Pielęgniarka, Kraków</span>
              </div>
            </div>
          </div>

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
      </div>

      <FeatureGrid />
      <BottomCTA />
    </div>
  );
}
