import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Eye,
  FileLock2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Bezpieczeństwo i prywatność w CRPE",
  description: "Dowiedz się, jak CRPE oddziela konta, dane i dokumenty oraz jaki jest zakres odpowiedzialności systemu.",
};

const wrap = "mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8";

const principles = [
  { icon: KeyRound, title: "Dostęp po zalogowaniu", text: "Dane osobiste, aktywności i dokumenty są dostępne w kontekście zalogowanego konta użytkownika." },
  { icon: UserCheck, title: "Indywidualne konta", text: "Nie rekomendujemy współdzielenia jednego konta przez wiele osób. Każdy użytkownik powinien pracować na własnym profilu." },
  { icon: FileLock2, title: "Dokument przy aktywności", text: "Plik jest przypisywany do konkretnego wpisu, dzięki czemu łatwiej kontrolować kompletność ewidencji." },
  { icon: Eye, title: "Zakres dostępu", text: "Dostęp do danych powinien wynikać z roli użytkownika i nadanych uprawnień, szczególnie w modułach organizacyjnych." },
  { icon: Trash2, title: "Kontrola nad wpisami", text: "Użytkownik powinien móc edytować i usuwać własne wpisy zgodnie z funkcjami dostępnymi w koncie." },
  { icon: Database, title: "Rozdzielenie odpowiedzialności", text: "CRPE pomaga porządkować ewidencję, ale nie jest państwowym rejestrem ani oficjalnym systemem rozliczeniowym." },
];

export default function Page() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_0%,rgba(125,211,252,0.28),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef6fc_100%)] py-14 sm:py-20">
        <div className={wrap}>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-center lg:gap-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-1.5 text-[11px] font-extrabold text-blue-800 shadow-sm"><ShieldCheck className="h-4 w-4" />Bezpieczeństwo i prywatność</div>
              <h1 className="mt-5 max-w-3xl text-[40px] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-[58px]">Twoje dane i dokumenty pozostają pod Twoją kontrolą.</h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-8 text-slate-600 sm:text-[18px]">CRPE służy do własnej ewidencji aktywności, punktów i dokumentów. Wyjaśniamy jasno, co robi system, kto widzi dane i czego CRPE nie zastępuje.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/polityka-prywatnosci" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">Polityka prywatności<ArrowRight className="h-4 w-4" /></Link>
                <Link href="/regulamin" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-slate-700">Regulamin</Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-blue-100 bg-white/90 p-6 shadow-[0_28px_75px_rgba(15,45,75,0.13)] sm:p-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]"><LockKeyhole className="h-7 w-7" /></span>
              <h2 className="mt-5 text-[27px] font-black tracking-[-0.04em] text-slate-950">Najważniejsze zasady</h2>
              <div className="mt-5 grid gap-3">
                {["Dane dostępne po zalogowaniu", "Dokumenty przypisane do wpisów", "Jasny status funkcji i modułów", "Brak automatycznego rozliczenia w systemie państwowym"].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p className="text-sm font-semibold leading-6 text-slate-700">{item}</p></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="mx-auto max-w-3xl text-center"><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">Zasady produktu</p><h2 className="mt-3 text-[32px] font-black tracking-[-0.04em] text-slate-950 sm:text-[44px]">Jak rozumiemy bezpieczną ewidencję.</h2></div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {principles.map(({ icon: Icon, title, text }) => (
            <article key={title} className="crpe-interactive-card rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_15px_42px_rgba(15,45,75,0.06)]">
              <span className="crpe-card-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-[17px] font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white sm:py-18">
        <div className={`${wrap} grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-14`}>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-300">Ważne rozróżnienie</p><h2 className="mt-3 text-[31px] font-black leading-[1.08] tracking-[-0.04em] sm:text-[44px]">CRPE porządkuje dane, ale nie zastępuje procedury rozliczenia.</h2></div>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><h3 className="text-lg font-black">CRPE pomaga</h3><p className="mt-2 text-sm leading-7 text-slate-300">Prowadzić własną ewidencję, kontrolować kompletność, przechowywać dokumenty i przygotować raport.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><h3 className="text-lg font-black">CRPE nie wykonuje automatycznie</h3><p className="mt-2 text-sm leading-7 text-slate-300">Oficjalnego wpisu do rejestru, weryfikacji przez właściwy organ ani formalnego rozliczenia obowiązku edukacyjnego.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><h3 className="text-lg font-black">Użytkownik nadal odpowiada</h3><p className="mt-2 text-sm leading-7 text-slate-300">Za poprawność wprowadzonych danych, kompletność dokumentów i wykonanie wymaganej procedury.</p></div>
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_70%)] p-6 shadow-[0_20px_55px_rgba(15,45,75,0.08)] sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Masz pytanie o dane?</p><h2 className="mt-2 text-[28px] font-black tracking-[-0.04em] text-slate-950 sm:text-[38px]">Napisz do nas przed rozpoczęciem pracy.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">W sprawach prywatności i zakresu dostępu możesz skorzystać z formularza kontaktowego.</p></div>
            <Link href="/kontakt" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white">Przejdź do kontaktu<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
