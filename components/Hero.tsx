// components/Hero.tsx
import Image from "next/image";
import Link from "next/link";

type HeroProps = {
  title?: string;
  subtitle?: string;
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  tertiaryCtaHref?: string;
  tertiaryCtaLabel?: string;
};

export default function Hero({
  title = "Porządek w punktach edukacyjnych.",
  subtitle = "Zapisuj aktywności, trzymaj dowody w jednym miejscu i miej szybki podgląd statusu w okresie rozliczeniowym.",
  primaryCtaHref = "/login",
  primaryCtaLabel = "Załóż konto / Zaloguj się",
  secondaryCtaHref = "/kalkulator",
  secondaryCtaLabel = "Sprawdź kalkulator",
  tertiaryCtaHref = "/portfolio",
  tertiaryCtaLabel = "Zobacz portfolio",
}: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* lekka tinata – nie za ciemna */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-white" />
      <div className="pointer-events-none absolute -left-24 top-[-120px] h-[420px] w-[420px] rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-[40px] h-[380px] w-[380px] rounded-full bg-indigo-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-10 md:pt-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          {/* LEWA */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              CRPE — dziennik aktywności i certyfikatów
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
              {title}
              <br />
              <span className="text-blue-700">Bez chaosu w certyfikatach.</span>
            </h1>

            <p className="mt-5 max-w-prose text-lg leading-relaxed text-slate-600">
              {subtitle}
            </p>

            {/* CTA — spójne z kalkulatorem (blue-600) */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                {primaryCtaLabel}
              </Link>

              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
              >
                {secondaryCtaLabel}
              </Link>

              <Link
                href={tertiaryCtaHref}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
              >
                {tertiaryCtaLabel}
              </Link>
            </div>
          </div>

          {/* PRAWA — ilustracja, nie zasłaniamy */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-[520px]">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-b from-blue-100/50 to-white blur-2xl" />
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <Image
                  src="/illustration.svg"
                  alt="Ilustracja CRPE"
                  fill
                  className="object-contain p-5"
                  priority
                />
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 shadow-sm backdrop-blur">
                <div className="font-semibold text-slate-900">Wkrótce</div>
                <div className="mt-1 text-slate-600">
                  Moduł webinarów/szkoleń, raporty CSV/PDF i audyt jakości wpisów.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* separator (opcjonalnie) */}
        <div className="mt-12 h-px w-full bg-slate-200/70" />
      </div>
    </section>
  );
}

