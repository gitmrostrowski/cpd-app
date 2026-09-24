import Link from "next/link";
import type { ReactNode } from "react";
import HomeFrame from "@/components/home/HomeFrame";
import HomeAction from "@/components/home/HomeAction";
import { MarketingFooter, MarketingNav } from "@/components/home/MarketingChrome";
import RoleContactModal from "@/components/RoleContactModal";
import PlacowkaPreview from "@/components/home/PlacowkaPreview";
import "@/app/home-v15.css";
import "@/app/role-v15.css";

/*
 * Strony ról w systemie Home v15: ta sama nawigacja, typografia i tokeny.
 * Każda strona: hero z podglądem interfejsu, zakres (dostępne / w przygotowaniu),
 * kroki, pytania i zamknięcie. Opisujemy wyłącznie to, co działa w aplikacji.
 */

type RoleKind = "medyk" | "placowka" | "organizator";

type RoleContent = {
  title: string;
  lead: string;
  status: string;
  note?: string;
  available: Array<[string, string]>;
  laterTitle: string;
  later: Array<[string, string]>;
  stepsTitle: string;
  steps: Array<[string, string]>;
  faq: Array<[string, string]>;
  finalTitle: string;
  finalText: string;
};

const content: Record<RoleKind, RoleContent> = {
  medyk: {
    title: "Twoje punkty, certyfikaty i raport w jednym koncie.",
    lead: "Ustawiasz zawód, okres i cel. Dodajesz aktywności z dokumentami, a CRPE pokazuje postęp i tempo potrzebne do końca okresu.",
    status: "Dostępne teraz",
    note: "Dla lekarzy, lekarzy dentystów, pielęgniarek, położnych, fizjoterapeutów, ratowników medycznych, farmaceutów i diagnostów laboratoryjnych.",
    available: [
      ["Panel CPD", "Postęp według okresu i celu oraz liczba punktów rocznie potrzebna do końca okresu."],
      ["Aktywności", "Kursy, webinary, konferencje i publikacje z datą i punktami."],
      ["Certyfikaty", "PDF albo zdjęcie z telefonu, przypięte do właściwego wpisu."],
      ["Raport okresu", "Zestawienie do wydruku lub zapisania jako PDF oraz plik CSV."],
      ["Baza szkoleń", "Wyszukiwanie szkoleń z punktami i dodawanie ich do planu."],
    ],
    laterTitle: "Dobrze wiedzieć",
    later: [
      ["CRPE nie rozlicza obowiązku za Ciebie", "To prywatna ewidencja. Rozliczenie składasz zgodnie z obowiązującą procedurą."],
      ["Plan to nie zapis", "Dodanie szkolenia do planu nie zapisuje Cię u organizatora."],
      ["Dane widzisz tylko Ty", "Aktywności i pliki są dostępne po zalogowaniu."],
    ],
    stepsTitle: "Cztery kroki do porządku w punktach.",
    steps: [
      ["Załóż konto", "Wybierz zawód, okres rozliczeniowy i cel."],
      ["Dodaj aktywność", "Nazwa, rodzaj, data i liczba punktów."],
      ["Dołącz dokument", "Zdjęcie certyfikatu albo plik PDF."],
      ["Sprawdzaj postęp", "Panel pokazuje, ile brakuje i jakie tempo utrzymać."],
    ],
    faq: [
      ["Czy mogę dodać starsze certyfikaty?", "Tak. Aktywność dodasz ręcznie z datą z przeszłości i przypiszesz do niej posiadany dokument."],
      ["Czy CRPE automatycznie mnie rozlicza?", "Nie. CRPE porządkuje dane i przygotowuje zestawienie, ale nie wykonuje oficjalnego rozliczenia."],
      ["Czy mogę korzystać z telefonu?", "Tak. Strona działa na telefonie, a certyfikat dodasz jako zdjęcie."],
      ["Czy raport można pobrać?", "Tak. Zestawienie okresu wydrukujesz albo zapiszesz jako PDF, a dane pobierzesz w pliku CSV."],
    ],
    finalTitle: "Zacznij od ostatniego szkolenia.",
    finalText: "Dodaj jedną aktywność z certyfikatem i zobacz, ile punktów masz już w tym okresie.",
  },
  placowka: {
    title: "Zespół, jednostki i dostęp w jednym panelu.",
    lead: "Placówka buduje strukturę, zaprasza pracowników i nadaje role. Każdy pracownik prowadzi własne konto, a jego dokumenty nie są udostępniane automatycznie.",
    status: "Panel pilotażowy",
    available: [
      ["Struktura placówki", "Oddziały, zespoły i jednostki z przypisaną odpowiedzialnością."],
      ["Zaproszenia", "Dostęp nadawany na konkretny adres e-mail pracownika."],
      ["Role", "Właściciel, administrator, koordynator, weryfikator i inne role operacyjne."],
      ["Rozdzielenie danych", "Członkostwo nie daje dostępu do prywatnych certyfikatów pracownika."],
    ],
    laterTitle: "W przygotowaniu",
    later: [
      ["Status zespołu", "Zbiorczy widok punktów i kompletności dokumentów."],
      ["Weryfikacja", "Kolejka aktywności i dokumentów udostępnionych placówce."],
      ["Alerty", "Przypomnienia o brakach i zbliżających się terminach."],
      ["Raporty zbiorcze", "Raport jednostki i eksport zgodny z uprawnieniami."],
    ],
    stepsTitle: "Jak uruchomić panel placówki.",
    steps: [
      ["Napisz do nas", "Podaj nazwę placówki, liczbę osób i strukturę."],
      ["Ustalamy pilotaż", "Zakładamy placówkę i konto właściciela."],
      ["Dodaj jednostki", "Oddziały i zespoły, w których pracują ludzie."],
      ["Zaproś zespół", "Wyślij zaproszenia i nadaj role."],
    ],
    faq: [
      ["Czy placówka może mieć jedno wspólne konto?", "Nie. Każdy pracownik korzysta z własnego konta, a administrator ma osobne uprawnienia."],
      ["Czy administrator zobaczy dokumenty pracowników?", "Nie automatycznie. Członkostwo w placówce nie daje dostępu do prywatnych certyfikatów."],
      ["Co jest dostępne już teraz?", "Struktura placówki, jednostki, członkostwa, zaproszenia i role. Status zespołu, weryfikacja i raporty zbiorcze są w przygotowaniu."],
      ["Dostałem zaproszenie. Co dalej?", "Zaloguj się adresem e-mail, na który przyszło zaproszenie, i otwórz panel placówki."],
    ],
    finalTitle: "Zacznijmy od jednego zespołu.",
    finalText: "Opisz placówkę, a ustalimy zakres pilotażu i uruchomimy panel.",
  },
  organizator: {
    title: "Pokaż szkolenie medykom, którzy planują punkty.",
    lead: "Zgłoś szkolenie do publicznej bazy CRPE z terminem, formą, punktami i linkiem do zapisów. Po weryfikacji zobaczą je użytkownicy planujący kolejne aktywności.",
    status: "Zgłaszanie dostępne",
    available: [
      ["Zgłoszenie szkolenia", "Formularz w bazie szkoleń, dostępny po zalogowaniu."],
      ["Weryfikacja", "Każde zgłoszenie sprawdzamy przed publikacją."],
      ["Link do zapisów", "Uczestnicy zapisują się bezpośrednio u Ciebie."],
      ["Logo organizatora", "Twoje logo przy wydarzeniu w bazie."],
    ],
    laterTitle: "W przygotowaniu",
    later: [
      ["Obsługa uczestników", "Listy uczestników i statusy dla wydarzenia."],
      ["Dokumenty", "Wydawanie zaświadczeń i certyfikatów uczestnikom."],
      ["Konto organizatora", "Zespół organizatora z rolami i własnym panelem."],
    ],
    stepsTitle: "Jak zgłosić szkolenie.",
    steps: [
      ["Załóż konto", "Albo zaloguj się, jeśli już je masz."],
      ["Otwórz bazę szkoleń", "Wybierz „Zgłoś szkolenie”."],
      ["Uzupełnij dane", "Termin, forma, punkty, zawody i link do zapisów."],
      ["Poczekaj na publikację", "Po weryfikacji szkolenie pojawi się w bazie."],
    ],
    faq: [
      ["Czy CRPE zapisuje uczestników?", "Nie. Użytkownik trafia przez link do Twojej strony zapisów. Dodanie szkolenia do planu w CRPE nie jest zapisem."],
      ["Czy mogę dodać logo?", "Tak. Logo dodasz w formularzu zgłoszenia."],
      ["Czy CRPE wydaje certyfikaty uczestnikom?", "Jeszcze nie. Obsługa dokumentów dla uczestników jest w przygotowaniu."],
      ["Mam dużo wydarzeń. Czy muszę zgłaszać każde osobno?", "Napisz do nas. Ustalimy wygodniejszy sposób przekazania danych."],
    ],
    finalTitle: "Twoje następne szkolenie może być w bazie.",
    finalText: "Wystarczy konto CRPE i podstawowe dane szkolenia.",
  },
};

