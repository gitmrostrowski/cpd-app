import Image from "next/image";
import Link from "next/link";

const linkClass = "text-white/80 transition hover:text-white";
const headClass = "text-[13px] font-bold text-crpe-punkt";

export default function Footer() {
  return (
    <footer data-crpe-chrome="true" className="relative overflow-hidden bg-crpe-navy text-white">
      <div className="crpe-dot-grid pointer-events-none absolute inset-0 text-white opacity-[0.04]" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-8 pt-14 text-sm sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
                <Image src="/logo.svg" alt="" width={26} height={26} />
              </span>
              <p className="font-display text-[20px] font-bold">
                CRPE<span className="text-crpe-punkt">.</span>pl
              </p>
            </div>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-white/65">
              Narzędzie do własnej ewidencji aktywności, punktów i dokumentów. CRPE nie jest państwowym rejestrem ani oficjalnym systemem rozliczeniowym.
            </p>
          </div>

          <div className="grid gap-8 text-[15px] font-medium sm:grid-cols-3">
            <nav className="grid content-start gap-3" aria-label="Dla kogo">
              <p className={headClass}>Dla kogo</p>
              <Link className={linkClass} href="/dla-medyka">Dla medyka</Link>
              <Link className={linkClass} href="/dla-placowki">Dla placówki</Link>
              <Link className={linkClass} href="/dla-organizatora">Dla organizatora</Link>
            </nav>
            <nav className="grid content-start gap-3" aria-label="Serwis">
              <p className={headClass}>Serwis</p>
              <Link className={linkClass} href="/narzedzia">Narzędzia</Link>
              <Link className={linkClass} href="/bezpieczenstwo">Bezpieczeństwo</Link>
              <Link className={linkClass} href="/pomoc">Centrum pomocy</Link>
              <Link className={linkClass} href="/kontakt">Kontakt</Link>
            </nav>
            <nav className="grid content-start gap-3" aria-label="Dokumenty">
              <p className={headClass}>Dokumenty</p>
              <Link className={linkClass} href="/regulamin">Regulamin</Link>
              <Link className={linkClass} href="/polityka-prywatnosci">Polityka prywatności</Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-[13px] text-white/50">© {new Date().getFullYear()} CRPE.pl</p>
        </div>
      </div>
    </footer>
  );
}
