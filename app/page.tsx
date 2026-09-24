import Link from "next/link";
import HomeFrame from "@/components/home/HomeFrame";
import HomeAction from "@/components/home/HomeAction";
import "./home-v15.css";

/*
 * Home v15 – układ oparty na produkcie.
 * 1. Hero: nagłówek + panel okresu z „linijką” (punkty vs upływ czasu).
 * 2. Trzy kroki  3. Narzędzia (zakładki)  4. Dla kogo (medyk główny, dwie ścieżki poboczne)
 * 5. Czym CRPE jest / nie jest  6. FAQ  7. Zamknięcie.
 * Wszystkie ilustracje są fragmentami interfejsu; dane w podglądach są przykładowe.
 */

const Check = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.2 4.2L19 7" /></svg>;
const Alert = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 7v6M12 17h.01" /></svg>;
const Logo = () => <span className="mark"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7.5 3.2v5.4c0 4.7-3.2 8-7.5 9.4-4.3-1.4-7.5-4.7-7.5-9.4V6.2z" /><path d="M9 12.2l2.1 2.1L15.2 10" /></svg></span>;

export default function Home() {
  return <HomeFrame className="crpe-home-v15" navigation={<>
<header className="site-header">
  <div className="wrap header-inner">
    <Link href="/" className="logo"><Logo />CRPE</Link>
    <nav aria-label="Nawigacja główna" className="main-nav" id="mainNav">
      <Link href="#jak-to-dziala">Jak to działa</Link>
      <Link href="#narzedzia">Narzędzia</Link>
      <Link href="#dla-kogo">Dla kogo</Link>
      <Link href="/baza-szkolen">Baza szkoleń</Link>
      <Link href="#faq">Pytania</Link>
    </nav>
    <div className="header-actions">
      <Link href="/login" className="btn btn-ghost btn-s">Zaloguj się</Link>
      <Link href="/rejestracja" className="btn btn-primary btn-s">Załóż konto</Link>
      <button type="button" className="menu-toggle-btn" id="menuToggle" aria-label="Otwórz menu" aria-expanded="false" aria-controls="sideDrawer"><i></i><i></i><i></i></button>
    </div>
  </div>
</header>
<button type="button" className="drawer-backdrop" id="drawerBackdrop" tabIndex={-1} aria-hidden="true"></button>
<nav className="side-drawer" id="sideDrawer" aria-label="Menu" aria-hidden="true">
  <div className="drawer-head"><span>Menu</span><button type="button" className="drawer-close" id="drawerClose" aria-label="Zamknij menu">✕</button></div>
  <Link href="#jak-to-dziala">Jak to działa</Link>
  <Link href="#narzedzia">Narzędzia</Link>
  <Link href="#dla-kogo">Dla kogo</Link>
  <Link href="/baza-szkolen">Baza szkoleń</Link>
  <Link href="#faq">Pytania</Link>
  <Link href="/pomoc">Centrum pomocy</Link>
  <div className="drawer-cta">
    <Link href="/login" className="btn btn-ghost">Zaloguj się</Link>
    <Link href="/rejestracja" className="btn btn-primary">Załóż konto</Link>
  </div>
</nav>
</>} footer={
<footer className="site-footer">
  <div className="wrap">
    <div className="footer-top">
      <div className="footer-brand">
        <span className="logo"><Logo />CRPE</span>
        <p>Narzędzie do własnej ewidencji aktywności, punktów i dokumentów edukacyjnych.</p>
      </div>
      <div className="footer-col"><h2 className="footer-heading">Dla kogo</h2>
        <Link href="/dla-medyka">Dla medyka</Link><Link href="/dla-placowki">Dla placówki</Link><Link href="/dla-organizatora">Dla organizatora</Link></div>
      <div className="footer-col"><h2 className="footer-heading">Serwis</h2>
        <Link href="/baza-szkolen">Baza szkoleń</Link><Link href="/narzedzia">Narzędzia</Link><Link href="/bezpieczenstwo">Bezpieczeństwo</Link><Link href="/pomoc">Centrum pomocy</Link><Link href="/kontakt">Kontakt</Link></div>
      <div className="footer-col"><h2 className="footer-heading">Dokumenty</h2>
        <Link href="/regulamin">Regulamin</Link><Link href="/polityka-prywatnosci">Polityka prywatności</Link></div>
    </div>
    <div className="footer-bottom">© 2026 CRPE.pl</div>
  </div>
</footer>}>

{/* 1. HERO */}
<section className="hero" aria-labelledby="hero-title">
  <div className="wrap">
    <div className="hero-grid">
      <h1 id="hero-title">Punkty edukacyjne bez segregatora.</h1>
      <div className="hero-side">
        <p className="lead">Dodawaj kursy i certyfikaty, także zdjęciem z telefonu. CRPE liczy punkty w Twoim okresie rozliczeniowym i pokazuje, ile jeszcze brakuje.</p>
        <div className="hero-cta"><HomeAction /><Link href="#jak-to-dziala" className="btn btn-ghost">Zobacz, jak działa</Link></div>
        <p className="hero-note">Dla lekarzy, pielęgniarek, fizjoterapeutów i innych zawodów medycznych.</p>
      </div>
    </div>

    <div className="stage">
      <div className="panel" role="img" aria-label="Przykładowy panel: 110 z 200 punktów w okresie 2024–2027, brakuje 90 punktów">
        <div className="toast" aria-hidden="true">
          <span className="doc doc-ok doc-l"><Check /></span>
          <div><b>Certyfikat dodany</b><span>Kurs z kardiologii, +15 pkt</span></div>
        </div>
        <div className="panel-top">
          <div className="who"><span className="avatar">AK</span><div><b>Okres rozliczeniowy 2024–2027</b><span>Dane przykładowe · stan na 24.09.2026</span></div></div>
          <span className="pill pill-warn">Tempo poniżej planu</span>
        </div>
        <div className="score"><b>110</b><span>z 200 punktów</span></div>
        <p className="score-note">Brakuje 90 pkt. Żeby zdążyć do końca 2027 roku, potrzebujesz około 71 pkt rocznie.</p>

        <div className="ruler" aria-hidden="true">
          <div className="ruler-track">
            <div className="ruler-fill">
              {[8, 19, 33, 41, 56, 70, 84, 95].map(x => <span key={x} className="tick" style={{ left: `${x}%` }}></span>)}
            </div>
            <div className="today"><span>24.09.2026</span></div>
          </div>
          <div className="years"><span>2024</span><span>2025</span><span>2026</span><span>2027</span></div>
        </div>
        <div className="ruler-legend" aria-hidden="true">
          <span><i className="lg-fill"></i>Zdobyte punkty</span>
          <span><i className="lg-tick"></i>Certyfikat w dokumentach</span>
          <span><i className="lg-today"></i>Upływ czasu</span>
        </div>

        <div className="panel-cols">
          <div>
            <p className="list-h">Ostatnie aktywności</p>
            <ul className="entries">
              <li><div>Ostre stany w kardiologii<small>Kurs online, 12 września</small></div><span className="pts">+15</span><span className="doc doc-ok"><Check /></span></li>
              <li><div>Antybiotykoterapia w praktyce<small>Webinar, 28 sierpnia</small></div><span className="pts">+5</span><span className="doc doc-warn"><Alert /></span></li>
              <li><div>Kongres kardiologiczny<small>Konferencja, 14 czerwca</small></div><span className="pts">+20</span><span className="doc doc-ok"><Check /></span></li>
            </ul>
          </div>
          <div>
            <div className="stats"><div><small>Aktywności</small><b>26</b></div><div><small>Certyfikaty</small><b>25</b></div></div>
            <p className="hint">Do jednej aktywności brakuje certyfikatu. <b>Dołącz zdjęcie</b>, żeby raport był kompletny.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* 2. JAK TO DZIAŁA */}