const Check = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.2 4.2L19 7" /></svg>;
const Doc = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>;

function MedykPreview() {
  return <div className="panel role-panel" role="img" aria-label="Przykładowy wpis aktywności z dołączonym certyfikatem">
    <div className="panel-top">
      <div><p className="rp-kicker">Aktywność</p><h2 className="rp-title">Ostre stany w kardiologii</h2></div>
      <span className="pill pill-ok">Certyfikat dołączony</span>
    </div>
    <dl className="rp-meta">
      <div><dt>Rodzaj</dt><dd>Kurs online</dd></div>
      <div><dt>Data</dt><dd>12.09.2026</dd></div>
      <div><dt>Punkty</dt><dd>15</dd></div>
    </dl>
    <div className="rp-file"><span className="doc doc-ok doc-l"><Doc /></span><div><b>certyfikat-kardiologia.pdf</b><span>Przypięty do tego wpisu</span></div></div>
    <div className="rp-progress">
      <div className="sum-top"><b>110 / 200 pkt w okresie 2024–2027</b><span className="muted">+15 pkt</span></div>
      <span className="bar"><i></i></span>
      <span className="muted">Do końca okresu potrzebujesz około 71 pkt rocznie.</span>
    </div>
    <p className="rp-foot">Dane przykładowe</p>
  </div>;
}

