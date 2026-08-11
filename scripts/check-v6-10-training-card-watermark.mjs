import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const cardStart = client.indexOf("displayedItems.map");
const cardEnd = client.indexOf("visibleCount < visibleItems.length", cardStart);
const card = client.slice(cardStart, cardEnd);
const actionsStart = card.indexOf(
  'className="col-span-2 mt-3 border-t',
);
const actions = card.slice(actionsStart);

const externalIndex = actions.indexOf("Zapisy u organizatora");
const planIndex = actions.indexOf("Dodaj do planu");
const pointsIndex = actions.indexOf("pointsDetailsLabel(t.points_verification_status)");

const checks = [
  [
    "Prawa strefa jest poszerzona i dochodzi akcjami do krawędzi karty",
    card.includes("sm:grid-cols-[64px_minmax(0,1fr)_216px]") &&
      actions.includes("sm:border-l") &&
      actions.includes("w-full"),
  ],
  [
    "Logo organizatora jest czytelnym znakiem przy nazwie",
    card.includes("<OrganizerLogo") &&
      client.includes('className="max-h-6 w-full object-contain"') &&
      client.includes("aria-label={name ? `Logo organizatora ${name}`"),
  ],
  [
    "Subtelna szyna koloru przełamuje tabelaryczny wygląd",
    card.includes("border-l-[3px]") &&
      card.includes("borderLeftColor: tone.rail") &&
      card.includes("rounded-2xl"),
  ],
  [
    "Przejście do zapisów jest pierwsze przed dodaniem do planu",
    externalIndex >= 0 &&
      externalIndex < planIndex &&
      actions.includes("mt-1.5"),
  ],
  [
    "Plan ma plus, a liczba punktów jest wyraźna",
    planIndex > externalIndex &&
    pointsIndex < externalIndex &&
      actions.includes('<Plus className="h-4 w-4 shrink-0"') &&
      actions.includes("text-[27px] font-black"),
  ],
  [
    "Pełne etykiety nie przełamują się także na wąskiej karcie",
    actions.includes('className="truncate"') &&
      actions.includes("Zapisy u organizatora") &&
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
