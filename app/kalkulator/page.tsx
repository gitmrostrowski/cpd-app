"use client";

import CalculatorClient from "./CalculatorClient";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function KalkulatorPage() {
  const { user, loading } = useAuth();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Kalkulator Punktów Edukacyjnych
        </h1>

        <p className="mt-2 text-slate-600">
          Policz punkty bez logowania. Wynik możesz zachować lokalnie na tym urządzeniu,
          a po zalogowaniu — zapisać w Portfolio i generować raporty/zaświadczenia.
        </p>

        {/* STATUS */}
        <div className="mt-4 rounded-xl border bg-white p-3 text-sm">
          {loading ? (
            <span className="text-slate-600">Status: sprawdzam sesję…</span>
          ) : user ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-700">
                Status: <span className="font-semibold text-emerald-700">✅ Zalogowany</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-700">
                {user.email}
              </span>
              <span className="text-slate-500">•</span>
              <Link href="/profil" className="text-blue-700 hover:underline">
                Ustawienia profilu
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-700">
                Status: <span className="font-semibold text-rose-700">❌ Niezalogowany</span>
              </span>
              <span className="text-slate-500">•</span>
              <Link href="/login" className="text-blue-700 hover:underline">
                Zaloguj się
              </Link>
              <span className="text-slate-500">
                (żeby zapisywać w Portfolio i generować raporty)
              </span>
            </div>
          )}
        </div>
      </div>

      <CalculatorClient />
    </div>
  );
}
