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

const pageWrap = "mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-8";
const panel = "rounded-[26px] border border-[#d7e3ee] bg-white shadow-[0_20px_55px_rgba(15,45,75,0.08)]";
const innerCard = "rounded-[18px] border border-[#dce7f1] bg-white shadow-[0_12px_30px_rgba(15,45,75,0.055)]";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-cyan-700">{children}</p>;
}

function IconTile({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "cyan" | "emerald" | "amber" }) {
  const styles = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };
  return <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${styles[tone]}`}>{children}</span>;
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
    <section id="profile" className={`${pageWrap} -mt-8 scroll-mt-24 pb-10`}>
      <div className={`${panel} p-3 md:p-4`}>
        <div className="grid gap-3 md:grid-cols-3">
          {profiles.map(({ title, text, icon: Icon, href, cta, tone, highlighted }) => (
            <Link
              key={title}
              href={href}
              className={`group relative flex min-h-[138px] flex-col justify-between rounded-[20px] border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(0,92,180,0.12)] ${
                highlighted
                  ? "border-cyan-300 bg-[linear-gradient(180deg,#f3ffff_0%,#ffffff_80%)] shadow-[inset_0_3px_0_rgba(0,169,181,0.65)]"
                  : "border-[#dfe9f2] bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                <IconTile tone={tone}><Icon className="h-5 w-5" strokeWidth={1.8} /></IconTile>
                <div>
                  <h3 className="text-[15px] font-extrabold text-slate-950">{title}</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-slate-600">{text}</p>
                </div>
              </div>
              <span className={`mt-4 inline-flex items-center gap-1.5 text-[13px] font-extrabold ${highlighted ? "text-cyan-700" : "text-blue-700"}`}>
                {cta} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f3f8fc] pb-16 pt-9">
      <div className="pointer-events-none absolute right-[-220px] top-[-180px] h-[520px] w-[520px] rounded-full bg-blue-100/70 blur-3xl" />
      <div className={`${pageWrap} relative`}>
        <div className={`${panel} overflow-hidden`}>
          <div className="grid min-h-[520px] lg:grid-cols-[0.94fr_1.06fr]">
            <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-[11px] font-bold text-blue-800">
                <ShieldCheck className="h-3.5 w-3.5" /> Bezpieczeństwo, punkty i certyfikaty w jednym miejscu
              </div>
              <h1 className="max-w-[560px] text-[34px] font-black leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-[44px] lg:text-[50px]">
                Punkty CPD pod kontrolą. <span className="text-blue-600">Bez stresu.</span>
              </h1>
              <p className="mt-5 max-w-[520px] text-[15px] leading-7 text-slate-600">
                Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp w aktualnym okresie rozliczeniowym. Prosto, spokojnie, bez Excela.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="#profile" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)] transition hover:bg-blue-700">
                  Wybierz profil <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#jak-to-dziala" className="inline-flex items-center gap-2 rounded-xl border border-[#d6e2ec] bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40">
                  Jak to działa
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  [Sparkles, "Szybki start", "Wpis w kilka minut"],
                  [FolderOpen, "Pełny porządek", "Dokumenty przy wpisach"],
                  [LockKeyhole, "Bezpieczne dane", "Dostęp pod kontrolą"],
                ].map(([Icon, title, text]) => {
                  const LucideIcon = Icon as typeof Sparkles;
                  return (
                    <div key={String(title)} className="rounded-[18px] border border-[#dce7f1] bg-white/80 p-3.5">
                      <LucideIcon className="mb-2 h-4 w-4 text-cyan-700" strokeWidth={2} />
                      <p className="text-[12px] font-extrabold text-slate-950">{String(title)}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{String(text)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative min-h-[460px] overflow-hidden bg-[#eaf3f9]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_20%,#ffffff_0%,rgba(255,255,255,0)_32%)]" />
              <Image
                src="/lekarka_z_tabletem.png"
                alt="Lekarka prezentująca panel CPD"
                fill
                priority
                className="object-cover object-[52%_14%]"
                sizes="(max-width: 1024px) 100vw, 590px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/35 via-transparent to-transparent" />
              <div className="absolute bottom-7 left-7 right-7 rounded-[20px] border border-white/80 bg-white/92 p-4 shadow-[0_18px_38px_rgba(15,45,75,0.18)] backdrop-blur sm:left-auto sm:w-[300px]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Twój status</p>
                    <div className="mt-1 text-[25px] font-black text-slate-950">110 / 200 pkt</div>
                  </div>
                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-100">55%</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[55%] rounded-full bg-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitStrip() {
  const items = [
    { icon: Sparkles, title: "Szybka reakcja", text: "Pierwszy wpis od razu po szkoleniu.", tone: "blue" as const },
    { icon: FolderOpen, title: "Profesjonalny porządek", text: "Aktywności, certyfikaty i raporty w jednym panelu.", tone: "cyan" as const },
    { icon: ClipboardCheck, title: "Gotowość do kontroli", text: "Status punktów i braków widoczny na bieżąco.", tone: "emerald" as const },
  ];

  return (
    <section className={`${pageWrap} pb-14`}>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map(({ icon: Icon, title, text, tone }) => (
          <div key={title} className={`${innerCard} flex gap-4 p-5`}>
            <IconTile tone={tone}><Icon className="h-5 w-5" /></IconTile>
            <div>
              <h3 className="text-[15px] font-extrabold text-slate-950">{title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{text}</p>
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
    { n: "3", icon: BarChart3, title: "Widzisz status", text: "Masz podgląd postępu, braków i dokumentów do rozliczenia." },
  ];

  return (
    <section id="jak-to-dziala" className={`${pageWrap} pb-16 scroll-mt-24`}>
      <div className="text-center">
        <Eyebrow>Jak to działa</Eyebrow>
        <h2 className="text-[28px] font-black tracking-[-0.025em] text-slate-950 md:text-[34px]">Etapy pracy z CRPE</h2>
      </div>
      <div className="relative mt-9">
        <div className="absolute left-[15%] right-[15%] top-[34px] hidden h-px bg-cyan-300 md:block" />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ n, icon: Icon, title, text }) => (
            <div key={n} className={`${innerCard} relative p-6 text-center`}>
              <div className="mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 ring-[10px] ring-[#f3f8fc]">
                <Icon className="h-7 w-7 text-cyan-700" strokeWidth={1.8} />
              </div>
              <span className="absolute left-1/2 top-5 ml-5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-600/20">{n}</span>
              <h3 className="mt-5 text-[16px] font-extrabold text-slate-950">{title}</h3>
              <p className="mx-auto mt-2 max-w-[260px] text-[13px] leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] rounded-[28px] border border-[#d6e2ec] bg-white p-4 shadow-[0_26px_70px_rgba(22,55,90,0.13)]">
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <div className="hidden rounded-[20px] bg-[#f4f8fb] p-3 sm:block">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-blue-600" />
            <span className="text-xs font-black text-slate-900">CRPE</span>
          </div>
          {['Panel', 'Aktywności', 'Certyfikaty', 'Raporty'].map((item, i) => (
            <div key={item} className={`mb-2 rounded-xl px-3 py-2 text-[11px] font-bold ${i === 0 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>{item}</div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">Panel użytkownika</p>
              <p className="text-xs text-slate-500">Aktualny okres rozliczeniowy</p>
            </div>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-extrabold text-cyan-700 ring-1 ring-cyan-100">Aktualne</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[["110", "pkt"], ["200", "cel"], ["90", "brak"]].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-[#dfe9f2] bg-[#f8fbfd] p-3 text-center">
                <div className="text-[19px] font-black text-slate-950">{value}</div>
                <div className="text-[11px] font-semibold text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="mb-2 flex justify-between text-[11px] font-bold text-slate-500"><span>Postęp</span><span>55%</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[55%] rounded-full bg-blue-600" /></div>
          </div>
          <div className="space-y-2.5">
            {["Konferencja kardiologiczna +20 pkt", "Kurs online +15 pkt", "Webinar medyczny +10 pkt"].map((x) => (
              <div key={x} className="flex items-center gap-3 rounded-2xl border border-[#dfe9f2] bg-white px-4 py-3 text-[13px] font-bold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {x}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureSection() {
  const features = [
    { icon: BookOpen, title: "Historia aktywności", text: "Szkolenia, kursy i wydarzenia zawsze pod ręką." },
    { icon: Award, title: "Certyfikaty przy wpisach", text: "Każdy dokument przypięty do konkretnej aktywności." },
    { icon: BarChart3, title: "Przejrzysty status", text: "Od razu wiesz, ile masz i ile jeszcze brakuje." },
    { icon: FileText, title: "Raporty i podsumowania", text: "Eksporty i dokumenty bez szukania plików." },
  ];

  return (
    <section id="funkcje" className="scroll-mt-24 bg-[#eef3f7] py-16">
      <div className={pageWrap}>
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <Eyebrow>CRPE w praktyce</Eyebrow>
            <h2 className="max-w-xl text-[28px] font-black leading-tight tracking-[-0.025em] text-slate-950 md:text-[36px]">Wszystko, czego potrzebujesz do zarządzania CPD</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
              Prosty panel dla aktywności, certyfikatów i punktów. Mniej ręcznego sprawdzania, więcej pewności przed końcem okresu rozliczeniowego.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-[18px] border border-[#d2dfe9] bg-white/80 p-4 shadow-[0_10px_28px_rgba(15,45,75,0.055)]">
                  <IconTile tone="blue"><Icon className="h-4 w-4" /></IconTile>
                  <h3 className="mt-3 text-[14px] font-extrabold text-slate-950">{title}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-blue-100 blur-3xl" />
            <div className="absolute -bottom-10 left-4 h-44 w-44 rounded-full bg-cyan-100 blur-3xl" />
            <DashboardMockup />
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
    <section id="faq" className={`${pageWrap} py-16 scroll-mt-24`}>
      <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        <div className={`${panel} p-6 md:p-8`}>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-[27px] font-black tracking-[-0.025em] text-slate-950 md:text-[32px]">Najczęstsze pytania</h2>
          <div className="mt-6 space-y-3">
            {items.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-[#dce7f1] bg-white px-5 py-4 open:shadow-[0_12px_30px_rgba(15,45,75,0.06)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-extrabold text-slate-950">
                  {q}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className={`${panel} flex flex-col justify-between p-6 md:p-8`}>
          <div>
            <IconTile tone="cyan"><HelpCircle className="h-5 w-5" /></IconTile>
            <h3 className="mt-5 text-[25px] font-black leading-tight tracking-[-0.02em] text-slate-950">Nie wiesz, który profil wybrać?</h3>
            <p className="mt-3 text-[14px] leading-7 text-slate-600">Porównaj role albo skontaktuj się z nami. Dobierzemy ścieżkę do Twojego sposobu pracy.</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="#profile" className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]">Porównaj profile</Link>
            <Link href="mailto:kontakt@crpe.pl" className="text-sm font-extrabold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-blue-700">Skontaktuj się</Link>
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
        <div className={`${panel} p-6 text-slate-500`}>Sprawdzam sesję…</div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className={`${pageWrap} py-10`}>
        <div className={`${panel} p-6 text-slate-500`}>Przenoszę…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f8fc]">
      <Hero />
      <HeroProfiles />
      <BenefitStrip />
      <HowItWorks />
      <FeatureSection />
      <FaqSection />
      <BottomCTA />
    </div>
  );
}
