/* eslint-disable @next/next/no-img-element -- supplied landing page artwork */
"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { initializeHome } from "@/components/home/initializeHome";
import "./home-v14.css";
const font = Montserrat({ subsets: ["latin", "latin-ext"], display: "swap" });
export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => root.current ? initializeHome(root.current) : undefined, []);
  return <div ref={root} className={`crpe-home-v14 ${font.className}`}>
  <Link className="skip-home" href="#kim-jestes">Przejdź do wyboru odbiorcy</Link>





<header className="site-header">
  <span className="scroll-progress" id="scrollProgress"></span>
  <div className="header-inner">
    <Link href="/" className="logo"><span className="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7.5 3.2v5.4c0 4.7-3.2 8-7.5 9.4-4.3-1.4-7.5-4.7-7.5-9.4V6.2z"></path><path d="M9 12.2l2.1 2.1L15.2 10"></path></svg></span>CRPE</Link>
    <nav className="main-nav" id="mainNav">
      <span className="nav-pill" id="navPill"></span>
      <Link href="#narzedzia">Narzędzia</Link>
      <Link href="#bezpieczenstwo">Bezpieczeństwo</Link>
      <Link href="#faq">FAQ</Link>
    </nav>
    <div className="header-actions">
      <Link href="/login" className="btn btn-ghost">Zaloguj się</Link>
      <Link href="/rejestracja" className="btn btn-primary">Załóż konto</Link>
      <button type="button" className="menu-toggle-btn" id="menuToggle" aria-label="Otwórz menu" aria-expanded="false" aria-controls="sideDrawer">
        <i></i><i></i><i></i>
      </button>
    </div>
  </div>
</header>
<button type="button" className="drawer-backdrop" id="drawerBackdrop" tabIndex={-1} aria-hidden="true"></button>
<nav className="side-drawer" id="sideDrawer" aria-label="Menu" aria-hidden="true">
  <div className="drawer-head">
    <span>Menu</span>
    <button type="button" className="drawer-close" id="drawerClose" aria-label="Zamknij menu">✕</button>
  </div>
  <Link href="#narzedzia">Narzędzia</Link>
  <Link href="#bezpieczenstwo">Bezpieczeństwo</Link>
  <Link href="#faq">FAQ</Link>
  <Link href="/pomoc">Centrum pomocy</Link>
  <div className="drawer-cta">
    <Link href="/login" className="btn btn-ghost">Zaloguj się</Link>
    <Link href="/rejestracja" className="btn btn-primary">Załóż konto</Link>
  </div>
</nav>

