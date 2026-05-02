// app/page.tsx — poprawka layoutu, ikon, podmenu i sekcji funkcji CRPE
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
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  FileText,
  FlaskConical,
  FolderOpen,
  HeartPulse,
  Minus,
  Pill,
  Plus,
  QrCode,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Smartphone,
  TrendingUp,
  UploadCloud,
  UserCog,
  UserRoundCheck,
  Users,
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
const iconBox = "flex shrink-0 items-center justify-center rounded-xl border";

const IMG = {
  hero: "/lekarka_z_tabletem.png",
  team: "/lekrze_konsyl_pion.png",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{children}</p>;
}

function IconTile({
  children,
  tone = "blue",
  className = "h-11 w-11",
}: {
  children: React.ReactNode;
  tone?: "blue" | "emerald" | "amber" | "indigo" | "slate";
  className?: string;
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return <span className={`${iconBox} ${className} ${tones[tone]}`}>{children}</span>;
}

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={`rounded-2xl border transition-all ${isOpen ? "border-blue-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50/80"}`}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
              <span className="text-sm font-semibold text-slate-900">{item.q}</span>
              <span className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border transition-colors ${isOpen ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
                {isOpen ? <Minus className="h-3 w-3 text-blue-600" strokeWidth={2.5} /> : <Plus className="h-3 w-3 text-slate-400" strokeWidth={2.5} />}
              </span>
            </button>
            {isOpen ? <div className="border-t border-slate-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-slate-600">{item.a}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-none flex-col justify-center rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/10">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <IconTile className="h-10 w-10"><BarChart3 className="h-4 w-4" strokeWidth={1.9} /></IconTile>
          <div>
            <div className="text-sm font-bold text-slate-950">Twój Panel CPD</div>
            <div className="text-xs text-slate-400">Przykład statusu użytkownika</div>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 px-3 py-2 text-right ring-1 ring-amber-100">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Do celu brakuje</div>
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
        {[["110", "masz pkt", "text-slate-950"], ["200", "wymagane", "text-slate-950"], ["90", "brakuje", "text-amber-700"]].map(([value, label, color]) => (
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
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ostatnie aktywności</div>
        <div className="space-y-2">
          {[
            { name: "Konferencja kardiologiczna", cat: "Konferencja", pts: 20, stripe: "bg-amber-400" },
            { name: "Kurs online / webinar", cat: "E-learning", pts: 15, stripe: "bg-slate-500" },
            { name: "Kurs stacjonarny NIL", cat: "Kurs", pts: 6, stripe: "bg-emerald-400" },
          ].map((e) => (
            <div key={e.name} className="relative flex items-center gap-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-4 pr-3">
              <div className={`absolute inset-y-2 left-0 w-1.5 rounded-r-full ${e.stripe}`} />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{e.name}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200">{e.cat}</span>
              <span className="text-xs font-bold text-blue-600">+{e.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhotoCard({ src, alt, title, text, className = "", imageClassName = "object-cover" }: { src: string; alt: string; title: string; text: string; className?: string; imageClassName?: string }) {
  return (
    <div className={`group relative overflow-hidden rounded-[1.45rem] border border-slate-200 bg-slate-900 shadow-sm ${className}`}>
      <Image src={src} alt={alt} fill className={`${imageClassName} transition duration-700 group-hover:scale-[1.03]`} sizes="(max-width: 1024px) 100vw, 780px" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/28 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white lg:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/90">CRPE w praktyce</p>
        <h3 className="mt-1.5 max-w-2xl text-xl font-bold leading-tight lg:text-2xl">{title}</h3>
        {text ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{text}</p> : null}
      </div>
    </div>
  );
}

function CrpeFeatures() {
  const features = [
    { icon: UploadCloud, title: "Szybkie wpisy", text: "Dodajesz aktywność w 20–30 sekund. Bez zbędnych pól na start." },
    { icon: FileText, title: "Certyfikaty w jednym miejscu", text: "PDF-y i zdjęcia certyfikatów są przypięte do konkretnych aktywności." },
    { icon: ShieldCheck, title: "Porządek przed kontrolą", text: "Łatwiej przygotować historię aktywności i brakujące dokumenty." },
    { icon: BarChart3, title: "Status w okresie", text: "Widzisz ile punktów masz, ile brakuje i co wymaga uzupełnienia." },
  ];

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r lg:p-8">
          <Eyebrow>Funkcje w CRPE</Eyebrow>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 lg:text-3xl">Co dostajesz w CRPE</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">Minimum klików, maksimum porządku. Budujesz portfolio, które da się szybko sprawdzić i uzupełnić.</p>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex gap-3">
              <IconTile className="h-11 w-11"><Smartphone className="h-5 w-5" strokeWidth={2.1} /></IconTile>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Planowana funkcja</p>
                <p className="mt-0.5 text-sm font-bold text-slate-950">Dodawanie certyfikatów z telefonu</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">Po szkoleniu zeskanujesz QR kod, dodasz aktywność i zrobisz zdjęcie certyfikatu. Wszystko trafi do Twojego panelu od razu, bez Excela i bez przepisywania danych.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                { icon: QrCode, text: "Skan QR kodu szkolenia" },
                { icon: UploadCloud, text: "Zdjęcie certyfikatu z telefonu" },
                { icon: CheckCircle2, text: "Automatyczny wpis do bazy" },
                { icon: Bell, text: "Przypomnienie o brakach" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-blue-100">
                  <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative grid gap-3 p-5 sm:grid-cols-2 lg:p-8">
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-[14px] border-slate-200/70 lg:block" />
          <svg className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden h-44 w-44 -translate-x-1/2 -translate-y-1/2 text-slate-300 lg:block" viewBox="0 0 220 220" fill="none" aria-hidden="true">
            <path d="M72 43c26-13 70-9 91 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M156 37l16 27-31 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M177 77c13 26 9 70-17 91" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M183 160l-27 16-4-31" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M148 177c-26 13-70 9-91-17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M64 183l-16-27 31-4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M43 143c-13-26-9-70 17-91" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M37 60l27-16 4 31" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="relative z-10 rounded-2xl border border-slate-200 bg-white/95 p-5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/5">
              <IconTile className="mb-4 h-12 w-12"><Icon className="h-5 w-5" strokeWidth={2.1} /></IconTile>
              <h3 className="text-sm font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReminderSection() {
  const items = ["brakujące certyfikaty przy aktywnościach", "zbliżający się koniec okresu rozliczeniowego", "aktywności, które warto uzupełnić przed raportem"];

  return (
    <div id="przypomnienia" className="scroll-mt-32">
      <div className="overflow-hidden rounded-[1.6rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white shadow-sm shadow-slate-900/5">
        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b border-blue-100 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <Eyebrow>Przypomnienia</Eyebrow>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Nie przegap brakujących dokumentów</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">CRPE może pomagać nie tylko w przechowywaniu certyfikatów, ale też w pilnowaniu braków i terminów. Dzięki temu łatwiej przygotować się do raportu bez nerwowego sprawdzania wszystkiego na końcu okresu.</p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3 lg:p-8">
            {items.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
                <IconTile className="mb-3 h-11 w-11"><Bell className="h-5 w-5" /></IconTile>
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
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 3), 3200);
    return () => clearInterval(t);
  }, [visible]);

  const steps = [
    {
      n: "1",
      icon: UserRoundCheck,
      color: "blue",
      title: "Wybierz zawód",
      subtitle: "System sam ustawi wymagania",
      desc: "Wybierasz swoją profesję, a CRPE dobiera właściwy okres i limit punktów.",
      preview: (
        <div className="space-y-1.5">
          {[
            { l: "Lekarz", p: "200 pkt / 4 lata", a: true },
            { l: "Pielęgniarka", p: "100 pkt / 5 lat", a: false },
            { l: "Fizjoterapeuta", p: "100 pkt / 5 lat", a: false },
          ].map((x) => (
            <div key={x.l} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${x.a ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
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
      subtitle: "Certyfikat od razu przy wpisie",
      desc: "Dodajesz szkolenie, punkty i dokument. Zdjęcie albo PDF trafia do konkretnej aktywności.",
      preview: (
        <div>
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
            <IconTile tone="amber" className="h-9 w-9"><FileText className="h-4 w-4" /></IconTile>
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
      icon: FileText,
      color: "emerald",
      title: "Masz gotowy raport",
      subtitle: "Status, braki i dokumenty w jednym miejscu",
      desc: "Widzisz postęp, brakujące punkty i dokumenty. Na końcu okresu szybciej przygotujesz podsumowanie.",
      preview: (
        <div>
          <div className="mb-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <div className="flex items-center gap-2">
              <IconTile tone="emerald" className="h-8 w-8"><CheckCircle2 className="h-4 w-4" /></IconTile>
              <div>
                <p className="text-sm font-bold text-slate-900">Raport CPD gotowy</p>
                <p className="text-xs text-slate-500">aktywności + certyfikaty + punkty</p>
              </div>
            </div>
          </div>
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>Postęp 2025–2028</span>
            <span className="font-bold text-slate-900">55%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-blue-600 transition-all duration-1000" style={{ width: visible ? "55%" : "0%" }} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[
              { v: "110", l: "masz", c: "text-slate-900" },
              { v: "200", l: "cel", c: "text-slate-900" },
              { v: "90", l: "brak", c: "text-amber-700" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-slate-100 bg-white py-1.5 text-center">
                <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
                <div className="text-[10px] text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const cm: Record<string, { text: string; border: string; bg: string; soft: string; num: string; tone: "blue" | "amber" | "emerald" }> = {
    blue: { text: "text-blue-700", border: "border-blue-200", bg: "bg-blue-600", soft: "bg-blue-50", num: "bg-blue-600", tone: "blue" },
    amber: { text: "text-amber-700", border: "border-amber-200", bg: "bg-amber-500", soft: "bg-amber-50", num: "bg-amber-500", tone: "amber" },
    emerald: { text: "text-emerald-700", border: "border-emerald-200", bg: "bg-emerald-600", soft: "bg-emerald-50", num: "bg-emerald-600", tone: "emerald" },
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
          <div className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:block">Interaktywny podgląd</div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="relative border-b border-slate-100 bg-slate-50/60 px-8 py-6">
          <div className="absolute left-[17%] right-[17%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
          <div className="absolute left-[17%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${activeStep * 33}%` }} />
          <div className="relative grid grid-cols-3 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const c = cm[step.color];
              const isActive = activeStep === i;
              return (
                <button key={step.n} type="button" onClick={() => setActiveStep(i)} className="group flex flex-col items-center gap-3 text-center focus:outline-none">
                  <span className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border bg-white shadow-sm transition-all duration-300 ${isActive ? `${c.border} scale-105 shadow-md` : "border-slate-200 group-hover:border-blue-200"}`}>
                    <span className={`absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${c.num}`}>{step.n}</span>
                    <Icon className={`h-7 w-7 ${isActive ? c.text : "text-slate-500"}`} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{step.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{step.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-3">
          {steps.map((step, i) => {
            const c = cm[step.color];
            const isActive = activeStep === i;
            return (
              <button key={step.n} type="button" onClick={() => setActiveStep(i)} className={`flex min-h-[255px] flex-col border-r border-slate-100 p-6 text-left transition-all duration-300 last:border-r-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 lg:p-7 ${isActive ? "bg-white" : "bg-slate-50/30 hover:bg-white"}`}>
                <div className={`mb-4 h-1.5 w-12 rounded-full transition-all ${isActive ? c.bg : "bg-slate-200"}`} />
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                <div className={`mt-auto rounded-2xl border p-3 transition-all duration-300 ${isActive ? `${c.border} ${c.soft}` : "border-slate-100 bg-white/80 opacity-75"}`}>
                  {step.preview}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="md:hidden">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const c = cm[step.color];
          if (activeStep !== i) return null;
          return (
            <div key={step.n} className="p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${c.border} bg-white shadow-sm`}>
                  <span className={`absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${c.num}`}>{step.n}</span>
                  <Icon className={`h-6 w-6 ${c.text}`} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-400">{step.subtitle}</p>
                </div>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-slate-500">{step.desc}</p>
              <div className={`rounded-2xl border p-3 ${c.border} ${c.soft}`}>{step.preview}</div>
            </div>
          );
        })}
        <div className="flex justify-center gap-2 border-t border-slate-100 py-3">
          {steps.map((_, i) => <button key={i} type="button" onClick={() => setActiveStep(i)} className={`h-2 rounded-full transition-all ${activeStep === i ? "w-8 bg-blue-600" : "w-2 bg-slate-200"}`} aria-label={`Pokaż krok ${i + 1}`} />)}
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
      if (authError || !auth?.user) {
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }
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
    const top = el.getBoundingClientRect().top + window.scrollY - 158;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }

  if (checking) return <div className={`${pageWrap} py-10`}><div className={`${cardCls} p-6 text-slate-500`}>Sprawdzam sesję…</div></div>;
  if (isLoggedIn) return <div className={`${pageWrap} py-10`}><div className={`${cardCls} p-6 text-slate-500`}>Przenoszę…</div></div>;

  const navItems = [
    { id: "hero", label: "O produkcie" },
    { id: "dla-kogo", label: "Dla kogo" },
    { id: "jak-to-dziala", label: "Jak to działa" },
    { id: "funkcje", label: "Funkcje CRPE" },
    { id: "przypomnienia", label: "Przypomnienia" },
    { id: "faq", label: "FAQ" },
  ];
  const navBase = "group inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:scale-[1.03] hover:bg-slate-50 hover:text-blue-700";
  const navActive = "group inline-flex shrink-0 scale-[1.03] items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-200";
  const FAQ = [
    { q: "Czy CRPE jest połączone z systemami państwowymi?", a: "Nie. CRPE służy do Twojej kontroli i uporządkowania danych. Systemy państwowe są zamknięte." },
    { q: "Czy moje certyfikaty są bezpieczne?", a: "Tak. Dane są zabezpieczone, a dostęp do nich masz tylko Ty. Przechowujemy dane w UE." },
    { q: "Czy mogę korzystać z telefonu?", a: "Tak. Możesz dodać certyfikat od razu po szkoleniu — nawet jako zdjęcie z telefonu." },
    { q: "Czy korzystanie jest darmowe?", a: "Tak. Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO: eksport PDF i przypomnienia." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="sticky top-[76px] z-30 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className={`${pageWrap} py-2.5`}>
          <nav className="mx-auto flex w-fit max-w-full items-center justify-center overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-sm shadow-slate-900/5">
            <div className="flex min-w-max items-center justify-center gap-1">
              {navItems.map(({ id, label }) => {
                const isActive = activeSection === id;
                return <button key={id} type="button" onClick={() => scrollToId(id)} className={isActive ? navActive : navBase}><span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : "bg-slate-300 group-hover:bg-blue-400"}`} />{label}</button>;
              })}
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
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-700"><Sparkles className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.75} />Wkrótce: Asystent AI do zarządzania rozwojem zawodowym</div>
                <h1 className="max-w-3xl text-[42px] font-bold leading-[1.04] tracking-tight text-slate-950 sm:text-[56px] lg:text-[62px]">Punkty CPD pod kontrolą. <span className="text-blue-600">Bez stresu.</span></h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w aktualnym okresie rozliczeniowym. Prosto. Spokojnie. Bez Excela.</p>
                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { icon: FolderOpen, t: "Porządek bez wysiłku", d: "Wpisy i certyfikaty zawsze pod ręką.", tone: "blue" as const },
                    { icon: BarChart3, t: "Jasny status punktów", d: "Wiesz ile masz i czego brakuje.", tone: "amber" as const },
                    { icon: ShieldCheck, t: "Bezpieczne dane", d: "Tylko Ty masz dostęp. Dane w UE.", tone: "emerald" as const },
                    { icon: Sparkles, t: "Start za darmo", d: "Podstawowe funkcje bezpłatnie. Bez karty.", tone: "indigo" as const },
                  ].map((b) => { const Icon = b.icon; return <div key={b.t} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm shadow-slate-900/5"><IconTile tone={b.tone} className="mt-0.5 h-10 w-10"><Icon className="h-5 w-5" strokeWidth={2} /></IconTile><div><div className="text-sm font-semibold text-slate-900">{b.t}</div><p className="mt-0.5 text-xs leading-relaxed text-slate-500">{b.d}</p></div></div>; })}
                </div>
                <div className="mt-8 flex flex-wrap gap-3"><Link href="/login" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95">Załóż darmowe konto <ArrowRight className="h-4 w-4" /></Link><button type="button" onClick={() => scrollToId("jak-to-dziala")} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">Jak to działa</button></div>
                <p className="mt-3 text-xs text-slate-500">Bez instalacji • 30 sekund do pierwszego wpisu • działa na telefonie</p>
              </div>
              <div className="relative z-10 min-h-[380px] overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-900 shadow-xl shadow-slate-950/10 lg:min-h-[500px]"><Image src={IMG.hero} alt="Pracowniczka medyczna z tabletem" fill priority className="object-cover object-[50%_22%]" sizes="(max-width: 1024px) 100vw, 390px" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-transparent to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/90">CRPE w praktyce</p><h3 className="mt-1.5 text-xl font-bold leading-tight">Panel zawsze pod ręką</h3><p className="mt-1.5 text-sm leading-relaxed text-white/75">Dodajesz wpisy i dokumenty na bieżąco.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-6"><div className={pageWrap}><div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm shadow-slate-900/5"><p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900">CRPE wspiera zawody regulowane przez samorządy zawodowe</p><div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">{["Naczelną Izbę Lekarską", "Naczelną Izbę Pielęgniarek i Położnych", "Krajową Izbę Fizjoterapeutów", "Naczelną Izbę Aptekarską", "Krajową Izbę Diagnostów Laboratoryjnych"].map((n) => <span key={n} className="text-xs font-medium text-slate-500">{n}</span>)}</div></div></div></section>

      <section className="bg-slate-50 py-7 lg:py-9">
        <div className={`${pageWrap} space-y-6`}>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><PhotoCard src={IMG.team} alt="Zespół medyczny przy stole" title="CRPE pomaga każdemu specjaliście pilnować własnych punktów, terminów i certyfikatów." text="" className="min-h-[390px] lg:min-h-[455px]" imageClassName="object-cover object-[50%_16%]" /><div className="flex min-h-[390px] items-stretch rounded-[1.45rem] bg-gradient-to-br from-white to-slate-50 p-4 lg:min-h-[455px]"><ProductPreview /></div></div>

          <div id="dla-kogo" className="grid scroll-mt-32 gap-6 lg:grid-cols-2">
            <div className={cardCls}><div className="border-b border-slate-100 px-6 py-5 lg:px-8"><Eyebrow>Odbiorcy</Eyebrow><h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Dla kogo jest CRPE</h2><p className="mt-1 text-sm text-slate-500">Dla zawodów medycznych zbierających punkty edukacyjne.</p></div><div className="p-5 lg:p-7"><div className="grid gap-3 sm:grid-cols-2">{[{ t: "Lekarze i lekarze dentyści", icon: Stethoscope }, { t: "Pielęgniarki i położne", icon: HeartPulse }, { t: "Fizjoterapeuci", icon: UserCog }, { t: "Farmaceuci", icon: Pill }, { t: "Diagności laboratoryjni", icon: FlaskConical }, { t: "Nowe zawody medyczne", icon: Users }].map(({ t, icon: Icon }) => <div key={t} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"><IconTile tone="emerald"><Icon className="h-5 w-5" strokeWidth={2.1} /></IconTile><span className="text-sm font-medium text-slate-800">{t}</span></div>)}</div><div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-semibold text-slate-900">Jeśli musisz zbierać punkty — CRPE jest dla Ciebie.</p><p className="mt-0.5 text-xs text-slate-500">Zacznij od kilku wpisów. Resztę uzupełniaj stopniowo.</p></div></div></div>
            <div className={cardCls}><div className="border-b border-slate-100 px-6 py-5 lg:px-8"><Eyebrow>Wartość</Eyebrow><h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Co zyskujesz</h2><p className="mt-1 text-sm text-slate-500">Porządek i jasny status. Bez komplikacji.</p></div><div className="p-5 lg:p-7"><div className="space-y-3">{[{ t: "Historia wszystkich aktywności w jednym miejscu", icon: BookOpen }, { t: "Certyfikaty zawsze pod ręką (PDF / zdjęcia)", icon: Award }, { t: "Przejrzysty podgląd zdobytych punktów", icon: BarChart3 }, { t: "Gotowość do przygotowania raportu", icon: CalendarCheck }].map(({ t, icon: Icon }) => <div key={t} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"><IconTile><Icon className="h-5 w-5" strokeWidth={2.1} /></IconTile><span className="text-sm font-medium text-slate-800">{t}</span></div>)}</div><div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><IconTile tone="amber"><FileText className="h-5 w-5" strokeWidth={2.1} /></IconTile><div><p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Wkrótce — PRO</p><p className="mt-0.5 text-sm font-semibold text-slate-900">Eksport PDF i przypomnienia</p><p className="mt-0.5 text-xs text-slate-500">Raport gotowy do wydruku + automatyczne przypomnienia.</p></div></div></div></div>
          </div>
        </div>
      </section>

      <section className="bg-white py-6 lg:py-8">
        <div className={`${pageWrap} space-y-6`}>
          <HowItWorks />
          <div id="funkcje" className="scroll-mt-32"><CrpeFeatures /></div>
          <ReminderSection />
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div id="faq" className={`${cardCls} scroll-mt-32`}><div className="border-b border-slate-100 px-6 py-5 lg:px-8"><Eyebrow>FAQ</Eyebrow><h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Najczęstsze pytania</h2><p className="mt-1 text-sm text-slate-500">Kliknij pytanie, aby zobaczyć odpowiedź.</p></div><div className="p-5 lg:p-7"><FaqAccordion items={FAQ} /></div></div>
            <div className={cardCls}><div className="p-6 lg:p-8"><Eyebrow>Co mówią użytkownicy</Eyebrow><Quote className="mb-3 h-6 w-6 text-blue-200" strokeWidth={1.5} /><p className="text-base leading-relaxed text-slate-700">&quot;Wcześniej trzymałam wszystko w Excelu i modliłam się żeby nie zgubić certyfikatów. Teraz dodaję wpis od razu po szkoleniu — z telefonu. Przed audytem mam wszystko gotowe w kilka minut, a nie w kilka godzin.&quot;</p><div className="mt-5 flex flex-wrap items-center gap-2"><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div><span className="text-sm font-semibold text-slate-900">Anna K.</span><span className="text-xs text-slate-400">Pielęgniarka, Kraków</span></div></div></div>
          </div>
          <BottomCTA />
        </div>
      </section>
    </div>
  );
}
