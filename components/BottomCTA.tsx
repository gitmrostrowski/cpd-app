// components/BottomCTA.tsx
"use client";

import Link from "next/link";

export default function BottomCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 md:p-10 shadow-md">
        {/* subtelne plamy – spójne z hero */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/60 px-3 py-1.5 text-xs font-medium text-blue-800">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Gotowy, by zacząć?
            </div>

            <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Załóż konto i zacznij porządkować punkty oraz certyfikaty.
            </h3>

            <p className="mt-2 max-w-prose text-slate-600">
              Podstawowe funkcje są darmowe. Wpisz aktywność, podepnij certyfikat i miej jasny status w okresie.
            </p>
          </div>

          <div className="lg:col-span-5 lg:flex lg:justify-end">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Zaloguj / Załóż konto
              </Link>

              <Link
                href="/kalkulator"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
              >
                Zobacz demo (Kalkulator)
              </Link>
            </div>
          </div>
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} CRPE.pl</span>

          <div className="flex items-center gap-4">
            <Link href="/regulamin" className="hover:text-slate-700">
              Regulamin
            </Link>
            <Link href="/polityka-prywatnosci" className="hover:text-slate-700">
              Polityka prywatności
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
