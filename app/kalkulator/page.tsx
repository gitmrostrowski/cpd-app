// app/kalkulator/page.tsx
"use client";

import CalculatorClient from "./CalculatorClient";

export default function KalkulatorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Kalkulator Punktów Edukacyjnych
        </h1>

        <p className="mt-2 text-slate-600">
          Policz punkty bez logowania. Wynik możesz zachować lokalnie na tym urządzeniu,
          a po zalogowaniu — zapisać w Portfolio i generować raporty/zaświadczenia.
        </p>
      </div>

      <CalculatorClient />
    </div>
  );
}