<section className="block" id="jak-to-dziala" aria-labelledby="how-title">
  <div className="wrap">
    <div className="sec-head"><h2 id="how-title">Trzy kroki, żadnych arkuszy.</h2><p>Dodaj aktywność, dołącz dokument i sprawdź postęp. CRPE zbierze wpisy w zestawienie okresu.</p></div>
    <ol className="steps">
      <li>
        <div className="scene" aria-hidden="true"><div className="mini form">
          <b>Nowa aktywność</b><span className="field">Kurs online</span><span className="field on">Ostre stany w kardiologii</span><span className="field">15 punktów</span>
        </div></div>
        <h3>Dodaj aktywność</h3><p>Kurs, webinar, konferencja albo publikacja. Nazwa, data i liczba punktów.</p>
      </li>
      <li>
        <div className="scene" aria-hidden="true"><div className="phone">
          <div className="cert"><i></i><i></i><i></i><i></i><span className="frame"></span></div><span className="shutter"></span>
        </div></div>
        <h3>Dołącz certyfikat</h3><p>Zrób zdjęcie telefonem albo wgraj PDF. Dokument zostaje przypięty do wpisu.</p>
      </li>
      <li>
        <div className="scene" aria-hidden="true"><div className="mini sum">
          <div className="sum-top"><b>110 / 200 pkt</b><span className="pill pill-brand">PDF</span></div><span className="bar"><i></i></span><span className="muted">Brakuje 90 pkt do celu</span>
        </div></div>
        <h3>Sprawdź stan i pobierz raport</h3><p>Widzisz, ile brakuje i jakie masz tempo. Zestawienie okresu pobierzesz jako PDF albo CSV.</p>
      </li>
    </ol>
  </div>
