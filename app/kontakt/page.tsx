import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Mail, Stethoscope, UserRound } from "lucide-react";
import RoleContactModal from "@/components/RoleContactModal";

export const metadata: Metadata = {
  title: "Kontakt z CRPE",
  description: "Skontaktuj się z CRPE jako medyk, placówka lub organizator kształcenia.",
};

const wrap = "mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8";

export default function Page() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_0%,rgba(125,211,252,0.25),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef6fc_100%)] py-14 sm:py-20">
        <div className={wrap}>
          <div className="mx-auto max-w-3xl text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]"><Mail className="h-7 w-7" /></span>
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">Kontakt</p>
            <h1 className="mt-3 text-[40px] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-[58px]">Wybierz temat, a formularz dopasuje pytania.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-8 text-slate-600 sm:text-[18px]">Najpierw wybierz rolę. Dzięki temu łatwiej przygotować odpowiedź i kolejne kroki.</p>
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_52px_rgba(15,45,75,0.07)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><Stethoscope className="h-6 w-6" /></span>
            <h2 className="mt-5 text-[23px] font-black text-slate-950">Jestem medykiem</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Pytania o konto, aktywności, dokumenty, raport lub Panel CPD.</p>
            <div className="mt-6"><RoleContactModal role="ogolne" triggerLabel="Napisz jako medyk" /></div>
          </article>
          <article className="rounded-[26px] border border-blue-200 bg-blue-50/45 p-6 shadow-[0_18px_52px_rgba(15,45,75,0.07)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><Building2 className="h-6 w-6" /></span>
            <h2 className="mt-5 text-[23px] font-black text-slate-950">Reprezentuję placówkę</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Rozmowa o indywidualnych kontach, kompletności zespołu i module organizacyjnym.</p>
            <div className="mt-6"><RoleContactModal role="placowka" triggerLabel="Zapytaj o moduł" /></div>
          </article>
          <article className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_52px_rgba(15,45,75,0.07)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><UserRound className="h-6 w-6" /></span>
            <h2 className="mt-5 text-[23px] font-black text-slate-950">Jestem organizatorem</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Rozmowa o wydarzeniach, uczestnikach, certyfikatach i dokumentacji.</p>
            <div className="mt-6"><RoleContactModal role="organizator" triggerLabel="Ustal zakres" /></div>
          </article>
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white sm:py-18">
        <div className={`${wrap} grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center`}>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-300">Kontakt bez formularza</p><h2 className="mt-3 text-[31px] font-black tracking-[-0.04em] sm:text-[44px]">Możesz też napisać bezpośrednio.</h2><p className="mt-4 text-[15px] leading-7 text-slate-300">Adres do kontaktu: kontakt@crpe.pl</p></div>
          <a href="mailto:kontakt@crpe.pl" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-blue-700">Napisz e-mail<ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="text-center"><p className="text-sm text-slate-600">Szukasz instrukcji obsługi?</p><Link href="/pomoc" className="mt-2 inline-flex items-center gap-2 text-sm font-extrabold text-blue-700">Przejdź do centrum pomocy<ArrowRight className="h-4 w-4" /></Link></div>
      </section>
    </div>
  );
}
