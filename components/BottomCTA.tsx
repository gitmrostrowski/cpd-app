import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type AudienceKey = "medyk" | "placowka" | "organizator";

const variants: Record<AudienceKey, {
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  facts: [string, string, string];
}> = {
  medyk: {
    eyebrow: "Możesz zacząć od razu",
    title: "Zacznij prowadzić własną ewidencję punktów i certyfikatów.",
    text: "Załóż konto medyka i dodaj pierwszą aktywność wtedy, gdy będzie Ci wygodnie.",
    cta: "Załóż konto medyka",
    href: "/rejestracja",
    facts: ["Bez karty płatniczej", "Dostęp z telefonu", "Dokumenty przy wpisach"],
  },
  placowka: {
    eyebrow: "CRPE dla organizacji",
    title: "Porozmawiajmy o zakresie dla Twojej placówki lub jednostki.",
    text: "Pokażemy, co jest dostępne dziś i jak rozwijamy zbiorczy widok kompletności zespołu.",
    cta: "Zapytaj o rozwiązanie dla placówki",
    href: "mailto:kontakt@crpe.pl?subject=CRPE%20dla%20plac%C3%B3wki",
    facts: ["Jasno oznaczony zakres", "Indywidualne konta", "Rozwój etapami"],
  },
  organizator: {
    eyebrow: "CRPE dla organizatora",
    title: "Ustalmy właściwy zakres obsługi szkoleń i dokumentacji.",
    text: "Dopasujemy rozmowę do rodzaju wydarzeń, uczestników i potrzebnej dokumentacji.",
    cta: "Zapytaj o moduł organizatora",
    href: "mailto:kontakt@crpe.pl?subject=CRPE%20dla%20organizatora",
    facts: ["Zakres indywidualny", "Dane wydarzeń", "Dokumentacja uczestników"],
  },
};

export default function BottomCTA({ selected }: { selected: AudienceKey }) {
  const active = variants[selected];

  return (
    <section className="mx-auto w-full max-w-[1160px] px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
      <div key={selected} className="crpe-role-swap relative overflow-hidden rounded-[24px] bg-blue-600 px-5 py-7 text-white shadow-[0_24px_65px_rgba(37,99,235,0.26)] sm:px-9 sm:py-10 lg:px-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-indigo-900/25 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">
              {active.eyebrow}
            </p>
            <h2 className="mt-2 text-[27px] font-black leading-[1.08] tracking-[-0.035em] sm:mt-3 sm:text-[37px]">
              {active.title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-blue-100 sm:mt-4 sm:text-[16px] sm:leading-7">
              {active.text}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold text-blue-50 sm:mt-5 sm:text-sm">
              {active.facts.map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-200" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 lg:items-center">
            <Link
              href={active.href}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-black text-blue-700 shadow-lg transition hover:bg-blue-50"
            >
              {active.cta} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#faq" className="text-center text-[13px] font-bold text-blue-100 underline decoration-blue-300/60 underline-offset-4 hover:text-white">
              Najpierw zobacz odpowiedzi w FAQ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
