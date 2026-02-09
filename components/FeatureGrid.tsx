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
  },
];

export default function FeatureGrid() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">Co dostajesz w CRPE</h2>
            <p className="mt-2 text-slate-600">
              Minimum klików, maksimum porządku. Budujesz portfolio, które da się obronić w papierach.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>

                {f.title.includes("Audyt") ? (
                  <div className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                    wkrótce
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

