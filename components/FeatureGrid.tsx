const FEATURES = [
  {
    title: "Zapisuj aktywności",
    desc: "Webinary, konferencje, kursy — wszystko w jednym miejscu.",
    icon: "📝"
  },
  {
    title: "Automatyczne punkty",
    desc: "System sam zlicza CPD/EDU w zadanych okresach.",
    icon: "✨"
  },
  {
    title: "Raporty PDF",
    desc: "Generuj gotowe zestawienia do audytu lub rejestracji.",
    icon: "📄"
  },
  {
    title: "Dostęp mobilny",
    desc: "Działa świetnie na telefonie i tablecie.",
    icon: "📱"
  }
];

export default function FeatureGrid() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Dlaczego to działa?</h2>
        <p className="mt-2 text-center text-slate-600">
          Minimalny wysiłek, maksymalny porządek w dokumentacji CPD.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
