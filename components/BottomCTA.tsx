import Link from "next/link";
import RoleContactModal from "@/components/RoleContactModal";
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
    href: "/kontakt#formularz",
    facts: ["Jasno oznaczony zakres", "Indywidualne konta", "Rozwój etapami"],
  },
  organizator: {
    eyebrow: "CRPE dla organizatora",
    title: "Ustalmy właściwy zakres obsługi szkoleń i dokumentacji.",
    text: "Dopasujemy rozmowę do rodzaju wydarzeń, uczestników i potrzebnej dokumentacji.",
    cta: "Zapytaj o moduł organizatora",
    href: "/kontakt#formularz",
    facts: ["Zakres indywidualny", "Dane wydarzeń", "Dokumentacja uczestników"],
  },
};

export default function BottomCTA({ selected }: { selected: AudienceKey }) {
  const active = variants[selected];

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="relative overflow-hidden rounded-[20px] bg-crpe-brand px-5 py-8 text-white shadow-[0_22px_58px_rgba(29,78,216,0.22)] sm:px-10 sm:py-11 lg:px-12">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
              {active.eyebrow}
            </p>
            <h2 className="mt-2 text-[27px] font-black leading-[1.08] tracking-[-0.035em] sm:mt-3 sm:text-[37px]">
              {active.title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-white/80 sm:mt-4 sm:text-[16px] sm:leading-7">
              {active.text}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 text-[13px] font-semibold text-white/90 sm:mt-5 sm:text-sm">
              {active.facts.map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white/70" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 lg:items-center">
            {selected === "medyk" ? (
              <Link
                href={active.href}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[14px] font-black text-crpe-brand shadow-lg transition hover:bg-crpe-placowka-soft"
              >
                {active.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <RoleContactModal
                role={selected}
                triggerLabel={active.cta}
                triggerClassName="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[14px] font-black text-crpe-brand shadow-lg transition hover:bg-crpe-placowka-soft"
              />
            )}
            <Link href="/pomoc" className="text-center text-[13px] font-bold text-white/80 underline decoration-white/35 underline-offset-4 hover:text-white">
              Najpierw zobacz centrum pomocy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
