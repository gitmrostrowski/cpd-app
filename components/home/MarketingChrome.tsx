import Link from "next/link";

/*
 * Wspólna nawigacja i stopka stron marketingowych (Home i strony ról).
 * Na Home kotwice prowadzą w obrębie strony, na pozostałych do sekcji Home.
 */

export const MARKETING_PATHS = ["/", "/dla-medyka", "/dla-placowki", "/dla-organizatora", "/narzedzia", "/bezpieczenstwo", "/kontakt"];

function Logo() {
  return <span className="mark"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7.5 3.2v5.4c0 4.7-3.2 8-7.5 9.4-4.3-1.4-7.5-4.7-7.5-9.4V6.2z" /><path d="M9 12.2l2.1 2.1L15.2 10" /></svg></span>;
}

export function MarketingNav({ onHome = false }: { onHome?: boolean }) {
  const a = (hash: string) => (onHome ? hash : `/${hash}`);
  const links = <>
    <Link href={a("#jak-to-dziala")}>Jak to działa</Link>
    <Link href={a("#narzedzia")}>Narzędzia</Link>
    <Link href="/baza-szkolen">Baza szkoleń</Link>
    <Link href={a("#faq")}>Pytania</Link>
    <Link href="/dla-placowki" className="nav-org">Dla placówek</Link>
  </>;
  return <>
<header className="site-header">
  <div className="wrap header-inner">
    <Link href="/" className="logo"><Logo />CRPE</Link>
    <nav aria-label="Nawigacja główna" className="main-nav" id="mainNav">{links}</nav>
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
  {links}
  <Link href="/pomoc">Centrum pomocy</Link>
  <div className="drawer-cta">
    <Link href="/login" className="btn btn-ghost">Zaloguj się</Link>
    <Link href="/rejestracja" className="btn btn-primary">Załóż konto</Link>
  </div>
</nav>
  </>;
}

export function MarketingFooter() {
  return <footer className="site-footer">
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
</footer>;
}
