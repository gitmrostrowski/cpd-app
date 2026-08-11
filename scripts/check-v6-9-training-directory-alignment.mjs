import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const filterStart = client.indexOf(
  '<div className="mb-4 grid grid-cols-[40px_minmax(0,1fr)]',
);
const filterEnd = client.indexOf(
  '<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">',
  filterStart,
);
const filterActions = client.slice(filterStart, filterEnd);

const cardStart = client.indexOf("displayedItems.map");
const cardEnd = client.indexOf("visibleCount < visibleItems.length", cardStart);
const card = client.slice(cardStart, cardEnd);
const actionStart = card.indexOf(
  'col-span-2 mt-3 border-t',
);
const actions = card.slice(actionStart);
const planStart = actions.indexOf('title="Dodaje szkolenie do planu CPD');
const planEnd = actions.indexOf("</button>", planStart);
const planButton = actions.slice(planStart, planEnd);

const checks = [
  [
    "Działania filtrów korzystają z tej samej dwunastokolumnowej siatki i odstępu co pola",
    filterActions.includes(
      "grid grid-cols-[40px_minmax(0,1fr)] items-center gap-2 lg:grid-cols-12 lg:gap-3",
    ) &&
      filterActions.includes("lg:col-start-10 lg:justify-self-end") &&
      filterActions.includes("lg:col-span-2") &&
      !filterActions.includes("sm:w-[198px]"),
  ],
  [
    "Prawa kolumna i obie akcje są szersze",
    card.includes("sm:grid-cols-[64px_minmax(0,1fr)_216px]") &&
      actions.includes("w-full") &&
      actions.includes("sm:pl-4"),
  ],
  [
    "Pełne etykiety przycisków nie łamią się",
    actions.includes('className="truncate"') &&
      actions.includes("Dodaj do planu") &&
      actions.includes("Zapisy u organizatora") &&
      !actions.includes('className="sm:hidden">Zapisy</span>'),
  ],
  [
    "Plus wyróżnia plan, a punkty mają własną typografię",
    planButton.includes("Plus") &&
      planButton.indexOf("Plus") < planButton.indexOf("Dodaj do planu") &&
      actions.includes("text-[27px] font-black") &&
      actions.includes("pointDisplay.suffix"),
  ],
  [
    "Zmiana nie narusza danych ani migracji",
    !client.includes("supabase/migrations") &&
      actions.includes("pointsDetailsLabel(t.points_verification_status)"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
