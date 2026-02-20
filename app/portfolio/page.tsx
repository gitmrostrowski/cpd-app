"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortfolioPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/kalkulator");
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="rounded-2xl border bg-white p-6 text-slate-700">
        Przenoszę do Kalkulatora…
      </div>
    </div>
  );
}
