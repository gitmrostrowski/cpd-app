import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  FileText,
  FolderOpen,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import RoleContactModal from "@/components/RoleContactModal";

export const metadata: Metadata = {
  title: "Centrum pomocy CRPE",
  description:
    "Proste instrukcje krok po kroku dotyczące konta, Panelu CPD, aktywności, dokumentów, raportów, Bazy szkoleń i panelu placówki.",
};

const wrap = "mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8";

type GuideItem = {
  title: string;
  intro: string;
  steps: string[];
  result: string;
  href: string;
  action: string;
  note?: string;
};

type Guide = {
  icon: LucideIcon;
  title: string;
  text: string;
  items: GuideItem[];
};

const guides: Guide[] = [
  {
    icon: KeyRound,
    title: "Konto i logowanie",
    text: "Założenie konta, ponowne logowanie i odzyskanie dostępu.",
    items: [
      {
        title: "Jak założyć konto?",
        intro: "Potrzebujesz adresu e-mail, do którego masz dostęp.",
        steps: [
          "Otwórz stronę rejestracji i wpisz swój adres e-mail oraz hasło.",
          "Zaakceptuj wymagane zgody i kliknij „Załóż konto”.",
          "Otwórz wiadomość od CRPE i potwierdź adres e-mail.",
          "Zaloguj się i uzupełnij zawód oraz ustawienia Panelu CPD.",
        ],
        result: "Po potwierdzeniu adresu otrzymasz własne, prywatne konto CRPE.",
        href: "/rejestracja",
        action: "Przejdź do rejestracji",
      },
      {
        title: "Jak zalogować się ponownie?",
        intro: "Użyj tego samego adresu, którym rejestrowałeś konto.",
        steps: [
          "Otwórz stronę logowania.",
          "Wpisz adres e-mail i hasło.",
          "Po zalogowaniu wybierz „Otwórz Panel CPD”.",
        ],
        result: "Wrócisz do zapisanych aktywności, dokumentów i ustawień.",
        href: "/login",
        action: "Otwórz logowanie",
      },
      {
        title: "Jak ustawić nowe hasło?",
        intro: "Zrób to, jeśli nie pamiętasz dotychczasowego hasła.",
        steps: [
          "Otwórz stronę resetowania hasła.",
          "Wpisz adres przypisany do konta CRPE.",
          "Otwórz otrzymaną wiadomość i ustaw nowe hasło.",
        ],
        result: "Po zmianie hasła zalogujesz się nim do tego samego konta.",
        href: "/reset-hasla",
        action: "Zresetuj hasło",
      },
    ],
  },
  {
    icon: BarChart3,
    title: "Panel CPD",
    text: "Zawód, okres, cel punktowy i właściwe odczytanie statusu.",
    items: [
      {
        title: "Jak ustawić zawód i okres?",
        intro:
          "Te dane decydują, jaki okres i reguły mogą być pokazane w Panelu CPD.",
        steps: [
          "Po zalogowaniu otwórz „Profil i ustawienia”.",
          "Wybierz zawód z listy.",
          "Wybierz okres domyślny albo podaj własne daty.",
          "Zapisz zmiany i wróć do Panelu CPD.",
        ],
        result: "Panel pokaże aktywności i punkty z wybranego okresu.",
        href: "/profil",
        action: "Otwórz ustawienia",
        note:
          "Jeżeli dla zawodu nie ma jeszcze zweryfikowanej reguły CRPE, system nie dopisze automatycznie celu.",
      },
      {
        title: "Jak ustawić własny cel punktowy?",
        intro:
          "Własny cel pomaga kontrolować postęp, ale nie jest formalnym potwierdzeniem obowiązku.",
        steps: [
          "Otwórz „Profil i ustawienia”.",
          "W polu „Własny cel punktowy” wpisz właściwą wartość.",
          "Zapisz zmiany.",
          "Sprawdź w Panelu CPD, czy cel i okres są poprawne.",
        ],
        result: "Postęp będzie liczony względem zapisanego celu użytkownika.",
        href: "/profil",
        action: "Ustaw własny cel",
      },
      {
        title: "Jak sprawdzić brakujące punkty?",
        intro: "Panel podsumowuje dane wpisane do Twojej ewidencji.",
        steps: [
          "Otwórz Panel CPD i sekcję „Status ewidencji”.",
          "Sprawdź liczbę punktów i czas pozostały do końca okresu.",
          "Otwórz „Co dalej?”, aby zobaczyć braki w danych lub dokumentach.",
          "Przejdź do aktywności wymagających uzupełnienia.",
        ],
        result: "Zobaczysz, ile punktów brakuje według ustawień i danych w CRPE.",
        href: "/panel-cpd",
        action: "Otwórz Panel CPD",
      },
    ],
  },
  {
    icon: CalendarCheck2,
    title: "Aktywności",
    text: "Dodawanie ukończonych i planowanych wpisów oraz poprawianie danych.",
    items: [
      {
        title: "Jak dodać ukończoną aktywność?",
        intro:
          "Przygotuj nazwę, datę, organizatora, kategorię i liczbę punktów.",
        steps: [
          "Otwórz „Aktywności” i kliknij „Dodaj aktywność”.",
          "Wybierz opcję aktywności ukończonej.",
          "Uzupełnij wymagane dane i liczbę punktów.",
          "Dodaj certyfikat od razu albo pozostaw wpis do późniejszego uzupełnienia.",
        ],
        result: "Wpis pojawi się w ewidencji i w podsumowaniu Panelu CPD.",
        href: "/aktywnosci?new=1",
        action: "Dodaj aktywność",
      },
      {
        title: "Jak poprawić istniejący wpis?",
        intro: "Możesz poprawić dane bez tworzenia drugiej aktywności.",
        steps: [
          "Otwórz „Aktywności” i znajdź właściwy wpis.",
          "Wybierz edycję aktywności.",
          "Popraw dane, kategorię, punkty lub status.",
          "Zapisz zmiany i sprawdź ponownie kompletność.",
        ],
        result: "Panel i raport użyją najnowszej zapisanej wersji wpisu.",
        href: "/aktywnosci",
        action: "Otwórz aktywności",
      },
      {
        title: "Co oznacza status kompletności?",
        intro: "Status mówi o danych w CRPE, nie o formalnym uznaniu aktywności.",
        steps: [
          "„Zaplanowane” oznacza aktywność, która jeszcze nie została ukończona.",
          "„Do uzupełnienia” oznacza brak ważnych danych, np. organizatora lub certyfikatu.",
          "„Kompletne” oznacza, że wpis ma dane wymagane do raportu CRPE.",
        ],
        result: "Po uzupełnieniu braków wpis automatycznie trafi do kompletnych.",
        href: "/aktywnosci",
        action: "Sprawdź kompletność",
      },
    ],
  },
  {
    icon: UploadCloud,
    title: "Dokumenty",
    text: "Certyfikat lub zdjęcie przypisane do właściwej aktywności.",
    items: [
      {
        title: "Jak dodać certyfikat?",
        intro: "Możesz użyć pliku PDF albo czytelnego zdjęcia.",
        steps: [
          "Otwórz „Aktywności” i wybierz właściwy wpis.",
          "Kliknij „Dodaj certyfikat”.",
          "Wybierz plik z komputera lub telefonu.",
          "Poczekaj na potwierdzenie zapisania dokumentu.",
        ],
        result: "Certyfikat zostanie połączony tylko z wybraną aktywnością.",
        href: "/aktywnosci",
        action: "Otwórz aktywności",
      },
      {
        title: "Jak zmienić błędny dokument?",
        intro: "Najpierw upewnij się, że edytujesz właściwą aktywność.",
        steps: [
          "Otwórz szczegóły aktywności.",
          "Przy obecnym certyfikacie wybierz usunięcie albo zmianę.",
          "Dodaj poprawny PDF lub zdjęcie.",
          "Sprawdź nazwę dokumentu i status kompletności.",
        ],
        result: "Raport będzie korzystał z aktualnego dokumentu.",
        href: "/aktywnosci",
        action: "Zmień dokument",
      },
      {
        title: "Jak usunąć załącznik?",
        intro:
          "Usunięcie dokumentu nie usuwa samej aktywności ani zapisanych punktów.",
        steps: [
          "Otwórz szczegóły aktywności.",
          "Znajdź dokument i kliknij „Usuń”.",
          "Potwierdź operację.",
          "Dodaj poprawny plik, jeżeli aktywność nadal ma być kompletna.",
        ],
        result: "Wpis pozostanie w ewidencji, ale może otrzymać status „Do uzupełnienia”.",
        href: "/aktywnosci",
        action: "Zarządzaj dokumentami",
      },
    ],
  },
  {
    icon: FileText,
    title: "Raporty",
    text: "Wybór okresu, kontrola zawartości i pobranie zestawienia.",
    items: [
      {
        title: "Jak otworzyć raport użytkownika?",
        intro: "Raport zbiera dane zapisane na Twoim prywatnym koncie.",
        steps: [
          "Po zalogowaniu wybierz z menu „Raporty”.",
          "Otwórz „Raport użytkownika”.",
          "Poczekaj na wczytanie aktywności i dokumentów.",
        ],
        result: "Zobaczysz podsumowanie okresu i listę pozycji raportu.",
        href: "/raporty/uzytkownik",
        action: "Otwórz raport",
      },
      {
        title: "Jak wybrać właściwy okres?",
        intro: "Raport może obejmować zapisany okres CPD albo własny zakres dat.",
        steps: [
          "W sekcji „Okres rozliczeniowy” wybierz jedną z dostępnych opcji.",
          "Jeśli wybierasz własny zakres, ustaw datę początku i końca.",
          "Sprawdź, czy liczba aktywności się zgadza.",
        ],
        result: "Do zestawienia trafią tylko wpisy należące do wybranego okresu.",
        href: "/raporty/uzytkownik",
        action: "Wybierz okres",
      },
      {
        title: "Jak pobrać zestawienie?",
        intro: "Przed pobraniem sprawdź pozycje oznaczone jako niekompletne.",
        steps: [
          "Wybierz aktywności, które mają znaleźć się w raporcie.",
          "Sprawdź dokumenty i dane organizatora.",
          "Kliknij „Drukuj / zapisz PDF” albo „Pobierz CSV”.",
        ],
        result: "Otrzymasz czytelne zestawienie do zapisu jako PDF albo plik CSV do dalszej pracy.",
        href: "/raporty/uzytkownik",
        action: "Przygotuj raport",
      },
    ],
  },
  {
    icon: FolderOpen,
    title: "Baza szkoleń",
    text: "Wyszukanie wydarzenia, użycie filtrów i dodanie go do planu.",
    items: [
      {
        title: "Jak znaleźć szkolenie?",
        intro: "Możesz szukać po nazwie, organizatorze albo temacie.",
        steps: [
          "Otwórz „Bazę szkoleń”.",
          "Wpisz szukaną frazę.",
          "Otwórz wybrane wydarzenie i sprawdź termin, formę oraz organizatora.",
          "Przejdź na stronę organizatora, jeśli chcesz się zapisać.",
        ],
        result: "CRPE pomaga znaleźć wydarzenie, ale zapis odbywa się u organizatora.",
        href: "/baza-szkolen",
        action: "Wyszukaj szkolenie",
      },
      {
        title: "Jak zawęzić wyniki?",
        intro: "Filtry pomagają usunąć wydarzenia, które Ci nie odpowiadają.",
        steps: [
          "Wybierz formę: online, stacjonarnie albo hybrydowo.",
          "Wybierz kategorię, zawód, miejsce lub minimalną liczbę punktów.",
          "Zmień albo wyczyść filtr, jeśli lista jest zbyt krótka.",
        ],
        result: "Lista pokaże wydarzenia zgodne z wybranymi kryteriami.",
        href: "/baza-szkolen",
        action: "Użyj filtrów",
      },
      {
        title: "Jak dodać wydarzenie do planu?",
        intro: "Plan pomaga pamiętać o wydarzeniu, ale nie jest zapisem.",
        steps: [
          "Znajdź wydarzenie w Bazie szkoleń.",
          "Kliknij „Dodaj do planu”.",
          "Po ukończeniu zmień wpis na ukończony i dodaj certyfikat.",
        ],
        result: "Wydarzenie pojawi się w planowanych aktywnościach Panelu CPD.",
        href: "/baza-szkolen",
        action: "Otwórz Bazę szkoleń",
        note:
          "Dodanie do planu nie rezerwuje miejsca i nie wysyła zgłoszenia do organizatora.",
      },
    ],
  },
  {
    icon: Building2,
    title: "Panel placówki",
    text: "Przełączanie kontekstu, pracownicy, zaproszenia i role.",
    items: [
      {
        title: "Jak wejść do panelu placówki?",
        intro: "Nie ma osobnego loginu dla placówki.",
        steps: [
          "Zaloguj się na własne konto CRPE.",
          "W menu konta wybierz „Panel placówki”.",
          "Jeśli należysz do kilku placówek, wybierz właściwą.",
        ],
        result: "Zobaczysz wyłącznie placówki, z którymi Twoje konto jest powiązane.",
        href: "/placowka",
        action: "Otwórz panel placówki",
      },
      {
        title: "Jak zaprosić pracowników?",
        intro:
          "Właściciel lub administrator może wysłać jedno albo wiele zaproszeń.",
        steps: [
          "W panelu placówki otwórz „Zespół”.",
          "Wpisz adres albo wklej listę adresów rozdzielonych przecinkami lub nowymi wierszami.",
          "Wybierz jednostkę i rolę po przyjęciu.",
          "Kliknij „Wyślij zaproszenia” i sprawdź wyniki w rejestrze.",
        ],
        result:
          "Pracownik otrzyma wiadomość, a administrator zobaczy wysyłkę, wejście w link, logowanie i przyjęcie.",
        href: "/placowka",
        action: "Przejdź do zespołu",
      },
      {
        title: "Jak nadać rolę i zakres?",
        intro:
          "Rola określa, co osoba może zrobić, a zakres — w jakiej części placówki.",
        steps: [
          "Otwórz „Role i dostęp”.",
          "Wybierz pracownika.",
          "Wybierz całą placówkę albo konkretną jednostkę.",
          "Wybierz gotową rolę i kliknij „Nadaj rolę”.",
        ],
        result: "Nowe uprawnienie pojawi się przy pracowniku i w historii zmian.",
        href: "/placowka",
        action: "Zarządzaj dostępem",
        note:
          "Samo członkostwo w placówce nie udostępnia automatycznie prywatnych certyfikatów ani aktywności.",
      },
    ],
  },
];

