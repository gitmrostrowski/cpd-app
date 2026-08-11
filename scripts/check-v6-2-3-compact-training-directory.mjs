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
      client.includes("sm:grid-cols-[64px_minmax(0,1fr)_216px]") &&
      client.includes('w-[64px] shrink-0') &&
      client.includes("sm:border-l sm:border-t-0 sm:pl-4") &&
      client.includes("text-[15px] font-bold"),
  ],
  [
    "Hierarchia ogranicza tagi i odróżnia brak weryfikacji od wszystkich medyków",
    !client.slice(client.indexOf("displayedItems.map"), client.indexOf("visibleCount < visibleItems.length")).includes("topics.map") &&
      client.includes("trainingMetaLine") &&
      client.includes('"Adresaci do weryfikacji"') &&
      client.includes('"Wszyscy medycy"') &&
      client.includes('if (pricePln === 0) return "Bezpłatne"'),
  ],
  [
    "Szczegóły otwiera dostępny tytuł, a plan pozostaje główną akcją",
    client.includes("Pokaż szczegóły szkolenia") &&
      client.includes("href={trainingPath(t)}") &&
      client.includes("Przejdź do zapisów") &&
      client.includes("Dodaj do planu"),
  ],
  [
    "Mobilne akcje zachowują wygodną wysokość dotykową",
    client.includes('className="flex h-10 w-full') &&
      client.includes("focus-visible:outline"),
  ],
  [
    "Panel boczny pozostaje widoczny podczas przewijania desktopu",
    client.includes('className="order-first space-y-4 lg:order-none lg:sticky lg:top-24 lg:self-start"'),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
