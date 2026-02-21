// app/kalkulator/page.tsx
"use client";

import CalculatorClient from "./CalculatorClient";

export default function KalkulatorPage() {
  return (
    <div className="relative">
      {/* TŁO jak na Home */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-white" />
        {/* delikatny „medyczny” gradient + plamy światła */}
        <div className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_20%_10%,rgba(37,99,235,0.10),transparent_60%),radial-gradient(55rem_30rem_at_85%_15%,rgba(14,165,233,0.08),transparent_55%),radial-gradient(40rem_25rem_at_50%_95%,rgba(99,102,241,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/70 via-white to-white" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Panel CPD
          </h1>
          <p className="mt-2 text-slate-600">
            Podgląd postępu w okresie rozliczeniowym. Dodawanie, edycja i certyfikaty są w{" "}
            <span className="font-semibold text-slate-800">Aktywnościach</span>.
          </p>
        </div>

        <CalculatorClient />
      </div>
    </div>
  );
}
