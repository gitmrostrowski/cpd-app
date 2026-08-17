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

const checks = [
  [
    "Prawa część karty ma wyraźną, zwartą kolumnę",
    card.includes("sm:grid-cols-[64px_minmax(0,1fr)_216px]") &&
      actions.includes("sm:border-l") &&
      actions.includes("sm:pl-4"),
  ],
  [
    "Subtelna szyna koloru zastępuje ciężką tintę",
    card.includes("border-l-[3px]") &&
      card.includes("borderLeftColor: tone.rail") &&
      card.includes("hover:border-slate-300"),
  ],
  [
    "Różne proporcje logo mieszczą się w jednym bezpiecznym obszarze",
    client.includes('className="inline-flex h-7 w-10') &&
      client.includes('className="max-h-6 w-full object-contain"') &&
      client.includes("overflow-hidden"),
  ],
  [
    "Logo nie obniża kontrastu akcji",
    client.includes("<OrganizerLogo") &&
      actions.includes("bg-crpe-brand") &&
      actions.includes("text-white"),
  ],
  [
    "Na telefonie akcje układają się bez nakładania logo",
    actions.includes("col-span-2") &&
      actions.includes("sm:col-span-1") &&
      !actions.includes("absolute"),
  ],
  [
    "Zmiana nie dotyka danych ani logiki zapisów",
    !client.includes("supabase/migrations") &&
      actions.includes("chooseTraining(t)") &&
      actions.includes("t.url") &&
      actions.includes("pointDisplay"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
