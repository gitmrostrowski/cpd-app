import Link from "next/link";

export default function RaportyPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Raporty</h1>
          <p className="mt-1 text-sm text-slate-600">
            Generowanie PDF/CSV i historia raportów – moduł jest w przygotowaniu.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          Wkrótce
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Co tu będzie?</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>Eksport aktywności do CSV</li>
          <li>Raport PDF gotowy do rozliczeń</li>
          <li>Historia wygenerowanych raportów</li>
          <li>Możliwość dodawania certyfikatów jako załączników</li>
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/portfolio"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Przejdź do Portfolio
          </Link>
          <Link
            href="/kalkulator"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Kalkulator
          </Link>
          <Link
            href="/activities"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Aktywności
          </Link>
        </div>
      </div>
    </div>
  );
}

