import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const cardStart = client.indexOf("displayedItems.map");
const cardEnd = client.indexOf("visibleCount < visibleItems.length", cardStart);
const card = client.slice(cardStart, cardEnd);
const actionsStart = card.indexOf(
  'className="relative col-span-2 mt-0.5 border-t',
);
const actions = card.slice(actionsStart);

const externalIndex = actions.indexOf("Przejdź do zapisów");
const planIndex = actions.indexOf("Dodaj do planu");
const pointsIndex = actions.indexOf("pointsDetailsLabel(t.points_verification_status)");

const checks = [
  [
    "Prawa strefa jest poszerzona i dochodzi akcjami do krawędzi karty",
    card.includes("sm:grid-cols-[52px_minmax(0,1fr)_312px]") &&
      actions.includes("grid grid-cols-2 gap-2.5") &&
      (actions.match(/h-10 min-w-0/g) ?? []).length >= 3,
  ],
  [
    "Logo organizatora jest nieinteraktywnym, czytelnym znakiem w pasie marki",
    actions.includes("sm:min-h-[66px]") &&
      card.includes("watermark") &&
      client.includes("pointer-events-none") &&
      client.includes("opacity-[0.52]") &&
      client.includes("saturate-[0.92]"),
  ],
  [
    "Miękka tinta i brak pionowej linii przełamują tabelaryczny wygląd",
    card.includes("w-[38%]") &&
      card.includes("radial-gradient") &&
      card.includes("linear-gradient") &&
      !actions.includes("sm:border-l"),
  ],
  [
    "Przejście do zapisów jest pierwsze w równej parze akcji",
    externalIndex >= 0 &&
      externalIndex < planIndex &&
      actions.includes("grid grid-cols-2 gap-2.5"),
  ],
  [
    "Plan ma biały plus, a czapeczka wyróżnia liczbę punktów",
    planIndex > externalIndex &&
    pointsIndex < externalIndex &&
      actions.includes('<Plus className="h-4 w-4 shrink-0 text-white"') &&
      actions.includes('<GraduationCap className="h-5 w-5 shrink-0" strokeWidth={2.1}'),
  ],
  [
    "Pełne etykiety nie przełamują się także na wąskiej karcie",
    (actions.match(/whitespace-nowrap/g) ?? []).length >= 4 &&
      actions.includes("Przejdź do zapisów") &&
      actions.includes("Dodaj do planu"),
  ],
  [
    "Zmiana pozostaje wyłącznie w warstwie prezentacji",
    !client.includes("supabase/migrations") &&
      actions.includes("chooseTraining(t)") &&
      actions.includes("t.url"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
