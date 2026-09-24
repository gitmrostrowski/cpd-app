import type { Metadata } from "next";
import Link from "next/link";
import RoleContactModal from "@/components/RoleContactModal";
import DirectEmailContacts from "@/components/DirectEmailContacts";
import MarketingPage, { PageHero } from "@/components/home/MarketingPage";

export const metadata: Metadata = {
  title: "Kontakt z CRPE",
  description: "Skontaktuj się z CRPE jako medyk, placówka lub organizator kształcenia.",
};

export default function Page() {
  return <MarketingPage variant="kontakt">
    <PageHero
      title="Napisz do nas."
      lead="Wybierz temat, a formularz dopasuje pytania. Dzięki temu łatwiej przygotować odpowiedź i kolejne kroki."
      note={<p className="hero-note">Szukasz instrukcji? Zajrzyj do <Link href="/pomoc" className="text-link">centrum pomocy</Link>.</p>}
    />

    <section id="formularz" className="block block-tight" aria-label="Wybierz temat">
      <div className="wrap contact-grid">
        <article className="contact-card contact-org">
          <span className="pill org-pill">Dla placówek</span>
          <h2>Reprezentuję placówkę</h2>
          <p>Panel zespołu, jednostki, zaproszenia i role. Ustalimy zakres pilotażu dla Twojej placówki.</p>
          <div className="hero-cta"><RoleContactModal role="placowka" triggerLabel="Zapytaj o pilotaż" triggerClassName="btn btn-on-dark" compact /><Link href="/dla-placowki" className="btn btn-ghost-dark">Dla placówek</Link></div>
        </article>
        <article className="contact-card">
          <h2>Jestem medykiem</h2>
          <p>Konto, aktywności, dokumenty, raport lub Panel CPD.</p>
          <RoleContactModal role="medyk" triggerLabel="Napisz jako medyk" triggerClassName="btn btn-ghost" compact />
        </article>
        <article className="contact-card">
          <h2>Jestem organizatorem</h2>
          <p>Zgłaszanie szkoleń do bazy i plany dotyczące obsługi uczestników.</p>
          <RoleContactModal role="organizator" triggerLabel="Napisz jako organizator" triggerClassName="btn btn-ghost" compact />
        </article>
      </div>
    </section>

    <section className="org-band" aria-labelledby="direct-title">
      <div className="wrap">
        <div className="sec-head sec-head-dark"><h2 id="direct-title">Wolisz zwykły e-mail?</h2><p>Kliknij adres, aby otworzyć pocztę. Jeśli urządzenie nie ma skonfigurowanej aplikacji pocztowej, użyj przycisku „Kopiuj adres”.</p></div>
        <div data-app-ui="true"><DirectEmailContacts /></div>
      </div>
    </section>
  </MarketingPage>;
}
