"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BottomCTA() {
  return (
    <section className="mx-auto max-w-[1120px] px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[28px] border border-[#d7e3ee] bg-white px-7 py-9 shadow-[0_20px_55px_rgba(15,45,75,0.08)] md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/55 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Gotowy, by zacząć?
            </div>
            <h3 className="text-[26px] font-black leading-tight tracking-[-0.025em] text-slate-950 md:text-[32px]">
              Załóż konto i zacznij porządkować punkty oraz certyfikaty.
            </h3>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-slate-600">
              Podstawowe funkcje są darmowe. Wpisz aktywność, podepnij certyfikat i miej jasny status w okresie.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
            >
              Załóż konto <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/kalkulator"
              className="text-sm font-extrabold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-blue-700"
            >
              Zobacz demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
