// app/raporty/RaportsClient.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function RaportsClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-4 text-sm">Ładuję…</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Raporty</h1>
          <p className="mt-1 text-sm text-slate-600">
            Wybierz rodzaj raportu, który chcesz przygotować.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/aktywnosci"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Aktywności
          </Link>
          <Link
            href="/kalkulator"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Kalkulator
          </Link>
        </div>
      </div>

      {!user && (
        <div className="mt-5 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Zaloguj się, aby generować raporty
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Możesz przeglądać dostępne opcje raportów, ale ich generowanie
            wymaga zalogowania.
          </p>

          <div className="mt-4 flex gap-2">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* USER REPORT */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">Raport użytkownika</h2>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border">
              Indywidualny
            </span>
          </div>

          <div className="mt-4 text-sm text-slate-600 space-y-1">
            <div>• podsumowanie punktów</div>
            <div>• lista aktywności</div>
            <div>• kontrola załączników</div>
            <div>• eksport PDF / ZIP</div>
          </div>

          <div className="mt-4">
            <Link
              href="/raporty/uzytkownik"
              className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Otwórz raport
            </Link>
          </div>
        </section>

        {/* ORG REPORT */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">Raport organizacji</h2>
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border">
              W budowie
            </span>
          </div>

          <div className="mt-4 text-sm text-slate-600 space-y-3">
            <p>
              Organizacje działające w środowiskach regulowanych, szczególnie w
              sektorze medycznym, nie posiadają narzędzi do monitorowania
              kompetencji pracowników.
            </p>

            <p>
              Brak wglądu w spełnianie wymogów edukacyjnych utrudnia zarządzanie
              i zwiększa ryzyko operacyjne.
            </p>

            <p>
              Chcemy pomóc organizacjom zarządzać kadrą wymagającą ustawicznego
              kształcenia.
            </p>
          </div>

          <div className="mt-4">
            <Link
              href="/raporty/organizacja"
              className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            >
              Zobacz widok
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