<section className="hero">
  <div className="hero-inner">
    <div className="hero-copy">
      <span className="eyebrow"><span className="dot"></span>CRPE dla medyków, placówek i organizatorów</span>
      <h1><span className="l1">Edukacja medyczna</span><br /><span className="accent">Prościej.</span></h1>
      <p className="lead">Szkolenia, punkty edukacyjne i certyfikaty w jednym miejscu.</p>
      <div className="hero-cta">
        <Link href="#kim-jestes" className="btn btn-primary hcta">Poznaj CRPE <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></Link>
      </div>
      <span className="hero-pick">Wybierz, kim jesteś</span>
      <div className="hero-roles" id="kim-jestes">
        <Link href="/dla-medyka" className="how-card role-green">
          <div className="card-top"><span className="rc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v5.5a4.5 4.5 0 0 0 9 0V3"></path><path d="M5 3h2M14 3h2"></path><path d="M10.5 13v2.5a4 4 0 0 0 8 0v-1"></path><circle cx="18.5" cy="10" r="2.2"></circle></svg></span><span className="ct-txt"><h3>Medyk</h3><span className="ct-mini">Rozwijaj swoje kompetencje</span></span></div>
          <div className="card-swap">
          <div className="cs-vis"><figure className="rc-photo"><img src="/home/v14/rola-medyk.webp" width={1254} height={1254} alt="Fartuch medyczny i stetoskop" loading="lazy" /></figure></div>
          <div className="cs-text">
            <div className="eyebrow-label">Dla indywidualnych użytkowników</div>
            <p className="desc">Zbieraj punkty CPD, aktywności i certyfikaty w swoim profilu.</p>
            <span className="go">Wybierz medyka <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"></path></svg></span>
          </div>
          </div>
          <span className="ct-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
        </Link>
        <Link href="/dla-placowki" className="how-card role-blue">
          <div className="card-top"><span className="rc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V8l8-4.5L20 8v13"></path><path d="M2 21h20"></path><path d="M12 8.5v4.5M9.75 10.75h4.5"></path><rect x="8" y="16" width="3.2" height="5"></rect><rect x="12.8" y="16" width="3.2" height="5"></rect></svg></span><span className="ct-txt"><h3>Placówka medyczna</h3><span className="ct-mini">Uporządkuj strukturę i dostęp</span></span></div>
          <div className="card-swap">
          <div className="cs-vis"><figure className="rc-photo"><img src="/home/v14/rola-placowka.webp" width={1254} height={1254} alt="Budynek placówki medycznej" loading="lazy" /></figure></div>
          <div className="cs-text">
            <div className="eyebrow-label">Dla klinik i placówek</div>
            <p className="desc">Twórz jednostki, zapraszaj zespół i nadawaj role. Raporty zbiorcze są rozwijane.</p>
            <span className="go">Wybierz placówkę <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"></path></svg></span>
          </div>
          </div>
          <span className="ct-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
        </Link>
        <Link href="/dla-organizatora" className="how-card role-violet">
          <div className="card-top"><span className="rc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7.5" r="2.8"></circle><path d="M7.2 17c0-2.6 2.1-4.3 4.8-4.3s4.8 1.7 4.8 4.3"></path><circle cx="5" cy="10" r="2.1"></circle><path d="M1.5 18c0-2 1.4-3.3 3.5-3.3"></path><circle cx="19" cy="10" r="2.1"></circle><path d="M22.5 18c0-2-1.4-3.3-3.5-3.3"></path></svg></span><span className="ct-txt"><h3>Organizator</h3><span className="ct-mini">Zgłoś szkolenie do publicznej bazy</span></span></div>
          <div className="card-swap">
          <div className="cs-vis"><figure className="rc-photo"><img src="/home/v14/rola-organizator.webp" width={1254} height={1254} alt="Laptop, notes i roślina na biurku" loading="lazy" /></figure></div>
          <div className="cs-text">
            <div className="eyebrow-label">Dla organizatorów szkoleń</div>
            <p className="desc">Zgłoś szkolenie do publikacji i skieruj odbiorców do zapisów. Obsługa uczestników jest rozwijana.</p>
            <span className="go">Wybierz organizatora <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"></path></svg></span>
          </div>
          </div>
          <span className="ct-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
        </Link>
      </div>
    </div>
    <figure className="hero-figure">
      <span className="hf-dots hf-dots-a" aria-hidden="true"></span>
      <span className="hf-dots hf-dots-b" aria-hidden="true"></span>
      <img src="/home/v14/crpe-hero-lekarka.webp" width={1370} height={1148} alt="Lekarka w gabinecie" fetchPriority="high" />
      <span className="hf-chip" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-4 9 4-9 4z"></path><path d="M7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5"></path></svg></span>
      <figcaption className="hero-stat">
        <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="2.6"></circle><path d="M3.5 18c0-2.8 2.4-4.4 5.5-4.4s5.5 1.6 5.5 4.4"></path><circle cx="17" cy="9" r="2.1"></circle><path d="M15.5 13.9c2.6.2 4.5 1.7 4.5 4.1"></path></svg></span>
        <span><b>Trzy role. Jeden CRPE.</b><em>Medyk, placówka, organizator</em></span>
      </figcaption>
    </figure>
  </div>
  <div className="hero-strip"><i></i><span>Wiedza</span><b>·</b><span>Rozwój</span><b>·</b><span>Lepsza opieka</span><i></i></div>
