import Link from "next/link";

export default function Hero() {
  return (
    <>
      <section className="relative overflow-hidden">
        {/* tło sekcji – lekka tinta + zanikanie */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-white to-white" />
        <div className="pointer-events-none absolute left-[-10%] top-[-25%] h-[34rem] w-[34rem] rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute right-[-10%] top-[5%] h-[28rem] w-[28rem] rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pt-10 md:pt-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
            {/* LEWA */}
            <div className="lg:col-span-7">
              {/* zamiast „cienkiej pigułki” – bardziej czytelny badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs text-slate-600 shadow-sm ring-1 ring-slate-200">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-600/10 text-sky-700">
                  •
                </span>
                <span className="font-medium">CRPE</span>
                <span className="text-slate-400">—</span>
                <span>dziennik aktywności i dokumentów</span>
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

              {/* CTA – wyrównane do szerokości „modułów” */}
              <div className="mt-7 grid max-w-[560px] grid-cols-3 gap-3">
                <Link
                  href="/portfolio"
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                >
                  Otwórz portfolio
                </Link>

                <Link
                  href="/activities"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-slate-50"
                >
                  Dodaj aktywność
                </Link>

                <Link
                  href="/kalkulator"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-slate-50"
                >
                  Kalkulator (gość)
                </Link>
              </div>

              {/* 3 kafelki – równe wysokości */}
              <div className="mt-4 grid max-w-[560px] gap-4 sm:grid-cols-3">
                {[
                  { k: "Moduł 01", t: "Dziennik", d: "Dodawaj aktywności i porządkuj dane na bieżąco." },
                  { k: "Moduł 02", t: "Dowody", d: "Podpinaj certyfikaty PDF/zdjęcia do wpisów." },
                  { k: "Moduł 03", t: "Raporty", d: "Eksport i historia raportów — kolejny etap." },
                ].map((x) => (
                  <div key={x.t} className="h-full rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm">
                    <div className="text-xs text-slate-500">{x.k}</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">{x.t}</div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRAWA – preview */}
            <div className="lg:col-span-5">
              {/* WAŻNE: przesuwamy preview w dół, żeby startował na wysokości nagłówka */}
              <div className="lg:pt-[64px]">
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

                  {/* ciaśniej, żeby dół był bliżej „modułów” */}
                  <div className="p-4">
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

                    <div className="mt-3 space-y-3">
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

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Link
                        href="/activities"
                        className="rounded-2xl bg-sky-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-sky-700"
                      >
                        Dodaj aktywność
                      </Link>
                      <Link
                        href="/portfolio"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-sky-700 hover:bg-slate-50"
                      >
                        Otwórz portfolio
                      </Link>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      To podgląd UI. Realne dane zobaczysz po zalogowaniu.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* separator */}
          <div className="mt-12 h-px w-full bg-slate-200/70" />
        </div>
      </section>

      {/* Sekcja poniżej – jasnoszare tło + 3 kafle (czytelniej niż w hero) */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "Twoje dane", d: "Wpisy i pliki są powiązane z Twoim kontem. RLS pilnuje dostępu." },
              { t: "Prosty workflow", d: "Dodajesz aktywność → (opcjonalnie) certyfikat → portfolio liczy punkty." },
              { t: "Raporty (kolejny etap)", d: "CSV/PDF i audyt jakości wpisów — wdrożymy po MVP." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
