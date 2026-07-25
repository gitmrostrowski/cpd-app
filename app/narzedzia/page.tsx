import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  FileText,
  FolderOpen,
  Smartphone,
  UploadCloud,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Narzędzia CRPE – Panel CPD, aktywności, raporty i baza szkoleń",
  description: "Poznaj wszystkie narzędzia dostępne w CRPE dla medyka.",
};

const wrap = "mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8";

const tools = [
  {
    icon: BarChart3,
    title: "Panel CPD i kalkulator",
    text: "Ustaw okres rozliczeniowy i cel, obserwuj postęp, limity oraz brakujące punkty.",
    href: "/kalkulator",
    cta: "Otwórz Panel CPD",
    bullets: ["Cel i okres rozliczeniowy", "Postęp i upływ czasu", "Limity oraz brakujące dokumenty"],
  },
  {
    icon: CalendarCheck2,
    title: "Aktywności i certyfikaty",
    text: "Dodawaj wydarzenia, punkty i kategorie, a następnie przypisuj dokument do właściwego wpisu.",
    href: "/aktywnosci",
    cta: "Przejdź do aktywności",
    bullets: ["Edycja i kontrola kompletności", "PDF lub zdjęcie certyfikatu", "Historia aktywności"],
  },
  {
    icon: FileText,
    title: "Raport użytkownika",
    text: "Przygotuj zestawienie aktywności, punktów i dokumentów dla wybranego okresu.",
    href: "/raporty",
    cta: "Zobacz raporty",
    bullets: ["Podsumowanie okresu", "Eksport raportu", "Zestaw dokumentów"],
  },
  {
    icon: FolderOpen,
    title: "Baza szkoleń",
    text: "Wyszukuj kursy, webinary i wydarzenia, filtruj je i dodawaj wybrane pozycje do planu CPD.",
    href: "/baza-szkolen",
    cta: "Przejdź do bazy",
    bullets: ["Filtry zawodu, miejsca i terminu", "Planowanie kolejnych aktywności", "Brak automatycznego zapisu u organizatora"],
  },
];

export default function Page() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_0%,rgba(125,211,252,0.26),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef6fc_100%)] py-14 sm:py-18">
        <div className={wrap}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">Narzędzia CRPE</p>
            <h1 className="mt-3 text-[40px] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-[58px]">Cały warsztat ewidencji w jednym koncie.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-7 text-slate-600 sm:text-[18px] sm:leading-8">Panel, aktywności, dokumenty, raport i baza szkoleń prowadzą użytkownika przez kolejne etapy pracy.</p>
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="grid gap-5 lg:grid-cols-2">
          {tools.map(({ icon: Icon, title, text, href, cta, bullets }, index) => (
            <article key={title} className="crpe-interactive-card flex flex-col rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_52px_rgba(15,45,75,0.07)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className="crpe-card-icon flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><Icon className="h-6 w-6" /></span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-100">Dostępne</span>
              </div>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Narzędzie 0{index + 1}</p>
              <h2 className="mt-2 text-[25px] font-black tracking-[-0.035em] text-slate-950">{title}</h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">{text}</p>
              <ul className="mt-5 grid gap-2.5">
                {bullets.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-slate-700"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>
                ))}
              </ul>
              <Link href={href} className="mt-7 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(37,99,235,0.18)] hover:bg-blue-700">{cta}<ArrowRight className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white sm:py-18">
        <div className={`${wrap} grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14`}>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-300">Praca na różnych urządzeniach</p>
            <h2 className="mt-3 text-[31px] font-black leading-[1.08] tracking-[-0.04em] sm:text-[44px]">Dodawaj dane tam, gdzie jest Ci wygodnie.</h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-300">Interfejs działa na komputerze i telefonie. Dokument możesz dołączyć jako PDF albo zdjęcie zrobione telefonem.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><Smartphone className="h-6 w-6 text-cyan-300" /><h3 className="mt-4 text-lg font-black">Dostęp mobilny</h3><p className="mt-2 text-sm leading-6 text-slate-300">Sprawdzaj status i uzupełniaj dane bezpośrednio z telefonu.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><UploadCloud className="h-6 w-6 text-cyan-300" /><h3 className="mt-4 text-lg font-black">Dokument przy wpisie</h3><p className="mt-2 text-sm leading-6 text-slate-300">Certyfikat pozostaje przypisany do konkretnej aktywności.</p></div>
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="rounded-[28px] bg-blue-600 px-6 py-9 text-white shadow-[0_26px_70px_rgba(37,99,235,0.25)] sm:px-10 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">Zacznij od podstaw</p><h2 className="mt-2 text-[30px] font-black leading-[1.08] tracking-[-0.04em] sm:text-[42px]">Załóż konto i uruchom własny Panel CPD.</h2></div>
            <Link href="/rejestracja" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-blue-700 shadow-lg">Załóż konto<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
