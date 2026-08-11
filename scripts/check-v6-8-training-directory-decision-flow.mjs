import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const filterStart = client.indexOf("Znajdź szkolenie");
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

const resetIndex = filterActions.indexOf('aria-label="Wyczyść filtry"');
const moreIndex = filterActions.indexOf("Więcej filtrów");
const planIndex = actions.indexOf("Dodaj do planu");
const pointsIndex = actions.indexOf("pointsDetailsLabel(t.points_verification_status)");
const logoIndex = card.indexOf("OrganizerLogo");

const checks = [
  [
    "Reset poprzedza rozwijanie filtrów",
    resetIndex >= 0 &&
      resetIndex < moreIndex &&
      filterActions.includes('className="sm:hidden">Filtry</span>') &&
      filterActions.includes("lg:col-span-2"),
  ],
  [
    "Liczba wyników ma jeden opis z ikoną i nie jest duplikowana w panelu bocznym",
    client.includes("SearchCheck") &&
      client.includes("matchedTrainingCountLabel(matchedCount)") &&
      client.includes("Znaleziono 1 dopasowane szkolenie") &&
      !client.includes("sidebarStats") &&
      !client.includes(">Podsumowanie<"),
  ],
  [
    "Punkty poprzedzają akcję, a plan pozostaje głównym CTA CRPE",
    actionStart >= 0 &&
      pointsIndex < planIndex &&
      actions.includes("bg-blue-700") &&
      actions.includes("pointsDetailsLabel(t.points_verification_status)"),
  ],
  [
    "Logo jest częścią metadanych organizatora, a akcja ma pełną szerokość",
    logoIndex >= 0 &&
      card.includes("<OrganizerLogo") &&
      actions.includes("w-full") &&
      actions.includes("Dodaj do planu"),
  ],
  [
    "Karta pokazuje mniej treści, a szczegóły mają osobną trasę",
    card.includes("Pokaż szczegóły szkolenia") &&
      !card.includes("topics.map") &&
      card.includes("href={trainingPath(t)}"),
  ],
  [
    "Główna akcja zatrzymuje użytkownika w przepływie CRPE",
    client.includes("window.location.assign(`/login?next=${encodeURIComponent(next)}`)") &&
      client.includes("Dodano do planu CPD") &&
      client.includes("To nie jest zapis na szkolenie"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
