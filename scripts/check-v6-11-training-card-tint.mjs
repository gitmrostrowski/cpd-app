import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const cardStart = client.indexOf("displayedItems.map");
const cardEnd = client.indexOf("visibleCount < visibleItems.length", cardStart);
const card = client.slice(cardStart, cardEnd);
const actionsStart = card.indexOf(
  'className="relative col-span-2 mt-0.5 grid grid-cols-[minmax(188px,1fr)_84px]',
);
const actions = card.slice(actionsStart);

const checks = [
  [
    "Prawa część karty ma uniwersalną tintę obejmującą około jednej trzeciej szerokości",
    card.includes("absolute inset-y-0 right-0 z-0 hidden w-[36%]") &&
      card.includes("radial-gradient") &&
      card.includes("linear-gradient") &&
      card.includes("rgba(239,246,255,0.92)"),
  ],
  [
    "Tinta ma miękkie wejście zamiast twardego podziału kolumnowego",
    card.includes("transparent_0%") &&
      card.includes("rgba(248,250,252,0.72)_22%") &&
      !actions.includes("sm:border-l"),
  ],
  [
    "Różne proporcje logo mieszczą się w jednym bezpiecznym obszarze",
    client.includes('? "h-[76px] w-[168px]"') &&
      client.includes('watermark ? "max-h-[62px] max-w-[154px] object-contain"') &&
      client.includes("justify-center opacity-[0.14]") &&
      card.includes("right-3 top-1/2") &&
      card.includes("-translate-y-1/2"),
  ],
  [
    "Logo i tinta nie przechwytują kliknięć ani nie obniżają kontrastu akcji",
    (card.match(/pointer-events-none/g) ?? []).length >= 2 &&
      card.includes("relative z-10 grid") &&
      actions.includes("bg-white/90") &&
      actions.includes("bg-blue-600"),
  ],
  [
    "Na telefonie akcje otrzymują spokojne tło bez nakładania dużego logo",
    actions.includes("bg-gradient-to-r from-slate-50/30 to-blue-50/70") &&
      actions.includes("sm:bg-none") &&
      card.includes("hidden -translate-y-1/2 sm:block"),
  ],
  [
    "Zmiana nie dotyka danych ani logiki zapisów",
    !client.includes("supabase/migrations") &&
      actions.includes("chooseTraining(t)") &&
      actions.includes("t.url") &&
      actions.includes("GraduationCap"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