const faq = [
  [
    "Czy CRPE jest oficjalnym rejestrem?",
    "Nie. CRPE pomaga prowadzić własną ewidencję i przygotować dane. Nie zastępuje oficjalnego rejestru ani wymaganej procedury potwierdzenia obowiązku.",
  ],
  [
    "Czy wynik „cel osiągnięty” oznacza formalne rozliczenie?",
    "Nie. To status obliczony z danych i ustawień w CRPE. Formalne potwierdzenie odbywa się poza CRPE według zasad właściwych dla zawodu.",
  ],
  [
    "Dlaczego nie widzę dokumentów bez logowania?",
    "Dokumenty i dane osobiste są przypisane do prywatnego konta i są dostępne dopiero po zalogowaniu.",
  ],
  [
    "Czy dodanie wydarzenia do planu oznacza zapis?",
    "Nie. Plan CPD pomaga zaplanować aktywność, ale zapis u organizatora odbywa się niezależnie.",
  ],
  [
    "Czy mogę dodać zdjęcie certyfikatu?",
    "Tak. Możesz dodać PDF albo czytelne zdjęcie i przypisać je do konkretnej aktywności.",
  ],
  [
    "Co zrobić, gdy punktacja wygląda nieprawidłowo?",
    "Sprawdź zawód, okres, własny cel, kategorię aktywności, wpisaną liczbę punktów oraz wersję reguły pokazaną w Panelu CPD.",
  ],
  [
    "Czy placówka zobaczy wszystkie moje dokumenty?",
    "Nie. Samo przyjęcie zaproszenia tworzy członkostwo, ale nie przekazuje automatycznie prywatnych aktywności ani certyfikatów.",
  ],
  [
    "Gdzie sprawdzę wysłane zaproszenia pracowników?",
    "W panelu placówki otwórz „Zespół”. Rejestr zaproszeń pokazuje wysyłkę, wejście w link, logowanie, przyjęcie, wygaśnięcie i anulowanie.",
  ],
];

