import CalculatorClient from "./CalculatorClient";

export default function KalkulatorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Kalkulator Punktów Edukacyjnych
        </h1>
        <p className="mt-2 text-slate-600">
          Szybko policz, ile punktów już masz i ile brakuje do końca okresu rozliczeniowego —
          bez logowania.
        </p>
      </div>

      <CalculatorClient />
    </div>
  );
}

