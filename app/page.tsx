"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";
import BottomCTA from "@/components/BottomCTA";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  HelpCircle,
  LockKeyhole,
  Medal,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  UserRound,
} from "lucide-react";

type ProfileRow = {
  user_id: string;
  profession: string | null;
  period_start: number | null;
  period_end: number | null;
  required_points: number | null;
};

const pageWrap = "mx-auto w-full max-w-[1140px] px-4 sm:px-6 lg:px-8";
const card = "rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5";
const softCard = "rounded-[1.1rem] border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/5";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-700">{children}</p>;
}

function IconBubble({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "cyan" | "amber" | "emerald" }) {
  const styles = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };
  return <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${styles[tone]}`}>{children}</span>;
}

function HeroProfiles() {
  const profiles = [
    {
      title: "Placówka medyczna",
      text: "Personel, punkty i dokumentacja w jednym miejscu.",
      icon: Building2,
      href: "/login?profile=facility",
      cta: "Wybierz placówkę",
      tone: "blue" as const,
    },
    {
      title: "Organizator",
      text: "Szkolenia, uczestnicy i raportowanie aktywności.",
      icon: CalendarCheck,
      href: "/login?profile=organizer",
      cta: "Wybierz organizatora",
      tone: "cyan" as const,
      highlighted: true,
    },
    {
      title: "Medyk",
      text: "Punkty CPD, aktywności i certyfikaty pod ręką.",
      icon: Stethoscope,
      href: "/login?profile=medic",
      cta: "Wybierz medyka",
      tone: "blue" as const,
    },
  ];

  return (
    <div id="profile" className="mt-8 scroll-mt-28 rounded-[1.25rem] border border-slate-200 bg-white/90 p-3 shadow-sm shadow-slate-900/5 backdrop-blur">
      <div className="grid gap-3 md:grid-cols-3">
        {profiles.map(({ title, text, icon: Icon, href, cta, tone, highlighted }) => (
          <Link
            key={title}
            href={href}
            className={`group flex items-center gap-4 rounded-[1rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-950/10 ${
              highlighted ? "border-cyan-300 bg-cyan-50/70" : "border-slate-200 bg-white"
            }`}
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${highlighted ? "bg-white" : "bg-slate-50"} ring-1 ring-slate-100`}>
              <Icon className={`h-7 w-7 ${tone === "cyan" ? "text-cyan-700" : "text-blue-700"}`} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-black text-slate-950">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
              <span className={`mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold ${highlighted ? "text-cyan-700" : "text-blue-700"}`}>
                {cta} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-8 lg:pb-12 lg:pt-10">
      <div className="pointer-events-none absolute left-[-180px] top-[-160px] h-[420px] w-[420px] rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="pointer-events-none absolute right-[-160px] top-10 h-[420px] w-[420px] rounded-full bg-blue-100/70 blur-3xl" />
      <div className={`${pageWrap} relative`}>
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
          <div className="flex flex-col justify-center rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-7 shadow-lg shadow-blue-950/5 backdrop-blur sm:p-10">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-[11px] font-bold text-cyan-800">
              <ShieldCheck className="h-3.5 w-3.5" /> Punkty, certyfikaty i terminy w jednym panelu
            </div>
            <h1 className="max-w-[620px] text-[36px] font-black leading-[1.06] tracking-[-0.04em] text-slate-950 sm:text-[46px] lg:text-[54px]">
              Punkty CPD pod kontrolą. <span className="text-blue-600">Bez stresu.</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-base leading-relaxed text-slate-600">
              CRPE porządkuje aktywności, certyfikaty i status punktów. Wybierz rolę, zacznij od właściwej ścieżki i pilnuj rozliczenia bez Excela.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#profile" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                Wybierz profil <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#jak-to-dziala" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Jak to działa
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                [Medal, "Porządek", "Bez ręcznego liczenia"],
                [FolderOpen, "Dokumenty", "Certyfikaty przy wpisach"],
                [ShieldCheck, "Bezpieczeństwo", "Dane pod kontrolą"],
              ].map(([Icon, title, text]) => {
                const LucideIcon = Icon as typeof Medal;
                return (
                  <div key={String(title)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
                    <IconBubble tone="blue"><LucideIcon className="h-4 w-4" /></IconBubble>
                    <div>
                      <p className="text-xs font-black text-slate-900">{String(title)}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{String(text)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[430px] overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-100 shadow-lg shadow-blue-950/5">
            <Image
              src="/lekarka_z_tabletem.png"
              alt="Lekarka prezentująca panel CPD"
              fill
              priority
              className="object-cover object-[50%_14%]"
              sizes="(max-width: 1024px) 100vw, 540px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-blue-950/15 backdrop-blur sm:left-auto sm:w-[300px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Twój status</p>
                  <div className="mt-1 text-2xl font-black text-slate-950">110 / 200 pkt</div>
                </div>
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-100">55%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[55%] rounded-full bg-blue-600" />
              </div>
            </div>
          </div>
        </div>
        <HeroProfiles />
      </div>
    </section>
  );
}

function BenefitStrip() {
  const items = [
    { icon: Sparkles, title: "Szybki start", text: "Pierwszy wpis w kilka minut.", tone: "blue" as const },
    { icon: FolderOpen, title: "Jedno miejsce", text: "Aktywności, certyfikaty i raporty.", tone: "cyan" as const },
    { icon: LockKeyhole, title: "Bezpieczne dane", text: "Dostęp i dokumenty pod kontrolą.", tone: "blue" as const },
    { icon: ClipboardCheck, title: "Gotowość do raportu", text: "Postęp i braki widoczne od razu.", tone: "emerald" as const },
  ];

  return (
    <section className={`${pageWrap} pb-12`}>
      <div className={`${card} grid gap-0 overflow-hidden md:grid-cols-4`}>
        {items.map(({ icon: Icon, title, text, tone }) => (
          <div key={title} className="flex gap-3 border-b border-slate-100 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
            <IconBubble tone={tone}><Icon className="h-4 w-4" /></IconBubble>
            <div>
              <h3 className="text-sm font-black text-slate-950">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", icon: UserRound, title: "Wybierasz profil", text: "Placówka, organizator albo medyk — od razu właściwa ścieżka." },
    { n: "2", icon: UploadCloud, title: "Uzupełniasz dane", text: "Dodajesz aktywności, punkty i certyfikaty bez arkuszy." },
    { n: "3", icon: BarChart3, title: "Masz porządek", text: "Widzisz status, braki i dokumenty potrzebne do rozliczenia." },
  ];

  return (
    <section id="jak-to-dziala" className={`${pageWrap} pb-14 scroll-mt-28`}>
      <div className="text-center">
        <Eyebrow>Jak to działa</Eyebrow>
        <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Trzy kroki do uporządkowanego CPD</h2>
      </div>
      <div className="relative mt-8 rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 md:p-7">
        <div className="absolute left-[18%] right-[18%] top-[68px] hidden border-t-2 border-dotted border-cyan-200 md:block" />
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map(({ n, icon: Icon, title, text }) => (
            <div key={n} className="relative z-10 rounded-[1.1rem] border border-slate-100 bg-white p-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 ring-8 ring-white">
                <span className="absolute left-1/2 top-3 ml-5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{n}</span>
                <Icon className="h-7 w-7 text-cyan-700" strokeWidth={1.8} />
              </div>
              <h3 className="mt-5 text-base font-black text-slate-950">{title}</h3>
              <p className="mx-auto mt-2 max-w-[270px] text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  const features = [
    { icon: BookOpen, title: "Historia aktywności", text: "Szkolenia, kursy i wydarzenia zawsze pod ręką." },
    { icon: Award, title: "Certyfikaty przy wpisach", text: "Każdy dokument przypięty do konkretnej aktywności." },
    { icon: BarChart3, title: "Status punktów", text: "Od razu wiesz, ile masz i ile jeszcze brakuje." },
    { icon: FileText, title: "Raporty", text: "Eksporty i podsumowania bez szukania plików." },
  ];

  return (
    <section id="funkcje" className={`${pageWrap} pb-14 scroll-mt-28`}>
      <div className={`${card} overflow-hidden bg-slate-50/70`}>
        <div className="grid gap-0 lg:grid-cols-[0.96fr_1.04fr] lg:items-stretch">
          <div className="p-6 md:p-8 lg:p-10">
            <Eyebrow>CRPE w praktyce</Eyebrow>
            <h2 className="max-w-xl text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Wszystko, czego potrzebujesz do zarządzania CPD</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
              Prosty panel dla aktywności, certyfikatów i punktów. Mniej ręcznego sprawdzania, więcej pewności przed końcem okresu rozliczeniowego.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className={`${softCard} p-4`}>
                  <IconBubble tone="blue"><Icon className="h-4 w-4" /></IconBubble>
                  <h3 className="mt-3 text-sm font-black text-slate-950">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 md:p-8">
            <div className="absolute inset-x-0 bottom-0 top-0 opacity-60">
              <Image src="/crpe_reka2b.png" alt="Panel CRPE na tablecie" fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 560px" />
            </div>
            <div className="relative ml-auto max-w-[420px] rounded-[1.35rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-blue-950/10 backdrop-blur">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-black text-slate-950">Panel użytkownika</p>
                  <p className="text-xs text-slate-400">Aktualny okres</p>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-100">Aktualne</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["110", "pkt"],
                  ["200", "cel"],
                  ["90", "brak"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <div className="text-lg font-black text-slate-950">{value}</div>
                    <div className="text-[11px] font-semibold text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[55%] rounded-full bg-blue-600" />
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Konferencja kardiologiczna +20 pkt",
                  "Kurs online +15 pkt",
                  "Webinar medyczny +10 pkt",
                ].map((x) => (
                  <div key={x} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" /> {x}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const items = [
    ["Czy CRPE jest połączone z systemami państwowymi?", "Nie. CRPE służy do Twojej kontroli i uporządkowania danych. Systemy państwowe są zamknięte."],
    ["Czy moje certyfikaty są bezpieczne?", "Tak. Dane są zabezpieczone, a dostęp do nich masz tylko Ty."],
    ["Czy mogę korzystać z telefonu?", "Tak. Certyfikat możesz dodać od razu po szkoleniu, również jako zdjęcie z telefonu."],
    ["Czy korzystanie jest darmowe?", "Podstawowe funkcje są darmowe. Rozszerzone funkcje mogą pojawić się jako pakiet PRO."],
  ];

  return (
    <section id="faq" className={`${pageWrap} pb-14 scroll-mt-28`}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className={`${card} p-6 md:p-8`}>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Najczęstsze pytania</h2>
          <div className="mt-6 space-y-3">
            {items.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-slate-950">
                  {q}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-600 ring-1 ring-slate-200 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className={`${card} flex flex-col justify-between overflow-hidden p-6 md:p-8`}>
          <div>
            <IconBubble tone="cyan"><HelpCircle className="h-5 w-5" /></IconBubble>
            <h3 className="mt-5 text-2xl font-black text-slate-950">Nie wiesz, który profil wybrać?</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Porównaj role albo skontaktuj się z nami. Dobierzemy ścieżkę do Twojego sposobu pracy.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#profile" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20">Porównaj profile</Link>
            <Link href="mailto:kontakt@crpe.pl" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700">Skontaktuj się</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let alive = true;
    async function run() {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!alive) return;
      if (authError || !auth?.user) {
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }
      setIsLoggedIn(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, profession, period_start, period_end, required_points")
        .eq("user_id", auth.user.id)
        .maybeSingle<ProfileRow>();
      if (!alive) return;
      router.replace(profile ? "/kalkulator" : "/start");
    }
    run();
    return () => {
      alive = false;
    };
  }, [router, supabase]);

  if (checking) {
    return (
      <div className={`${pageWrap} py-10`}>
        <div className={`${card} p-6 text-slate-500`}>Sprawdzam sesję…</div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className={`${pageWrap} py-10`}>
        <div className={`${card} p-6 text-slate-500`}>Przenoszę…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_34%,#f8fafc_100%)]">
      <Hero />
      <BenefitStrip />
      <HowItWorks />
      <FeatureSection />
      <FaqSection />
      <BottomCTA />
    </div>
  );
}
