// app/page.tsx — landing page CRPE, wersja ewolucyjna
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
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
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
const cardCls = "overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5";
const iconBox = "flex shrink-0 items-center justify-center rounded-xl border";

const IMG = {
  hero: "/lekarka_z_tabletem.png",
  team: "/lekrze_konsyl_pion.png",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">{children}</p>;
}

function IconTile({
  children,
  tone = "blue",
  className = "h-11 w-11",
}: {
  children: React.ReactNode;
  tone?: "blue" | "emerald" | "amber" | "indigo" | "slate" | "rose";
  className?: string;
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
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
    <div className={`group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-slate-900 shadow-sm ${className}`}>
      <Image src={src} alt={alt} fill className={`${imageClassName} transition duration-700 group-hover:scale-[1.03]`} sizes="(max-width: 1024px) 100vw, 780px" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/28 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white lg:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/90">CRPE w praktyce</p>
        <h3 className="mt-1.5 max-w-2xl text-xl font-bold leading-tight lg:text-2xl">{title}</h3>
        {text ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{text}</p> : null}
      </div>
    </div>
  );
}

function ScenarioSection() {
  return (
    <div id="scenariusz" className="scroll-mt-32">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className={`${cardCls} p-6 lg:p-8`}>
          <Eyebrow>Typowy scenariusz</Eyebrow>
          <h2 className="max-w-xl text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">Spokojny koniec okresu rozliczeniowego zaczyna się dużo wcześniej.</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Pod koniec okresu zaczyna się szukanie certyfikatów, dat, punktów, limitów i brakujących dokumentów. CRPE pokazuje wcześniej, ile masz punktów, czego brakuje i które aktywności warto uzupełnić.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              "widzisz aktualny status punktów",
              "masz certyfikaty przypisane do aktywności",
              "łatwiej sprawdzasz braki przed przygotowaniem raportu",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-800">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${cardCls} bg-slate-950 p-6 text-white lg:p-8`}>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-200">Przykład użytkownika</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              ["142", "pkt zebrane"],
              ["58", "pkt brakuje"],
              ["6", "braków w dokumentach"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                <div className="text-3xl font-black tracking-tight">{value}</div>
                <div className="mt-1 text-xs font-semibold text-slate-300">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-white p-4 text-slate-950">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Postęp okresu</span>
              <span>71%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[71%] rounded-full bg-blue-600" />
            </div>
            <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-800 ring-1 ring-blue-100">
              Najbliższy krok: uzupełnij brakujące certyfikaty i zaplanuj aktywność za minimum 58 pkt.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CrpeFeatures() {
  const flow = [
    { icon: BookOpen, title: "Szkolenie", text: "bierzesz udział", tone: "blue" as const },
    { icon: FileText, title: "Certyfikat", text: "dodajesz dokument", tone: "blue" as const },
    { icon: BarChart3, title: "Raport", text: "punkty się liczą", tone: "blue" as const },
    { icon: FolderOpen, title: "Baza CRPE", text: "wszystko w jednym miejscu", tone: "blue" as const },
    { icon: Users, title: "Samorząd zawodowy", text: "OIL / KIF / NIPiP", tone: "blue" as const },
    { icon: CheckCircle2, title: "Spokój", text: "wiesz, co masz", tone: "emerald" as const },
  ];

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 p-8 text-white lg:border-b-0 lg:border-r lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-90px] left-[-70px] h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100">Korzyści</p>
            <h2 className="max-w-md text-4xl font-black tracking-tight lg:text-5xl">Od szkolenia do porządku. Bez Excela.</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-blue-50">Po szkoleniu dodajesz certyfikat z telefonu. CRPE przypina go do aktywności, liczy punkty i pokazuje, czego jeszcze brakuje.</p>
            <div className="mt-7 grid gap-3">
              {["Robisz zdjęcie certyfikatu", "CRPE pamięta za Ciebie", "Widzisz status punktów od razu"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-white/20 backdrop-blur">
                  <CheckCircle2 className="h-5 w-5 text-blue-100" />
                  <span className="text-sm font-bold text-white">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50">
              Sprawdź ile punktów Ci brakuje <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-50/70 p-6 lg:p-8">
          <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-blue-100/80 blur-3xl" />
          <div className="relative rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-950">Jak to działa w praktyce</p>
                <p className="text-xs text-slate-500">szkolenie → certyfikat → raport → porządek</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">~30 sek do wpisu</span>
            </div>
            <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {flow.map(({ icon: Icon, title, text, tone }, i) => (
                <div key={title} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5">
                  <div className="mb-3 flex items-center gap-3">
                    <IconTile tone={tone} className="h-12 w-12">
                      <Icon className="h-6 w-6" strokeWidth={2.1} />
                    </IconTile>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950">{title}</p>
                      <p className="text-xs leading-relaxed text-slate-500">{text}</p>
                    </div>
                  </div>
                  {i < flow.length - 1 ? <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-blue-500 lg:block" /> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Mniej klikania</p>
              <p className="mt-1 text-xs text-slate-600">wpis i certyfikat od razu po szkoleniu</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Mniej pamiętania</p>
              <p className="mt-1 text-xs text-slate-600">CRPE pokazuje braki i status</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Więcej spokoju</p>
              <p className="mt-1 text-xs text-slate-600">dokumenty masz w jednym widoku</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReminderSection() {
  const items = ["brakujące certyfikaty przy aktywnościach", "zbliżający się koniec okresu rozliczeniowego", "aktywności, które warto uzupełnić przed raportem"];
  return (
    <div id="przypomnienia" className="scroll-mt-32">
      <div className="overflow-hidden rounded-[1.8rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white shadow-sm shadow-slate-900/5">
        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b border-blue-100 p-7 lg:border-b-0 lg:border-r lg:p-9">
            <Eyebrow>Przypomnienia</Eyebrow>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Nie przegap brakujących dokumentów</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">CRPE może pomagać nie tylko w przechowywaniu certyfikatów, ale też w pilnowaniu braków i terminów. Dzięki temu łatwiej przygotować się do raportu bez nerwowego sprawdzania wszystkiego na końcu okresu.</p>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-3 lg:p-9">
            {items.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
                <IconTile tone="amber" className="mb-4 h-12 w-12"><Bell className="h-5 w-5" /></IconTile>
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
  const steps = [
    { icon: UserRoundCheck, title: "Wybierasz zawód i okres", desc: "CRPE dopasowuje wymagania punktowe oraz podstawowe limity dla wybranego zawodu." },
    { icon: UploadCloud, title: "Dodajesz aktywności i certyfikaty", desc: "Wpisujesz szkolenie, dodajesz punkty i przypinasz dokument jako PDF albo zdjęcie." },
    { icon: FileText, title: "Widzisz aktualny status", desc: "Masz jasny podgląd: ile punktów już masz, czego brakuje i co warto uzupełnić dalej." },
  ];

  return (
    <div id="jak-to-dziala" className={`${cardCls} scroll-mt-32`}>
      <div className="border-b border-slate-100 px-6 py-6 lg:px-9">
        <Eyebrow>Proces</Eyebrow>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">Jak CRPE prowadzi Cię krok po kroku</h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">Trzy proste etapy: wybór ustawień, dodanie aktywności i bieżący status punktów. Bez Excela i zgadywania.</p>
          </div>
          <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-100">2 minuty do pierwszego wpisu</span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="relative border-b border-slate-100 p-6 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:p-8">
              <div className="mb-5 flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{i + 1}</span>
                <IconTile className="h-13 w-13"><Icon className="h-6 w-6" strokeWidth={2} /></IconTile>
              </div>
              <h3 className="text-lg font-black text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
              {i < steps.length - 1 ? <ArrowRight className="absolute right-[-10px] top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-blue-500 lg:block" /> : null}
            </div>
          );
        })}
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

  if (checking) return <div className={`${pageWrap} py-10`}><div className={`${cardCls} p-6 text-slate-500`}>Sprawdzam sesję…</div></div>;
  if (isLoggedIn) return <div className={`${pageWrap} py-10`}><div className={`${cardCls} p-6 text-slate-500`}>Przenoszę…</div></div>;

  const navItems = [
    { id: "hero", label: "O produkcie" },
    { id: "scenariusz", label: "Problem" },
    { id: "dla-kogo", label: "Dla kogo" },
    { id: "jak-to-dziala", label: "Jak to działa" },
    { id: "funkcje", label: "Funkcje CRPE" },
    { id: "przypomnienia", label: "Przypomnienia" },
    { id: "faq", label: "FAQ" },
  ];
  const navBase = "shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus:outline-none";
  const navActive = "shrink-0 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm focus:outline-none";
  const FAQ = [
    { q: "Czy CRPE jest połączone z systemami państwowymi?", a: "Nie. CRPE służy do Twojej kontroli i uporządkowania danych. Systemy państwowe są zamknięte." },
    { q: "Czy moje certyfikaty są bezpieczne?", a: "Tak. Dane są zabezpieczone, a dostęp do nich masz tylko Ty. Przechowujemy dane w UE." },
    { q: "Czy mogę korzystać z telefonu?", a: "Tak. Możesz dodać certyfikat od razu po szkoleniu — nawet jako zdjęcie z telefonu." },
    { q: "Czy korzystanie jest darmowe?", a: "Tak. Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO: eksport PDF i przypomnienia." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="sticky top-[76px] z-30 bg-white/95 pb-3 pt-2 shadow-sm shadow-slate-900/5 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className={`${pageWrap}`}>
          <nav className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <div className="flex min-w-max gap-1">
              {navItems.map(({ id, label }) => {
                const isActive = activeSection === id;
                return <button key={id} type="button" onClick={() => scrollToId(id)} className={isActive ? navActive : navBase}>{label}</button>;
              })}
            </div>
          </nav>
        </div>
      </div>

      <section className="bg-[radial-gradient(circle_at_top_left,#dbeafe_0,transparent_34%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_100%)] py-8 lg:py-12">
        <div className={pageWrap}>
          <div id="hero" className="scroll-mt-32 overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
            <div className="relative grid grid-cols-1 gap-10 p-7 sm:p-9 lg:grid-cols-[1.55fr_0.95fr] lg:p-12 xl:p-14">
              <div className="pointer-events-none absolute left-0 top-10 h-28 w-1.5 rounded-r-full bg-blue-600" />
              <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-blue-100/80 blur-3xl" />
              <div className="relative z-10 flex flex-col justify-center">
                <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700"><Sparkles className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.75} />Spokojny koniec okresu rozliczeniowego zaczyna się dużo wcześniej</div>
                <h1 className="max-w-4xl text-[40px] font-black leading-[1.04] tracking-tight text-slate-950 sm:text-[56px] lg:text-[64px]">Masz wszystko pod kontrolą — <span className="text-blue-600">punkty, certyfikaty i terminy</span></h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">Zbieraj punkty, przechowuj certyfikaty i miej pewność, że nie zabraknie Ci nic na koniec okresu.</p>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">CRPE porządkuje aktywności CPD, pokazuje aktualny status i pomaga wcześniej zauważyć braki — bez arkuszy, notatek i szukania dokumentów po mailach.</p>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { icon: FolderOpen, t: "Certyfikaty w jednym miejscu", d: "Dokumenty przypisane do aktywności.", tone: "blue" as const },
                    { icon: BarChart3, t: "Jasny status punktów", d: "Wiesz, ile masz i czego brakuje.", tone: "amber" as const },
                    { icon: ShieldCheck, t: "Bezpieczne dane", d: "Dostęp do danych masz tylko Ty.", tone: "emerald" as const },
                    { icon: CalendarCheck, t: "Terminy pod kontrolą", d: "Łatwiej przygotujesz się do raportu.", tone: "indigo" as const },
                  ].map((b) => { const Icon = b.icon; return <div key={b.t} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-900/5"><IconTile tone={b.tone} className="mt-0.5 h-10 w-10"><Icon className="h-5 w-5" strokeWidth={2} /></IconTile><div><div className="text-sm font-bold text-slate-900">{b.t}</div><p className="mt-0.5 text-xs leading-relaxed text-slate-500">{b.d}</p></div></div>; })}
                </div>
                <div className="mt-9 flex flex-wrap gap-3"><Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-base font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95">Sprawdź ile punktów Ci brakuje <ArrowRight className="h-5 w-5" /></Link><button type="button" onClick={() => scrollToId("jak-to-dziala")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">Zobacz jak działa</button></div>
                <p className="mt-4 text-sm text-slate-500">Bezpłatny start. Bez Excela. Bez szukania certyfikatów po mailach.</p>
              </div>
              <div className="relative z-10 min-h-[390px] overflow-hidden rounded-[1.8rem] border border-slate-200 bg-slate-900 shadow-xl shadow-slate-950/10 lg:min-h-[540px]"><Image src={IMG.hero} alt="Pracowniczka medyczna z tabletem" fill priority className="object-cover object-[50%_22%]" sizes="(max-width: 1024px) 100vw, 430px" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-transparent to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/90">CRPE w praktyce</p><h3 className="mt-1.5 text-2xl font-black leading-tight">Panel zawsze pod ręką</h3><p className="mt-2 text-sm leading-relaxed text-white/75">Dodajesz wpisy i dokumenty na bieżąco.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-6"><div className={pageWrap}><div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm shadow-slate-900/5"><p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900">CRPE wspiera zawody regulowane przez samorządy zawodowe</p><div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">{["Naczelną Izbę Lekarską", "Naczelną Izbę Pielęgniarek i Położnych", "Krajową Izbę Fizjoterapeutów", "Naczelną Izbę Aptekarską", "Krajową Izbę Diagnostów Laboratoryjnych"].map((n) => <span key={n} className="text-xs font-medium text-slate-500">{n}</span>)}</div></div></div></section>

      <section className="bg-slate-50 py-10 lg:py-14">
        <div className={`${pageWrap} space-y-10 lg:space-y-16`}>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><PhotoCard src={IMG.team} alt="Zespół medyczny przy stole" title="CRPE pomaga każdemu specjaliście pilnować własnych punktów, terminów i certyfikatów." text="" className="min-h-[390px] lg:min-h-[455px]" imageClassName="object-cover object-[50%_16%]" /><div className="flex min-h-[390px] items-stretch rounded-[1.7rem] bg-gradient-to-br from-white to-slate-50 p-4 lg:min-h-[455px]"><ProductPreview /></div></div>

          <ScenarioSection />

          <div id="dla-kogo" className="grid scroll-mt-32 gap-6 lg:grid-cols-2">
            <div className={cardCls}>
              <div className="border-b border-slate-100 px-6 py-6 lg:px-8">
                <Eyebrow>Odbiorcy</Eyebrow>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Dla kogo jest CRPE</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">Dla zawodów medycznych zobowiązanych do zbierania punktów edukacyjnych. Lekarze, pielęgniarki, fizjoterapeuci i inni specjaliści, którzy chcą mieć porządek bez Excela.</p>
              </div>
              <div className="p-6 lg:p-8">
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
                      <IconTile tone="emerald"><Icon className="h-5 w-5" strokeWidth={2.1} /></IconTile>
                      <span className="text-sm font-semibold text-slate-800">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={cardCls}>
              <div className="border-b border-slate-100 px-6 py-6 lg:px-8">
                <Eyebrow>Wartość</Eyebrow>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Co zyskujesz</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">Porządek i jasny status. Bez komplikacji.</p>
              </div>
              <div className="p-6 lg:p-8">
                <div className="space-y-3">
                  {[
                    { t: "Historia aktywności w jednym miejscu", icon: BookOpen },
                    { t: "Certyfikaty pod ręką", icon: Award },
                    { t: "Przejrzysty podgląd punktów", icon: BarChart3 },
                    { t: "Gotowość do przygotowania raportu", icon: CalendarCheck },
                  ].map(({ t, icon: Icon }) => (
                    <div key={t} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <IconTile><Icon className="h-5 w-5" strokeWidth={2.1} /></IconTile>
                      <span className="text-sm font-semibold text-slate-800">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <HowItWorks />
          <div id="funkcje" className="scroll-mt-32"><CrpeFeatures /></div>
          <ReminderSection />

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div id="faq" className={`${cardCls} scroll-mt-32`}>
              <div className="border-b border-slate-100 px-6 py-6 lg:px-8">
                <Eyebrow>FAQ</Eyebrow>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Najczęstsze pytania</h2>
                <p className="mt-2 text-sm text-slate-500">Kliknij pytanie, aby zobaczyć odpowiedź.</p>
              </div>
              <div className="p-6 lg:p-8"><FaqAccordion items={FAQ} /></div>
            </div>
            <div className={cardCls}>
              <div className="p-6 lg:p-8">
                <Eyebrow>Przykład opinii</Eyebrow>
                <Quote className="mb-3 h-6 w-6 text-blue-200" strokeWidth={1.5} />
                <p className="text-base leading-relaxed text-slate-700">&quot;Wcześniej trzymałam wszystko w Excelu i modliłam się, żeby nie zgubić certyfikatów. Teraz dodaję wpis od razu po szkoleniu — z telefonu.&quot;</p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
                  <span className="text-sm font-semibold text-slate-900">Anna K.</span>
                  <span className="text-xs text-slate-400">Pielęgniarka, Kraków</span>
                </div>
              </div>
            </div>
          </div>

          <BottomCTA />
        </div>
      </section>
    </div>
  );
}
