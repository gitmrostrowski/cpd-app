import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const filterStart = client.indexOf(
  '<div className="mb-4 grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)]',
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
  'grid-cols-[minmax(168px,1fr)_76px]',
);
const actions = card.slice(actionStart);
const planStart = actions.indexOf('title="Dodaje szkolenie do planu CPD');
const planEnd = actions.indexOf("</button>", planStart);
const planButton = actions.slice(planStart, planEnd);
const pointsStart = actions.indexOf("pointsDetailsLabel(t.points_verification_status)");
const pointsEnd = actions.indexOf("{t.url ? (", pointsStart);
const points = actions.slice(pointsStart, pointsEnd);

const checks = [
  [
    "Działania filtrów korzystają z tej samej dwunastokolumnowej siatki i odstępu co pola",
    filterActions.includes(
      "grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 lg:grid-cols-12 lg:gap-3",
    ) &&
      filterActions.includes("lg:col-start-8 lg:justify-self-end") &&
      (filterActions.match(/lg:col-span-2/g) ?? []).length === 2 &&
      !filterActions.includes("sm:w-[198px]"),
  ],
  [
    "Prawa kolumna i obie akcje są szersze",
    card.includes("sm:grid-cols-[52px_minmax(0,1fr)_272px]") &&
      actions.includes("grid-cols-[minmax(168px,1fr)_76px]") &&
      actions.includes("px-4 text-xs"),
  ],
  [
    "Pełne etykiety przycisków nie łamią się",
    (actions.match(/whitespace-nowrap/g) ?? []).length >= 3 &&
      actions.includes("Dodaj do planu") &&
      actions.includes("Przejdź do zapisów") &&
      !actions.includes('className="sm:hidden">Zapisy</span>'),
  ],
  [
    "Biała czapeczka wyróżnia dodawanie do planu, a nie liczbę punktów",
    planButton.includes("GraduationCap") &&
      planButton.includes("text-white") &&
      planButton.indexOf("GraduationCap") < planButton.indexOf("Dodaj do planu") &&
      !points.includes("GraduationCap") &&
      points.includes("pkt</span>"),
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
