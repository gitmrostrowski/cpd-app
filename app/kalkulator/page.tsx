// app/kalkulator/page.tsx
"use client";

import CalculatorClient from "./CalculatorClient";

export default function KalkulatorPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#eaf1f8]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <CalculatorClient />
      </div>
    </div>
  );
}
