// app/raporty/organizacja/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Raport organizacji | CRPE",
};

export default function RaportOrganizacjiPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Raport organizacji
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Widok dla organizacji i zespołów pracujących w środowiskach
            regulowanych.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/raporty"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Wróć do raportów
          </Link>
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

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                W budowie...
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Przygotowujemy moduł raportowy dla organizacji.
              </p>
            </div>

            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
              W budowie
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
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

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/raporty"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Wróć do wyboru raportu
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Zaloguj się
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Docelowo w tym module
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Planowany zakres raportu organizacyjnego.
          </p>

          <div className="mt-4 space-y-3">
            {[
              "Zbiorczy widok pracowników i statusów edukacyjnych",
              "Filtrowanie po zawodzie, okresie, jednostce i kompletności",
              "Szybki podgląd braków punktowych i dokumentowych",
              "Raporty PDF i eksport zestawień dla organizacji",
              "Wczesne wychwytywanie ryzyk zgodności",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              Założenie dostępu
            </div>
            <p className="mt-1 text-sm text-slate-700">
              Ten widok powinien być dostępny na podstawie uprawnień, a nie
              samej profesji użytkownika.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
