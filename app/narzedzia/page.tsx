import type { Metadata } from "next";
import Link from "next/link";
import HomeAction from "@/components/home/HomeAction";
import MarketingPage, { PageHero } from "@/components/home/MarketingPage";

export const metadata: Metadata = {
  title: "Narzędzia CRPE – Panel CPD, aktywności, raporty i baza szkoleń",
  description: "Poznaj wszystkie narzędzia dostępne w CRPE dla medyka.",
};

const tools = [
  {
    title: "Panel CPD i kalkulator",
    text: "Ustaw okres rozliczeniowy i cel, obserwuj postęp, limity oraz brakujące punkty.",
    href: "/panel-cpd",
    cta: "Otwórz Panel CPD",
    bullets: ["Cel i okres rozliczeniowy", "Postęp i tempo do końca okresu", "Limity oraz brakujące dokumenty"],
  },
  {
    title: "Aktywności i certyfikaty",
    text: "Dodawaj wydarzenia, punkty i kategorie, a następnie przypisuj dokument do właściwego wpisu.",
    href: "/aktywnosci",
    cta: "Przejdź do aktywności",
    bullets: ["Edycja i kontrola kompletności", "PDF lub zdjęcie certyfikatu", "Historia aktywności"],
  },
  {
    title: "Raport użytkownika",
    text: "Przygotuj zestawienie aktywności, punktów i kompletności dokumentów dla wybranego okresu.",
    href: "/raporty",
    cta: "Zobacz raporty",
    bullets: ["Podsumowanie okresu", "Wydruk lub zapis PDF", "Eksport CSV"],
  },
  {
    title: "Baza szkoleń",
    text: "Wyszukuj kursy, webinary i wydarzenia, filtruj je i dodawaj wybrane pozycje do planu CPD.",
    href: "/baza-szkolen",
    cta: "Przejdź do bazy",
    bullets: ["Filtry zawodu, miejsca i terminu", "Planowanie kolejnych aktywności", "Brak automatycznego zapisu u organizatora"],
  },
];

const Check = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.2 4.2L19 7" /></svg>;

export default function Page() {
  return <MarketingPage variant="narzedzia">
    <PageHero
      title="Cały warsztat ewidencji w jednym koncie."
      lead="Panel, aktywności, dokumenty, raport i baza szkoleń prowadzą Cię przez kolejne etapy pracy, od ustawienia celu do gotowego zestawienia."
      actions={<div className="hero-cta"><HomeAction /><Link href="/#jak-to-dziala" className="btn btn-ghost">Zobacz, jak działa</Link></div>}
    />

    <section className="block" aria-label="Narzędzia">
      <div className="wrap">
        <div className="tool-grid">
          {tools.map(({ title, text, href, cta, bullets }, index) => (
            <article key={title} className="tool-item">
              <h2>{title}</h2>
              <p>{text}</p>
              <ul className="checks">
                {bullets.map((item) => <li key={item}><span className="mark ok"><Check /></span><div><span>{item}</span></div></li>)}
              </ul>
              <Link
                href={href}
                className={
                  index === 0
                    ? "btn btn-primary"
                    : "text-link"
                }
              >
                {cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="block honest" aria-labelledby="devices-title">
      <div className="wrap">
        <div className="sec-head"><h2 id="devices-title">Na komputerze i w telefonie.</h2><p>Dane dodajesz tam, gdzie jest Ci wygodnie. Certyfikat możesz dołączyć jako PDF albo zdjęcie zrobione telefonem.</p></div>
        <div className="cols2">
          <div><h3>Dostęp mobilny</h3><p className="muted">Sprawdzasz status i uzupełniasz dane bezpośrednio z telefonu.</p></div>
          <div><h3>Dokument przy wpisie</h3><p className="muted">Certyfikat pozostaje przypisany do konkretnej aktywności.</p></div>
        </div>
      </div>
    </section>

    <section className="final final-top" aria-labelledby="tools-final">
      <div className="wrap final-box">
        <h2 id="tools-final">Załóż konto i uruchom własny Panel CPD.</h2>
        <div><p>Na start wybierasz zawód, okres rozliczeniowy i cel.</p><div className="hero-cta"><HomeAction /><Link href="/dla-placowki" className="btn btn-ghost">Dla placówek</Link></div></div>
      </div>
    </section>
  </MarketingPage>;
}
