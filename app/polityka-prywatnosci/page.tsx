// app/polityka-prywatnosci/page.tsx
export const metadata = { title: "Polityka prywatności | CRPE" };

const VERSION = "1.0";
const EFFECTIVE_DATE = "2026-02-17";

const ADMIN = "MEDICAI SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ";
const ADDRESS = "ul. Sulmierzycka 6/21, 02-139 Warszawa, Polska";
const KRS = "0001153208";
const NIP = "5223324469";
const REGON = "540789044";

const PRIVACY_EMAIL = "info@medicai.pl"; // możesz zmienić na np. privacy@crpe.pl

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Polityka Prywatności CRPE.pl</h1>
      <p className="mt-2 text-sm opacity-80">
        <strong>Wersja:</strong> {VERSION} • <strong>Data obowiązywania:</strong>{" "}
        {EFFECTIVE_DATE}
      </p>

      <div className="mt-8 space-y-6 leading-7">
        <section>
          <h2 className="text-lg font-semibold">1. Administrator danych i kontakt</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-2">
            <li>
              Administratorem danych osobowych jest <strong>{ADMIN}</strong>,{" "}
              {ADDRESS}, KRS: {KRS}, NIP: {NIP}, REGON: {REGON}.
            </li>
            <li>
              Kontakt w sprawach danych osobowych: <strong>{PRIVACY_EMAIL}</strong>.
            </li>
            <li>
              Administrator nie wyznaczył inspektora ochrony danych (IOD). Jeżeli
              w przyszłości Administrator wyznaczy IOD, dane kontaktowe zostaną
              opublikowane w Serwisie.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Jakie dane przetwarzamy</h2>
          <p className="mt-2">
            W zależności od sposobu korzystania z Serwisu możemy przetwarzać:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <strong>dane konta</strong>: adres e-mail, identyfikator użytkownika,
              informacje o logowaniu (techniczne), historia akceptacji dokumentów
              (wersje i daty),
            </li>
            <li>
              <strong>dane ewidencji aktywności</strong>: typ aktywności, liczba punktów,
              rok/okres, organizator, opisy,
            </li>
            <li>
              <strong>załączniki</strong> (np. certyfikaty) i metadane: nazwa pliku,
              typ, rozmiar, data dodania,
            </li>
            <li>
              <strong>dane rozliczeniowe</strong> (dla planów płatnych): dane do faktury
              (np. imię i nazwisko/nazwa firmy, adres, NIP), status płatności/
              identyfikatory transakcji,
            </li>
            <li>
              <strong>dane techniczne i logi</strong>: adres IP, identyfikatory sesji,
              informacje o przeglądarce/urządzeniu, zdarzenia bezpieczeństwa.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Cele i podstawy prawne przetwarzania</h2>
          <ul className="mt-2 list-disc pl-5 space-y-2">
            <li>
              <strong>Założenie i utrzymanie Konta oraz świadczenie usług</strong> –
              art. 6 ust. 1 lit. b RODO (wykonanie umowy / świadczenie usług).
            </li>
            <li>
              <strong>Ewidencja aktywności, kalkulator, raporty, załączniki</strong> –
              art. 6 ust. 1 lit. b RODO.
            </li>
            <li>
              <strong>Kontakt i obsługa zgłoszeń/reklamacji</strong> – art. 6 ust. 1 lit. b
              i/lub lit. f RODO (prawnie uzasadniony interes: komunikacja i obsługa).
            </li>
            <li>
              <strong>Bezpieczeństwo Serwisu, zapobieganie nadużyciom, logi</strong> –
              art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes).
            </li>
            <li>
              <strong>Rozliczenia i obowiązki księgowo-podatkowe</strong> (plany płatne) –
              art. 6 ust. 1 lit. c RODO (obowiązek prawny).
            </li>
            <li>
              <strong>Analityka i marketing</strong> – zostaną wdrożone w przyszłości.
              W przypadku narzędzi wymagających zgody (np. cookies analityczne/marketingowe),
              Serwis będzie prosił o zgodę w banerze/panelu cookies (art. 6 ust. 1 lit. a RODO).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Odbiorcy danych (podmioty przetwarzające)</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-2">
            <li>
              Dane mogą być przekazywane dostawcom usług niezbędnych do działania Serwisu
              (na podstawie umów powierzenia i w niezbędnym zakresie).
            </li>
            <li>
              Aktualnie główni dostawcy to:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>
                  <strong>Supabase</strong> – uwierzytelnianie, baza danych, przechowywanie plików
                  (np. certyfikaty).
                </li>
                <li>
                  <strong>Vercel</strong> – hosting aplikacji.
                </li>
              </ul>
            </li>
            <li>
              Po wdrożeniu płatności dane mogą być przekazywane operatorowi płatności
              w zakresie obsługi transakcji (np. identyfikatory i status płatności).
            </li>
            <li>
              Dane mogą zostać ujawnione organom publicznym, jeżeli obowiązek wynika z przepisów prawa.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Transfer danych poza EOG</h2>
          <p className="mt-2">
            Dostawcy infrastruktury mogą przetwarzać dane w Europejskim Obszarze Gospodarczym
            (EOG) lub poza EOG. Jeżeli dojdzie do transferu danych poza EOG, Administrator
            zapewni odpowiednie zabezpieczenia wymagane przez RODO (np. standardowe klauzule umowne).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Okres przechowywania danych</h2>
          <ul className="mt-2 list-disc pl-5 space-y-2">
            <li>
              Dane Konta i ewidencji aktywności – przez czas posiadania Konta.
            </li>
            <li>
              Po usunięciu Konta – dane z aktywnej bazy są usuwane, a kopie zapasowe mogą być
              przechowywane do <strong>30 dni</strong> wyłącznie w celach odtworzeniowych i bezpieczeństwa.
            </li>
            <li>
              Logi bezpieczeństwa i diagnostyczne – do <strong>90 dni</strong> (lub dłużej, jeśli będzie to
              konieczne dla wyjaśnienia incydentu).
            </li>
            <li>
              Dane rozliczeniowe i dokumenty księgowe (plany płatne) – przez okres wymagany przepisami,
              standardowo <strong>5 lat</strong> od końca roku podatkowego/rozliczeniowego.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Prawa Użytkownika</h2>
          <p className="mt-2">
            Użytkownik ma prawo do: dostępu do danych, sprostowania, usunięcia, ograniczenia przetwarzania,
            przenoszenia danych, wniesienia sprzeciwu (dla podstawy art. 6 ust. 1 lit. f RODO),
            cofnięcia zgody (jeśli przetwarzanie odbywa się na podstawie zgody) oraz wniesienia skargi do PUODO.
          </p>
          <p className="mt-2">
            W celu realizacji praw prosimy o kontakt na adres: <strong>{PRIVACY_EMAIL}</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Czy podanie danych jest obowiązkowe?</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Podanie danych niezbędnych do utworzenia Konta jest konieczne do korzystania z usług wymagających logowania.
            </li>
            <li>
              Podanie danych rozliczeniowych jest konieczne do zakupu planu płatnego i wystawienia dokumentów rozliczeniowych.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Cookies i podobne technologie</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-2">
            <li>
              Serwis może wykorzystywać cookies niezbędne do działania (np. sesja, bezpieczeństwo).
            </li>
            <li>
              Obecnie Serwis może działać bez cookies analitycznych/marketingowych.
            </li>
            <li>
              Po wdrożeniu analityki i marketingu: cookies analityczne/marketingowe będą uruchamiane
              dopiero po uzyskaniu zgody Użytkownika w banerze/panelu cookies.
            </li>
            <li>
              Użytkownik może zarządzać cookies także w ustawieniach przeglądarki.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Zautomatyzowane podejmowanie decyzji</h2>
          <p className="mt-2">
            Administrator nie podejmuje wobec Użytkownika decyzji wywołujących skutki prawne lub w podobny sposób
            istotnie na niego wpływających w sposób wyłącznie zautomatyzowany.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Bezpieczeństwo</h2>
          <p className="mt-2">
            Administrator stosuje środki techniczne i organizacyjne adekwatne do ryzyka (m.in. szyfrowanie HTTPS,
            kontrola dostępu, mechanizmy autoryzacji). Użytkownik powinien chronić dostęp do skrzynki e-mail i Konta.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">12. Zmiany Polityki Prywatności</h2>
          <p className="mt-2">
            Polityka może być aktualizowana (np. zmiana dostawców, funkcji, wdrożenie analityki/marketingu).
            Aktualna wersja jest publikowana w Serwisie.
          </p>
        </section>
      </div>
    </main>
  );
}