function OrganizatorPreview() {
  return <div className="rp-pair" role="img" aria-label="Przykładowe zgłoszenie szkolenia i ta sama pozycja opublikowana w bazie szkoleń">
    <div className="panel role-panel">
      <div className="panel-top"><div><p className="rp-kicker">Zgłoszenie szkolenia</p><h2 className="rp-title">Niewydolność serca w praktyce</h2></div></div>
      <div className="rp-form">
        <span className="field">Kurs online</span>
        <span className="field">8–9 października 2026</span>
        <span className="field">10 punktów</span>
        <span className="field">Lekarze, pielęgniarki</span>
        <span className="field on">https://twoja-strona.pl/zapisy</span>
      </div>
      <span className="pill pill-warn">Czeka na weryfikację</span>
    </div>
    <div className="rp-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
    <div className="panel role-panel rp-published">
      <div className="panel-top"><span className="rp-logo" aria-hidden="true">TO</span><span className="pill pill-ok">W bazie szkoleń</span></div>
      <h3 className="rp-course">Niewydolność serca w praktyce</h3>
      <p className="muted">Kurs online, 8–9 października</p>
      <div className="rp-course-foot"><span className="pill pill-brand">10 pkt</span><span className="text-link">Zapisy u organizatora</span></div>
      <p className="rp-foot">Dane przykładowe</p>
    </div>
  </div>;
}