</section>

<section className="section tools-section" id="narzedzia">
  <div className="wrap">
    <div className="tools-head reveal-up">
      <span className="tools-eyebrow"><i></i>Nasze narzędzia</span>
      <h2>Wszystko, czego potrzebujesz, <span className="accent">w jednym koncie</span></h2>
      <p>Cztery narzędzia konta medyka. Poniżej pokazujemy dane przykładowe.</p>
    </div>
    <div className="tools-ui reveal-up">
      <div className="tools-nav" role="tablist" aria-label="Narzędzia CRPE">
        <button type="button" className="tnav is-on" role="tab" id="tnav-0" aria-selected="true" aria-controls="tpane-0" data-i="0">
          <span className="tnav-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16l5-5 3 3 6-7"></path><path d="M18 7h-4M18 7v4"></path><path d="M4 20h16"></path></svg></span>
          <span className="tnav-tx"><b>Panel CPD</b><em>Postęp i cel okresu w jednym widoku.</em></span>
          <span className="tnav-ar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
        </button>
        <button type="button" className="tnav" role="tab" id="tnav-1" aria-selected="false" aria-controls="tpane-1" data-i="1">
          <span className="tnav-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11"></path><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"></path></svg></span>
          <span className="tnav-tx"><b>Aktywności</b><em>Wpis z punktami i certyfikatem.</em></span>
          <span className="tnav-ar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
        </button>
        <button type="button" className="tnav" role="tab" id="tnav-2" aria-selected="false" aria-controls="tpane-2" data-i="2">
          <span className="tnav-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5"></path><path d="M9 13h6M9 17h4"></path></svg></span>
          <span className="tnav-tx"><b>Raport</b><em>Zestawienie okresu do pobrania.</em></span>
          <span className="tnav-ar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
        </button>
        <button type="button" className="tnav" role="tab" id="tnav-3" aria-selected="false" aria-controls="tpane-3" data-i="3">
          <span className="tnav-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"></path><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5z"></path><path d="M9 7.5h6"></path></svg></span>
          <span className="tnav-tx"><b>Baza szkoleń</b><em>Kursy i wydarzenia do planu CPD.</em></span>
          <span className="tnav-ar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
        </button>
      </div>
      <div className="tools-stage"><p className="demo-label">Podgląd możliwości · dane przykładowe</p>
      <div className="tpane is-on" id="tpane-0" role="tabpanel" aria-labelledby="tnav-0">
        <div className="tpane-hd"><b>Panel CPD</b><span className="tpane-tags"><i>Cel 200 pkt</i><i>Okres 2024–2027</i></span></div>
        <div className="tp-body">
            <div className="tp-top"><span className="tp-app"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16l5-5 3 3 6-7"></path><path d="M18 7h-4M18 7v4"></path></svg></span><div className="tp-ttl"><small>Widok użytkownika</small></div><span className="tp-badge">Stan na 09.2025</span></div>
            <div className="cpd">
              <div className="tp-ring">
                <svg viewBox="0 0 120 120"><circle className="tr-bg" cx="60" cy="60" r="51"></circle><circle className="tr-fg" cx="60" cy="60" r="51" pathLength="1"></circle></svg>
                <div className="tp-ring-c"><b>55<i>%</i></b><small>celu okresu</small></div>
              </div>
              <div className="cpd-main">
                <div className="cpd-lbl">Punkty w okresie</div>
                <div className="cpd-val"><b>110<i>/ 200 pkt</i></b><span className="gap">brakuje 90 pkt</span></div>
                <div className="cpd-bar"><i style={{"--w": "55%"} as CSSProperties}></i></div>
                <div className="cpd-years"><span>Okres 2024–2027</span><span>18 miesięcy do końca</span></div>
                <div className="cpd-tiles">
                  <div><small>Aktywności</small><b>26</b></div>
                  <div><small>Certyfikaty</small><b>18</b></div>
                  <div><small>Średnio / rok</small><b>42 pkt</b></div>
                </div>
              </div>
            </div>
            <div className="tp-chart">
              <div className="tp-chart-hd"><span>Przyrost punktów</span><span className="hl">+42 pkt w tym roku</span></div>
              <div className="tp-spark">
                <svg viewBox="0 0 520 86" preserveAspectRatio="none">
                  <line className="grid" x1="0" y1="22" x2="520" y2="22" vectorEffect="non-scaling-stroke"></line>
                  <line className="grid" x1="0" y1="52" x2="520" y2="52" vectorEffect="non-scaling-stroke"></line>
                  <path className="area" d="M0 70 C60 66 96 52 150 55 C210 58 244 34 300 32 C360 30 396 20 450 14 L510 9 L510 86 L0 86 Z"></path>
                  <path className="line" pathLength="1" d="M0 70 C60 66 96 52 150 55 C210 58 244 34 300 32 C360 30 396 20 450 14 L510 9"></path>
                </svg>
                <span className="end-dot"></span>
              </div>
              <div className="tp-months"><span>2024</span><span>2025</span><span>2026</span><span>2027</span></div>
            </div>
        </div>
      </div>
      <div className="tpane" id="tpane-1" role="tabpanel" aria-labelledby="tnav-1" hidden>
        <div className="tpane-hd"><b>Aktywności</b><span className="tpane-tags"><i>24 pkt / miesiąc</i><i>Certyfikat w PDF</i></span></div>
        <div className="tp-body">
            <div className="tp-top"><span className="tp-app"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"></path></svg></span><div className="tp-ttl"><strong>Aktywności</strong><small>Wrzesień 2025</small></div><span className="tp-badge">24 pkt w miesiącu</span></div>
            <div className="tp-sum">
              <div className="tp-sum-hd"><span>Podział punktów</span><b>24 pkt</b></div>
              <div className="tp-seg"><i className="a" style={{"--w": "50%"} as CSSProperties}></i><i className="b" style={{"--w": "17%"} as CSSProperties}></i><i className="c" style={{"--w": "33%"} as CSSProperties}></i></div>
              <div className="tp-legend"><span className="a">Kursy · 12</span><span className="b">Webinary · 4</span><span className="c">Konferencje · 8</span></div>
            </div>
            <div className="tp-time">
              <div className="tp-ev done"><time>14.09</time><span className="mk"><span></span></span><p>Kurs: Postępowanie w sepsie<small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.2 4.2L19 7"></path></svg>Certyfikat załączony</small></p><span className="tp-pts">12 pkt</span></div>
              <div className="tp-ev done"><time>02.09</time><span className="mk"><span></span></span><p>Webinar: EKG w praktyce<small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.2 4.2L19 7"></path></svg>Certyfikat załączony</small></p><span className="tp-pts">4 pkt</span></div>
              <div className="tp-ev"><time>26.08</time><span className="mk"><span></span></span><p>Konferencja PTK<small className="wait"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5"></path></svg>Czeka na dokument</small></p><span className="tp-pts">8 pkt</span></div>
            </div>
        </div>
      </div>
      <div className="tpane" id="tpane-2" role="tabpanel" aria-labelledby="tnav-2" hidden>
        <div className="tpane-hd"><b>Raport</b><span className="tpane-tags"><i>PDF</i><i>CSV</i></span></div>
        <div className="tp-body">
            <div className="tp-top"><span className="tp-app"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5"></path></svg></span><div className="tp-ttl"><strong>Raport okresu</strong><small>PDF · CSV</small></div><span className="tp-badge">Gotowy do pobrania</span></div>
            <div className="tp-report">
              <div className="tp-paper">
                <div className="ts-head"><span className="ts-mark">CRPE</span><div><strong>Zestawienie okresu</strong><small>2024–2027 · konto medyka</small></div></div>
                <div className="ts-table">
                  <div className="ts-row"><span>Aktywności</span><b>26</b></div>
                  <div className="ts-row"><span>Certyfikaty</span><b>18</b></div>
                  <div className="ts-row"><span>Punkty edukacyjne</span><b>110</b></div>
                  <div className="ts-row total"><span>Realizacja celu</span><b>55%</b></div>
                </div>
                <div className="ts-foot"><span className="ts-seal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.2 4.2L19 7"></path></svg></span>Zestawienie zgodne z wpisami w koncie</div>
              </div>
              <div className="tp-side">
                <div className="tp-total"><small>Punkty w okresie</small><b>110 / 200</b></div>
                <div className="tp-fmt">
                  <span className="on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v10"></path><path d="M8 11l4 4 4-4"></path><path d="M5 19h14"></path></svg>Pobierz PDF</span>
                  <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M4 10h16M10 10v10"></path></svg>Pobierz CSV</span>
                </div>
              </div>
            </div>
        </div>
      </div>
      <div className="tpane" id="tpane-3" role="tabpanel" aria-labelledby="tnav-3" hidden>
        <div className="tpane-hd"><b>Baza szkoleń</b><span className="tpane-tags"><i>318 wydarzeń</i><i>Filtry</i></span></div>
        <div className="tp-body">
            <div className="tp-top"><span className="tp-app"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"></path><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5z"></path></svg></span><div className="tp-ttl"><strong>Baza szkoleń</strong><small>Kursy, webinary i konferencje</small></div><span className="tp-badge">318 wydarzeń</span></div>
            <div className="tp-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4.2-4.2"></path></svg>Szukaj szkoleń, kursów i webinarów<span className="tp-caret"></span></div>
            <div className="tp-chips"><span className="on">Wszystkie</span><span>Kursy</span><span>Webinary</span><span>Konferencje</span></div>
            <div className="tp-res">
              <div className="tp-course"><span className="tag">Kurs stacjonarny</span><h5>Kardiologia interwencyjna</h5><div className="meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2.5"></rect><path d="M3.5 10h17M8 3v4M16 3v4"></path></svg>Warszawa · 14.09<b>12 pkt</b></div><div className="tc-foot"><span className="tc-org">Centrum Medyczne Warszawa</span><span className="tc-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg>Dodaj</span></div></div>
              <div className="tp-course"><span className="tag">Webinar</span><h5>Antybiotykoterapia w POZ</h5><div className="meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2.5"></rect><path d="M3.5 10h17M8 3v4M16 3v4"></path></svg>Online · 22.09<b>4 pkt</b></div><div className="tc-foot"><span className="tc-org">Polskie Towarzystwo POZ</span><span className="tc-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg>Dodaj</span></div></div>
            </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</section>

