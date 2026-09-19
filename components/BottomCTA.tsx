import Link from "next/link";
import RoleContactModal from "@/components/RoleContactModal";
import { ArrowRight, Building2, FileCheck2, GraduationCap } from "lucide-react";
import { DotBullet, DotTitle, DottedCurve, Eyebrow, IconBadge, cx, pill } from "@/components/ui/crpe";
import { pageWrap } from "@/lib/layout";

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

const roleIcon = { medyk: FileCheck2, placowka: Building2, organizator: GraduationCap } as const;

export default function BottomCTA({ selected }: { selected: AudienceKey }) {
  const active = variants[selected];
  const ctaClass = cx(pill.primary, "min-h-14 px-7 text-[15px]");

  return (
    <section className="bg-crpe-surface pb-16 sm:pb-24">
      <div className={pageWrap}>
      <div className="relative overflow-hidden rounded-[32px] bg-white px-6 py-10 text-crpe-ink ring-1 ring-crpe-line sm:px-10 sm:py-14 lg:px-14">
        <div className="crpe-dot-grid pointer-events-none absolute inset-0 text-white opacity-[0.05]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-crpe-punkt/20 blur-3xl" aria-hidden="true" />
        <DottedCurve className="pointer-events-none absolute -right-6 top-4 hidden w-[340px] text-white/25 lg:block" />

        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-12">
          <span className="hidden h-28 w-28 items-center justify-center rounded-full bg-white lg:flex" aria-hidden="true">
            <IconBadge icon={roleIcon[selected]} size="lg" tone="punkt" />
          </span>

          <div className="max-w-2xl">
            <Eyebrow>{active.eyebrow}</Eyebrow>
            <h2 className="mt-3 text-[30px] font-bold leading-[1.06] tracking-[-0.03em] sm:text-[42px]">
              <DotTitle>{active.title}</DotTitle>
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-crpe-muted sm:text-[17px]">{active.text}</p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-[14px] font-semibold text-crpe-muted">
              {active.facts.map((item) => (
                <li key={item} className="flex gap-2">
                  <DotBullet /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-stretch gap-4 lg:items-center">
            {selected === "medyk" ? (
              <Link href={active.href} className={ctaClass}>
                {active.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <RoleContactModal role={selected} triggerLabel={active.cta} triggerClassName={ctaClass} />
            )}
            <Link
              href="/pomoc"
              className="text-center text-[14px] font-semibold text-crpe-muted underline decoration-crpe-line underline-offset-4 hover:text-crpe-brand"
            >
              Najpierw zobacz centrum pomocy
            </Link>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
