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

const pointsIndex = actions.indexOf(
  "pointsDetailsLabel(t.points_verification_status)",
);
const signupIndex = actions.indexOf("Zapisy u organizatora");
const planIndex = actions.indexOf("Dodaj do planu");

const checks = [
  [
    "Prawa strefa jest częścią zwartej kompozycji karty",
    card.includes("sm:grid-cols-[64px_minmax(0,1fr)_216px]") &&
      actions.includes("sm:border-l") &&
      actions.includes("sm:pl-4"),
  ],
  [
    "Logo mieści znaki pionowe, kwadratowe oraz szerokie",
    client.includes('className="inline-flex h-7 w-10') &&
      client.includes("max-h-6 w-full") &&
      client.includes("object-contain") &&
      client.includes("overflow-hidden"),
  ],
  [
    "Brak logo wykorzystuje inicjały organizatora zamiast pustej półki",
    client.includes("const initials") &&
      client.includes("if (!initials) return null") &&
      client.includes("{initials}"),
  ],
  [
    "Punkty leżą na pierwszym planie strefy akcji",
    pointsIndex >= 0 &&
      pointsIndex < signupIndex &&
      actions.includes("text-[27px] font-black") &&
      actions.includes("text-blue-700"),
  ],
  [
    "Dwa przyciski tworzą zwartą parę i nie łamią tekstu",
    signupIndex > pointsIndex &&
      planIndex > signupIndex &&
      actions.includes('className="truncate"') &&
      actions.includes("w-full"),
  ],
  [
    "Zmiana jest responsywna i nie ingeruje w logikę danych",
    actions.includes("col-span-2") &&
      actions.includes("sm:col-span-1") &&
      actions.includes("chooseTraining(t)") &&
      actions.includes("t.url") &&
      !client.includes("supabase/migrations"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
