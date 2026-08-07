import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const checks = [
  [
    "Lista pokazuje początkowo 10 szkoleń i rozwija się partiami po 10",
    client.includes("const TRAININGS_PAGE_SIZE = 10") &&
      client.includes("visibleItems.slice(0, visibleCount)") &&
      client.includes("count + TRAININGS_PAGE_SIZE") &&
      client.includes("Pokaż kolejne"),
  ],
  [
    "Desktop ma zwarty układ data, treść i akcje",
    client.includes("sm:grid-cols-[52px_minmax(0,1fr)_188px]") &&
      client.includes('h-[58px] w-[52px]') &&
      client.includes("sm:min-h-[104px]") &&
      client.includes("space-y-2"),
  ],
  [
    "Hierarchia ogranicza tagi i odróżnia brak weryfikacji od wszystkich medyków",
    client.includes("t.topics.slice(0, 1)") &&
      client.includes('"Adresaci do weryfikacji"') &&
      client.includes('"Wszyscy medycy"') &&
      client.includes('if (pricePln === 0) return "Bezpłatne"'),
  ],
  [
    "Szczegóły otwiera dostępny tytuł, a zapis pozostaje główną akcją",
    client.includes("Pokaż szczegóły szkolenia") &&
      client.includes("setDetailsTraining(t)") &&
      client.includes("Przejdź do zapisów") &&
      !client.includes("Szczegóły <ChevronRight"),
  ],
  [
    "Mobilne akcje zachowują wysokość dotykową 44 px",
    client.includes('className="inline-flex h-11') &&
      client.includes("sm:h-9"),
  ],
  [
    "Panel boczny pozostaje widoczny podczas przewijania desktopu",
    client.includes('className="space-y-4 lg:sticky lg:top-24 lg:self-start"'),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
