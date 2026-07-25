import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-12 text-sm sm:py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
        <div>
          <p className="font-black text-slate-900">CRPE.pl</p>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-600">
            Narzędzie do własnej ewidencji aktywności, punktów i dokumentów. CRPE nie jest państwowym rejestrem ani oficjalnym systemem rozliczeniowym.
          </p>
          <p className="mt-4 text-[13px] text-slate-500">© {new Date().getFullYear()} CRPE.pl</p>
        </div>

        <div className="grid gap-7 sm:grid-cols-3 lg:text-right">
          <nav className="grid content-start gap-2.5 text-[14px] font-bold text-slate-700">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Dla kogo</p>
            <Link className="hover:text-blue-700" href="/dla-medyka">Dla medyka</Link>
            <Link className="hover:text-blue-700" href="/dla-placowki">Dla placówki</Link>
            <Link className="hover:text-blue-700" href="/dla-organizatora">Dla organizatora</Link>
          </nav>
          <nav className="grid content-start gap-2.5 text-[14px] font-bold text-slate-700">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Serwis</p>
            <Link className="hover:text-blue-700" href="/narzedzia">Narzędzia</Link>
            <Link className="hover:text-blue-700" href="/bezpieczenstwo">Bezpieczeństwo</Link>
            <Link className="hover:text-blue-700" href="/pomoc">Centrum pomocy</Link>
            <Link className="hover:text-blue-700" href="/kontakt">Kontakt</Link>
          </nav>
          <nav className="grid content-start gap-2.5 text-[14px] font-bold text-slate-700">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Dokumenty</p>
            <Link className="hover:text-blue-700" href="/regulamin">Regulamin</Link>
            <Link className="hover:text-blue-700" href="/polityka-prywatnosci">Polityka prywatności</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