const quickStart = [
  ["1", "Ustaw konto", "Wybierz zawód, okres i cel.", "/profil"],
  ["2", "Dodaj aktywność", "Wpisz ukończone szkolenie.", "/aktywnosci?new=1"],
  ["3", "Dołącz dokument", "Przypisz certyfikat do wpisu.", "/aktywnosci"],
  ["4", "Sprawdź raport", "Skontroluj dane i pobierz zestawienie.", "/raporty/uzytkownik"],
];

export default function Page() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_0%,rgba(125,211,252,0.25),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef6fc_100%)] py-14 sm:py-20">
        <div className={wrap}>
          <div className="mx-auto max-w-3xl text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">
              <LifeBuoy className="h-7 w-7" />
            </span>
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
              Centrum pomocy
            </p>
            <h1 className="mt-3 text-[40px] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-[58px]">
              Co chcesz zrobić?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-8 text-slate-600 sm:text-[18px]">
              Wybierz czynność. Po kliknięciu zobaczysz krótką instrukcję,
              rezultat i przycisk prowadzący do właściwego miejsca.
            </p>
          </div>
        </div>
      </section>

      <section className={`${wrap} -mt-7 relative z-10`}>
        <div className="rounded-[26px] border border-blue-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,45,75,0.1)] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Pierwszy raz w CRPE?
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Zacznij od tych czterech kroków
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> około 5 minut
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickStart.map(([number, title, text, href]) => (
              <Link
                key={number}
                href={href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                  {number}
                </span>
                <h3 className="mt-3 text-sm font-black text-slate-950">
                  {title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="mb-7 max-w-2xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
            Instrukcje krok po kroku
          </p>
          <h2 className="mt-2 text-[30px] font-black tracking-[-0.04em] text-slate-950 sm:text-[38px]">
            Wybierz obszar i kliknij czynność.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12">
          {guides.map(({ icon: Icon, title, text, items }, index) => (
            <article
              key={title}
              className={`flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_15px_42px_rgba(15,45,75,0.06)] ${
                index < 4 ? "xl:col-span-3" : "xl:col-span-4"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[19px] font-black text-slate-950">
                {title}
              </h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                {text}
              </p>
              <div className="mt-5 flex-1 divide-y divide-slate-100 border-y border-slate-100">
                {items.map((item) => (
                  <details key={item.title} className="group">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2.5 text-sm font-bold text-slate-800 transition hover:text-blue-700">
                      <span>{item.title}</span>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="pb-4">
                      <p className="text-xs leading-5 text-slate-600">
                        {item.intro}
                      </p>
                      <ol className="mt-3 space-y-2">
                        {item.steps.map((step, index) => (
                          <li
                            key={step}
                            className="flex gap-2.5 text-xs leading-5 text-slate-700"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-600">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
                        <strong>Rezultat:</strong> {item.result}
                      </div>
                      {item.note ? (
                        <p className="mt-3 text-[11px] leading-5 text-slate-500">
                          <strong>Ważne:</strong> {item.note}
                        </p>
                      ) : null}
                      <Link
                        href={item.href}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 hover:text-blue-800"
                      >
                        {item.action} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </details>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f6f9fd_0%,#eef4fa_100%)] py-14 sm:py-18">
        <div
          className={`${wrap} grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10`}
        >
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <HelpCircle className="h-5 w-5" />
            </span>
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
              Zasady i zakres CRPE
            </p>
            <h2 className="mt-2 text-[32px] font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[44px]">
              Pytania o to, czym CRPE jest, a czym nie.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Wyżej znajdziesz instrukcje „jak to zrobić”. Tutaj odpowiadamy na
              pytania o zakres, dane i formalności. Nie znalazłeś odpowiedzi?
              Napisz, co chciałeś zrobić i jaki komunikat zobaczyłeś.
            </p>
            <div className="mt-5">
              <RoleContactModal
                role="medyk"
                triggerLabel="Napisz do pomocy"
              />
            </div>
          </div>
          <div className="space-y-3">
            {faq.map(([question, answer]) => (
              <details
                key={question}
                className="group rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-[0_10px_28px_rgba(15,45,75,0.05)]"
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-950">
                  {question}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-3 pr-8 text-sm leading-6 text-slate-600">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,45,75,0.08)] sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Szybkie przejście
              </p>
              <h2 className="mt-2 text-[28px] font-black tracking-[-0.04em] text-slate-950 sm:text-[38px]">
                Otwórz narzędzie, którego potrzebujesz.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/panel-cpd"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white"
              >
                Panel CPD <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/narzedzia"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-extrabold text-slate-700"
              >
                Wszystkie narzędzia
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
