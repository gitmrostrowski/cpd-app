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
const logoIndex = card.indexOf("<OrganizerLogo");
const pointsIndex = actions.indexOf(
  "pointsDetailsLabel(t.points_verification_status)",
);
const planIndex = actions.indexOf("Dodaj do planu");

const checks = [
  [
    "Dwie akcje tworzą czytelną pionową parę",
    actionsStart >= 0 &&
      externalIndex >= 0 &&
      planIndex > externalIndex &&
      actions.includes("flex h-10 w-full") &&
      actions.includes("flex h-9 w-full"),
  ],
  [
    "Logo i punkty tworzą spójną hierarchię przed akcjami",
    logoIndex >= 0 &&
      pointsIndex >= 0 &&
      pointsIndex < externalIndex &&
      planIndex > externalIndex &&
      card.includes("text-[13px] font-medium text-slate-600") &&
      actions.includes("text-[27px] font-black"),
  ],
  [
    "Logo jest widoczne i uniwersalne dla różnych proporcji",
    client.includes('className="inline-flex h-7 w-10') &&
      client.includes('className="max-h-6 w-full object-contain"') &&
      client.includes("if (!logoUrl)") &&
      !card.includes("absolute right-3 top-1/2"),
  ],
  [
    "Liczba punktów ma czytelne proporcje",
    actions.includes("text-[27px] font-black") &&
      actions.includes("text-[13px] font-bold") &&
      actions.includes("text-crpe-brand"),
  ],
  [
    "Interfejs pozostaje czytelny na desktopie i telefonie",
    card.includes("grid-cols-[64px_minmax(0,1fr)]") &&
      card.includes("sm:grid-cols-[64px_minmax(0,1fr)_216px]") &&
      actions.includes("col-span-2") &&
      actions.includes("sm:col-span-1"),
  ],
  [
    "Zmiana pozostaje w warstwie wizualnej",
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