function Actions({ role, variant }: { role: RoleKind; variant: "hero" | "final" }): ReactNode {
  if (role === "medyk") return <div className="hero-cta"><HomeAction /><Link href={variant === "hero" ? "/#narzedzia" : "/baza-szkolen"} className="btn btn-ghost">{variant === "hero" ? "Zobacz narzędzia" : "Przeglądaj szkolenia"}</Link></div>;
  if (role === "placowka") return <div className="hero-cta"><RoleContactModal role="placowka" triggerLabel="Zapytaj o pilotaż" triggerClassName="btn btn-primary" compact /><Link href="/placowka" className="btn btn-ghost">Mam zaproszenie</Link></div>;
  return <div className="hero-cta"><Link href="/baza-szkolen" className="btn btn-primary">Zgłoś szkolenie</Link><RoleContactModal role="organizator" triggerLabel="Napisz do nas" triggerClassName="btn btn-ghost" compact /></div>;
}

export default function RoleLandingPage({ role }: { role: RoleKind }) {
  const c = content[role];
  const laterIsSoon = role !== "medyk";
  return <HomeFrame className={`crpe-home-v15 crpe-role role-${role}`} navigation={<MarketingNav />} footer={<MarketingFooter />}>

<section className="hero role-hero" aria-labelledby="role-title">
  <div className="wrap">
    <div className="hero-grid">
      <div>
        <span className={`pill ${role === "medyk" || role === "organizator" ? "pill-ok" : "pill-brand"} role-status`}>{c.status}</span>
        <h1 id="role-title">{c.title}</h1>
      </div>
      <div className="hero-side">
        <p className="lead">{c.lead}</p>
        <Actions role={role} variant="hero" />
        {c.note ? <p className="hero-note">{c.note}</p> : null}
      </div>
    </div>
    <div className="stage">
      {role === "medyk" ? <MedykPreview /> : role === "placowka" ? <PlacowkaPreview /> : <OrganizatorPreview />}
    </div>
  </div>
</section>

<section className="block" id="zakres" aria-labelledby="scope-title">
  <div className="wrap">
    <div className="sec-head"><h2 id="scope-title">Co możesz zrobić już teraz.</h2><p>{laterIsSoon ? "Opisujemy tylko to, co działa. Kolejne funkcje są wyraźnie oznaczone." : "Wszystko poniżej działa w koncie medyka od pierwszego dnia."}</p></div>
    <div className="cols2">
      <div>
        <h3>Dostępne teraz</h3>
        <ul className="checks">
          {c.available.map(([title, text]) => <li key={title}><span className="mark ok"><Check /></span><div><b>{title}</b><span>{text}</span></div></li>)}
        </ul>
      </div>
      <div>
        <h3>{c.laterTitle}</h3>
        <ul className="checks">
          {c.later.map(([title, text]) => <li key={title}><span className={laterIsSoon ? "mark soon" : "mark no"}>{laterIsSoon ? "" : "i"}</span><div><b>{title}</b><span>{text}</span></div></li>)}
        </ul>
        <div className="links"><Link href="/bezpieczenstwo">Jak chronimy dane</Link><Link href="/polityka-prywatnosci">Polityka prywatności</Link><Link href="/regulamin">Regulamin</Link></div>
      </div>
    </div>
  </div>
</section>

<section className="block honest" aria-labelledby="steps-title">
  <div className="wrap">
    <div className="sec-head"><h2 id="steps-title">{c.stepsTitle}</h2><p>{role === "placowka" ? "Panel placówki uruchamiamy w pilotażu, razem z Tobą." : "Bez szkoleń i instrukcji. Każdy krok to jeden ekran."}</p></div>
    <ol className="role-steps">
      {c.steps.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}
    </ol>
  </div>
</section>

<section className="block" id="pytania" aria-labelledby="role-faq-title">
  <div className="wrap faq">
    <div><h2 id="role-faq-title">Pytania</h2><p className="faq-lead">Więcej odpowiedzi w <Link href="/pomoc">centrum pomocy</Link>.</p></div>
    <div className="faq-list">
      {c.faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </div>
  </div>
</section>

<section className="final" aria-labelledby="role-final-title">
  <div className="wrap final-box">
    <h2 id="role-final-title">{c.finalTitle}</h2>
    <div><p>{c.finalText}</p><Actions role={role} variant="final" /></div>
  </div>
</section>

</HomeFrame>;
}
