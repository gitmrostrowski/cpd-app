// app/page.tsx — poprawka podmenu sticky, 2/3 layout, wersja 2026-05-02 17:24 + aktualizacja 21:16
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
  QrCode,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

import BottomCTA from "@/components/BottomCTA";

type ProfileRow = {
  user_id: string;
  profession: string | null;
  period_start: number | null;
  period_end: number | null;
  required_points: number | null;
};

const pageWrap = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8";
const cardCls = "overflow-hidden rounded-[1.45rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5";

const IMG = {
  hero: "/lekarka_z_tabletem.png",
  team: "/lekrze_konsyl_pion.png",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </p>
  );
}

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`rounded-2xl border transition-all ${
              isOpen ? "border-blue-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50/80"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
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
    <div className="relative mx-auto w-full max-w-[470px] rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/10">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-blue-100 bg-blue-50">
            <BarChart3 className="h-4 w-4 text-blue-600" strokeWidth={1.9} />
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

      <div className="mb-4 rounded-2xl bg-blue-600 p-4 text-white shadow-sm">
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
  );
}

function PhotoCard({
  src,
  alt,
  title,
  text,
  className = "",
  imageClassName = "object-cover",
}: {
  src: string;
  alt: string;
  title: string;
  text: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-[1.45rem] border border-slate-200 bg-slate-900 shadow-sm ${className}`}>
      <Image src={src} alt={alt} fill className={`${imageClassName} transition duration-700 group-hover:scale-[1.03]`} sizes="(max-width: 1024px) 100vw, 780px" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/28 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white lg:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/90">CRPE w praktyce</p>
        <h3 className="mt-1.5 max-w-2xl text-xl font-bold leading-tight lg:text-2xl">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{text}</p>
      </div>
    </div>
  );
}