</section>

{/* 3. NARZĘDZIA */}
<section className="block block-flush" id="narzedzia" aria-labelledby="tools-title">
  <div className="wrap">
    <div className="sec-head"><h2 id="tools-title">Jedno konto na cały okres.</h2><p>Aktywności, dokumenty, raport i plan szkoleń w jednym miejscu. W podglądach są dane przykładowe.</p></div>
    <div className="tools">
      <div className="tablist" role="tablist" aria-label="Narzędzia konta medyka">
        <button type="button" className="tab is-on" role="tab" id="tnav-0" aria-selected="true" aria-controls="tpane-0"><strong>Aktywności</strong><span>Wpisy z punktami, filtrami i statusem dokumentów.</span></button>
        <button type="button" className="tab" role="tab" id="tnav-1" aria-selected="false" aria-controls="tpane-1" tabIndex={-1}><strong>Certyfikaty z telefonu</strong><span>Zdjęcie trafia od razu do właściwego wpisu.</span></button>
        <button type="button" className="tab" role="tab" id="tnav-2" aria-selected="false" aria-controls="tpane-2" tabIndex={-1}><strong>Raport okresu</strong><span>Zestawienie całego okresu w PDF albo CSV.</span></button>
        <button type="button" className="tab" role="tab" id="tnav-3" aria-selected="false" aria-controls="tpane-3" tabIndex={-1}><strong>Baza szkoleń</strong><span>Szkolenia z punktami do zaplanowania.</span></button>
      </div>
      <div className="viewer">
        <div className="tpane is-on" id="tpane-0" role="tabpanel" aria-labelledby="tnav-0">
          <div className="mini card">
            <b>Aktywności</b>
            <div className="chips"><span className="pill pill-brand">Wszystkie 26</span><span className="pill pill-line">Bez certyfikatu 1</span><span className="pill pill-line">2026</span></div>
            <table className="table"><tbody>
              <tr><td>Ostre stany w kardiologii<small>Kurs, 12.09.2026</small></td><td><span className="pill pill-ok">Certyfikat</span></td><td><b>15 pkt</b></td></tr>
              <tr><td>Antybiotykoterapia w praktyce<small>Webinar, 28.08.2026</small></td><td><span className="pill pill-warn">Brak</span></td><td><b>5 pkt</b></td></tr>
              <tr><td>Kongres kardiologiczny<small>Konferencja, 14.06.2026</small></td><td><span className="pill pill-ok">Certyfikat</span></td><td><b>20 pkt</b></td></tr>
              <tr><td>Publikacja w czasopiśmie<small>Publikacja, 02.04.2026</small></td><td><span className="pill pill-ok">Certyfikat</span></td><td><b>10 pkt</b></td></tr>
            </tbody></table>
          </div>
        </div>
        <div className="tpane" id="tpane-1" role="tabpanel" aria-labelledby="tnav-1" hidden>
          <div className="upload">
            <div className="phone phone-l"><small>Antybiotykoterapia</small><div className="cert"><i></i><i></i><i></i><i></i><i></i><span className="frame"></span></div><span className="shutter"></span></div>
            <div className="upload-copy"><span className="pill pill-ok">Przypisano do wpisu</span><p>Webinar „Antybiotykoterapia w praktyce”, 5 pkt.</p><small>Możesz też wgrać gotowy plik PDF.</small></div>
          </div>
        </div>
        <div className="tpane" id="tpane-2" role="tabpanel" aria-labelledby="tnav-2" hidden>
          <div className="paper">
            <div className="row"><b>Zestawienie aktywności</b><span>CRPE</span></div>
            <small>Okres 2024–2027, stan na 24.09.2026</small>
            <hr />
            <div className="row"><span>Zdobyte punkty</span><b>110 / 200</b></div>
            <span className="bar"><i></i></span>
            <hr />
            <div className="row"><span>Kongres kardiologiczny</span><span>20</span></div>
            <div className="row"><span>Ostre stany w kardiologii</span><span>15</span></div>
            <div className="row"><span>Publikacja w czasopiśmie</span><span>10</span></div>
            <div className="row"><span>Antybiotykoterapia w praktyce</span><span>5</span></div>
            <div className="row faint"><span>i 22 kolejne aktywności</span><span></span></div>
            <div className="paper-foot"><span className="pill pill-brand">Pobierz PDF</span><span className="pill pill-line">Pobierz CSV</span></div>
          </div>
        </div>
        <div className="tpane" id="tpane-3" role="tabpanel" aria-labelledby="tnav-3" hidden>
          <div className="mini card">
            <div className="search"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>kardiologia, online</div>
            <div className="course"><b>Niewydolność serca w praktyce</b><span className="pill pill-brand">10 pkt</span><small>Kurs online, 8–9 października</small></div>
            <div className="course"><b>EKG dla praktyków</b><span className="pill pill-brand">6 pkt</span><small>Webinar, 15 października</small></div>
            <div className="course"><b>Farmakoterapia w geriatrii</b><span className="pill pill-brand">12 pkt</span><small>Stacjonarnie, Warszawa, 24 października</small></div>
            <Link href="/baza-szkolen" className="text-link">Otwórz bazę szkoleń</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* 4. DLA KOGO */}
