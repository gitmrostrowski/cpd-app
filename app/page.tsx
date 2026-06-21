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
  HeartPulse,
  LockKeyhole,
  Medal,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  UserRound,
  Users,
} from "lucide-react";

type ProfileRow = {
  user_id: string;
  profession: string | null;
  period_start: number | null;
  period_end: number | null;
  required_points: number | null;
};

const pageWrap = "mx-auto w-full max-w-[1220px] px-4 sm:px-6 lg:px-8";
const card = "rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5";
const softCard = "rounded-[1.25rem] border border-slate-200/80 bg-white/85 shadow-sm shadow-slate-900/5";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-600">{children}</p>;
}

function IconBubble({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "cyan" | "amber" | "emerald" }) {
  const styles = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };
  return <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${styles[tone]}`}>{children}</span>;
}

function ProfileCards() {
  const profiles = [
    {
      title: "Placówka medyczna",
      text: "Zarządzaj personelem, punktami edukacyjnymi i dokumentacją w jednym miejscu.",
      icon: Building2,
      href: "/login?profile=facility",
      cta: "Wybierz placówkę",
      tone: "blue" as const,
    },
    {
      title: "Organizator",
      text: "Twórz szkolenia, zarządzaj uczestnikami i raportuj aktywności edukacyjne.",
      icon: CalendarCheck,
      href: "/login?profile=organizer",
      cta: "Wybierz organizatora",
      tone: "cyan" as const,
      highlighted: true,
    },
    {
      title: "Medyk",
      text: "Pilnuj swoich punktów CPD, zapisuj aktywności i przechowuj certyfikaty.",
      icon: Stethoscope,
      href: "/login?profile=medic",
      cta: "Wybierz medyka",
      tone: "blue" as const,
    },
  ];

  return (
    <section id="profile" className={`${pageWrap} -mt-10 relative z-20 pb-12 scroll-mt-28`}>
      <div className={`${card} overflow-hidden bg-white/95 p-5 backdrop-blur md:p-7`}>
        <div className="mb-6 text-center">
          <Eyebrow>Start dopasowany do roli</Eyebrow>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Wybierz profil i przejdź dalej</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Trzy ścieżki na pierwszej stronie — bez szukania w menu. Każdy profil prowadzi do właściwego onboardingu.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {profiles.map(({ title, text, icon: Icon, href, cta, tone, highlighted }) => (
            <Link
              key={title}
              href={href}
              className={`group flex min-h-[280px] flex-col rounded-[1.35rem] border p-6 text-center transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10 ${
                highlighted
                  ? "border-cyan-300 bg-gradient-to-b from-cyan-50/80 to-white ring-1 ring-cyan-100"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-slate-50 ring-1 ring-slate-100">
                <Icon className={`h-11 w-11 ${tone === "cyan" ? "text-cyan-600" : "text-blue-700"}`} strokeWidth={1.7} />
              </div>
              <h3 className="text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{text}</p>
              <span
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  highlighted
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20 group-hover:bg-cyan-700"
                    : "border border-blue-200 bg-white text-blue-700 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                }`}
              >
                {cta} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitStrip() {
  const items = [
    { icon: Sparkles, title: "Szybki start", text: "Rejestracja i pierwszy wpis w kilka minut.", tone: "blue" as const },
    { icon: FolderOpen, title: "Wszystko w jednym miejscu", text: "Aktywności, certyfikaty i raporty w jednym panelu.", tone: "cyan" as const },
    { icon: LockKeyhole, title: "Bezpieczne dokumenty", text: "Dane i certyfikaty są zawsze chronione.", tone: "blue" as const },
    { icon: ClipboardCheck, title: "Gotowość do raportu", text: "Widzisz postęp, braki i kompletność dokumentów.", tone: "emerald" as const },
  ];

  return (
    <section className={`${pageWrap} pb-12`}>
      <div className={`${card} grid gap-0 overflow-hidden md:grid-cols-4`}>
        {items.map(({ icon: Icon, title, text, tone }) => (
          <div key={title} className="flex gap-4 border-b border-slate-100 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:p-6">
            <IconBubble tone={tone}><Icon className="h-5 w-5" /></IconBubble>
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
    { n: "1", icon: UserRound, title: "Wybierasz profil", text: "Wybierz rolę najlepiej dopasowaną do Twoich potrzeb." },
    { n: "2", icon: UploadCloud, title: "Uzupełniasz dane", text: "Podaj niezbędne informacje i skonfiguruj konto." },
    { n: "3", icon: BarChart3, title: "Zaczynasz działać", text: "Korzystaj z funkcji CRPE i osiągaj swoje cele." },
  ];

  return (
    <section id="jak-to-dziala" className={`${pageWrap} pb-14 scroll-mt-28`}>
      <div className="text-center">
        <Eyebrow>Jak to działa</Eyebrow>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Prosty proces od startu do porządku</h2>
      </div>
      <div className="relative mt-9 grid gap-6 md:grid-cols-3">
        <div className="absolute left-[16%] right-[16%] top-12 hidden border-t-2 border-dashed border-blue-100 md:block" />
        {steps.map(({ n, icon: Icon, title, text }) => (
          <div key={n} className="relative z-10 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 ring-8 ring-white">
              <span className="absolute -mt-16 -ml-16 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{n}</span>
              <Icon className="h-10 w-10 text-blue-700" strokeWidth={1.7} />
            </div>
            <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
            <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureSection() {
  const features = [
    { icon: BookOpen, title: "Historia aktywności", text: "Szkolenia, kursy i wydarzenia zawsze pod ręką." },
    { icon: Award, title: "Certyfikaty przy wpisach", text: "Każdy dokument jest przypięty do odpowiedniej aktywności." },
    { icon: BarChart3, title: "Przejrzysty status punktów", text: "Od razu widzisz, ile masz i ile jeszcze brakuje." },
    { icon: FileText, title: "Raporty i podsumowania", text: "Eksportuj dane i przygotuj dokumenty bez chaosu." },
  ];

  return (
    <section id="funkcje" className={`${pageWrap} pb-14 scroll-mt-28`}>
      <div className={`${card} overflow-hidden p-5 md:p-8`}>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Eyebrow>CRPE w praktyce</Eyebrow>
            <h2 className="max-w-xl text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Wszystko, czego potrzebujesz do zarządzania CPD</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Prosty panel dla aktywności, certyfikatów i punktów. Bez arkuszy, zgubionych PDF-ów i sprawdzania wszystkiego na koniec okresu.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className={softCard + " p-4"}>
                  <IconBubble tone="blue"><Icon className="h-5 w-5" /></IconBubble>
                  <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-inner">
            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-xl shadow-blue-950/10">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-black text-slate-950">Panel użytkownika</p>
                  <p className="text-xs text-slate-400">Twój postęp</p>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-100">Aktualne</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["110 pkt", "200 cel", "90 brak"].map((x) => (
                  <div key={x} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center text-sm font-black text-slate-900">{x}</div>
                ))}
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[55%] rounded-full bg-blue-600" />
              </div>
              <div className="mt-5 space-y-3">
                {["Konferencja kardiologiczna +20 pkt", "Kurs online +15 pkt", "Webinar medyczny +10 pkt"].map((x) => (
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
          <h2 className="text-3xl font-black tracking-tight text-slate-950">Najczęstsze pytania</h2>
          <div className="mt-6 space-y-3">
            {items.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-slate-950">
                  {q}
                  <span className="rounded-full bg-white p-1 text-blue-600 ring-1 ring-slate-200 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className={`${card} flex flex-col justify-between p-6 md:p-8`}>
          <div>
            <IconBubble tone="cyan"><HelpCircle className="h-6 w-6" /></IconBubble>
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_38%,#f8fafc_100%)]">
      <section className="relative overflow-hidden pb-16 pt-8 lg:pb-20 lg:pt-10">
        <div className="pointer-events-none absolute left-[-140px] top-[-140px] h-[420px] w-[420px] rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute right-[-150px] top-16 h-[440px] w-[440px] rounded-full bg-cyan-100/70 blur-3xl" />
        <div className={`${pageWrap} relative`}>
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-xl shadow-blue-950/5 backdrop-blur">
            <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Bezpieczeństwo, punkty i certyfikaty w jednym miejscu
                </div>
                <h1 className="max-w-3xl text-[42px] font-black leading-[1.02] tracking-tight text-slate-950 sm:text-[58px] lg:text-[66px]">
                  Punkty CPD pod kontrolą. <span className="text-blue-600">Bez stresu.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                  Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w aktualnym okresie rozliczeniowym. Prosto. Spokojnie. Bez Excela.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="#profile" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                    Wybierz profil <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="#jak-to-dziala" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                    Jak to działa
                  </Link>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    [Medal, "Porządek bez wysiłku"],
                    [HeartPulse, "Pełna kontrola"],
                    [ShieldCheck, "Bezpieczne dane"],
                  ].map(([Icon, label]) => {
                    const LucideIcon = Icon as typeof Medal;
                    return (
                      <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <IconBubble tone="blue"><LucideIcon className="h-5 w-5" /></IconBubble>
                        <span className="text-sm font-black text-slate-800">{String(label)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative min-h-[460px] bg-gradient-to-br from-blue-50 via-white to-cyan-50 lg:min-h-[640px]">
                <Image
                  src="/lekarka_z_tabletem.png"
                  alt="Lekarka prezentująca panel CPD"
                  fill
                  priority
                  className="object-cover object-[50%_12%]"
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-6 right-6 rounded-2xl border border-white/70 bg-white/85 p-5 shadow-xl shadow-blue-950/15 backdrop-blur md:left-10 md:right-auto md:w-[320px]">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Twój status</p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <div className="text-3xl font-black text-slate-950">110 / 200 pkt</div>
                    <div className="text-sm font-bold text-slate-500">55%</div>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[55%] rounded-full bg-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProfileCards />
      <BenefitStrip />
      <HowItWorks />
      <FeatureSection />
      <FaqSection />
      <BottomCTA />
    </div>
  );
}
