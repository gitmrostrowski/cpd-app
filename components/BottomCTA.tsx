"use client";
import Link from "next/link";

export default function BottomCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/60 md:px-12 md:py-12">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-indigo-100/30 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Gotowy, by zacząć?
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Załóż konto i zacznij porządkować punkty oraz certyfikaty.
            </h3>
            <p className="mt-2 text-base text-slate-600">
              Podstawowe funkcje są darmowe. Wpisz aktywność, podepnij certyfikat i miej jasny status w okresie.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Zaloguj / Załóż konto
            </Link>
            <Link
              href="/kalkulator"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Zobacz demo (Kalkulator)
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
