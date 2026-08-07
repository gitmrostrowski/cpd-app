import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const cardStart = client.indexOf("displayedItems.map");
const cardEnd = client.indexOf("visibleCount < visibleItems.length", cardStart);
const card = client.slice(cardStart, cardEnd);
const actionsStart = card.indexOf(
  'className="relative col-span-2 mt-0.5 flex flex-col gap-2.5',
);
const actions = card.slice(actionsStart);

const externalIndex = actions.indexOf("Przejdź do zapisów");
const logoIndex = actions.indexOf("<OrganizerLogo");
const pointsIndex = actions.indexOf(
  "pointsDetailsLabel(t.points_verification_status)",
);
const planIndex = actions.indexOf("Dodaj do planu");

const checks = [
  [
    "Dwa przyciski tworzą równe pełnoszerokie moduły",
    actionsStart >= 0 &&
      externalIndex >= 0 &&
      planIndex > externalIndex &&
      (actions.match(/inline-flex h-10 w-full/g) ?? []).length >= 3 &&
      actions.includes("flex flex-col gap-2.5"),
  ],
  [
    "Logo i punkty tworzą osobny pas marki między przyciskami",
    logoIndex > externalIndex &&
      pointsIndex > logoIndex &&
      planIndex > pointsIndex &&
      actions.includes("min-h-[38px]") &&
      actions.includes("items-center justify-between gap-3 px-1"),
  ],
  [
    "Logo jest widoczne i uniwersalne dla różnych proporcji",
    client.includes('? "h-[38px] w-[160px]"') &&
      client.includes("justify-start opacity-[0.64]") &&
      client.includes("group-hover:opacity-[0.76]") &&
      client.includes(
        'watermark ? "max-h-[34px] max-w-[148px] object-contain object-left"',
      ) &&
      !card.includes("absolute right-3 top-1/2"),
  ],
  [
    "Czapeczka punktów dokładnie przywraca proporcje z v6.7",
    actions.includes(
      '<GraduationCap className="h-5 w-5 shrink-0" strokeWidth={2.1}',
    ) &&
      actions.includes("text-[20px] font-black") &&
      actions.includes("text-xs font-bold text-blue-600"),
  ],
  [
    "Tinta pozostaje miękka, a interfejs czytelny na desktopie i telefonie",
    card.includes("hidden w-[36%]") &&
      card.includes("radial-gradient") &&
      actions.includes("bg-gradient-to-r from-slate-50/30 to-blue-50/70") &&
      actions.includes("sm:bg-none") &&
      actions.includes("whitespace-nowrap"),
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
