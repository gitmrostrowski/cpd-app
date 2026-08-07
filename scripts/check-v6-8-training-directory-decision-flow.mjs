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
  'flex flex-col gap-2.5',
);
const actions = card.slice(actionStart);

const resetIndex = filterActions.indexOf('aria-label="Wyczyść filtry"');
const moreIndex = filterActions.indexOf("Więcej filtrów");
const resultsIndex = filterActions.indexOf("Pokaż wyniki");
const planIndex = actions.indexOf("Dodaj do planu");
const pointsIndex = actions.indexOf("pointsDetailsLabel(t.points_verification_status)");
const externalIndex = actions.indexOf("Przejdź do zapisów");
const logoIndex = card.indexOf("OrganizerLogo");

const checks = [
  [
    "Reset poprzedza symetryczną parę działań filtrów",
    resetIndex >= 0 &&
      resetIndex < moreIndex &&
      moreIndex < resultsIndex &&
      (filterActions.match(/lg:col-span-2/g) ?? []).length === 2,
  ],
  [
    "Liczba wyników ma jeden opis z ikoną i nie jest duplikowana w panelu bocznym",
    client.includes("SearchCheck") &&
      client.includes("matchedTrainingCountLabel(visibleItems.length)") &&
      client.includes("Znaleziono 1 dopasowane szkolenie") &&
      !client.includes("sidebarStats") &&
      !client.includes(">Podsumowanie<"),
  ],
  [
    "Zapisy są pierwszą szeroką akcją, a plan pozostaje głównym CTA CRPE",
    actionStart >= 0 &&
      externalIndex >= 0 &&
      externalIndex < planIndex &&
      pointsIndex > externalIndex &&
      pointsIndex < planIndex &&
      actions.includes("bg-blue-600") &&
      actions.includes("pointsDetailsLabel(t.points_verification_status)"),
  ],
  [
    "Logo ma własny pas marki, a zapis wykorzystuje pełną szerokość prawej strefy",
    logoIndex >= 0 &&
      actions.includes("border border-slate-300 bg-white/95") &&
      actions.includes("h-10 w-full") &&
      card.includes("watermark"),
  ],
  [
    "Karta pokazuje mniej treści, a tematy są dostępne po rozwinięciu",
    card.includes("Szczegóły") &&
      !card.includes("topics.map") &&
      client.includes("detailsTraining.topics.map") &&
      client.includes("Tematy szkolenia"),
  ],
  [
    "Główna akcja zatrzymuje użytkownika w przepływie CRPE",
    client.includes('window.location.href = "/login?next=/baza-szkolen"') &&
      client.includes("Dodano do planu CPD") &&
      client.includes("Czy chcesz teraz przejść do strony organizatora?"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
