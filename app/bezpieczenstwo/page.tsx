import type { Metadata } from "next";
import Link from "next/link";
import MarketingPage, { PageHero } from "@/components/home/MarketingPage";

export const metadata: Metadata = {
  title: "Bezpieczeństwo i prywatność w CRPE",
  description: "Dowiedz się, jak CRPE oddziela konta, dane i dokumenty oraz jaki jest zakres odpowiedzialności systemu.",
};

const principles: Array<[string, string]> = [
  ["Dostęp po zalogowaniu", "Dane osobiste, aktywności i dokumenty są dostępne w kontekście zalogowanego konta użytkownika."],
  ["Indywidualne konta", "Nie rekomendujemy współdzielenia jednego konta przez wiele osób. Każdy pracuje na własnym profilu."],
  ["Dokument przy aktywności", "Plik jest przypisany do konkretnego wpisu, dzięki czemu łatwiej kontrolować kompletność ewidencji."],
  ["Zakres dostępu z roli", "W placówce dostęp wynika z roli i nadanych uprawnień. Członkostwo nie otwiera prywatnych certyfikatów."],
  ["Kontrola nad wpisami", "Swoje wpisy możesz edytować i usuwać w ramach funkcji dostępnych w koncie."],
  ["Rozdzielenie odpowiedzialności", "CRPE porządkuje ewidencję, ale nie jest państwowym rejestrem ani oficjalnym systemem rozliczeniowym."],
];

const Check = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.2 4.2L19 7" /></svg>;

export default function Page() {
  const half = Math.ceil(principles.length / 2);
  return <MarketingPage variant="bezpieczenstwo">
    <PageHero
      title="Twoje dane i dokumenty pod Twoją kontrolą."
      lead="CRPE służy do własnej ewidencji aktywności, punktów i dokumentów. Wyjaśniamy jasno, co robi system, kto widzi dane i czego CRPE nie zastępuje."
      actions={<div className="hero-cta"><Link href="/polityka-prywatnosci" className="btn btn-primary">Polityka prywatności</Link><Link href="/regulamin" className="btn btn-ghost">Regulamin</Link></div>}
    />

    <section className="block" aria-labelledby="principles-title">
      <div className="wrap">
        <div className="sec-head"><h2 id="principles-title">Jak rozumiemy bezpieczną ewidencję.</h2><p>Sześć zasad, na których opiera się każde konto CRPE.</p></div>
        <div className="cols2">
          {[principles.slice(0, half), principles.slice(half)].map((column, i) => (
            <ul className="checks" key={i}>
              {column.map(([title, text]) => <li key={title}><span className="mark ok"><Check /></span><div><b>{title}</b><span>{text}</span></div></li>)}
            </ul>
          ))}
        </div>
      </div>
    </section>

    <section className="block honest" aria-labelledby="scope-title">
      <div className="wrap">
        <div className="sec-head"><h2 id="scope-title">CRPE porządkuje dane, ale nie zastępuje procedury rozliczenia.</h2><p>To ważne rozróżnienie, więc mówimy o nim wprost.</p></div>
        <ol className="role-steps plain-steps">
          <li><h3>CRPE pomaga</h3><p>Prowadzić własną ewidencję, kontrolować kompletność, przechowywać dokumenty i przygotować raport.</p></li>
          <li><h3>CRPE nie wykonuje</h3><p>Oficjalnego wpisu do rejestru, weryfikacji przez właściwy organ ani formalnego rozliczenia obowiązku.</p></li>
          <li><h3>Ty odpowiadasz</h3><p>Za poprawność danych, kompletność dokumentów i wykonanie wymaganej procedury.</p></li>
        </ol>
      </div>
    </section>

    <section className="final final-top" aria-labelledby="security-final">
      <div className="wrap final-box">
        <h2 id="security-final">Masz pytanie o dane?</h2>
        <div><p>W sprawach prywatności i zakresu dostępu napisz do nas przed rozpoczęciem pracy.</p><div className="hero-cta"><Link href="/kontakt" className="btn btn-primary">Przejdź do kontaktu</Link></div></div>
      </div>
    </section>
  </MarketingPage>;
}
