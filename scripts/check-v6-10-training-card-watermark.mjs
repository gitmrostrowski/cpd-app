import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const cardStart = client.indexOf("displayedItems.map");
const cardEnd = client.indexOf("visibleCount < visibleItems.length", cardStart);
const card = client.slice(cardStart, cardEnd);
const actionsStart = card.indexOf(
  'className="relative isolate col-span-2 mt-0.5 grid grid-cols-[minmax(188px,1fr)_84px]',
);
const actions = card.slice(actionsStart);

const externalIndex = actions.indexOf("Przejdź do zapisów");
const planIndex = actions.indexOf("Dodaj do planu");
const pointsIndex = actions.indexOf("pointsDetailsLabel(t.points_verification_status)");

const checks = [
  [
    "Prawa strefa jest poszerzona i dochodzi akcjami do krawędzi karty",
    card.includes("sm:grid-cols-[52px_minmax(0,1fr)_292px]") &&
      actions.includes("col-span-2 inline-flex") &&
      actions.includes("grid-cols-[minmax(188px,1fr)_84px]"),
  ],
  [
    "Logo organizatora jest nieinteraktywnym, rozjaśnionym tłem",
    actions.includes("absolute -right-3 top-1 z-0") &&
      actions.includes("watermark") &&
      client.includes("pointer-events-none") &&
      client.includes("opacity-[0.12]") &&
      client.includes("saturate-[0.75]"),
  ],
  [
    "Miękka plama koloru i brak pionowej linii przełamują tabelaryczny wygląd",
    actions.includes("rounded-full blur-2xl") &&
      actions.includes("tone.wash") &&
      !actions.includes("sm:border-l"),
  ],
  [
    "Przejście do zapisów jest pierwsze i zajmuje pełny górny rząd",
    externalIndex >= 0 &&
      externalIndex < planIndex &&
      actions.includes('className="relative z-10 col-span-2'),
  ],
  [
    "Plan ma biały plus, a czapeczka wyróżnia liczbę punktów",
    planIndex > externalIndex &&
      pointsIndex > planIndex &&
      actions.includes('<Plus className="h-4 w-4 shrink-0 text-white"') &&
      actions.includes('<GraduationCap className="h-[18px] w-[18px] shrink-0 text-blue-600"'),
  ],
  [
    "Pełne etykiety nie przełamują się także na wąskiej karcie",
    (actions.match(/whitespace-nowrap/g) ?? []).length >= 3 &&
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
