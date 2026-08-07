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

const brandIndex = actions.indexOf("sm:min-h-[66px]");
const pointsIndex = actions.indexOf(
  "pointsDetailsLabel(t.points_verification_status)",
);
const pairIndex = actions.indexOf("grid grid-cols-2 gap-2.5");
const signupIndex = actions.indexOf("Przejdź do zapisów");
const planIndex = actions.indexOf("Dodaj do planu");

const checks = [
  [
    "Prawa strefa jest częścią kompozycji, a nie pionowym panelem przycisków",
    card.includes("w-[38%]") &&
      card.includes("radial-gradient(ellipse_at_92%_12%") &&
      !actions.includes("flex flex-col gap-2.5"),
  ],
  [
    "Logo jest dużym tłem marki i mieści znaki pionowe, kwadratowe oraz szerokie",
    client.includes('? "h-[72px] w-[210px]"') &&
      client.includes("max-h-[64px] max-w-[196px]") &&
      client.includes("object-contain object-right") &&
      client.includes("opacity-[0.52]"),
  ],
  [
    "Brak logo wykorzystuje nazwę organizatora zamiast pozostawiać pustą półkę",
    actions.includes(") : t.organizer ? (") &&
      actions.includes("text-blue-900/[0.16]") &&
      !actions.includes('<span aria-hidden="true" />'),
  ],
  [
    "Punkty z czapką z v6.7 leżą na pierwszym planie strefy marki",
    brandIndex >= 0 &&
      pointsIndex > brandIndex &&
      pointsIndex < pairIndex &&
      actions.includes(
        '<GraduationCap className="h-5 w-5 shrink-0" strokeWidth={2.1}',
      ) &&
      actions.includes("rounded-full border border-blue-100/90 bg-white/80"),
  ],
  [
    "Dwa równe przyciski są jednym poziomym paskiem i nie łamią tekstu",
    pairIndex > pointsIndex &&
      signupIndex > pairIndex &&
      planIndex > signupIndex &&
      (actions.match(/h-10 min-w-0/g) ?? []).length >= 3 &&
      (actions.match(/whitespace-nowrap/g) ?? []).length >= 4,
  ],
  [
    "Zmiana jest responsywna i nie ingeruje w logikę danych",
    actions.includes("sm:min-h-[66px]") &&
      actions.includes("hidden -translate-y-1/2 sm:block") &&
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
