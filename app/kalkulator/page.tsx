// app/kalkulator/page.tsx
"use client";

import Link from "next/link";
import CalculatorClient from "./CalculatorClient";

export default function KalkulatorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Panel CPD
            </h1>

            <p className="mt-2 text-slate-600">
              Podgląd postępu w okresie rozliczeniowym. Dodawanie, edycja i certyfikaty są w{" "}
              <Link href="/aktywnosci" className="font-medium text-blue-700 hover:underline">
                Aktywnościach
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/aktywnosci?new=1"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Dodaj aktywność
            </Link>
            <Link
              href="/aktywnosci"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Zobacz aktywności
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <span className="font-semibold">Jak to działa:</span> Panel CPD pokazuje podsumowanie (DONE liczy się do punktów,
          PLANNED jest planem). Wpisy dodajesz i porządkujesz w Aktywnościach.
        </div>
      </div>

      <CalculatorClient />
    </div>
  );
}
