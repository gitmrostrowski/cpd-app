// app/panel-cpd/page.tsx
"use client";

import CalculatorClient from "./CalculatorClient";

export default function PanelCpdPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-crpe-surface">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <CalculatorClient />
      </div>
    </div>
  );
}
