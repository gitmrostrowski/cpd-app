// app/kalkulator/page.tsx
import CalculatorClient from "./CalculatorClient";

export default function KalkulatorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Panel CPD
        </h1>
        <p className="mt-2 text-slate-600">
          Podgląd postępu w okresie rozliczeniowym. Dodawanie, edycja i certyfikaty są w{" "}
          <span className="font-semibold text-slate-900">Aktywnościach</span>.
        </p>
      </div>

      <CalculatorClient />
    </div>
  );
}
