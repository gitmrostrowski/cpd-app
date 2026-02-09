const PILLARS = [
  {
    title: "Dziennik aktywności",
    badge: "core",
    desc: "Dodajesz kursy, konferencje i samokształcenie w kilka sekund. Zawsze w tym samym formacie.",
    bullets: ["Szybkie dodawanie", "Porządek w danych", "Filtrowanie po roku i typie"],
    icon: "📚",
  },
  {
    title: "Dowody i załączniki",
    badge: "core",
    desc: "Podepnij certyfikat do wpisu, żeby nie szukać go po mailach i dysku. Jeden wpis = jeden dowód.",
    bullets: ["PDF / JPG / PNG / WEBP", "Link do podglądu", "Bezpieczne uprawnienia (RLS)"],
    icon: "📎",
  },
  {
    title: "Okres i cel z profilu",
    badge: "core",
    desc: "Portfolio liczy punkty tylko w Twoim okresie rozliczeniowym. Cel punktowy ustawiasz raz i masz spokój.",
    bullets: ["Okres 2023–2026 lub własny", "Postęp i brakujące punkty", "Spójne ustawienia w całej aplikacji"],
    icon: "🧭",
  },
  {
    title: "Raporty i audyt wpisów",
    badge: "wkrótce",
    desc: "W kolejnym kroku dodamy eksport i kontrolę kompletności: brak organizatora, brak certyfikatu, duplikaty.",
    bullets: ["Eksport CSV/PDF", "Historia raportów", "Checklisty jakości danych"],
    icon: "🧾",
  },
];

function badgeClass(badge: string) {
  if (badge === "wkrótce") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function FeatureGrid() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">Jak CRPE pomaga w praktyce</h2>
          <p className="mt-2 text-slate-600">
            Zamiast „kolejnego narzędzia” — prosta rutyna: wpis → dowód → status w okresie.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="text-3xl">{p.icon}</div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                    p.badge
                  )}`}
                >
                  {p.badge === "wkrótce" ? "wkrótce" : "core"}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-slate-600">{p.desc}</p>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs">
                      ✓
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Minimalny próg wejścia</div>
              <div className="mt-1 text-sm text-slate-600">
                Możesz zacząć od kalkulatora (gość), a potem przenieść wpisy do portfolio.
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Bez „przepisów z góry”</div>
              <div className="mt-1 text-sm text-slate-600">
                Okres i cel ustawiasz w profilu. System dopasowuje liczenie do Twoich parametrów.
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Czytelny workflow</div>
              <div className="mt-1 text-sm text-slate-600">
                Wszystko kręci się wokół wpisów i dowodów — to ułatwia przygotowanie raportu.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