<section className="section sec-section" id="bezpieczenstwo">
  <div className="wrap">
    <div className="sec-split">
      <figure className="sec-figure reveal-up">
        <img src="/home/v14/crpe-certyfikat-tablet.webp" width={640} height={909} alt="Lekarz trzymający tablet z certyfikatem CRPE" loading="lazy" />
        <span className="sec-badge"><i></i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" strokeLinejoin="round"></path><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span>
      </figure>
      <div className="sec-copy reveal-up">
        <span className="tools-eyebrow sec-eyebrow"><i></i>Zakres i bezpieczeństwo</span>
        <h2>CRPE pomaga prowadzić własną ewidencję<span className="dot">.</span></h2>
        <p>System porządkuje aktywności, punkty i dokumenty, ale nie zastępuje oficjalnych rejestrów ani wymaganej procedury rozliczenia.</p>
        <div className="sec-list">
          <div className="sec-item">
            <span className="sec-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="10" width="16" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round"></path></svg></span>
            <div>
              <h4>Dane na Twoim koncie</h4>
              <p>Dostęp do aktywności i dokumentów wymaga zalogowania.</p>
            </div>
          </div>
          <div className="sec-item">
            <span className="sec-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 4h9l3 3v13H6z" strokeLinejoin="round"></path><path d="M9 12h6M9 16h6" strokeLinecap="round"></path></svg></span>
            <div>
              <h4>Dokument przy aktywności</h4>
              <p>Certyfikat pozostaje przypisany do właściwego wpisu.</p>
            </div>
          </div>
          <div className="sec-item">
            <span className="sec-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" strokeLinejoin="round"></path></svg></span>
            <div>
              <h4>Jasna rola systemu</h4>
              <p>CRPE nie jest państwowym rejestrem ani automatycznym rozliczeniem obowiązku.</p>
            </div>
          </div>
        </div>
        <div className="sec-actions">
          <Link href="/polityka-prywatnosci" className="sec-btn">Polityka prywatności</Link>
          <Link href="/regulamin" className="sec-btn">Regulamin</Link>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="section faq" id="faq">
  <div className="wrap">
    <div className="section-head reveal-up">
      <span className="eyebrow center"><span className="dot"></span>FAQ</span>
      <h2>Najczęstsze pytania.</h2>
      <p>Jeśli nie znajdziesz odpowiedzi, <Link href="/kontakt" style={{"color": "var(--blue)", "fontWeight": "600"} as CSSProperties}>napisz do nas</Link>.</p>
    </div>
    <div className="faq-list reveal-up">
      <details className="faq-item">
        <summary>Czy CRPE jest połączone z systemem państwowym?
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"></path></svg>
        </summary>
        <div className="faq-body">Nie. CRPE służy do prowadzenia własnej ewidencji aktywności, punktów i dokumentów. Nie zastępuje oficjalnych rejestrów ani wymaganej procedury rozliczenia.</div>
      </details>
      <details className="faq-item">
        <summary>Co CRPE oferuje medykowi już teraz?
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"></path></svg>
        </summary>
        <div className="faq-body">Medyk może prowadzić ewidencję aktywności, punktów i dokumentów, kontrolować postęp oraz przygotować raport użytkownika.</div>
      </details>
      <details className="faq-item">
        <summary>Czy mogę dodać certyfikat z telefonu?
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"></path></svg>
        </summary>
        <div className="faq-body">Tak. Dokument możesz dodać jako plik PDF lub zdjęcie i przypisać do konkretnej aktywności.</div>
      </details>
      <details className="faq-item">
        <summary>Co CRPE daje placówce lub jednostce?
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"></path></svg>
        </summary>
        <div className="faq-body">Panel pozwala tworzyć strukturę jednostki, wysyłać zaproszenia i nadawać role. Zbiorczy status zespołu, raporty i alerty są rozwijane.</div>
      </details>
    </div>
  </div>
</section>

<footer className="site-footer">
  <div className="wrap">
    <div className="footer-top">
      <div className="footer-brand">
        <span className="logo">CRPE</span>
        <p>Narzędzie do własnej ewidencji aktywności, punktów i dokumentów. CRPE nie jest państwowym rejestrem ani oficjalnym systemem rozliczeniowym.</p>
      </div>
      <div className="footer-col">
        <h4>Dla kogo</h4>
        <Link href="/dla-medyka">Dla medyka</Link>
        <Link href="/dla-placowki">Dla placówki</Link>
        <Link href="/dla-organizatora">Dla organizatora</Link>
      </div>
      <div className="footer-col">
        <h4>Serwis</h4>
        <Link href="/narzedzia">Narzędzia</Link>
        <Link href="/bezpieczenstwo">Bezpieczeństwo</Link>
        <Link href="/pomoc">Centrum pomocy</Link>
        <Link href="/kontakt">Kontakt</Link>
      </div>
      <div className="footer-col">
        <h4>Dokumenty</h4>
        <Link href="/regulamin">Regulamin</Link>
        <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
      </div>
    </div>
    <div className="footer-bottom">© 2026 CRPE.pl</div>
  </div>
</footer>



</div>;
}