function CrpeFeatures() {
  const features = [
    {
      icon: UploadCloud,
      title: "Szybkie wpisy",
      text: "Dodajesz aktywność w 20–30 sekund. Bez zbędnych pól na start.",
    },
    {
      icon: FileText,
      title: "Certyfikaty w jednym miejscu",
      text: "PDF-y i zdjęcia certyfikatów są przypięte do konkretnych aktywności.",
    },
    {
      icon: BarChart3,
      title: "Status w okresie",
      text: "Widzisz ile punktów masz, ile brakuje i co wymaga uzupełnienia.",
    },
    {
      icon: ShieldCheck,
      title: "Porządek przed kontrolą",
      text: "Łatwiej przygotować historię aktywności i brakujące dokumenty.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <Eyebrow>Funkcje w CRPE</Eyebrow>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 lg:text-3xl">Co dostajesz w CRPE</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Minimum klików, maksimum porządku. Budujesz portfolio, które da się szybko sprawdzić i uzupełnić.
            </p>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 ring-1 ring-blue-100">
                  <Smartphone className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Planowana funkcja</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-950">Dodawanie certyfikatów z telefonu</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Po szkoleniu zeskanujesz QR kod, dodasz aktywność i zrobisz zdjęcie certyfikatu. Wszystko trafi do Twojego panelu od razu, bez Excela i bez przepisywania danych.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  { icon: QrCode, text: "Skan QR kodu szkolenia" },
                  { icon: UploadCloud, text: "Zdjęcie certyfikatu z telefonu" },
                  { icon: CheckCircle2, text: "Automatyczny wpis do bazy" },
                  { icon: BellIcon, text: "Przypomnienie o brakach" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-blue-100">
                    <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:p-8">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/5">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <h3 className="text-sm font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ReminderSection() {
  const items = [
    "brakujące certyfikaty przy aktywnościach",
    "zbliżający się koniec okresu rozliczeniowego",
    "aktywności, które warto uzupełnić przed raportem",
  ];

  return (
    <div id="przypomnienia" className="scroll-mt-32">
      <div className="overflow-hidden rounded-[1.6rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white shadow-sm shadow-slate-900/5">
        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b border-blue-100 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <Eyebrow>Przypomnienia</Eyebrow>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Nie przegap brakujących dokumentów</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              CRPE może pomagać nie tylko w przechowywaniu certyfikatów, ale też w pilnowaniu braków i terminów.
              Dzięki temu łatwiej przygotować się do raportu bez nerwowego sprawdzania wszystkiego na końcu okresu.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3 lg:p-8">
            {items.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
                  <BellIcon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold leading-snug text-slate-900">{item}</p>
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
            <div className="h-3 rounded-full bg-blue-600 transition-all duration-1000" style={{ width: visible ? "55%" : "0%" }} />
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
      <div className="border-b border-slate-100 px-6 py-5 lg:px-8">
        <Eyebrow>Proces</Eyebrow>
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Zobacz, jak CRPE prowadzi Cię krok po kroku</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-blue-600/20">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                2 minuty do pierwszego wpisu
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Od wyboru zawodu, przez dodanie certyfikatu, aż po jasny status punktów — bez Excela i zgadywania.</p>
          </div>
          <div className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:block">
            Interaktywny podgląd
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
              className={`group flex min-h-[310px] flex-col gap-3 border-r border-slate-100 p-6 text-left transition-all duration-300 last:border-r-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 lg:p-7 ${
                isActive ? "bg-gradient-to-br from-blue-50/80 via-white to-white shadow-inner" : "hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-all ${c.num} ${isActive ? "scale-110 shadow-md" : ""}`}>
                  {step.n}
                </span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-all ${c.bg} ${c.ring} ${isActive ? "scale-105" : ""}`}>
                  <Icon className={`h-5 w-5 ${c.text}`} strokeWidth={1.75} />
                </span>
              </div>
              <div>
                <p className={`text-base font-bold ${isActive ? "text-slate-900" : "text-slate-700"}`}>{step.title}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-400">{step.subtitle}</p>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
              <div className={`mt-auto transition-all duration-500 ${isActive ? "opacity-100" : "opacity-60"}`}>{step.preview}</div>
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
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${c.num}`}>{step.n}</span>
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
              aria-label={`Pokaż krok ${i + 1}`}
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
    const top = el.getBoundingClientRect().top + window.scrollY - 158;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }

  if (checking) {
    return (
      <div className={`${pageWrap} py-10`}>
        <div className={`${cardCls} p-6 text-slate-500`}>Sprawdzam sesję…</div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className={`${pageWrap} py-10`}>
        <div className={`${cardCls} p-6 text-slate-500`}>Przenoszę…</div>
      </div>
    );
  }

  const navItems = [
    { id: "hero", label: "O produkcie" },
    { id: "dla-kogo", label: "Dla kogo" },
    { id: "jak-to-dziala", label: "Jak to działa" },
    { id: "funkcje", label: "Funkcje CRPE" },
    { id: "przypomnienia", label: "Przypomnienia" },
    { id: "faq", label: "FAQ" },
  ];

  const navBase =
    "shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-blue-700";
  const navActive =
    "shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20";

  const FAQ = [
    { q: "Czy CRPE jest połączone z systemami państwowymi?", a: "Nie. CRPE służy do Twojej kontroli i uporządkowania danych. Systemy państwowe są zamknięte." },
    { q: "Czy moje certyfikaty są bezpieczne?", a: "Tak. Dane są zabezpieczone, a dostęp do nich masz tylko Ty. Przechowujemy dane w UE." },
    { q: "Czy mogę korzystać z telefonu?", a: "Tak. Możesz dodać certyfikat od razu po szkoleniu — nawet jako zdjęcie z telefonu." },
    { q: "Czy korzystanie jest darmowe?", a: "Tak. Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO: eksport PDF i przypomnienia." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="sticky top-[76px] z-30 border-b border-slate-200 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className={`${pageWrap} py-2.5`}>
          <nav className="flex w-full items-center justify-center overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm shadow-slate-900/5">
            <div className="flex min-w-max items-center justify-center gap-1.5">
              {navItems.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => scrollToId(id)} className={activeSection === id ? navActive : navBase}>
                  {label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      <section className="bg-[radial-gradient(circle_at_top_left,#dbeafe_0,transparent_34%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_100%)] py-7 lg:py-10">
        <div className={pageWrap}>
          <div id="hero" className="scroll-mt-32 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
            <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[2fr_1fr] lg:p-10 xl:p-12">
              <div className="pointer-events-none absolute left-0 top-8 h-24 w-1.5 rounded-r-full bg-blue-600" />
              <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-blue-100/80 blur-3xl" />

              <div className="relative z-10 flex flex-col justify-center">
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-700">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.75} />
                  Wkrótce: Asystent AI do zarządzania rozwojem zawodowym
                </div>

                <h1 className="max-w-3xl text-[42px] font-bold leading-[1.04] tracking-tight text-slate-950 sm:text-[56px] lg:text-[62px]">
                  Punkty CPD pod kontrolą. <span className="text-blue-600">Bez stresu.</span>
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
                  Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w aktualnym
                  okresie rozliczeniowym. Prosto. Spokojnie. Bez Excela.
                </p>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { icon: FolderOpen, t: "Porządek bez wysiłku", d: "Wpisy i certyfikaty zawsze pod ręką.", bg: "bg-blue-100", ic: "text-blue-700", ring: "ring-blue-200" },
                    { icon: BarChart3, t: "Jasny status punktów", d: "Wiesz ile masz i czego brakuje.", bg: "bg-amber-100", ic: "text-amber-700", ring: "ring-amber-200" },
                    { icon: ShieldCheck, t: "Bezpieczne dane", d: "Tylko Ty masz dostęp. Dane w UE.", bg: "bg-emerald-100", ic: "text-emerald-700", ring: "ring-emerald-200" },
                    { icon: Sparkles, t: "Start za darmo", d: "Podstawowe funkcje bezpłatnie. Bez karty.", bg: "bg-indigo-100", ic: "text-indigo-700", ring: "ring-indigo-200" },
                  ].map((b) => {
                    const Icon = b.icon;
                    return (
                      <div key={b.t} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm shadow-slate-900/5">
                        <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${b.bg} ring-1 ${b.ring}`}>
                          <Icon className={`h-5 w-5 ${b.ic}`} strokeWidth={2} />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{b.t}</div>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{b.d}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/login" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95">
                    Załóż darmowe konto <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={() => scrollToId("jak-to-dziala")} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">
                    Jak to działa
                  </button>
                </div>
              </div>

              <div className="relative z-10 min-h-[380px] overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-900 shadow-xl shadow-slate-950/10 lg:min-h-[500px]">
                <Image src={IMG.hero} alt="Pracowniczka medyczna z tabletem" fill priority className="object-cover object-[50%_22%]" sizes="(max-width: 1024px) 100vw, 390px" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/90">CRPE w praktyce</p>
                  <h3 className="mt-1.5 text-xl font-bold leading-tight">Panel zawsze pod ręką</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">Dodajesz wpisy i dokumenty na bieżąco.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-6">
        <div className={pageWrap}>
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm shadow-slate-900/5">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900">
              CRPE wspiera zawody regulowane przez samorządy zawodowe
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
              {[
                "Naczelną Izbę Lekarską",
                "Naczelną Izbę Pielęgniarek i Położnych",
                "Krajową Izbę Fizjoterapeutów",
                "Naczelną Izbę Aptekarską",
                "Krajową Izbę Diagnostów Laboratoryjnych",
              ].map((n) => (
                <span key={n} className="text-xs font-medium text-slate-500">{n}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-7 lg:py-9">
        <div className={`${pageWrap} space-y-6`}>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <PhotoCard
              src={IMG.team}
              alt="Zespół medyczny przy stole"
              title="CRPE pomaga każdemu specjaliście pilnować własnych punktów, terminów i certyfikatów."
              text=""
              className="min-h-[390px] lg:min-h-[455px]"
              imageClassName="object-cover object-[50%_16%]"
            />
            <div className="flex min-h-[390px] items-center rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 lg:min-h-[455px]">
              <ProductPreview />
            </div>
          </div>

          <div id="dla-kogo" className="grid scroll-mt-32 gap-6 lg:grid-cols-2">
            <div className={cardCls}>
              <div className="border-b border-slate-100 px-6 py-5 lg:px-8">
                <Eyebrow>Odbiorcy</Eyebrow>
                <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Dla kogo jest CRPE</h2>
                <p className="mt-1 text-sm text-slate-500">Dla zawodów medycznych zbierających punkty edukacyjne.</p>
              </div>

              <div className="p-5 lg:p-7">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { t: "Lekarze i lekarze dentyści", icon: Stethoscope },
                    { t: "Pielęgniarki i położne", icon: HeartPulse },
                    { t: "Fizjoterapeuci", icon: UserCog },
                    { t: "Farmaceuci", icon: Pill },
                    { t: "Diagności laboratoryjni", icon: FlaskConical },
                    { t: "Nowe zawody medyczne", icon: Users },
                  ].map(({ t, icon: Icon }) => (
                    <div key={t} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                        <Icon className="h-5 w-5" strokeWidth={2.1} />
                      </span>
                      <span className="text-sm font-medium text-slate-800">{t}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Jeśli musisz zbierać punkty — CRPE jest dla Ciebie.</p>
                  <p className="mt-0.5 text-xs text-slate-500">Zacznij od kilku wpisów. Resztę uzupełniaj stopniowo.</p>
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <div className="border-b border-slate-100 px-6 py-5 lg:px-8">
                <Eyebrow>Wartość</Eyebrow>
                <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Co zyskujesz</h2>
                <p className="mt-1 text-sm text-slate-500">Porządek i jasny status. Bez komplikacji.</p>
              </div>

              <div className="p-5 lg:p-7">
                <div className="space-y-3">
                  {[
                    { t: "Historia wszystkich aktywności w jednym miejscu", icon: BookOpen },
                    { t: "Certyfikaty zawsze pod ręką (PDF / zdjęcia)", icon: Award },
                    { t: "Przejrzysty podgląd zdobytych punktów", icon: BarChart3 },
                    { t: "Gotowość do przygotowania raportu", icon: CalendarCheck },
                  ].map(({ t, icon: Icon }) => (
                    <div key={t} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
                        <Icon className="h-5 w-5" strokeWidth={2.1} />
                      </span>
                      <span className="text-sm font-medium text-slate-800">{t}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                    <FileText className="h-5 w-5" strokeWidth={2.1} />
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
        </div>
      </section>

      <section className="bg-white py-6 lg:py-8">
        <div className={`${pageWrap} space-y-6`}>
          <HowItWorks />

          <div id="funkcje" className="scroll-mt-32">
            <CrpeFeatures />
          </div>

          <ReminderSection />
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div id="faq" className={`${cardCls} scroll-mt-32`}>
              <div className="border-b border-slate-100 px-6 py-5 lg:px-8">
                <Eyebrow>FAQ</Eyebrow>
                <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Najczęstsze pytania</h2>
                <p className="mt-1 text-sm text-slate-500">Kliknij pytanie, aby zobaczyć odpowiedź.</p>
              </div>
              <div className="p-5 lg:p-7">
                <FaqAccordion items={FAQ} />
              </div>
            </div>

            <div className={cardCls}>
              <div className="p-6 lg:p-8">
                <Eyebrow>Co mówią użytkownicy</Eyebrow>
                <Quote className="mb-3 h-6 w-6 text-blue-200" strokeWidth={1.5} />
                <p className="text-base leading-relaxed text-slate-700">
                  "Wcześniej trzymałam wszystko w Excelu i modliłam się żeby nie zgubić certyfikatów.
                  Teraz dodaję wpis od razu po szkoleniu — z telefonu. Przed audytem mam wszystko gotowe
                  w kilka minut, a nie w kilka godzin."
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
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
          </div>
        </div>
 
