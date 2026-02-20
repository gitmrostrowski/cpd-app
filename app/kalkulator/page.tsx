// app/kalkulator/page.tsx
"use client";

import CalculatorClient from "./CalculatorClient";

export default function KalkulatorPage() {
  return (
    <div className="relative">
      {/* tło jak na Home: delikatny niebieski gradient, zanika w dół */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-blue-50 via-sky-50/60 to-transparent"
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-8">
        {/* nagłówek strony (opcjonalnie możesz zostawić, bo CalculatorClient też ma swój header) */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Panel CPD</h1>
          <p className="mt-2 text-slate-600">
            Podgląd postępu w okresie rozliczeniowym. Dodawanie, edycja i certyfikaty są w{" "}
            <span className="font-medium text-slate-900">Aktywnościach</span>.
          </p>
        </div>

        <CalculatorClient />
      </div>
    </div>
  );
}
