// app/page.tsx — kompletna, domknięta wersja landing page CRPE 17.2
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

function ScenarioStrip() {
  const [state, setState] = useState<0 | 1>(0);

  useEffect(() => {
    const t = setInterval(() => setState((s) => (s === 0 ? 1 : 0)), 3600);
    return () => clearInterval(t);
  }, []);

  const isOrder = state === 1;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-[-90px] h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />

      <div className="relative grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
        {/* Copy / state */}
        <div className="relative border-b border-slate-100 bg-white/80 p-7 lg:border-b-0 lg:border-r lg:p-8">
          <div className="absolute left-0 top-8 h-20 w-1.5 rounded-r-full bg-blue-600" />

          <div className="mb-5 flex items-center gap-3">
            <div className="relative">
              <span className={`absolute inset-0 rounded-2xl ${isOrder ? "animate-ping bg-emerald-300/25" : "animate-ping bg-amber-300/25"}`} />
              <IconTile tone={isOrder ? "emerald" : "amber"} className="relative h-14 w-14 rounded-2xl shadow-sm">
                {isOrder ? <CheckCircle2 className="h-7 w-7" strokeWidth={2.2} /> : <Bell className="h-7 w-7" strokeWidth={2.2} />}
              </IconTile>
            </div>
            <div>
              <Eyebrow>{isOrder ? "Efekt w CRPE" : "Typowy problem"}</Eyebrow>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px] font-bold text-slate-500">
                <span className={`rounded-full px-2.5 py-1 transition ${!isOrder ? "bg-amber-100 text-amber-700 shadow-sm" : ""}`}>chaos</span>
                <span className={`rounded-full px-2.5 py-1 transition ${isOrder ? "bg-emerald-100 text-emerald-700 shadow-sm" : ""}`}>porządek</span>
              </div>
            </div>
          </div>

          <h2 className="max-w-md text-2xl font-black leading-tight tracking-tight text-slate-950 lg:text-3xl">
            {isOrder ? "Jeden wpis. Certyfikat, punkty i status w komplecie." : "Certyfikaty są wszędzie. Statusu nadal brak."}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
            {isOrder
              ? "Aktywność, dokument i punkty są połączone. Od razu widzisz, co masz, czego brakuje i co warto uzupełnić dalej."
              : "Maile, zdjęcia, PDF-y i notatki są rozrzucone po różnych miejscach. Na końcu okresu trzeba ręcznie sprawdzać, co naprawdę się liczy."}
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              <span>chaos</span>
              <span>porządek</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all duration-700 ${isOrder ? "w-full bg-emerald-500" : "w-[34%] bg-amber-400"}`} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-semibold">
              <span className={`${isOrder ? "text-slate-400" : "text-amber-700"}`}>{isOrder ? "problem rozwiązany" : "brakuje porządku"}</span>
              <span className={`${isOrder ? "text-emerald-700" : "text-slate-400"}`}>{isOrder ? "gotowe do raportu" : "CRPE porządkuje dane"}</span>
            </div>
          </div>
        </div>

        {/* Animated demo */}
        <div className="relative min-h-[390px] bg-slate-50/80 p-5 lg:p-7">
          {/* CHAOS */}
          <div className={`absolute inset-5 transition-all duration-700 lg:inset-7 ${!isOrder ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none opacity-0 translate-y-4 scale-[0.98]"}`}>
            <div className="grid h-full gap-4 md:grid-cols-[1fr_0.82fr]">
              <div className="rounded-[1.35rem] border border-amber-200 bg-white p-5 shadow-sm shadow-amber-950/5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-slate-950">Rozrzucone dokumenty</p>
                    <p className="mt-0.5 text-xs text-slate-500">nie wiadomo, co jest aktualne</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100">brak statusu</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { file: "certyfikat_final.pdf", note: "bez punktów", tone: "amber", move: "" },
                    { file: "IMG_2847.jpg", note: "nieprzypisany", tone: "slate", move: "translate-x-3" },
                    { file: "mail_od_organizatora.msg", note: "do sprawdzenia", tone: "amber", move: "-translate-x-1" },
                    { file: "scan_2024_kopia.pdf", note: "duplikat?", tone: "rose", move: "translate-x-2" },
                  ].map((row) => (
                    <div key={row.file} className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition ${row.move}`}>
                      <IconTile tone={row.tone as "amber" | "slate" | "rose"} className="h-9 w-9 rounded-xl">
                        <FileText className="h-4 w-4" strokeWidth={2.2} />
                      </IconTile>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{row.file}</span>
                      <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{row.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
                <p className="text-base font-black text-slate-950">Na koniec okresu</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">trzeba ręcznie ustalić, które dokumenty pasują do aktywności i ile punktów można policzyć.</p>

                <div className="mt-5 space-y-2.5">
                  {[
                    "brak certyfikatu przy wpisie",
                    "niejasna liczba punktów",
                    "raport do sprawdzenia ręcznie",
                  ].map((x) => (
                    <div key={x} className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800 ring-1 ring-amber-100">
                      <Bell className="h-3.5 w-3.5 shrink-0" />
                      {x}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ORDER */}
          <div className={`absolute inset-5 transition-all duration-700 lg:inset-7 ${isOrder ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none opacity-0 translate-y-4 scale-[0.98]"}`}>
            <div className="grid h-full gap-4 md:grid-cols-[1fr_0.82fr]">
              <div className="rounded-[1.35rem] border border-blue-200 bg-white p-5 shadow-sm shadow-blue-950/5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-slate-950">Aktywność w CRPE</p>
                    <p className="mt-0.5 text-xs text-slate-500">wszystko połączone w jednym wpisie</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">kompletne</span>
                </div>

                <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black leading-tight text-slate-950">Konferencja kardiologiczna</p>
                      <p className="mt-1 text-xs text-slate-500">Organizator · 2026 · certyfikat.pdf</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-black text-white shadow-sm">+20 pkt</span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-100">
                      <p className="text-xl font-black text-slate-950">20</p>
                      <p className="text-[10px] font-medium text-slate-400">punktów</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-100">
                      <p className="text-xl font-black text-slate-950">PDF</p>
                      <p className="text-[10px] font-medium text-slate-400">certyfikat</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-100">
                      <p className="text-xl font-black text-emerald-600">OK</p>
                      <p className="text-[10px] font-medium text-slate-400">status</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm shadow-emerald-950/5">
                <div className="mb-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">Panel gotowy</div>
                <p className="text-base font-black text-slate-950">Status CPD jest jasny</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">widzisz punkty, braki i dokumenty bez ręcznego porównywania plików.</p>

                <div className="mt-7">
                  <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-600">
                    <span>Postęp</span>
                    <span>71%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div className="h-full w-[71%] rounded-full bg-blue-600" />
                  </div>
                  <div className="mt-4 rounded-2xl bg-white p-3 text-xs font-bold leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
                    Braki widoczne wcześniej, dokumenty przypisane do aktywności.
                  </div>
                </div>
              </div>
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
    { icon: FileText, title: "Certyfikat", text: "robisz zdjęcie", tone: "blue" as const },
    { icon: BarChart3, title: "Raport", text: "punkty się liczą", tone: "blue" as const },
    { icon: FolderOpen, title: "Baza CRPE", text: "wszystko w jednym miejscu", tone: "blue" as const },
    { icon: Users, title: "Samorząd zawodowy", text: "OIL / KIF / NIPiP", tone: "blue" as const },
    { icon: CheckCircle2, title: "Spokój", text: "wiesz, co masz", tone: "emerald" as const },
  ];

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 p-7 text-white lg:border-b-0 lg:border-r lg:p-8">
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
            <Link href="/login" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50">
              Załóż darmowe konto <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-50/70 p-5 lg:p-7">
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
                    <IconTile tone={tone} className={`h-12 w-12 ${i === 1 ? "animate-pulse" : ""}`}>
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
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-slate-900/5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <IconTile tone="emerald" className="h-11 w-11"><CheckCircle2 className="h-5 w-5" /></IconTile>
                <div>
                  <p className="text-sm font-black text-slate-950">Efekt: dokumentacja CPD pod ręką</p>
                  <p className="text-xs text-slate-600">aktywności, certyfikaty, punkty i braki w jednym miejscu</p>
                </div>
              </div>
              <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">bez chaosu</span>
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
      <div className="overflow-hidden rounded-[1.6rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white shadow-sm shadow-slate-900/5">
        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b border-blue-100 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <Eyebrow>Przypomnienia</Eyebrow>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">System pilnuje braków za Ciebie</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">CRPE może przypominać o brakujących dokumentach, terminach i aktywnościach wymagających uzupełnienia. Dzięki temu łatwiej przygotować raport bez nerwowego sprawdzania wszystkiego na końcu okresu.</p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3 lg:p-8">
            {items.map((item, i) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
                <div className="relative mb-3 h-11 w-11">
                  {i === items.length - 1 ? <span className="absolute inset-0 animate-ping rounded-xl bg-amber-300/30" /> : null}
                  <IconTile tone="amber" className={`relative h-11 w-11 ${i === items.length - 1 ? "animate-bounce" : ""}`}><Bell className="h-5 w-5" /></IconTile>
                </div>
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
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused) return;
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 3), 3200);
    return () => clearInterval(t);
  }, [visible, paused]);

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
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-amber-200 bg-white p-2.5">
            <IconTile tone="amber" className="h-9 w-9"><FileText className="h-4 w-4" /></IconTile>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">Konferencja kardiologiczna</p>
              <p className="text-xs text-slate-400">certyfikat.pdf · 2026</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-emerald-600">+20 pkt</span>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-amber-100 bg-white px-2.5 py-1.5 text-xs text-slate-500">2026</div>
            <div className="rounded-lg border border-amber-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-700">Konferencja</div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-white/70 px-3 py-2 text-xs text-slate-400">
            <UploadCloud className="h-3.5 w-3.5 shrink-0 text-amber-500" />
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
    amber: { text: "text-amber-700", border: "border-amber-300", bg: "bg-amber-500", soft: "bg-amber-100", num: "bg-amber-500", tone: "amber" },
    emerald: { text: "text-emerald-700", border: "border-emerald-200", bg: "bg-emerald-600", soft: "bg-emerald-50", num: "bg-emerald-600", tone: "emerald" },
  };

  return (
    <div id="jak-to-dziala" ref={ref} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className={`${cardCls} scroll-mt-32`}>
      <div className="border-b border-slate-100 px-6 py-5 lg:px-8">
        <Eyebrow>Proces</Eyebrow>
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Trzy kroki do jasnego statusu CPD</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-blue-600/20">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                2 minuty do pierwszego wpisu
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Wybierasz zawód, dodajesz aktywności i widzisz, ile punktów masz oraz czego jeszcze brakuje.</p>
          </div>
          <div className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:block">Interaktywny podgląd</div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="relative border-b border-slate-100 bg-slate-50/60 px-8 py-6">
          <div className="absolute left-[17%] right-[17%] top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
          <div className="absolute left-[17%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${activeStep * 33}%` }}>
            <div className="h-full w-full animate-[pulse_2s_infinite] bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 opacity-60" />
          </div>
          <div className="relative grid grid-cols-3 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const c = cm[step.color];
              const isActive = activeStep === i;
              return (
                <button key={step.n} type="button" onMouseEnter={() => setActiveStep(i)} onClick={() => setActiveStep(i)} className="group flex flex-col items-center gap-3 text-center focus:outline-none">
                  <span className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border bg-white shadow-sm transition-all duration-300 ${isActive ? `${c.border} scale-110 shadow-lg ring-4 ring-current/10` : "border-slate-200 group-hover:border-blue-200"}`}>
                    <span className={`absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${c.num}`}>{step.n}</span>
                    <Icon className={`h-7 w-7 transition-all ${isActive ? `${c.text} scale-110` : "text-slate-500"}`} strokeWidth={1.9} />
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
              <button key={step.n} type="button" onMouseEnter={() => setActiveStep(i)} onClick={() => setActiveStep(i)} className={`flex min-h-[255px] flex-col border-r border-slate-100 p-6 text-left transition-all duration-300 last:border-r-0 focus:outline-none focus-visible:ring-0 lg:p-7 ${isActive ? "bg-white" : "bg-slate-50/30 hover:bg-white"}`}>
                <div className={`mb-4 h-1.5 w-12 rounded-full transition-all ${isActive ? c.bg : "bg-slate-200"}`} />
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                <div className={`mt-auto rounded-2xl border p-3 transition-all duration-300 ${isActive ? `${c.border} ${c.soft} shadow-sm` : "border-slate-100 bg-white/80 opacity-75"}`}>
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
    { id: "dla-kogo", label: "Dla kogo" },
    { id: "jak-to-dziala", label: "Jak to działa" },
    { id: "funkcje", label: "Funkcje CRPE" },
    { id: "przypomnienia", label: "Przypomnienia" },
    { id: "faq", label: "FAQ" },
  ];
  const navBase = "shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none";
  const navActive = "shrink-0 border-b-2 border-blue-600 px-3 py-2.5 text-sm font-semibold text-blue-700 focus:outline-none";
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
          <nav className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <div className="flex min-w-max px-2">
              {navItems.map(({ id, label }) => {
                const isActive = activeSection === id;
                return <button key={id} type="button" onClick={() => scrollToId(id)} className={isActive ? navActive : navBase}>{label}</button>;
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
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-700"><Sparkles className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.75} />Spokojny koniec okresu rozliczeniowego zaczyna się dużo wcześniej</div>
                <h1 className="max-w-3xl text-[42px] font-bold leading-[1.04] tracking-tight text-slate-950 sm:text-[56px] lg:text-[62px]">Masz wszystko pod kontrolą — <span className="text-blue-600">punkty, certyfikaty i terminy.</span></h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">Zbieraj punkty, przechowuj certyfikaty i miej pewność, że nie zabraknie Ci nic na koniec okresu.</p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">Pod koniec okresu nie musisz szukać dokumentów po mailach ani liczyć punktów na szybko. CRPE pokazuje wcześniej, co masz i czego jeszcze brakuje.</p>
                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { icon: FolderOpen, t: "Porządek bez wysiłku", d: "Wpisy i certyfikaty zawsze pod ręką.", tone: "blue" as const },
                    { icon: BarChart3, t: "Jasny status punktów", d: "Wiesz ile masz i czego brakuje.", tone: "amber" as const },
                    { icon: ShieldCheck, t: "Bezpieczne dane", d: "Tylko Ty masz dostęp. Dane w UE.", tone: "emerald" as const },
                    { icon: Sparkles, t: "Start za darmo", d: "Podstawowe funkcje bezpłatnie. Bez karty.", tone: "indigo" as const },
                  ].map((b) => { const Icon = b.icon; return <div key={b.t} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm shadow-slate-900/5"><IconTile tone={b.tone} className="mt-0.5 h-10 w-10"><Icon className="h-5 w-5" strokeWidth={2} /></IconTile><div><div className="text-sm font-semibold text-slate-900">{b.t}</div><p className="mt-0.5 text-xs leading-relaxed text-slate-500">{b.d}</p></div></div>; })}
                </div>
                <div className="mt-8 flex flex-wrap gap-3"><Link href="/login" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95">Załóż konto i zobacz swój status <ArrowRight className="h-4 w-4" /></Link><button type="button" onClick={() => scrollToId("jak-to-dziala")} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">Sprawdź jak działa</button></div>
                <p className="mt-3 text-xs text-slate-500">Bezpłatny start • bez karty płatniczej • pierwszy wpis w około 30 sekund</p>
              </div>
              <div className="relative z-10 min-h-[380px] overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-900 shadow-xl shadow-slate-950/10 lg:min-h-[500px]"><Image src={IMG.hero} alt="Pracowniczka medyczna z tabletem" fill priority className="object-cover object-[50%_22%]" sizes="(max-width: 1024px) 100vw, 390px" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-transparent to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/90">CRPE w praktyce</p><h3 className="mt-1.5 text-xl font-bold leading-tight">Panel zawsze pod ręką</h3><p className="mt-1.5 text-sm leading-relaxed text-white/75">Dodajesz wpisy i dokumenty na bieżąco.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-6"><div className={pageWrap}><div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm shadow-slate-900/5"><p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900">CRPE wspiera zawody regulowane przez samorządy zawodowe</p><div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">{["Naczelną Izbę Lekarską", "Naczelną Izbę Pielęgniarek i Położnych", "Krajową Izbę Fizjoterapeutów", "Naczelną Izbę Aptekarską", "Krajową Izbę Diagnostów Laboratoryjnych"].map((n) => <span key={n} className="text-xs font-medium text-slate-500">{n}</span>)}</div></div></div></section>

      <section className="bg-slate-50 py-7 lg:py-9">
        <div className={`${pageWrap} space-y-10 lg:space-y-14`}>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><PhotoCard src={IMG.team} alt="Zespół medyczny przy stole" title="CRPE pomaga każdemu specjaliście pilnować własnych punktów, terminów i certyfikatów." text="" className="min-h-[390px] lg:min-h-[455px]" imageClassName="object-cover object-[50%_16%]" /><div className="flex min-h-[390px] items-stretch rounded-[1.45rem] bg-gradient-to-br from-white to-slate-50 p-4 lg:min-h-[455px]"><ProductPreview /></div></div>

          <ScenarioStrip />

          <div id="dla-kogo" className="grid scroll-mt-32 gap-6 lg:grid-cols-2">
            <div className={cardCls}>
              <div className="border-b border-slate-100 px-6 py-5 lg:px-8">
                <Eyebrow>Odbiorcy</Eyebrow>
                <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Dla kogo jest CRPE</h2>
                <p className="mt-1 text-sm text-slate-500">Dla zawodów medycznych zobowiązanych do zbierania punktów edukacyjnych. Lekarze, pielęgniarki, fizjoterapeuci i inni specjaliści, którzy chcą mieć porządek bez Excela.</p>
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
                      <IconTile tone="emerald"><Icon className="h-5 w-5" strokeWidth={2.1} /></IconTile>
                      <span className="text-sm font-medium text-slate-800">{t}</span>
                    </div>
                  ))}
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
                    { t: "Historia aktywności w jednym miejscu", icon: BookOpen },
                    { t: "Certyfikaty pod ręką", icon: Award },
                    { t: "Przejrzysty podgląd punktów", icon: BarChart3 },
                    { t: "Gotowość do przygotowania raportu", icon: CalendarCheck },
                  ].map(({ t, icon: Icon }) => (
                    <div key={t} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <IconTile><Icon className="h-5 w-5" strokeWidth={2.1} /></IconTile>
                      <span className="text-sm font-medium text-slate-800">{t}</span>
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
              <div className="border-b border-slate-100 px-6 py-5 lg:px-8">
                <Eyebrow>FAQ</Eyebrow>
                <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Najczęstsze pytania</h2>
                <p className="mt-1 text-sm text-slate-500">Kliknij pytanie, aby zobaczyć odpowiedź.</p>
              </div>
              <div className="p-5 lg:p-7"><FaqAccordion items={FAQ} /></div>
            </div>
            <div className={cardCls}>
              <div className="p-6 lg:p-8">
                <Eyebrow>Przykład użycia</Eyebrow>
                <Quote className="mb-3 h-6 w-6 text-blue-200" strokeWidth={1.5} />
                <p className="text-base leading-relaxed text-slate-700">&quot;Typowy scenariusz: po szkoleniu dodajesz aktywność i certyfikat od razu, a później widzisz, ile punktów masz i czego jeszcze brakuje.&quot;</p>
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
