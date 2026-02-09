import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Nie znaleziono strony</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ten adres nie istnieje albo strona została przeniesiona.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Home
          </Link>
          <Link
            href="/kalkulator"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Kalkulator
          </Link>
          <Link
            href="/portfolio"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Portfolio
          </Link>
          <Link
            href="/profil"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Profil
          </Link>
        </div>
      </div>
    </div>
  );
}

