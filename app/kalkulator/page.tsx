// app/kalkulator/page.tsx
"use client";

import CalculatorClient from "./CalculatorClient";

export default function KalkulatorPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[linear-gradient(180deg,#f5f9fd_0%,#edf4fa_48%,#f7fafc_100%)]">
      <div className="mx-auto w-full max-w-[1220px] px-4 pb-16 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <CalculatorClient />
      </div>
    </div>
  );
}
