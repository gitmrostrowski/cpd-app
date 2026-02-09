const FEATURES = [
  {
    title: "Szybkie wpisy",
    desc: "Dodajesz aktywność w 20–30 sekund. Bez zbędnych pól na start.",
    icon: "⚡",
  },
  {
    title: "Dowody w jednym miejscu",
    desc: "Certyfikat przypięty do aktywności — łatwo go znaleźć przed audytem.",
    icon: "📎",
  },
  {
    title: "Status w okresie",
    desc: "Portfolio liczy punkty w Twoim okresie i pokazuje braki do celu.",
    icon: "📊",
  },
  {
    title: "Audyt jakości danych",
    desc: "Wkrótce: braki organizatora, brak certyfikatu, duplikaty i checklisty.",
    icon: "✅",
    soon: true,
  },
];

export default function FeatureGrid() {
  return (
    <section className="relative py-16">
      {/* spójny tint pod Hero (bez kopiowania layoutu CPDme) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/[0.03] via-white to-white" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
              Funkcje w CRPE
            </div>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Co dostajesz w CRPE
            </h2>
            <p className="mt-3 text-slate-600">
              Minimum klików, maksimum porządku. Budujesz portfolio, które da się obronić w papierach.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* icon badge */}
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl">
                  {f.icon}
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {f.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {f.desc}
                </p>

                {/* wypełniacz żeby karty były równe */}
                <div className="mt-auto pt-4">
                  {f.soon ? (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                      Wkrótce
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Gotowe
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* mały “pas” na dole dla porządku wizualnego */}
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Pro tip:</span>{" "}
            uzupełniaj aktywności na bieżąco — wtedy raport i audyt to formalność.
          </div>
        </div>
      </div>
    </section>
  );
}