<section className="block block-flush" id="dla-kogo" aria-labelledby="aud-title">
  <div className="wrap">
    <h2 id="aud-title" className="visually-hidden">Dla kogo jest CRPE</h2>
    <div className="aud">
      <div className="aud-main">
        <div>
          <h3>Dla medyka</h3>
          <p>Prywatny profil edukacyjny. Punkty, dokumenty i raport w jednym miejscu, na komputerze i telefonie.</p>
        </div>
        <ul>
          <li>Licznik punktów w okresie</li>
          <li>Certyfikaty przy wpisach</li>
          <li>Tempo potrzebne do celu</li>
          <li>Raport PDF i CSV</li>
        </ul>
        <div className="aud-actions"><HomeAction /><Link href="/dla-medyka" className="text-link light">Więcej dla medyka</Link></div>
      </div>
      <div className="aud-side">
        <div className="aud-card">
          <h3>Dla placówki</h3>
          <p>Jednostki, zaproszenia i role są dostępne. Raporty zbiorcze w przygotowaniu.</p>
          <Link href="/dla-placowki" className="text-link">Poznaj panel placówki</Link>
        </div>
        <div className="aud-card">
          <h3>Dla organizatora szkoleń</h3>
          <p>Zgłoszenie szkolenia do publicznej bazy jest dostępne. Obsługa uczestników w przygotowaniu.</p>
          <Link href="/dla-organizatora" className="text-link">Zgłoś szkolenie</Link>
        </div>
      </div>
    </div>
  </div>
</section>

