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
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Aktywności
          </Link>
          <Link
            href="/kalkulator"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Kalkulator
          </Link>
        </div>
      </div>

      {!user ? (
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
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Raport użytkownika
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Zestawienie aktywności, punktów i załączników dla jednej osoby.
              </p>
            </div>

            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] text-blue-700">
              Indywidualny
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• podsumowanie punktów w wybranym okresie</li>
              <li>• lista aktywności do raportu</li>
              <li>• kontrola załączników i certyfikatów</li>
              <li>• eksport PDF i ZIP</li>
            </ul>
          </div>

          <div className="mt-4">
            <Link
              href="/raporty/uzytkownik"
              className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Otwórz raport
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Raport organizacji
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Zbiorcze raporty dla wielu użytkowników, zespołu lub organizacji.
              </p>
            </div>

            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
              W budowie
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              W budowie...
            </div>

            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
              <p>
                Organizacje działające w środowiskach regulowanych, szczególnie
                w sektorze medycznym, nie posiadają narzędzi umożliwiających
                bieżące monitorowanie kompetencji pracowników i zgodności z
                obowiązkowymi wymaganiami edukacyjnymi.
              </p>

              <p>
                Pracodawcy nie mają wglądu w czasie rzeczywistym w to, czy ich
                personel spełnia wymagane standardy edukacyjne. Utrudnia to
                zarządzanie zespołami, wczesne reagowanie i zwiększa ryzyko
                operacyjne.
              </p>

              <p>
                Chcemy pomóc organizacjom, które zatrudniają kadrę w zawodach
                wymagających ustawicznego kształcenia.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Link
              href="/raporty/organizacja"
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Zobacz widok
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
