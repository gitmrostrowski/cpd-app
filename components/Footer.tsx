import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-[1160px] gap-6 px-4 py-9 text-sm sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
        <div>
          <p className="font-black text-slate-900">CRPE.pl</p>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-slate-600 sm:text-sm">
            Narzędzie do własnej ewidencji aktywności, punktów i dokumentów. CRPE nie jest państwowym rejestrem ani oficjalnym systemem rozliczeniowym.
          </p>
          <p className="mt-3 text-[12px] text-slate-500">© {new Date().getFullYear()} CRPE.pl</p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-[13px] font-bold text-slate-700 sm:text-sm">
          <Link className="hover:text-blue-700" href="mailto:kontakt@crpe.pl">Kontakt</Link>
          <Link className="hover:text-blue-700" href="/regulamin">Regulamin</Link>
          <Link className="hover:text-blue-700" href="/polityka-prywatnosci">Polityka prywatności</Link>
        </nav>
      </div>
    </footer>
  );
}
