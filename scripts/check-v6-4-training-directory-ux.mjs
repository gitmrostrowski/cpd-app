import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const checks = [
  [
    "Zgłoszenie szkolenia jest oddzielone od filtrowania",
    client.includes("Zgłoś szkolenie") &&
      client.indexOf("Zgłoś szkolenie") < client.indexOf("Znajdź szkolenie") &&
      !client.includes('href="/aktywnosci"') &&
      !client.includes('"Odśwież"'),
  ],
  [
    "Zaawansowane filtry są sterowane z nagłówka wyszukiwarki",
    client.includes('aria-controls="advanced-training-filters"') &&
      client.includes('id="advanced-training-filters"') &&
      client.includes("SlidersHorizontal"),
  ],
  [
    "Formularz ma czytelną końcową akcję i obsługuje Enter",
    client.includes("onSubmit={(event) =>") &&
      client.includes('type="submit"') &&
      client.includes("Pokaż wyniki") &&
      client.includes('aria-label="Wyczyść filtry"'),
  ],
  [
    "Podstawowe filtry mają techniczne etykiety i nazwy",
    [
      "training-search",
      "training-profession",
      "training-place",
      "training-time",
      "training-format",
      "training-points",
    ].every(
      (id) =>
        client.includes(`htmlFor="${id}"`) &&
        client.includes(`id="${id}"`) &&
        client.includes(`name="${id}"`),
    ),
  ],
  [
    "Liczba wyników i sortowanie znajdują się nad listą",
    client.includes("Wyniki wyszukiwania") &&
      client.includes("matchedTrainingCountLabel(visibleItems.length)") &&
      client.includes("SearchCheck") &&
      client.includes('id="training-sort"') &&
      client.includes("void load({ sortBy: nextSort })"),
  ],
  [
    "Karty mają szerszą kolumnę i dwie czytelne akcje",
    client.includes("sm:grid-cols-[52px_minmax(0,1fr)_220px]") &&
      client.includes("Przejdź do zapisów") &&
      client.includes("Dodaj do planu") &&
      client.includes("sm:h-9"),
  ],
  [
    "Tematy nie przeciążają listy i są dostępne w szczegółach",
    !client.includes("topicCountLabel(remainingTopics)") &&
      client.includes("detailsTraining.topics.map"),
  ],
  [
    "Panel boczny nie powtarza liczby wyników",
    !client.includes("sidebarStats") &&
      !client.includes(">Podsumowanie<") &&
      client.includes("Kalendarz szkoleń"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
