// components/Hero.tsx
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <>
      <section className="relative overflow-hidden">
        {/* jasna “tinta” niebieska, delikatna i zanikająca */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-white to-white" />
        <div className="pointer-events-none absolute -left-24 top-[-120px] h-[420px] w-[420px] rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-[40px] h-[380px] w-[380px] rounded-full bg-indigo-200/35 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pt-10 md:pt-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* LEWA: przekaz + CTA */}
            <div className="lg:col-span-7">
              {/* badge zamiast “cienkiego paska” */}
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                CRPE • dziennik aktywności i dokumentów
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
                Porządek w punktach
                <br />
                edukacyjnych.
                <br />
                <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Bez chaosu w certyfikatach.
                </span>
              </h1>

              <p className="mt-5 max-w-prose text-lg leading-relaxed text-slate-600">
                CRPE pomaga prowadzić dziennik aktywności, trzymać dowody w jednym miejscu i na
                bieżąco liczyć punkty w okresie rozliczeniowym. Prosto: wpis → dowód → status.
              </p>

              {/* CTA: kolory jak w kalkulatorze */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/portfolio"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Otwórz portfolio
                </Link>

                <Link
                  href="/activities"
                  className="inline-flex items-center justify-center rounded-2xl border border-blue-200/60 bg-white px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Dodaj aktywność
                </Link>

                <Link
                  href="/kalkulator"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Kalkulator (gość)
                </Link>
              </div>

              {/* 3 moduły: równe, uporządkowane */}
              <div className="mt-9 grid gap-4 sm:grid-cols-3">
                {[
                  { k: "Moduł 01", t: "Dziennik", d: "Dodawaj aktywności i porządkuj dane na bieżąco." },
                  { k: "Moduł 02", t: "Dowody", d: "Podpinaj certyfikaty PDF/zdjęcia do wpisów." },
                  { k: "Moduł 03", t: "Raporty", d: "Eksport i historia raportów — kolejny etap." },
                ].map((x) => (
                  <div
                    key={x.t}
                    className="h-full rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm"
                  >
                    <div className="text-xs text-slate-500">{x.k}</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">{x.t}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-600">{x.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRAWA: “Wizualny skrót” + karta postępu + ilustracja */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-[520px]">
                <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="text-sm font-semibold text-slate-900">Wizualny skrót</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Wpis → dowód → status w okresie. To wszystko.
                  </div>

                  {/* ✅ KARTA POSTĘPU NAD OBRAZKIEM */}
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Okres</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">—</div>

                    <div className="mt-3 h-2 w-full rounded-full bg-white">
                      <div className="h-2 w-[0%] rounded-full bg-blue-600" />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                      <span>
                        Masz: <span className="font-semibold text-slate-900">—</span> pkt
                      </span>
                      <span>
                        Brakuje: <span className="font-semibold text-slate-900">—</span>
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      Zaloguj się, aby zobaczyć swój realny status.
                    </div>
                  </div>

                  <div className="mt-4 relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <Image
                      src="/illustration.svg"
                      alt="Ilustracja CRPE"
                      fill
                      className="object-contain p-4"
                      priority
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs text-slate-500">Wkrótce</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Webinary / baza szkoleń</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Możliwość dodania modułu z ofertami i zapisami.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sekcja “jak to działa” pod hero */}
          <div className="mt-12 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { t: "1) Dodaj aktywność", d: "Wpis + punkty + rok + (opcjonalnie) organizator." },
                { t: "2) Podepnij dowód", d: "PDF/zdjęcie certyfikatu przypięte do wpisu." },
                { t: "3) Masz status", d: "Portfolio liczy punkty w okresie i pokazuje braki do celu." },
              ].map((x) => (
                <div key={x.t} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-base font-semibold text-slate-900">{x.t}</div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-600">{x.d}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5">
              <div>
                <div className="text-sm font-semibold text-slate-900">Wejdź dalej</div>
                <div className="mt-1 text-sm text-slate-600">
                  Jeśli chcesz tylko policzyć punkty — zacznij od kalkulatora. Jeśli chcesz porządek w dokumentach — portfolio.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/kalkulator"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Kalkulator
                </Link>
                <Link
                  href="/portfolio"
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Portfolio
                </Link>
              </div>
            </div>
          </div>

          {/* ✅ PRZYWRÓCONY MODUŁ: „Jak to działa w praktyce” + preview widoku */}
          <div className="mt-12 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <h2 className="text-2xl font-extrabold text-slate-900">Jak to działa w praktyce</h2>
                <p className="mt-2 text-slate-600">
                  Nie musisz od razu wszystkiego uzupełniać. Na start liczy się: wpis, punkty, rok.
                </p>

                <ol className="mt-6 space-y-3">
                  {[
                    { t: "Dodaj aktywność", d: "Kurs / konferencja / webinar — wpis w 20–30 sekund." },
                    { t: "Podepnij dowód", d: "PDF lub zdjęcie certyfikatu do aktywności." },
                    { t: "Zobacz status", d: "Portfolio liczy punkty w Twoim okresie i pokazuje braki." },
                  ].map((x, i) => (
                    <li key={x.t} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{x.t}</div>
                        <div className="text-sm text-slate-600">{x.d}</div>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Zacznij teraz
                  </Link>
                  <Link
                    href="/kalkulator"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50/50"
                  >
                    Zobacz kalkulator
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Podgląd widoku</div>
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
                        <div className="h-2 w-[55%] rounded-full bg-blue-600" />
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
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Dodaj aktywność
                      </Link>
                      <Link
                        href="/portfolio"
                        className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50/50"
                      >
                        Otwórz portfolio
                      </Link>
                    </div>

                    <div className="mt-4 text-xs text-slate-500">
                      To jest podgląd UI. Realne dane zobaczysz po zalogowaniu.
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
    </>
  );
}
