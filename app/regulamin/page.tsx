// app/regulamin/page.tsx
export const metadata = { title: "Regulamin | CRPE" };

const VERSION = "1.0";
const EFFECTIVE_DATE = "2026-02-17";
const SERVICE = "crpe.pl";
const COMPANY = "MEDICAI SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ";
const ADDRESS = "ul. Sulmierzycka 6/21, 02-139 Warszawa, Polska";
const KRS = "0001153208";
const NIP = "5223324469";
const REGON = "540789044";
const CONTACT_EMAIL = "info@medicai.pl";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Regulamin Serwisu CRPE.pl</h1>
      <p className="mt-2 text-sm opacity-80">
        <strong>Wersja:</strong> {VERSION} • <strong>Data obowiązywania:</strong>{" "}
        {EFFECTIVE_DATE} • <strong>Serwis:</strong> {SERVICE}
      </p>

      <div className="mt-8 space-y-6 leading-7">
        <section>
          <h2 className="text-lg font-semibold">§1. Postanowienia ogólne</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-2">
            <li>
              Niniejszy regulamin („Regulamin”) określa zasady korzystania z
              serwisu internetowego CRPE.pl („Serwis”) oraz warunki świadczenia
              usług drogą elektroniczną przez Usługodawcę.
            </li>
            <li>
              Serwis CRPE.pl jest niezależnym narzędziem wspierającym prowadzenie
              ewidencji aktywności edukacyjnych i punktów. Serwis nie jest
              oficjalnym rejestrem państwowym i nie jest powiązany z organami
              administracji publicznej ani systemami państwowymi (np. MZ, CeZ,
              SMK).
            </li>
            <li>
              Regulamin udostępniany jest nieodpłatnie w Serwisie w sposób
              umożliwiający jego pozyskanie, odtwarzanie i utrwalenie.
            </li>
            <li>
              Warunkiem korzystania z funkcji wymagających Konta jest akceptacja
              Regulaminu oraz zapoznanie się z Polityką Prywatności.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            §2. Usługodawca – dane rejestrowe i kontakt
          </h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <strong>Usługodawca:</strong> {COMPANY}
            </li>
            <li>
              <strong>Adres siedziby:</strong> {ADDRESS}
            </li>
            <li>
              <strong>KRS:</strong> {KRS}
            </li>
            <li>
              <strong>NIP:</strong> {NIP}
            </li>
            <li>
              <strong>REGON:</strong> {REGON}
            </li>
            <li>
              <strong>Kontakt e-mail (obsługa Serwisu i reklamacje):</strong>{" "}
              {CONTACT_EMAIL}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">§3. Definicje</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <strong>Użytkownik</strong> – osoba korzystająca z Serwisu.
            </li>
            <li>
              <strong>Konto</strong> – indywidualny panel Użytkownika w Serwisie.
            </li>
            <li>
              <strong>Usługi</strong> – usługi świadczone drogą elektroniczną w
              Serwisie (m.in. rejestracja/logowanie, prowadzenie ewidencji
              aktywności, kalkulator punktów, raporty, przechowywanie
              załączników).
            </li>
            <li>
              <strong>Treści Użytkownika</strong> – dane i materiały wprowadzane
              lub przesyłane przez Użytkownika (w tym pliki).
            </li>
            <li>
              <strong>Plan</strong> – wariant dostępu do Serwisu (bezpłatny lub
              płatny) o określonym zakresie funkcji i okresie rozliczeniowym.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">§4. Zakres i charakter usług</h2>
          <p className="mt-2">
            Serwis umożliwia w szczególności:
          </p>
          <ol className="mt-2 list-[lower-alpha] pl-5 space-y-1">
            <li>prowadzenie elektronicznego dziennika aktywności edukacyjnych,</li>
            <li>
              przypisywanie punktów/parametrów do aktywności według zasad
              przyjętych w Serwisie,
            </li>
            <li>tworzenie zestawień i raportów (np. do pobrania),</li>
            <li>
              przechowywanie załączników (np. skanów certyfikatów) powiązanych z
              aktywnościami.
            </li>
          </ol>
          <p className="mt-2">
            Wyniki kalkulacji i raporty mają charakter pomocniczy i zależą od
            danych wprowadzonych przez Użytkownika. Przenoszenie danych do
            systemów zewnętrznych (w tym państwowych) odbywa się samodzielnie
            przez Użytkownika.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">§5. Wymagania techniczne</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Do korzystania z Serwisu wymagane są: urządzenie z dostępem do
              Internetu, aktualna przeglądarka obsługująca JavaScript i cookies
              oraz aktywny adres e-mail.
            </li>
            <li>
              Usługodawca nie odpowiada za ograniczenia wynikające z konfiguracji
              urządzenia Użytkownika, oprogramowania lub dostawcy Internetu.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            §6. Konto – rejestracja i bezpieczeństwo
          </h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Utworzenie Konta następuje poprzez procedurę rejestracji/logowania
              dostępną w Serwisie.
            </li>
            <li>
              Użytkownik zobowiązuje się do podawania prawdziwych danych, jeżeli
              Serwis wymaga ich podania.
            </li>
            <li>
              Użytkownik odpowiada za zachowanie poufności danych dostępowych do
              Konta oraz za działania wykonane w ramach Konta.
            </li>
            <li>
              Usługodawca może stosować mechanizmy bezpieczeństwa (np.
              ograniczenia liczby prób logowania).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            §7. Pliki i certyfikaty (Treści Użytkownika)
          </h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Użytkownik może przesyłać pliki (np. certyfikaty) w zakresie
              udostępnionym przez Serwis.
            </li>
            <li>
              Użytkownik oświadcza, że posiada prawa do przesyłanych materiałów i
              że ich treść jest zgodna z prawem oraz nie narusza praw osób
              trzecich.
            </li>
            <li>
              Domyślne limity (jeśli Serwis nie wskazuje inaczej): formaty
              PDF/JPG/PNG, maks. 5 MB na plik.
            </li>
            <li>
              Usługodawca może odmówić przyjęcia/przechowywania pliku, jeżeli:
              narusza Regulamin lub prawo, może zagrażać bezpieczeństwu lub nie
              spełnia wymogów technicznych.
            </li>
            <li>
              Zaleca się, aby Użytkownik nie umieszczał danych nadmiarowych, w
              szczególności danych wrażliwych, jeżeli nie są konieczne do celu
              ewidencji.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            §8. Zasady korzystania – treści niedozwolone
          </h2>
          <p className="mt-2">
            Zabronione jest dostarczanie treści o charakterze bezprawnym, w
            szczególności:
          </p>
          <ol className="mt-2 list-[lower-alpha] pl-5 space-y-1">
            <li>naruszających prawa autorskie lub dobra osobiste,</li>
            <li>
              zawierających złośliwe oprogramowanie lub działania zakłócające
              Serwis,
            </li>
            <li>wprowadzających w błąd co do autentyczności dokumentów,</li>
            <li>
              obejmujących dane, których Użytkownik nie jest uprawniony
              udostępniać.
            </li>
          </ol>
          <p className="mt-2">
            W razie naruszeń Usługodawca może czasowo ograniczyć dostęp do Konta
            lub Treści Użytkownika – w zakresie koniecznym dla bezpieczeństwa i
            zgodności z prawem.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            §9. Plany płatne, rozliczenia i dostęp
          </h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Serwis może oferować plany płatne. Zakres funkcji, ceny i okresy
              rozliczeniowe są prezentowane w Serwisie przed zakupem.
            </li>
            <li>Płatności mogą być realizowane przez zewnętrznego operatora płatności.</li>
            <li>
              Dostęp do funkcji planu płatnego jest przyznawany na czas okresu
              rozliczeniowego wskazanego przy zakupie.
            </li>
            <li>
              Brak skutecznej płatności może skutkować brakiem odnowienia planu
              lub ograniczeniem funkcji płatnych.
            </li>
            <li>
              Na potrzeby rozliczeń Użytkownik może zostać poproszony o podanie
              danych rozliczeniowych (np. dane do faktury).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            §10. Prawo odstąpienia (dotyczy Konsumentów)
          </h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Jeżeli Użytkownik jest konsumentem, co do zasady przysługuje mu
              prawo odstąpienia od umowy zawartej na odległość w terminie 14 dni.
            </li>
            <li>
              Jeżeli Użytkownik zażąda rozpoczęcia świadczenia usług (dostępu do
              funkcji płatnych) przed upływem 14 dni, Usługodawca może wymagać
              złożenia wyraźnego żądania oraz potwierdzenia przyjęcia do
              wiadomości konsekwencji.
            </li>
            <li>
              Szczegóły procedury odstąpienia są dostępne w Serwisie lub
              przekazywane w potwierdzeniu zakupu.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">§11. Reklamacje</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Reklamacje dotyczące działania Serwisu Użytkownik może składać na
              adres e-mail: {CONTACT_EMAIL}.
            </li>
            <li>
              Reklamacja powinna zawierać opis problemu, datę/okoliczności
              wystąpienia oraz dane kontaktowe.
            </li>
            <li>
              Usługodawca rozpatruje reklamację w terminie do 14 dni i udziela
              odpowiedzi e-mailowo.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">§12. Odpowiedzialność</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Użytkownik ponosi pełną odpowiedzialność za poprawność danych i
              autentyczność dokumentów dodawanych do Serwisu.
            </li>
            <li>
              Usługodawca nie odpowiada za nieuzyskanie przez Użytkownika
              wymaganej liczby punktów w systemach zewnętrznych ani za skutki
              decyzji podjętych na podstawie danych wprowadzonych przez
              Użytkownika.
            </li>
            <li>
              Usługodawca dokłada starań w celu zapewnienia ciągłości działania
              Serwisu, jednak nie gwarantuje nieprzerwanej dostępności (np.
              awarie, prace serwisowe, awarie dostawców infrastruktury).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            §13. Usunięcie Konta i zakończenie umowy
          </h2>
          <p className="mt-2">
            Użytkownik może usunąć Konto (jeśli Serwis udostępnia taką funkcję)
            albo złożyć żądanie e-mailowo. Usunięcie Konta skutkuje usunięciem
            danych z aktywnej bazy Serwisu, z zastrzeżeniem że:
          </p>
          <ol className="mt-2 list-[lower-alpha] pl-5 space-y-1">
            <li>
              kopie zapasowe mogą być przechowywane do 30 dni wyłącznie w celach
              odtworzeniowych i bezpieczeństwa,
            </li>
            <li>
              niektóre dane mogą być przechowywane dłużej, jeżeli jest to
              konieczne do celów rozliczeń (np. księgowych/podatkowych) lub
              obrony roszczeń.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold">§14. Zmiany Regulaminu</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Usługodawca może zmienić Regulamin z ważnych powodów (np. zmiany
              prawa, bezpieczeństwa, funkcji Serwisu).
            </li>
            <li>
              O zmianach Użytkownicy zostaną poinformowani w Serwisie lub e-mailowo.
            </li>
            <li>
              Korzystanie z Serwisu po wejściu w życie zmian może wymagać ponownej
              akceptacji.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">§15. Postanowienia końcowe</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Prawem właściwym jest prawo polskie.</li>
            <li>
              Integralną częścią Regulaminu jest Polityka Prywatności dostępna w
              Serwisie pod adresem <strong>/polityka-prywatnosci</strong>.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
