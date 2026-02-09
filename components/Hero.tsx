import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Lekka, czysta tinata + zanikanie do bieli */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-sky-50 via-white to-white" />

      {/* delikatne “plamy” – dużo mniej nasycone */}
      <div className="pointer-events-none absolute -left-32 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-sky-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-10 -z-10 h-[26rem] w-[26rem] rounded-full bg-indigo-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 pt-10 md:pt-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* LEWA */}
          <div className="lg:col-span-7">
            {/* zamiast “cienkiego paska” robimy elegancki badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-sky-600" />
              <span className="font-medium">CRPE</span>
              <span className="text-slate-400">•</span>
              dziennik aktywności i dokumentów
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
              Porządek w punktach edukacyjnych.
              <br />
              <span className="bg-gradient-to-r from-sky-700 to-indigo-700 bg-clip-text text-transparent">
                Bez chaosu w certyfikatach.
              </span>
            </h1>

            <p className="mt-5 max-w-prose text-lg leading-relaxed text-slate-600">
              CRPE pomaga prowadzić dziennik aktywności, trzymać dowody w jednym miejscu i na bieżąco
              liczyć punkty w okresie rozliczeniowym. Jedna prosta rutyna: wpis → dowód → status.
            </p>

            {/* CTA + moduły w jednej “siatce”, żeby idealnie trzymały szerokość */}
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {/* przyciski – dokładnie szerokość modułów */}
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Otwórz portfolio
              </Link>

              <Link
                href="/activities"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Dodaj aktywność
              </Link>

              <Link
                href="/kalkulator"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Kalkulator (gość)
              </Link>

              {/* moduły – ta sama siatka, więc szerokości są 1:1 */}
              {[
                { k: "Moduł 01", t: "Dziennik", d: "Dodawaj aktywności i porządkuj dane na bieżąco." },
                { k: "Moduł 02", t: "Dowody", d: "Podpinaj certyfikaty PDF/zdjęcia do wpisów." },
                { k: "Moduł 03", t: "Raporty", d: "Eksport i historia raportów — kolejny etap." },
              ].map((x) => (
                <div
                  key={x.t}
                  className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur"
                >
                  <div className="text-xs text-slate-500">{x.k}</div>
                  <div className="mt-1 text-base font-semibold text-slate-900">{x.t}</div>
                  <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PRAWA – preview */}
          <div className="lg:col-span-5">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Podgląd aplikacji</div>
                  <div className="text-xs text-slate-500">Portfolio / status w okresie</div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  MVP
                </span>
              </div>

              <div className="p-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
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
                  {[
                    { t: "Konferencja / kongres", m: "Organizator: PT… • Rok: 2025", p: 20, cert: true },
                    { t: "Kurs online / webinar", m: "Organizator: OIL • Rok: 2024", p: 10, cert: false },
                  ].map((a) => (
                    <div key={a.t} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{a.t}</div>
                          <div className="mt-1 text-sm text-slate-600">{a.m}</div>
                          <div className="mt-2 text-xs text-slate-500">
                            {a.cert ? "📎 certyfikat podpięty" : "brak certyfikatu"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                          <span className="text-slate-600">pkt</span>{" "}
                          <span className="font-semibold text-slate-900">{a.p}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    href="/activities"
                    className="rounded-2xl bg-sky-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Dodaj aktywność
                  </Link>
                  <Link
                    href="/portfolio"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Otwórz portfolio
                  </Link>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  To podgląd UI. Realne dane zobaczysz po zalogowaniu.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* dolne kafle */}
        <div className="mt-10 rounded-[32px] border border-slate-200 bg-slate-50/60 p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "Twoje dane", d: "Wpisy i pliki są powiązane z Twoim kontem. RLS pilnuje dostępu." },
              { t: "Prosty workflow", d: "Dodajesz aktywność → (opcjonalnie) certyfikat → portfolio liczy punkty." },
              { t: "Raporty (kolejny etap)", d: "CSV/PDF i audyt jakości wpisów — wdrożymy po MVP." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
                <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 h-px w-full bg-slate-200/70" />
      </div>
    </section>
  );
}
