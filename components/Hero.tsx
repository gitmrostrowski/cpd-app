import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 md:pt-16">
      {/* tło: subtelne „światło” (inne niż CPDme) */}
      <div className="pointer-events-none absolute left-[-15%] top-[-25%] h-[32rem] w-[32rem] rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-30%] h-[36rem] w-[36rem] rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* LEWA */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              CRPE • dziennik aktywności i dokumentów
            </div>

            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Porządek w punktach edukacyjnych.
              <br />
              <span className="text-sky-700">Bez chaosu w certyfikatach.</span>
            </h1>

            <p className="mt-4 max-w-prose text-lg text-slate-600">
              CRPE pomaga prowadzić dziennik aktywności, trzymać dowody w jednym miejscu i na bieżąco
              liczyć punkty w okresie rozliczeniowym. Prosto, jasno i po Twojemu.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
              >
                Załóż konto / Zaloguj się
              </Link>

              <Link
                href="/kalkulator"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Sprawdź kalkulator
              </Link>

              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Podgląd portfolio
              </Link>
            </div>

            {/* mini-kafelki (Twoje, nie CPDme) */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Moduł 01</div>
                <div className="mt-1 font-semibold text-slate-900">Dziennik</div>
                <div className="mt-1 text-sm text-slate-600">
                  Dodawaj aktywności i porządkuj dane na bieżąco.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Moduł 02</div>
                <div className="mt-1 font-semibold text-slate-900">Dowody</div>
                <div className="mt-1 text-sm text-slate-600">
                  Podpinaj certyfikaty PDF/zdjęcia do wpisów.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Moduł 03</div>
                <div className="mt-1 font-semibold text-slate-900">Raporty</div>
                <div className="mt-1 text-sm text-slate-600">
                  Eksport i historia raportów — w kolejnych krokach.
                </div>
              </div>
            </div>
          </div>

          {/* PRAWA: „podgląd aplikacji” zamiast ilustracji */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Podgląd</div>
                  <div className="text-xs text-slate-500">Jak wygląda praca w CRPE</div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  MVP
                </span>
              </div>

              <div className="p-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">Okres: 2023–2026</div>
                    <div className="text-xs text-slate-500">postęp</div>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-white">
                    <div className="h-2 w-[55%] rounded-full bg-sky-600" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Masz: 110 pkt</span>
                    <span>Brakuje: 90 pkt</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">Konferencja / kongres</div>
                        <div className="mt-1 text-sm text-slate-600">Organizator: PT… • Rok: 2025</div>
                        <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                          📎 certyfikat
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-600">pkt</span>{" "}
                        <span className="font-semibold text-slate-900">20</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">Kurs online / webinar</div>
                        <div className="mt-1 text-sm text-slate-600">Organizator: OIL • Rok: 2024</div>
                        <div className="mt-2 text-xs text-slate-500">brak certyfikatu</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-600">pkt</span>{" "}
                        <span className="font-semibold text-slate-900">10</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    href="/activities"
                    className="rounded-2xl bg-sky-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-sky-700"
                  >
                    Dodaj aktywność
                  </Link>
                  <Link
                    href="/portfolio"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Otwórz portfolio
                  </Link>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  To tylko podgląd UI — dane pochodzą z Twojego konta po zalogowaniu.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* pasek dolny — ale inny: „mini FAQ / zaufanie”, bez CPDme-owego układu */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="font-semibold text-slate-900">Twoje dane</div>
            <div className="mt-1 text-sm text-slate-600">
              Wpisy i pliki są powiązane z Twoim kontem. Uprawnienia kontroluje RLS w bazie.
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="font-semibold text-slate-900">Prosty workflow</div>
            <div className="mt-1 text-sm text-slate-600">
              Dodajesz aktywność → opcjonalnie certyfikat → portfolio liczy punkty w okresie.
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="font-semibold text-slate-900">Raporty (kolejny etap)</div>
            <div className="mt-1 text-sm text-slate-600">
              CSV/PDF i historia — dodamy po dopracowaniu walidacji i audytu wpisów.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
