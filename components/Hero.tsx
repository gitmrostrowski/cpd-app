import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* NAVY TŁO + głębia */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-white" />
      <div className="pointer-events-none absolute left-[-20%] top-[-30%] h-[34rem] w-[34rem] rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-20%] top-[0%] h-[30rem] w-[30rem] rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-[420px] h-[220px] bg-gradient-to-b from-slate-950/0 to-white" />

      <div className="relative mx-auto max-w-6xl px-4 pt-10 md:pt-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* LEWA */}
          <div className="lg:col-span-7">
            {/* Badge zamiast “cienkiego paska” */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-white/80 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="font-medium">CRPE</span>
              <span className="text-white/50">•</span>
              <span>dziennik aktywności i dokumentów</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
              Porządek w punktach edukacyjnych.
              <br />
              <span className="bg-gradient-to-r from-sky-200 via-sky-100 to-indigo-200 bg-clip-text text-transparent">
                Bez chaosu w certyfikatach.
              </span>
            </h1>

            <p className="mt-6 max-w-prose text-lg leading-relaxed text-white/70">
              CRPE pomaga prowadzić dziennik aktywności, trzymać dowody w jednym miejscu i na bieżąco
              liczyć punkty w okresie rozliczeniowym. Jedna prosta rutyna: wpis → dowód → status.
            </p>

            {/* CTA + MODUŁY w jednym gridzie 3-kolumnowym:
                CTA ma dokładnie taką samą szerokość jak moduły (kolumny) */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {/* CTA ROW (1:1 nad modułami) */}
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                Otwórz portfolio
              </Link>

              <Link
                href="/activities"
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
              >
                Dodaj aktywność
              </Link>

              <Link
                href="/kalkulator"
                className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10"
              >
                Kalkulator (gość)
              </Link>

              {/* MODUŁY */}
              {[
                { k: "Moduł 01", t: "Dziennik", d: "Dodawaj aktywności i porządkuj dane na bieżąco." },
                { k: "Moduł 02", t: "Dowody", d: "Podpinaj certyfikaty PDF/zdjęcia do wpisów." },
                { k: "Moduł 03", t: "Raporty", d: "Eksport i historia raportów — kolejny etap." },
              ].map((x) => (
                <div
                  key={x.t}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur"
                >
                  <div className="text-xs text-white/55">{x.k}</div>
                  <div className="mt-1 text-base font-semibold text-white">{x.t}</div>
                  <div className="mt-1 text-sm leading-relaxed text-white/70">{x.d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PRAWA – preview: jasna karta, żeby była czytelna na granacie */}
          <div className="lg:col-span-5">
            <div className="rounded-[28px] border border-white/10 bg-white shadow-sm">
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

        {/* Dolne 3 kafle – już w jasnej strefie */}
        <div className="mt-10 rounded-[32px] border border-slate-200 bg-slate-50 p-5 md:p-6">
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