{/* 5. CZYM JEST / NIE JEST */}
<section className="block honest" id="bezpieczenstwo" aria-labelledby="honest-title">
  <div className="wrap">
    <div className="sec-head"><h2 id="honest-title">Twoja ewidencja. Twoje dane.</h2><p>CRPE porządkuje dokumentację, ale nie zastępuje oficjalnej procedury rozliczenia. Mówimy to wprost.</p></div>
    <div className="cols2">
      <div>
        <h3>CRPE jest</h3>
        <ul className="checks">
          <li><span className="mark ok"><Check /></span><div><b>Prywatnym narzędziem do ewidencji</b><span>Prowadzisz własny rejestr aktywności i punktów.</span></div></li>
          <li><span className="mark ok"><Check /></span><div><b>Archiwum dokumentów</b><span>Dostęp tylko po zalogowaniu. Certyfikat zostaje przy swoim wpisie.</span></div></li>
          <li><span className="mark ok"><Check /></span><div><b>Źródłem gotowego zestawienia</b><span>Raport ułatwia przygotowanie się do rozliczenia.</span></div></li>
        </ul>
      </div>
      <div>
        <h3>CRPE nie jest</h3>
        <ul className="checks">
          <li><span className="mark no">–</span><div><b>Rejestrem państwowym</b><span>Nie jest połączone z systemami samorządów zawodowych ani urzędów.</span></div></li>
          <li><span className="mark no">–</span><div><b>Automatycznym rozliczeniem obowiązku</b><span>Rozliczenie składasz nadal zgodnie z obowiązującą procedurą.</span></div></li>
        </ul>
        <div className="links"><Link href="/bezpieczenstwo">Jak chronimy dane</Link><Link href="/polityka-prywatnosci">Polityka prywatności</Link><Link href="/regulamin">Regulamin</Link></div>
      </div>
    </div>
  </div>
</section>

{/* 6. FAQ */}
<section className="block" id="faq" aria-labelledby="faq-title">
  <div className="wrap faq">
    <div><h2 id="faq-title">Pytania</h2><p className="faq-lead">Nie ma tu Twojego pytania? <Link href="/kontakt">Napisz do nas</Link>.</p></div>
    <div className="faq-list">
      <details><summary>Czy CRPE jest połączone z systemem państwowym?</summary><p>Nie. CRPE służy do prowadzenia własnej ewidencji aktywności, punktów i dokumentów. Nie zastępuje oficjalnych rejestrów ani wymaganej procedury rozliczenia.</p></details>
      <details><summary>Czy mogę dodać certyfikat z telefonu?</summary><p>Tak. Dokument dodasz jako zdjęcie albo plik PDF i przypiszesz do konkretnej aktywności.</p></details>
      <details><summary>Dla jakich zawodów jest CRPE?</summary><p>Dla lekarzy, lekarzy dentystów, pielęgniarek, położnych, fizjoterapeutów, ratowników medycznych, farmaceutów i diagnostów laboratoryjnych. Zawód wybierasz przy zakładaniu konta.</p></details>
      <details><summary>Co CRPE daje placówce lub jednostce?</summary><p>Panel pozwala tworzyć strukturę jednostki, wysyłać zaproszenia i nadawać role. Zbiorczy status zespołu, raporty i alerty są w przygotowaniu.</p></details>
      <details><summary>Co CRPE oferuje organizatorowi kształcenia?</summary><p>Organizator może zgłosić szkolenie do publicznej bazy i podać link do zapisów. Obsługa uczestników jest w przygotowaniu. <Link href="/dla-organizatora">Poznaj zakres dla organizatora</Link>.</p></details>
    </div>
  </div>
</section>

{/* 7. ZAMKNIĘCIE */}
<section className="final" aria-labelledby="final-title">
  <div className="wrap final-box">
    <h2 id="final-title">Zacznij od jednego certyfikatu.</h2>
    <div><p>Dodaj ostatnie szkolenie i zobacz, ile punktów masz już w tym okresie.</p><div className="hero-cta"><HomeAction /><Link href="/baza-szkolen" className="btn btn-ghost">Przeglądaj szkolenia</Link></div></div>
  </div>
</section>

</HomeFrame>;
}
